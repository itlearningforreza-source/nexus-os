import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import crypto from "crypto";

function count(db: any, table: string, orgId: string, where = "") {
  return (db.prepare(`SELECT COUNT(*) c FROM ${table} WHERE organization_id = ? ${where}`).get(orgId) as any)?.c || 0;
}
function sum(db: any, table: string, col: string, orgId: string, where = "") {
  return (db.prepare(`SELECT COALESCE(SUM(${col}),0) s FROM ${table} WHERE organization_id = ? ${where}`).get(orgId) as any)?.s || 0;
}

function analyzeSales(db: any, orgId: string) {
  const deals = db.prepare("SELECT stage, COUNT(*) c, SUM(value) v FROM deals WHERE organization_id = ? GROUP BY stage").all(orgId) as any[];
  const total = deals.reduce((s, d) => s + (d.v || 0), 0);
  const open = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost").reduce((s, d) => s + d.c, 0);
  const closedWon = deals.find((d) => d.stage === "Won")?.c || 0;
  const highProb = count(db, "deals", orgId, "AND probability >= 75 AND stage IN ('Proposal','Negotiation')");
  const top = db.prepare("SELECT title, value, stage, expected_close FROM deals WHERE organization_id = ? AND stage NOT IN ('Won','Lost') ORDER BY value DESC LIMIT 3").all(orgId) as any[];
  return {
    text: `Your sales pipeline totals ${formatCurrency(total)} across ${open} open deals. ${closedWon} deals have been won. ${highProb} deals have a high probability of closing soon. Top opportunities: ${top.map((t) => `${t.title} (${formatCurrency(t.value)})`).join(", ")}.`,
    sources: ["CRM Pipeline", "Sales Dashboard"],
  };
}

function evaluateBusiness(db: any, orgId: string) {
  const revenue = sum(db, "invoices", "paid_amount", orgId, "AND status = 'Paid'");
  const pipeline = sum(db, "deals", "value", orgId, "AND stage NOT IN ('Won','Lost')");
  const openTickets = count(db, "tickets", orgId, "AND status IN ('Open','In Progress')");
  const projects = db.prepare("SELECT status, COUNT(*) c FROM projects WHERE organization_id = ? GROUP BY status").all(orgId) as any[];
  const atRisk = projects.find((p) => p.status === "At Risk")?.c || 0;
  const overdueTasks = count(db, "tasks", orgId, "AND status != 'Done' AND due_date < date('now')");
  const employees = count(db, "employees", orgId, "AND status = 'Active'");
  const contractsExpiring = count(db, "contracts", orgId, "AND expiry_date IS NOT NULL AND expiry_date BETWEEN date('now') AND date('now', '+45 days') AND status IN ('Active','Signed')");
  const overdueInvoicesTotal = sum(db, "invoices", "amount", orgId, "AND status = 'Overdue'");
  return {
    text:
      `Company health summary: Revenue is ${formatCurrency(revenue)}, pipeline is ${formatCurrency(pipeline)}. ${
        atRisk > 0 ? `${atRisk} projects are at risk. ` : "Project portfolio looks healthy. "
      }${
        overdueTasks > 0 ? `${overdueTasks} tasks are overdue. ` : "No overdue tasks. "
      }${
        contractsExpiring > 0 ? `${contractsExpiring} contracts expire within 45 days. ` : ""
      }${
        overdueInvoicesTotal > 0 ? `${formatCurrency(overdueInvoicesTotal)} in overdue invoices. ` : ""
      }${openTickets} support tickets are open, and the team has ${employees} active employees.`,
    sources: ["Finance Report", "Projects Dashboard", "CRM", "HR"],
  };
}

function findOverdueProjects(db: any, orgId: string) {
  const projects = db.prepare(
    `SELECT name, status, end_date, progress FROM projects
     WHERE organization_id = ? AND status != 'Completed' AND end_date IS NOT NULL AND end_date < date('now')
     ORDER BY end_date ASC LIMIT 6`
  ).all(orgId) as any[];
  if (projects.length === 0) {
    return { text: "There are no overdue projects. All active projects are within their timeline.", sources: ["Projects Dashboard"] };
  }
  return {
    text: `${projects.length} project(s) are past their end date: ${projects.map((p) => `${p.name} (${p.status}, ${p.progress}% complete)`).join("; ")}.`,
    sources: ["Projects Dashboard", "Timeline"],
  };
}

function expiringContracts(db: any, orgId: string) {
  const contracts = db.prepare(
    `SELECT title, status, value, expiry_date FROM contracts
     WHERE organization_id = ? AND expiry_date IS NOT NULL
     AND expiry_date BETWEEN date('now') AND date('now', '+60 days')
     AND status IN ('Active','Signed')
     ORDER BY expiry_date ASC LIMIT 6`
  ).all(orgId) as any[];
  if (contracts.length === 0) {
    return { text: "No contracts are expiring within the next 60 days.", sources: ["Legal Repository"] };
  }
  const total = contracts.reduce((s, c) => s + (c.value || 0), 0);
  return {
    text: `${contracts.length} contracts expire within 60 days, with a combined value of ${formatCurrency(total)}. Closest: ${contracts.map((c) => `${c.title} (expires ${c.expiry_date})`).join("; ")}.`,
    sources: ["Legal Contracts", "Renewal Calendar"],
  };
}

function topCustomers(db: any, orgId: string) {
  const rows = db.prepare(
    `SELECT c.name, SUM(d.value) pipeline, COUNT(d.id) deals FROM companies c
     LEFT JOIN deals d ON d.company_id = c.id AND d.stage NOT IN ('Won','Lost')
     WHERE c.organization_id = ? GROUP BY c.id ORDER BY pipeline DESC LIMIT 5`
  ).all(orgId) as any[];
  return {
    text: `Top customers by open pipeline: ${rows.map((r) => `${r.name} (${formatCurrency(r.pipeline || 0)})`).join(", ")}.`,
    sources: ["CRM", "Customer Health"],
  };
}

function meetingsToday(db: any, orgId: string) {
  const rows = db.prepare(
    `SELECT title, start, end FROM events WHERE organization_id = ? AND date(start) = date('now') ORDER BY start ASC`
  ).all(orgId) as any[];
  if (rows.length === 0) return { text: "You have no meetings scheduled today.", sources: ["Calendar"] };
  return { text: `You have ${rows.length} meeting(s) today: ${rows.map((r) => `${r.title} at ${r.start?.slice(11,16)}`).join(", ")}.`, sources: ["Calendar"] };
}

function weekReport(db: any, orgId: string) {
  const tasksDone = count(db, "tasks", orgId, "AND completed = 1 AND updated_at >= datetime('now','-7 days')");
  const dealsWon = sum(db, "deals", "value", orgId, "AND stage = 'Won' AND updated_at >= datetime('now','-7 days')");
  const ticketsResolved = count(db, "tickets", orgId, "AND status = 'Resolved' AND updated_at >= datetime('now','-7 days')");
  const newContacts = count(db, "contacts", orgId, "AND created_at >= datetime('now','-7 days')");
  return {
    text: `Weekly report: ${tasksDone} tasks completed, ${formatCurrency(dealsWon)} in deals won, ${newContacts} new contacts added, ${ticketsResolved} tickets resolved this week.`,
    sources: ["Tasks", "CRM", "Support", "Analytics"],
  };
}

function churnRisk(db: any, orgId: string) {
  const atRisk = count(db, "companies", orgId, "AND health = 'Critical'");
  const risky = db.prepare(
    `SELECT name, health, annual_revenue FROM companies
     WHERE organization_id = ? AND health IN ('At Risk','Critical') ORDER BY annual_revenue DESC LIMIT 5`
  ).all(orgId) as any[];
  return {
    text: `${atRisk} customer(s) are flagged at risk. Highest value: ${risky.map((r) => `${r.name} (${formatCurrency(r.annual_revenue || 0)})`).join(", ")}. Consider account reviews.`,
    sources: ["Customer Health", "CRM"],
  };
}

function employeeInsights(db: any, orgId: string) {
  const total = count(db, "employees", orgId);
  const onLeave = count(db, "employees", orgId, "AND status = 'On Leave'");
  const byDept = db.prepare("SELECT department, COUNT(*) c FROM employees WHERE organization_id = ? GROUP BY department ORDER BY c DESC LIMIT 5").all(orgId) as any[];
  return {
    text: `${total} employees, ${onLeave} currently on leave. Largest departments: ${byDept.map((d) => `${d.department} (${d.c})`).join(", ")}.`,
    sources: ["HR Directory", "People Ops"],
  };
}

function overdueInvoices(db: any, orgId: string) {
  const rows = db.prepare(
    `SELECT i.number, i.amount, i.currency, i.due_date, c.name FROM invoices i
     LEFT JOIN companies c ON c.id = i.company_id
     WHERE i.organization_id = ? AND i.status = 'Overdue' ORDER BY i.due_date ASC LIMIT 6`
  ).all(orgId) as any[];
  if (rows.length === 0) return { text: "There are no overdue invoices.", sources: ["Finance"] };
  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  return {
    text: `${rows.length} invoices are overdue totaling ${formatCurrency(total)}. Largest: ${rows[0].number} (${formatCurrency(rows[0].amount)}) from ${rows[0].name}. Would you like me to prepare payment reminders?`,
    sources: ["Finance Invoices", "Accounts Receivable"],
  };
}

const handlers: Record<string, (db: any, orgId: string) => { text: string; sources: string[] }> = {
  "analyze sales": analyzeSales,
  "sales pipeline": analyzeSales,
  pipeline: analyzeSales,
  "company health": evaluateBusiness,
  "business health": evaluateBusiness,
  overview: evaluateBusiness,
  "overdue project": findOverdueProjects,
  "projects behind": findOverdueProjects,
  "expiring contract": expiringContracts,
  "contracts expir": expiringContracts,
  "top customer": topCustomers,
  "top account": topCustomers,
  "meeting": meetingsToday,
  "today's meeting": meetingsToday,
  calendar: meetingsToday,
  "weekly report": weekReport,
  "churn": churnRisk,
  "at risk": churnRisk,
  "employee": employeeInsights,
  people: employeeInsights,
  "overdue invoice": overdueInvoices,
  "payment reminder": overdueInvoices,
  finance: overdueInvoices,
  invoice: overdueInvoices,
};

function respond(query: string, db: any, orgId: string) {
  const q = query.toLowerCase();
  for (const key of Object.keys(handlers)) {
    if (q.includes(key)) {
      try {
        return handlers[key](db, orgId);
      } catch {
        continue;
      }
    }
  }
  return {
    text: `I've scanned your workspace for "${
      query
    }". I can help you analyze your sales pipeline, review company health, find overdue projects or invoices, list expiring contracts, summarize today's meetings, or generate a weekly report — all using live data from your CRM, finance, projects, and HR.`,
    sources: ["Nexus AI Command Center"],
  };
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { message } = body || {};
  const db = getDb();

  const result = respond(String(message || ""), db, user.organization_id);
  db.prepare(
    "INSERT INTO ai_conversations (id, organization_id, user_id, role, content, created_at) VALUES (?, ?, ?, 'user', ?, datetime('now'))"
  ).run(crypto.randomUUID(), user.organization_id, user.id, String(message || ""));
  db.prepare(
    "INSERT INTO ai_conversations (id, organization_id, user_id, role, content, meta, created_at) VALUES (?, ?, ?, 'assistant', ?, ?, datetime('now'))"
  ).run(crypto.randomUUID(), user.organization_id, user.id, result.text, JSON.stringify({ sources: result.sources }));

  return NextResponse.json({ answer: result.text, sources: result.sources });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const history = db
    .prepare("SELECT role, content, meta FROM ai_conversations WHERE organization_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(user.organization_id, user.id) as any[];
  return NextResponse.json({ history: history.reverse() });
}