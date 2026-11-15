import { getDb } from "./db";

export function getCount(db: any, table: string, orgId: string, where = "") {
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM ${table} WHERE organization_id = ? ${where}`)
    .get(orgId);
  return row?.c || 0;
}

export function getSum(db: any, table: string, column: string, orgId: string, where = "") {
  const row = db
    .prepare(`SELECT COALESCE(SUM(${column}), 0) as s FROM ${table} WHERE organization_id = ? ${where}`)
    .get(orgId);
  return row?.s || 0;
}

export function dashboardStats(orgId: string) {
  const db = getDb();
  const totalRevenue = getSum(db, "invoices", "paid_amount", orgId, "AND status = 'Paid'");
  const pipeline = getSum(
    db,
    "deals",
    "value",
    orgId,
    "AND stage NOT IN ('Lost', 'Won') AND probability > 0"
  );
  const activeProjects = getCount(db, "projects", orgId, "AND status IN ('On Track','At Risk')");
  const atRiskProjects = getCount(db, "projects", orgId, "AND status = 'At Risk'");
  const openTickets = getCount(db, "tickets", orgId, "AND status IN ('Open','In Progress','Waiting')");
  const employees = getCount(db, "employees", orgId, "AND status = 'Active'");
  const deals = db
    .prepare("SELECT stage, COUNT(*) c, SUM(value) v FROM deals WHERE organization_id = ? AND stage NOT IN ('Lost','Won') GROUP BY stage")
    .all(orgId) as any[];
  const openDeals = deals.reduce((s, d) => s + d.c, 0);

  // last 12 months revenue
  const monthly = db
    .prepare(
      `SELECT strftime('%Y-%m', issue_date) m, SUM(paid_amount) rev
       FROM invoices WHERE organization_id = ? AND status = 'Paid' AND issue_date IS NOT NULL
       GROUP BY m ORDER BY m LIMIT 12`
    )
    .all(orgId) as any[];

  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueData = monthly.map((r) => {
    const parts = r.m.split("-");
    return { label: monthLabels[parseInt(parts[1], 10) - 1], value: Math.round(r.rev) };
  });

  const stageColors: Record<string, string> = {
    Lead: "var(--ink-faint)",
    Qualified: "var(--accent)",
    Proposal: "#8b5cf6",
    Negotiation: "#f59e0b",
  };
  const pipelineData = deals.map((d) => ({
    label: d.stage,
    value: Math.round(d.v),
    color: stageColors[d.stage] || "var(--accent)",
  }));

  const taskData = db
    .prepare(
      `SELECT
        SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) done,
        SUM(CASE WHEN status != 'Done' AND due_date < date('now') THEN 1 ELSE 0 END) overdue,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) inprogress
       FROM tasks WHERE organization_id = ?`
    )
    .get(orgId) as any;

  const upcomingEvents = db
    .prepare(
      `SELECT id, title, start, end, location FROM events
       WHERE organization_id = ? AND start >= datetime('now')
       ORDER BY start ASC LIMIT 5`
    )
    .all(orgId) as any[];

  const recentActivity = db
    .prepare(
      `SELECT a.user_id, a.action, a.created_at, u.name FROM audit_logs a JOIN users u ON u.id = a.user_id
       WHERE a.organization_id = ? ORDER BY a.created_at DESC LIMIT 8`
    )
    .all(orgId) as any[];

  const topAccounts = db
    .prepare(
      `SELECT c.id, c.name, c.health, COUNT(d.id) deal_count, SUM(d.value) deal_value
       FROM companies c LEFT JOIN deals d ON d.company_id = c.id AND d.stage NOT IN ('Lost','Won')
       WHERE c.organization_id = ?
       GROUP BY c.id ORDER BY deal_value DESC LIMIT 5`
    )
    .all(orgId) as any[];

  const overdueInvoices = db
    .prepare(
      `SELECT i.number, i.due_date, i.amount, i.currency, c.name company
       FROM invoices i LEFT JOIN companies c ON c.id = i.company_id
       WHERE i.organization_id = ? AND i.status = 'Overdue'
       ORDER BY i.due_date ASC LIMIT 5`
    )
    .all(orgId) as any[];

  // weekly tasks chart
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const dStart = new Date();
    dStart.setDate(dStart.getDate() - i);
    dStart.setHours(0, 0, 0, 0);
    const dEnd = new Date(dStart);
    dEnd.setDate(dEnd.getDate() + 1);
    const s = dStart.toISOString().replace("T", " ").slice(0, 19);
    const e = dEnd.toISOString().replace("T", " ").slice(0, 19);
    const row2 = db
      .prepare(
        `SELECT SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) done,
                COUNT(*) created
         FROM tasks WHERE organization_id = ? AND created_at >= ? AND created_at < ?`
      )
      .get(orgId, s, e) as any;
    weekData.push({
      label: dStart.toLocaleDateString("en-US", { weekday: "short" }),
      completed: row2?.done || 0,
      created: row2?.created || 0,
    });
  }

  return {
    totalRevenue,
    pipeline,
    activeProjects,
    atRiskProjects,
    openTickets,
    employees,
    openDeals,
    revenueData,
    pipelineData,
    taskData: {
      done: taskData?.done || 0,
      overdue: taskData?.overdue || 0,
      inprogress: taskData?.inprogress || 0,
    },
    upcomingEvents,
    recentActivity,
    topAccounts,
    overdueInvoices,
    weekData,
  };
}

export function searchAll(orgId: string, q: string, limit = 8) {
  const db = getDb();
  const term = `%${q}%`;
  const out: Record<string, any[]> = {};
  const tryQuery = (query: string, numLikeTerms = 2) => {
    const params: any[] = [orgId];
    for (let i = 0; i < numLikeTerms; i++) params.push(term);
    params.push(limit);
    try {
      return db.prepare(query).all(...params);
    } catch {
      return [];
    }
  };
  out.companies = tryQuery(
    `SELECT id, name, industry, 'Company' type FROM companies WHERE organization_id = ? AND (name LIKE ? OR industry LIKE ?) LIMIT ?`
  );
  out.contacts = tryQuery(
    `SELECT id, first_name, last_name, email, 'Contact' type FROM contacts WHERE organization_id = ? AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?) LIMIT ?`,
    3
  );
  out.deals = tryQuery(
    `SELECT id, title, value, stage, 'Deal' type FROM deals WHERE organization_id = ? AND title LIKE ? LIMIT ?`
  );
  out.projects = tryQuery(
    `SELECT id, name, status, 'Project' type FROM projects WHERE organization_id = ? AND name LIKE ? LIMIT ?`
  );
  out.tasks = tryQuery(
    `SELECT id, title, status, 'Task' type FROM tasks WHERE organization_id = ? AND title LIKE ? LIMIT ?`
  );
  out.tickets = tryQuery(
    `SELECT id, number, subject, status, 'Ticket' type FROM tickets WHERE organization_id = ? AND (subject LIKE ? OR number LIKE ?) LIMIT ?`
  );
  out.documents = tryQuery(
    `SELECT id, name, folder, 'Document' type FROM documents WHERE organization_id = ? AND name LIKE ? LIMIT ?`
  );
  out.office = tryQuery(
    `SELECT id, name, kind, 'Office' type FROM office_documents WHERE organization_id = ? AND (name LIKE ? OR content LIKE ?) LIMIT ?`
  );
  out.invoices = tryQuery(
    `SELECT id, number, amount, status, 'Invoice' type FROM invoices WHERE organization_id = ? AND number LIKE ? LIMIT ?`
  );
  out.users = tryQuery(
    `SELECT id, name, title, 'Employee' type FROM users WHERE organization_id = ? AND (name LIKE ? OR title LIKE ?) LIMIT ?`
  );
  return out;
}