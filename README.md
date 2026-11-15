# Nexus OS

> One Platform. One Workspace. One Company Operating System.

Nexus OS is an all-in-one enterprise SaaS platform that unifies CRM, projects, finance, HR, documents, AI, and more into a single, powerful workspace.

## Features

- **Dashboard** — Real-time KPIs, charts, activity feed, AI insights
- **CRM** — Contacts, companies, leads, deals with visual pipeline
- **Sales Pipeline** — Kanban board with drag-and-drop deal management
- **Projects** — List & board views, task management, project health tracking
- **Documents** — File management with folders, starring, and search
- **Office Suite** — Writer (block-based rich text), Spreadsheet (formula engine), and Presentation editors with autosave and export
- **HR** — Employee directory, org chart, department management
- **Finance** — Invoices, expenses, revenue tracking, donut charts
- **Support** — Ticket management with priority, SLA, and resolution tracking
- **Legal** — Contract management with status, value, and expiry tracking
- **IT & Assets** — Asset management with assignment and warranty tracking
- **Marketing** — Campaign management with performance metrics
- **Chat** — Team messaging with channels and direct messages
- **Calendar** — Event management with multiple views
- **Knowledge Base** — Company wiki with nested pages
- **Analytics** — Dashboard with interactive charts and KPIs
- **Automation** — Workflow automation builder
- **AI Assistant** — Built-in AI for data analysis and insights
- **Settings** — Organization, profile, security, notifications, billing, API, audit
- **Command Palette** — Cmd+K navigation and search
- **Global Search** — Cross-table search across all entities
- **Dark Mode** — Full dark mode support with system preference detection

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT (jose) + bcrypt password hashing
- **Styling:** Tailwind CSS 3.4
- **Charts:** Recharts
- **Icons:** Custom SVG icon system (90+ icons)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone <repository-url>
cd "SaaS-all in one"
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

```
Email: demo@example.com
Password: demo123
```

### Seed Data

The database is pre-seeded with demo data for Acme Corporation:

- 100+ employees
- 100+ companies
- 500+ contacts
- 100+ deals
- 20+ projects
- 500+ tasks
- 100+ invoices
- 100+ tickets
- 100+ documents
- 50+ contracts
- 100+ calendar events
- 100+ chat messages

To re-seed:

```bash
npm run seed
```

## Project Structure

```
├── app/
│   ├── (marketing)/          # Public landing page
│   ├── (app)/                # Authenticated app shell
│   │   ├── dashboard/        # Main dashboard
│   │   ├── crm/              # CRM module
│   │   ├── sales/            # Sales pipeline
│   │   ├── marketing/        # Marketing campaigns
│   │   ├── support/          # Support tickets
│   │   ├── projects/         # Project management
│   │   ├── documents/        # Document management
│   │   ├── hr/               # Human resources
│   │   ├── finance/          # Finance & invoicing
│   │   ├── legal/            # Legal contracts
│   │   ├── it/               # IT asset management
│   │   ├── chat/             # Team chat
│   │   ├── calendar/         # Calendar events
│   │   ├── analytics/        # Analytics dashboard
│   │   ├── ai/               # AI assistant
│   │   ├── automation/       # Workflow automation
│   │   ├── knowledge/        # Knowledge base
│   │   ├── inbox/            # Unified inbox
│   │   ├── email/            # Email interface
│   │   ├── admin/            # Admin console
│   │   └── settings/         # Settings (9 sub-pages)
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication
│   │   ├── crm/              # CRM CRUD
│   │   ├── projects/         # Projects CRUD
│   │   ├── tasks/            # Tasks CRUD
│   │   ├── finance/          # Finance CRUD
│   │   ├── hr/               # HR CRUD
│   │   ├── support/          # Support CRUD
│   │   ├── legal/            # Legal CRUD
│   │   ├── it/               # IT CRUD
│   │   ├── documents/        # Documents CRUD
│   │   ├── marketing/        # Marketing CRUD
│   │   ├── calendar/         # Calendar CRUD
│   │   ├── knowledge/        # Knowledge CRUD
│   │   ├── automations/      # Automation CRUD
│   │   ├── chat/             # Chat API
│   │   ├── notifications/    # Notifications API
│   │   ├── search/           # Global search
│   │   ├── ai/               # AI assistant
│   │   └── health/           # Health check
│   └── login/                # Login page
├── components/
│   ├── layout/               # App shell, sidebar, topbar, command palette
│   ├── ui/                   # Design system (Button, Badge, Input, etc.)
│   ├── charts/               # Recharts components
│   ├── dashboard/            # Dashboard widgets
│   ├── projects/             # Kanban board
│   ├── landing/              # Landing page components
│   └── settings/             # Settings navigation
├── lib/
│   ├── schema.sql           # Single source of truth: tables + indexes
│   ├── schema.ts            # Applies schema.sql + additive migrations
│   ├── db.ts                 # Database singleton
│   ├── auth.ts               # JWT authentication
│   ├── crud.ts               # Generic CRUD handler factory
│   ├── data.ts               # Dashboard data aggregation
│   ├── nav.ts                # Navigation configuration
│   ├── theme.ts              # Theme injection
│   ├── api.ts                # API helpers
│   └── utils.ts              # Utility functions
├── scripts/
│   ├── setup.mjs             # Setup script
│   ├── seed.mjs              # Seed data script
│   └── test-api.mjs          # API integration test suite
└── data/
    └── nexus.db              # SQLite database
```

## Database & Migrations

- **`lib/schema.sql`** is the single source of truth for the schema (tables,
  indexes, unique constraints). It is shared by both the runtime
  (`lib/schema.ts`) and the seeder (`scripts/seed.mjs`), so migrations and demo
  data never drift apart.
- `lib/schema.ts` runs `schema.sql` idempotently (`CREATE TABLE IF NOT EXISTS`)
  and applies any additive column migrations for existing databases.
- Foreign keys are enforced (`PRAGMA foreign_keys = ON`), so parent rows are
  created before children.

Tables (all tenant-scoped by `organization_id`): Organizations, Users, Sessions,
Teams, Roles, Team Members, Contacts, Companies, Deals, Projects, Tasks,
Employees, Invoices, Expenses, Documents, Contracts, Tickets, Assets,
Conversations, Messages, Events, Automations, Knowledge Pages, Campaigns,
Notifications, Audit Logs, Feature Flags, API Keys, Team Invites.

## Security Model

- **Tenant isolation:** every query is scoped by `organization_id`; cross-tenant
  reads/writes return 404 (covered by automated tests).
- **Mass-assignment protection:** generic CRUD (`lib/crud.ts`) whitelists
  updatable columns and ignores protected fields (`id`, `organization_id`,
  `created_at`, hashes).
- **Auth:** JWT sessions (httpOnly cookies), bcrypt password hashing, server-side
  session revocation on logout, and forced re-auth on password change.
- **Rate limiting:** login, registration, and password-change endpoints are
  rate-limited by IP (in-memory buckets are periodically pruned).
- **RBAC:** owner/admin roles gate organization-level settings, team invites, and
  API-key management.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

```env
# Database (any writable path)
DATABASE_PATH=./data/nexus.db

# Authentication secret — generate a long random string in production
AUTH_SECRET=change-this-to-a-secure-random-string

# Comma-separated roles with admin privileges
ADMIN_ROLES=owner,admin

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript check (tsc --noEmit)
npm run test         # Run the API integration test suite (isolated test DB)
npm run seed         # Seed database with demo data
npm run setup        # Install + seed
```

> **Note:** `npm run lint` calls `next lint`, which is interactive/unconfigured
> and not enforced — use `npm run typecheck` and `npm run test` as the gates.

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | User login (rate-limited) |
| `/api/auth/register` | POST | Create organization + user |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/password` | POST | Change password (revokes other sessions) |
| `/api/crm/companies` | CRUD | Company management |
| `/api/crm/contacts` | CRUD | Contact management |
| `/api/crm/deals` | CRUD | Deal pipeline |
| `/api/projects` | CRUD | Project management |
| `/api/tasks` | CRUD | Task management |
| `/api/finance/invoices` | CRUD | Invoice management |
| `/api/hr/employees` | CRUD | Employee management |
| `/api/support/tickets` | CRUD | Ticket management |
| `/api/legal/contracts` | CRUD | Contract management |
| `/api/it/assets` | CRUD | Asset management |
| `/api/documents` | CRUD | Document management |
| `/api/office` | CRUD | Office Suite documents (kind: writer/spreadsheet/presentation) |
| `/api/office/export` | POST | Export office docs (markdown/html/txt/json/csv) |
| `/api/marketing/campaigns` | CRUD | Campaign management |
| `/api/calendar/events` | CRUD | Event management |
| `/api/knowledge` | CRUD | Knowledge base |
| `/api/automations` | CRUD | Automation workflows |
| `/api/chat` | GET/POST | Chat messages |
| `/api/emails` | GET/POST/PATCH | Email inbox (real backend) |
| `/api/notifications` | GET/POST | Notifications |
| `/api/search` | GET | Global search |
| `/api/ai` | GET/POST | AI assistant |
| `/api/health` | GET | Health check |
| `/api/settings` | PUT | Organization settings (admin) |
| `/api/settings/profile` | PATCH | Current user's profile/preferences |
| `/api/settings/api-keys` | GET/POST/PATCH | API-key management (admin) |
| `/api/settings/team-invites` | GET/POST/DELETE | Team invitations (admin) |

## Testing

```bash
npm run test
```

Boots the server against an isolated throwaway SQLite database and runs
end-to-end assertions covering: auth & session revocation, tenant isolation
(cross-org reads/writes blocked), CRUD mass-assignment & injection protection,
org settings, feature flags, email, password change, profile whitelisting, team
invites, API-key management, chat tenant isolation, office document CRUD/export/
versioning/tenant isolation, and login rate-limiting. It also runs a formula-engine
unit suite for the Spreadsheet editor (arithmetic, comparisons, ranges, aggregation,
logical/text/lookup functions, and error handling).

## License

MIT
