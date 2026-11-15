-- Nexus OS single source of truth for the database schema.
-- Shared by lib/schema.ts (app boot, idempotent migrate) and scripts/seed.mjs (demo data).
-- All statements use IF [NOT] EXISTS so they are safe to run repeatedly on existing DBs.

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry TEXT,
  size TEXT,
  plan TEXT DEFAULT 'Business' CHECK (plan IN ('Free', 'Starter', 'Business', 'Enterprise')),
  settings TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  title TEXT,
  avatar_color TEXT DEFAULT '#3b82f6',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  timezone TEXT DEFAULT 'Asia/Jakarta',
  locale TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  onboarded INTEGER DEFAULT 0,
  phone TEXT,
  preferences TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT,
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Lead', 'Inactive')),
  tags TEXT DEFAULT '[]',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  city TEXT,
  country TEXT,
  employees INTEGER CHECK (employees IS NULL OR employees >= 0),
  annual_revenue REAL CHECK (annual_revenue IS NULL OR annual_revenue >= 0),
  health TEXT DEFAULT 'Healthy' CHECK (health IN ('Healthy', 'At Risk', 'Critical')),
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  stage TEXT DEFAULT 'Lead' CHECK (stage IN ('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')),
  value REAL DEFAULT 0 CHECK (value >= 0),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close TEXT,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'On Track' CHECK (status IN ('On Track', 'At Risk', 'On Hold', 'Completed')),
  health TEXT DEFAULT 'green' CHECK (health IN ('green', 'yellow', 'red')),
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  start_date TEXT,
  end_date TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Backlog' CHECK (status IN ('Backlog', 'Todo', 'In Progress', 'Review', 'Done')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  due_date TEXT,
  tags TEXT DEFAULT '[]',
  completed INTEGER DEFAULT 0 CHECK (completed IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  department TEXT,
  title TEXT,
  manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  location TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Terminated')),
  hire_date TEXT,
  salary REAL CHECK (salary IS NULL OR salary >= 0),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue', 'Partially Paid', 'Cancelled')),
  issue_date TEXT,
  due_date TEXT,
  amount REAL DEFAULT 0 CHECK (amount >= 0),
  paid_amount REAL DEFAULT 0 CHECK (paid_amount >= 0 AND paid_amount <= amount),
  currency TEXT DEFAULT 'USD',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  amount REAL DEFAULT 0 CHECK (amount >= 0),
  currency TEXT DEFAULT 'USD',
  date TEXT,
  vendor TEXT,
  status TEXT DEFAULT 'Approved' CHECK (status IN ('Approved', 'Pending', 'Rejected')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'document' CHECK (type IN ('document', 'presentation', 'spreadsheet', 'pdf', 'image')),
  folder TEXT DEFAULT 'My Drive',
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  size INTEGER DEFAULT 0 CHECK (size >= 0),
  starred INTEGER DEFAULT 0 CHECK (starred IN (0, 1)),
  content TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Signed', 'Expiring', 'Expired', 'Cancelled')),
  value REAL DEFAULT 0 CHECK (value >= 0),
  currency TEXT DEFAULT 'USD',
  start_date TEXT,
  expiry_date TEXT,
  counterparty TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Waiting', 'Resolved', 'Closed')),
  category TEXT,
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  due_date TEXT,
  sla TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_id TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'In Repair', 'Retired')),
  category TEXT,
  purchase_date TEXT,
  warranty_until TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind TEXT DEFAULT 'channel' CHECK (kind IN ('channel', 'dm')),
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start TEXT,
  end TEXT,
  kind TEXT DEFAULT 'Meeting' CHECK (kind IN ('Meeting', 'Call', 'Workshop', 'Review')),
  location TEXT,
  attendees TEXT DEFAULT '[]',
  all_day INTEGER DEFAULT 0 CHECK (all_day IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT,
  definition TEXT DEFAULT '{}',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Disabled')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  meta TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT,
  object TEXT,
  object_id TEXT,
  ip TEXT,
  result TEXT DEFAULT 'Success' CHECK (result IN ('Success', 'Failed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT,
  read INTEGER DEFAULT 0 CHECK (read IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled INTEGER DEFAULT 1 CHECK (enabled IN (0, 1)),
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Paused', 'Completed')),
  type TEXT,
  budget REAL CHECK (budget IS NULL OR budget >= 0),
  revenue REAL CHECK (revenue IS NULL OR revenue >= 0),
  leads INTEGER CHECK (leads IS NULL OR leads >= 0),
  open_rate REAL CHECK (open_rate IS NULL OR (open_rate >= 0 AND open_rate <= 100)),
  ctr REAL CHECK (ctr IS NULL OR (ctr >= 0 AND ctr <= 100)),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knowledge_pages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  parent_id TEXT REFERENCES knowledge_pages(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  folder TEXT DEFAULT 'inbox' CHECK (folder IN ('inbox', 'starred', 'sent', 'drafts', 'archive', 'trash')),
  from_name TEXT,
  from_email TEXT,
  to_email TEXT,
  subject TEXT,
  body TEXT,
  read INTEGER DEFAULT 0 CHECK (read IN (0, 1)),
  starred INTEGER DEFAULT 0 CHECK (starred IN (0, 1)),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  permissions TEXT DEFAULT '["read"]',
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  last_used TEXT,
  revoked INTEGER DEFAULT 0 CHECK (revoked IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  invited_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS office_documents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'writer' CHECK (kind IN ('writer', 'spreadsheet', 'presentation')),
  folder TEXT DEFAULT 'My Drive',
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  starred INTEGER DEFAULT 0 CHECK (starred IN (0, 1)),
  archived INTEGER DEFAULT 0 CHECK (archived IN (0, 1)),
  content TEXT,
  meta TEXT DEFAULT '{}',
  version INTEGER DEFAULT 1 CHECK (version >= 1),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Indexes (multi-tenant partitioning, join, and hot query columns)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_email ON users(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_org_number ON invoices(organization_id, number);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_org_number ON tickets(organization_id, number);
CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_org ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_events_org ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start);
CREATE INDEX IF NOT EXISTS idx_automations_org ON automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_org ON ai_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_org ON feature_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_org ON knowledge_pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_emails_org ON emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_emails_user ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_office_documents_org ON office_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_office_documents_owner ON office_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_office_documents_kind ON office_documents(kind);
