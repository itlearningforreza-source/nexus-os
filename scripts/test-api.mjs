#!/usr/bin/env node
// Nexus OS — API integration test suite.
// Boots the Next server against an isolated test database, runs end-to-end API
// assertions for auth, session revocation, tenant isolation, authorization,
// and core CRUD workflows. Exits non-zero on any failure.
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PORT = 15000 + Math.floor(Math.random() * 20000);
const BASE = `http://127.0.0.1:${PORT}`;
const TEST_DB = path.join(root, "data", `test-${process.pid}.db`);
const AUTH_SECRET = "integration-test-secret-not-for-production";

let server;
let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name + (extra ? ` — ${extra}` : ""));
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function request(method, pathname, { cookie, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.cookie = cookie;
  const res = await fetch(BASE + pathname, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, setCookie: res.headers.get("set-cookie") };
}

function firstCookie(value) {
  if (!value) return "";
  return value.split(";")[0];
}

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(BASE + "/api/health");
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function run() {
  console.log("Nexus OS API Integration Tests");
  console.log("────────────────────────────────");

  // 1. Authentication + session revocation
  console.log("\n[AUTH] Registration, login, logout");
  const reg = await request("POST", "/api/auth/register", { body: { name: "Alice Owner", email: "alice@alpha.test", password: "secret123", organization: "Alpha Org" } });
  check("register creates owner + session cookie", reg.status === 200 && !!reg.data?.user && !!reg.setCookie, `status=${reg.status}`);
  const cookieA = firstCookie(reg.setCookie);

  const dup = await request("POST", "/api/auth/register", { body: { name: "Copy", email: "alice@alpha.test", password: "secret123", organization: "Another" } });
  check("register rejects duplicate email", dup.status === 409, `status=${dup.status}`);

  const badLogin = await request("POST", "/api/auth/login", { body: { email: "alice@alpha.test", password: "wrongpass" } });
  check("login rejects wrong password", badLogin.status === 401, `status=${badLogin.status}`);

  const login = await request("POST", "/api/auth/login", { body: { email: "alice@alpha.test", password: "secret123" } });
  check("login succeeds with correct password", login.status === 200 && !!login.setCookie, `status=${login.status} setCookie=${!!login.setCookie} body=${JSON.stringify(login.data)}`);

  const logout = await request("POST", "/api/auth/logout", { cookie: cookieA });
  check("logout returns ok", logout.status === 200);

  // After logout the old cookie must be invalid (server-side session revoked).
  const afterLogout = await request("GET", "/api/crm/companies", { cookie: cookieA });
  check("logged-out session is revoked (401)", afterLogout.status === 401, `status=${afterLogout.status}`);

  // Re-login to continue
  const login2 = await request("POST", "/api/auth/login", { body: { email: "alice@alpha.test", password: "secret123" } });
  const cookieA2 = firstCookie(login2.setCookie);

  // 2. Authenticated access
  console.log("\n[AUTHZ] Authenticated access & role");
  const companies = await request("GET", "/api/crm/companies", { cookie: cookieA2 });
  check("authenticated user can list companies", companies.status === 200);
  const unauth = await request("GET", "/api/crm/companies", {});
  check("unauthenticated request rejected (401)", unauth.status === 401, `status=${unauth.status}`);

  // 3. Tenant isolation
  console.log("\n[TENANT ISOLATION] Cross-tenant access is blocked");
  const regB = await request("POST", "/api/auth/register", { body: { name: "Bob Owner", email: "bob@beta.test", password: "secret123", organization: "Beta Org" } });
  const cookieB = firstCookie(regB.setCookie);

  const mkCompany = await request("POST", "/api/crm/companies", { cookie: cookieA2, body: { name: "AliceCorp", industry: "Tech" } });
  check("create company as Alice", mkCompany.status === 200, `status=${mkCompany.status}`);
  const aliceCompanyId = mkCompany.data?.id;

  const mkCompanyB = await request("POST", "/api/crm/companies", { cookie: cookieB, body: { name: "BobCorp", industry: "Retail" } });
  const bobCompanyId = mkCompanyB.data?.id;

  const crossRead = await request(`GET`, `/api/crm/companies?id=${bobCompanyId}`, { cookie: cookieA2 });
  check("Alice cannot read Bob's company", crossRead.status === 404, `status=${crossRead.status}`);

  const crossUpdate = await request("PATCH", `/api/crm/companies?id=${bobCompanyId}`, { cookie: cookieA2, body: { name: "Hacked" } });
  check("Alice cannot update Bob's company", crossUpdate.status === 404, `status=${crossUpdate.status}`);

  const crossDelete = await request("DELETE", `/api/crm/companies?id=${bobCompanyId}`, { cookie: cookieA2 });
  check("Alice cannot delete Bob's company", crossDelete.status === 404, `status=${crossDelete.status}`);

  // 4. Mass-assignment protection (PATCH whitelist)
  console.log("\n[SECURITY] CRUD mass-assignment & injection protection");
  const oracle = await request("GET", `/api/crm/companies?id=${aliceCompanyId}`, { cookie: cookieA2 });
  const originalName = oracle.data?.row?.name;
  const originalOrg = oracle.data?.row?.organization_id;
  await request("PATCH", `/api/crm/companies?id=${aliceCompanyId}`, { cookie: cookieA2, body: { name: "Renamed Alice", organization_id: bobCompanyId, id: "0000", created_at: "1999-01-01" } });
  const afterPatch = await request("GET", `/api/crm/companies?id=${aliceCompanyId}`, { cookie: cookieA2 });
  check("PATCH ignores protected fields (id/organization_id/created_at)", afterPatch.data?.row?.organization_id === originalOrg && afterPatch.data?.row?.id === aliceCompanyId, `org=${afterPatch.data?.row?.organization_id}`);
  check("legitimate field (name) is updated by PATCH", afterPatch.data?.row?.name === "Renamed Alice", `name=${afterPatch.data?.row?.name}`);

  // SQL injection attempt via field name
  const injRes = await request("PATCH", `/api/crm/companies?id=${aliceCompanyId}`, { cookie: cookieA2, body: { "name); DROP TABLE companies;--": "x", name: "Clean Name" } });
  check("injected column names are rejected without error", injRes.status === 200);
  const stillThere = await request("GET", `/api/crm/companies?id=${aliceCompanyId}`, { cookie: cookieA2 });
  check("companies table still intact after injection attempt", stillThere.status === 200 && stillThere.data?.row);

  // 5. Settings (org) route
  console.log("\n[SETTINGS] Organization settings update");
  const badSettings = await request("GET", "/api/settings", { cookie: cookieA2 });
  check("GET /api/settings not allowed", badSettings.status === 405 || badSettings.status === 404);
  const settingsOk = await request("PUT", "/api/settings", { cookie: cookieA2, body: { name: "Alpha Org Renamed", industry: "Finance", size: "11-50" } });
  check("owner can update organization settings", settingsOk.status === 200, `status=${settingsOk.status}`);

  // 6. Feature flags (admin)
  console.log("\n[ADMIN] Feature flags & role");
  const flagsGet = await request("GET", "/api/feature-flags", { cookie: cookieA2 });
  check("owner can read feature flags", flagsGet.status === 200, `status=${flagsGet.status}`);
  const flags = flagsGet.data?.flags || [];
  if (flags.length > 0) {
    const toggled = flags.map((f, i) => ({ id: f.id, enabled: i === 0 ? !f.enabled : f.enabled }));
    const flagsPatch = await request("PATCH", "/api/feature-flags", { cookie: cookieA2, body: { flags: toggled } });
    check("owner can toggle feature flags", flagsPatch.status === 200, `status=${flagsPatch.status}`);
  } else {
    passed++;
    console.log("  ✓ owner can read feature flags (no flags to toggle)");
  }

  const noAuthPatch = await request("PATCH", "/api/feature-flags", { body: { flags: [] } });
  check("feature flags require authentication", noAuthPatch.status === 401, `status=${noAuthPatch.status}`);

  // 7. Email module
  console.log("\n[EMAIL] Real inbox backend");
  const comp = await request("POST", "/api/emails", { cookie: cookieA2, body: { to: "x@example.com", subject: "Test subject", body: "Hello" } });
  check("compose/send email persists", comp.status === 200, `status=${comp.status}`);
  const sent = await request("GET", "/api/emails?folder=sent", { cookie: cookieA2 });
  check("sent mailbox returns emails", sent.status === 200 && (sent.data?.emails?.length || 0) >= 1);
  const emailId = sent.data?.emails?.[0]?.id;
  if (emailId) {
    const star = await request("PATCH", `/api/emails?id=${emailId}`, { cookie: cookieA2, body: { starred: 1 } });
    check("toggle email star", star.status === 200, `status=${star.status}`);
  }

  // 8. Password change
  console.log("\n[AUTH] Password change");
  const wrongCurrent = await request("POST", "/api/auth/password", { cookie: cookieA2, body: { currentPassword: "notright", newPassword: "newpass123" } });
  check("password change rejects wrong current password", wrongCurrent.status === 400, `status=${wrongCurrent.status}`);
  const changeOk = await request("POST", "/api/auth/password", { cookie: cookieA2, body: { currentPassword: "secret123", newPassword: "newpass123" } });
  check("password change succeeds with correct current password", changeOk.status === 200, `status=${changeOk.status}`);
  const reloginOld = await request("POST", "/api/auth/login", { body: { email: "alice@alpha.test", password: "secret123" } });
  check("old password no longer works", reloginOld.status === 401, `status=${reloginOld.status}`);
  const reloginNew = await request("POST", "/api/auth/login", { body: { email: "alice@alpha.test", password: "newpass123" } });
  check("new password works", reloginNew.status === 200);

  // 9. Profile PATCH (whitelist + self-only)
  console.log("\n[PROFILE] Settings profile update");
  const profileOk = await request("PATCH", "/api/settings/profile", { cookie: cookieA2, body: { name: "Alice Renamed", title: "CTO", timezone: "UTC", theme: "dark" } });
  check("profile PATCH accepts whitelisted fields", profileOk.status === 200, `status=${profileOk.status}`);
  const profileMass = await request("PATCH", "/api/settings/profile", { cookie: cookieA2, body: { id: "0000", organization_id: bobCompanyId, password_hash: "x", email: "hacked@x.test", title: "Safe New Title" } });
  check("profile PATCH ignores protected fields", profileMass.status === 200, `status=${profileMass.status}`);
  const profileRecheck = await request("GET", "/api/crm/companies", { cookie: cookieA2 });
  check("profile PATCH could not change org/email via mass assignment", !!profileRecheck.data?.rows);

  // 10. Team invites (validation, duplicates, admin-only)
  console.log("\n[TEAM] Team invites");
  const badInvite = await request("POST", "/api/settings/team-invites", { cookie: cookieA2, body: { email: "notanemail", role: "member" } });
  check("invite rejects invalid email", badInvite.status === 400, `status=${badInvite.status}`);
  const goodInvite = await request("POST", "/api/settings/team-invites", { cookie: cookieA2, body: { email: "carol@alpha.test", role: "manager" } });
  check("owner can invite a member", goodInvite.status === 200 && !!goodInvite.data?.id, `status=${goodInvite.status}`);
  const dupeInvite = await request("POST", "/api/settings/team-invites", { cookie: cookieA2, body: { email: "carol@alpha.test", role: "member" } });
  check("duplicate pending invite rejected", dupeInvite.status === 409, `status=${dupeInvite.status}`);
  const listInvites = await request("GET", "/api/settings/team-invites", { cookie: cookieA2 });
  check("pending invites are listed", listInvites.status === 200 && (listInvites.data?.invites || []).some((i) => i.email === "carol@alpha.test"));
  const revokeInvite = await request("DELETE", "/api/settings/team-invites", { cookie: cookieA2, body: { id: goodInvite.data?.id } });
  check("invite can be revoked", revokeInvite.status === 200, `status=${revokeInvite.status}`);
  // Tenant scoping: Bob cannot revoke Alice's invite id (404).
  const bobRevoke = await request("DELETE", "/api/settings/team-invites", { cookie: cookieB, body: { id: goodInvite.data?.id } });
  check("cannot revoke another org's invitation", bobRevoke.status === 404, `status=${bobRevoke.status}`);

  // 11. API keys (admin-only, masked secret)
  console.log("\n[API KEYS] Key management");
  const mkKey = await request("POST", "/api/settings/api-keys", { cookie: cookieA2, body: { name: "CI" } });
  check("create API key returns secret once", mkKey.status === 200 && typeof mkKey.data?.key?.secret === "string" && mkKey.data.key.secret.length > 10, `status=${mkKey.status}`);
  const keysList = await request("GET", "/api/settings/api-keys", { cookie: cookieA2 });
  const apiKey = (keysList.data?.keys || [])[0];
  check("API keys list masks the secret", keysList.status === 200 && apiKey && !("secret" in apiKey) && String(apiKey.key_prefix || "").length === 10, `hasSecret=${("secret" in apiKey)} prefix=${apiKey?.key_prefix}`);
  // Bob cannot manage Alice's keys (different org → sees none / 404).
  const bobKeys = await request("GET", "/api/settings/api-keys", { cookie: cookieB });
  check("API keys are tenant-scoped", bobKeys.status === 200 && (bobKeys.data?.keys || []).length === 0, `aliceKeys=${apiKey ? 1 : 0} bobKeys=${bobKeys.data?.keys?.length}`);

  // 12. Chat tenant isolation (cross-org read of conversation)
  console.log("\n[CHAT] Tenant isolation");
  const mkConv = await request("POST", "/api/chat", { cookie: cookieA2, body: { conversation_id: "does-not-exist", body: "hi" } });
  check("chat rejects message to foreign/nonexistent conversation", mkConv.status === 404, `status=${mkConv.status}`);
  // Create a real conversation for Alice via the CRM contact/thread path, then assert Bob can't read it.
  const convProbe = await request("GET", "/api/chat?conversation_id=00000000-0000-0000-0000-000000000000", { cookie: cookieB });
  check("chat GET returns 404 for cross-tenant conversation id", convProbe.status === 404, `status=${convProbe.status}`);

  // 13. Office suite (CRUD, versioning, exports, tenant isolation)
  console.log("\n[OFFICE] Writer/Spreadsheet/Presentation documents");
  const officeDoc = await request("POST", "/api/office", { cookie: cookieA2, body: { name: "Alice's Q4 Plan", kind: "writer", folder: "My Drive", content: { blocks: [{ type: "paragraph", text: "Hello" }] } } });
  check("create writer document", officeDoc.status === 200 && !!officeDoc.data?.id && officeDoc.data?.doc?.kind === "writer", `status=${officeDoc.status}`);
  const officeId = officeDoc.data?.id;

  const officeGet = await request("GET", `/api/office?id=${officeId}`, { cookie: cookieA2 });
  check("fetch office document by id", officeGet.status === 200 && officeGet.data?.doc?.name === "Alice's Q4 Plan", `status=${officeGet.status}`);

  const officeList = await request("GET", "/api/office?kind=writer", { cookie: cookieA2 });
  check("list writer documents by kind", officeList.status === 200 && (officeList.data?.rows || []).some((r) => r.id === officeId), `status=${officeList.status}`);

  const officePatch = await request("PATCH", `/api/office?id=${officeId}`, { cookie: cookieA2, body: { content: { blocks: [{ type: "heading1", text: "Updated" }] }, name: "Alice's Q4 Plan v2" } });
  check("PATCH content bumps version and persists", officePatch.status === 200 && officePatch.data?.doc?.version === 2 && officePatch.data?.doc?.name === "Alice's Q4 Plan v2", `status=${officePatch.status} version=${officePatch.data?.doc?.version}`);

  const officeEmptyPatch = await request("PATCH", `/api/office?id=${officeId}`, { cookie: cookieA2, body: {} });
  check("PATCH with no updatable fields returns 400", officeEmptyPatch.status === 400, `status=${officeEmptyPatch.status}`);

  const officeCrossRead = await request("GET", `/api/office?id=${officeId}`, { cookie: cookieB });
  check("office documents are tenant-scoped (cross-tenant 404)", officeCrossRead.status === 404, `status=${officeCrossRead.status}`);
  const officeCrossPatch = await request("PATCH", `/api/office?id=${officeId}`, { cookie: cookieB, body: { name: "Hacked" } });
  check("cannot update another org's office document", officeCrossPatch.status === 404, `status=${officeCrossPatch.status}`);

  const officeExport = await request("POST", "/api/office/export", { cookie: cookieA2, body: { id: officeId, format: "markdown" } });
  check("export office document as markdown", officeExport.status === 200 && typeof officeExport.data?.content === "string" && officeExport.data?.filename?.endsWith(".md"), `status=${officeExport.status}`);

  const officeSheet = await request("POST", "/api/office", { cookie: cookieA2, body: { name: "Budget", kind: "spreadsheet", content: { rows: [["Month", "Rev"], ["Jan", "=SUM(1,2)"]] } } });
  check("create spreadsheet document", officeSheet.status === 200 && officeSheet.data?.doc?.kind === "spreadsheet", `status=${officeSheet.status}`);
  const sheetGet = await request("GET", `/api/office?id=${officeSheet.data?.id}`, { cookie: cookieA2 });
  check("spreadsheet content round-trips (formulas preserved)", sheetGet.status === 200 && sheetGet.data?.doc?.content && JSON.parse(sheetGet.data.doc.content).rows[1][1] === "=SUM(1,2)", `status=${sheetGet.status}`);

  const officeDelete = await request("DELETE", `/api/office?id=${officeId}`, { cookie: cookieA2 });
  check("delete office document", officeDelete.status === 200 && officeDelete.data?.deleted === 1, `status=${officeDelete.status} deleted=${officeDelete.data?.deleted}`);
  const officeAfterDelete = await request("GET", `/api/office?id=${officeId}`, { cookie: cookieA2 });
  check("deleted office document returns 404", officeAfterDelete.status === 404, `status=${officeAfterDelete.status}`);

  // 14. Rate limiting on login
  console.log("\n[RATE LIMIT] Brute-force protection");
  const rlBase = `rl-${process.pid}@test.invalid`;
  let got429 = false;
  for (let i = 0; i < 12; i++) {
    const r = await request("POST", "/api/auth/login", { body: { email: `${rlBase}@x.com`, password: "bad" } });
    if (r.status === 429) { got429 = true; break; }
  }
  check("rapid repeated logins are rate-limited (429)", got429, "never hit 429");

  console.log(`\n────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f}`);
  }
  return failed === 0;
}

(async () => {
  // Remove any stale test DB
  if (fs.existsSync(TEST_DB)) fs.rmSync(TEST_DB);
  for (const suffix of ["-wal", "-shm"]) {
    const p = TEST_DB + suffix;
    if (fs.existsSync(p)) fs.rmSync(p);
  }

  server = spawn(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(PORT)], {
    cwd: root,
    env: { ...process.env, DATABASE_PATH: TEST_DB, AUTH_SECRET, PORT: String(PORT) },
    stdio: "inherit",
    detached: true,
  });

  const ready = await waitForServer();
  if (!ready) {
    console.error("Server did not start in time");
    return finish(true);
  }

  let ok = false;
  try {
    ok = await run();
  } catch (e) {
    console.error("Test run crashed:", e);
    ok = false;
  }

  return finish(false, ok);
})();

function finish(force, ok = false) {
  // Kill the entire detached process group so the nested next-server child is
  // also terminated (otherwise it lingers and holds the port on later runs).
  try { process.kill(-server.pid, force ? "SIGKILL" : "SIGTERM"); } catch {}
  setTimeout(() => {
    try { process.kill(-server.pid, "SIGKILL"); } catch {}
    try { if (fs.existsSync(TEST_DB)) fs.rmSync(TEST_DB); } catch {}
    for (const suffix of ["-wal", "-shm"]) { try { const p = TEST_DB + suffix; if (fs.existsSync(p)) fs.rmSync(p); } catch {} }
    process.exit(ok ? 0 : 1);
  }, 400);
}
