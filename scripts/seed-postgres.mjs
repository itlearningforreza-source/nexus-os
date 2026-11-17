#!/usr/bin/env node
// PostgreSQL Seed Script for Nexus OS
// Run with: node scripts/seed-postgres.mjs

import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from 'dotenv';

config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

const ORG_ID = crypto.randomUUID();

function uid() {
  return crypto.randomUUID();
}

const now = new Date();
const iso = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
const daysAhead = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };
const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const money = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 100) / 100;

async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => data[k]);
  await pool.query(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
}

async function run() {
  console.log('Nexus OS — PostgreSQL Seed');
  console.log('────────────────────────────────');
  
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Connected to PostgreSQL');
  } catch (e) {
    console.error('Failed to connect to PostgreSQL:', e);
    process.exit(1);
  }

  console.log('Seeding demo database (Acme Corporation)...');
  
  const userPassword = await bcrypt.hash('demo123', 10);
  const users: Record<string, string> = {};
  const employees: Array<{id: string, name: string, dept: string}> = [];

  // ── Organization ─────────────────────────────────────────────
  await insert('organizations', {
    id: ORG_ID,
    name: 'Acme Corporation',
    slug: 'acme',
    industry: 'Technology',
    size: '501-1000',
    plan: 'Enterprise',
    settings: JSON.stringify({}),
    created_at: iso(daysAgo(730)),
    updated_at: iso(daysAgo(1)),
  });

  // ── Users ────────────────────────────────────────────────────
  const userSeeds = [
    { email: 'demo@example.com', name: 'Alex Rivera', title: 'CEO', role: 'owner', color: '#3b82f6', dept: 'Executive', salary: 320000 },
    { email: 'sarah@acme.com', name: 'Sarah Chen', title: 'VP Sales', role: 'admin', color: '#8b5cf6', dept: 'Sales', salary: 240000 },
    { email: 'john@acme.com', name: 'John Kim', title: 'Engineering Manager', role: 'admin', color: '#10b981', dept: 'Engineering', salary: 210000 },
    { email: 'emily@acme.com', name: 'Emily Davis', title: 'VP Marketing', role: 'admin', color: '#f59e0b', dept: 'Marketing', salary: 220000 },
    { email: 'michael@acme.com', name: 'Michael Patel', title: 'CFO', role: 'admin', color: '#ef4444', dept: 'Finance', salary: 290000 },
  ];

  for (const [i, u] of userSeeds.entries()) {
    const id = uid();
    users[u.name] = id;
    await insert('users', {
      id, organization_id: ORG_ID,
      email: u.email, password_hash: userPassword,
      name: u.name, role: u.role, title: u.title,
      avatar_color: u.color, status: 'active',
      timezone: 'Asia/Jakarta', locale: 'en', theme: 'system',
      onboarded: i === 0,
      created_at: iso(daysAgo(700 - i * 30)),
      updated_at: iso(daysAgo(1)),
    });
    employees.push({ id, name: u.name, email: u.email, dept: u.dept, title: u.title });
  }

  // Additional users
  const firstNames = ['Ava','Liam','Mia','Noah','Sofia','Ethan','Isabella','Lucas','Amelia','Mason','Harper','Elijah','Ella','James','Luna','Benjamin','Aria','Henry','Scarlett','Alexander','Grace','Daniel','Chloe','Matthew','Zoe','Samuel','Nora','David','Layla','Owen','Riley','Hannah','Jack','Evelyn','Leo','Alice','Oscar','Nina','Max','Ruby','Felix'];
  const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker'];
  const departments = ['Engineering','Sales','Marketing','Finance','HR','Operations','Design','Support','Legal','Product'];
  const jobTitles: Record<string, string[]> = {
    Engineering: ['Frontend Engineer','Backend Engineer','DevOps Engineer','Data Engineer','QA Engineer'],
    Sales: ['Account Executive','Sales Manager','SDR','Account Manager'],
    Marketing: ['Marketing Manager','Content Strategist','SEO Specialist','Growth Marketer'],
    Finance: ['Financial Analyst','Accountant','FP&A Manager'],
    HR: ['HR Manager','Recruiter','People Ops'],
    Operations: ['Operations Manager','Project Manager','Analyst'],
    Design: ['Product Designer','UX Designer','UI Designer'],
    Support: ['Support Agent','Support Lead','CSM'],
    Legal: ['Legal Counsel','Paralegal'],
    Product: ['Product Manager','Product Owner'],
  };

  for (let i = 0; i < 110; i++) {
    const dept = pick(departments);
    const name = pick(firstNames) + ' ' + pick(lastNames);
    if (users[name]) continue;
    const id = uid();
    users[name] = id;
    await insert('users', {
      id, organization_id: ORG_ID,
      email: name.toLowerCase().replace(/ /g, '.') + '@acme.com',
      password_hash: null, name, role: 'member',
      title: pick(jobTitles[dept] || ['Associate']),
      avatar_color: pick(['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899']),
      status: 'active', timezone: 'Asia/Jakarta', locale: 'en', onboarded: true,
      created_at: iso(daysAgo(rnd(600))), updated_at: iso(daysAgo(1)),
    });
    employees.push({ id, name, email: name.toLowerCase().replace(/ /g, '.') + '@acme.com', dept, title: pick(jobTitles[dept] || ['Associate']) });
  }

  // ── Employees ──────────────────────────────────────────────
  for (const e of employees) {
    await insert('employees', {
      id: e.id, organization_id: ORG_ID, user_id: e.id,
      name: e.name, email: e.email, department: e.dept, title: e.title,
      manager_id: pick([users['Alex Rivera'],users['Sarah Chen'],users['John Kim'],users['Emily Davis'],users['Michael Patel']]),
      location: pick(['San Francisco','New York','Austin','London','Singapore','Jakarta','Berlin']),
      phone: '+1 555 ' + String(rnd(900000) + 100000),
      status: pick(['Active','Active','Active','On Leave']),
      hire_date: iso(daysAgo(rnd(2000))),
      salary: money(70000, 280000),
      created_at: iso(daysAgo(rnd(600))),
      updated_at: iso(daysAgo(1)),
    });
  }

  // ── Companies ──────────────────────────────────────────────
  const industries = ['Technology','Healthcare','Finance','Retail','Manufacturing','Energy','Media','Education','Logistics','Real Estate'];
  const companyNames: string[] = [];
  const companyIds: string[] = [];

  for (let i = 0; i < 105; i++) {
    const id = uid(); companyIds.push(id);
    const name = pick(['Acme','Globex','Initech','Umbrella','Stark','Wayne','Hooper','Vandelay','Sterling','Hooli','Nimbus','Pied','Dunder','Soylent','Aperture','Ogden','Wonka','Northwind','Contoso','Fabrikam','Adventure','Blue','Crimson','Vertex','Quantum','Nova','Zenith','Orbit','Falcon','Atlas']) + ' ' + pick(['Industries','Solutions','Group','Tech','Systems','Labs','Dynamics','Global','Enterprises','Digital','Networks','Analytics']);
    companyNames.push(name);
    await insert('companies', {
      id, organization_id: ORG_ID, name,
      industry: pick(industries),
      website: 'https://' + name.toLowerCase().replace(/[^a-z]/g, '') + '.com',
      city: pick(['San Francisco','New York','Austin','London','Singapore','Jakarta','Berlin','Tokyo','Sydney']),
      country: pick(['USA','USA','USA','UK','Singapore','Indonesia','Germany','Japan','Australia']),
      employees: 10 + rnd(8000),
      annual_revenue: money(100000, 50000000),
      health: pick(['Healthy','Healthy','Healthy','At Risk','Critical']),
      owner_id: pick(Object.values(users)),
      tags: JSON.stringify(pick([['Enterprise'],['SMB'],['Strategic'],['Growth'],['Priority']])),
      created_at: iso(daysAgo(rnd(600))), updated_at: iso(daysAgo(rnd(30))),
    });
  }

  // ── Contacts ───────────────────────────────────────────────
  for (let i = 0; i < 520; i++) {
    const firstName = pick(firstNames), lastName = pick(lastNames);
    await insert('contacts', {
      id: uid(), organization_id: ORG_ID,
      first_name: firstName, last_name: lastName,
      email: firstName.toLowerCase() + '.' + lastName.toLowerCase() + '@example.com',
      phone: '+1 555 ' + String(rnd(900000) + 100000),
      company_id: pick(companyIds),
      title: pick(['CEO','CTO','VP Sales','Director','Manager','Founder','CFO','Marketing Lead','Engineer','Buyer']),
      owner_id: pick(Object.values(users)),
      status: pick(['Active','Active','Active','Lead','Inactive']),
      tags: JSON.stringify(pick([['Hot'],['Warm'],['Customer'],['Prospect'],['Partner'],['Cold']])),
      score: rnd(101),
      created_at: iso(daysAgo(rnd(500))), updated_at: iso(daysAgo(rnd(30))),
    });
  }

  // ── Deals ──────────────────────────────────────────────────
  const stageProbs: Record<string, number> = { Lead: 20, Qualified: 35, Proposal: 55, Negotiation: 75, Won: 100, Lost: 0 };
  const stages = Object.keys(stageProbs);
  for (let i = 0; i < 120; i++) {
    const stage = pick(stages);
    const cid = pick(companyIds);
    await insert('deals', {
      id: uid(), organization_id: ORG_ID,
      title: companyNames[companyIds.indexOf(cid)] + ' ' + pick(['Enterprise Deal','Platform License','Renewal','Expansion','Implementation','Annual Contract']),
      company_id: cid, contact_id: null,
      owner_id: pick(Object.values(users)),
      stage, value: money(5000, 250000),
      probability: stageProbs[stage],
      expected_close: iso(daysAhead(rnd(90))),
      source: pick(['Website','Referral','Outbound','Inbound','Partner','Event']),
      created_at: iso(daysAgo(rnd(300))), updated_at: iso(daysAgo(rnd(30))),
    });
  }

  // ── Projects ───────────────────────────────────────────────
  const projectNames = ['Project Phoenix','Project Atlas','Cloud Migration','Mobile App Redesign','API Platform','Data Warehouse','Website Revamp','Mobile Banking App','E-commerce Launch','Chatbot Integration','AI Assistant','CRM Rollout','Security Upgrade','HR Portal','Payment Gateway','Analytics Dashboard','IoT Platform','Marketplace Launch','Internal Tools','Brand Refresh','Partner Portal','Content Platform','Mobile Wallet','Design System','Growth Engine','Operations Reboot'];
  const projectIds: string[] = [];
  for (let i = 0; i < 26; i++) {
    const id = uid(); projectIds.push(id);
    const progress = rnd(101);
    await insert('projects', {
      id, organization_id: ORG_ID, name: projectNames[i],
      description: projectNames[i] + ' is an active initiative at Acme Corporation to drive business value.',
      status: pick(['On Track','On Track','At Risk','On Hold','Completed']),
      health: Math.random() < 0.6 ? 'green' : pick(['green','green','yellow','red']),
      owner_id: pick(Object.values(users)),
      company_id: pick(companyIds),
      start_date: iso(daysAgo(rnd(120))), end_date: iso(daysAhead(rnd(180))),
      progress, created_at: iso(daysAgo(rnd(300))), updated_at: iso(daysAgo(rnd(30))),
    });
  }

  // ── Tasks ──────────────────────────────────────────────────
  const taskStatuses = ['Backlog','Todo','In Progress','Review','Done'];
  const taskTitles = ['Fix login bug','Write API docs','Design onboarding','Refactor auth module','Update pricing page','Run QA checks','Ship v2.3','Prepare release notes','Optimize database','Add dark mode','Improve accessibility','Set up CI/CD','Review PR','Schedule sync','Analyze churn','Migrate legacy data','Test edge cases','Update dependencies','Monitor metrics','Draft spec','Launch campaign','Audit security','Configure monitoring','Document workflows','Backup data'];
  for (let i = 0; i < 620; i++) {
    const done = Math.random() < 0.45;
    await insert('tasks', {
      id: uid(), organization_id: ORG_ID,
      project_id: pick(projectIds), title: pick(taskTitles),
      description: 'Task description for tracking purposes.',
      status: done ? 'Done' : pick(taskStatuses),
      priority: pick(['Low','Low','Medium','Medium','Medium','High','High','Critical']),
      assignee_id: pick(Object.values(users)),
      due_date: iso(done ? daysAgo(rnd(30)) : daysAhead(rnd(30))),
      tags: JSON.stringify(pick([['bug'],['feature'],['enhancement'],['design'],['backend'],['frontend']])),
      completed: done, created_at: iso(daysAgo(rnd(200))), updated_at: iso(daysAgo(rnd(30))),
    });
  }

  // ── Invoices ───────────────────────────────────────────────
  const invoiceStatuses = ['Paid','Paid','Paid','Paid','Overdue','Draft','Partially Paid'];
  for (let i = 0; i < 120; i++) {
    const status = pick(invoiceStatuses), amount = money(1000, 50000);
    await insert('invoices', {
      id: uid(), organization_id: ORG_ID,
      number: 'INV-' + String(1000 + i), company_id: pick(companyIds),
      status, issue_date: iso(daysAgo(rnd(120))), due_date: iso(daysAhead(rnd(30))),
      amount, paid_amount: status === 'Paid' ? amount : status === 'Partially Paid' ? amount * 0.5 : 0,
      currency: pick(['USD','USD','USD','IDR','EUR','SGD']),
      created_at: iso(daysAgo(rnd(200))), updated_at: iso(daysAgo(rnd(20))),
    });
  }

  // ── Expenses ───────────────────────────────────────────────
  for (let i = 0; i < 80; i++) {
    await insert('expenses', {
      id: uid(), organization_id: ORG_ID,
      description: pick(['Office rent','Cloud hosting','Software licenses','Marketing ads','Team lunch','Travel','Equipment','Consulting','Training','Utilities']),
      category: pick(['Operations','Technology','Marketing','Travel','Office']),
      amount: money(50, 12000), currency: pick(['USD','USD','USD','IDR']),
      date: iso(daysAgo(rnd(180))),
      vendor: pick(['Amazon Web Services','Google','Microsoft','Stripe','Slack','Figma','GitHub','Zoom','Notion','Datadog']),
      status: pick(['Approved','Approved','Pending','Rejected']),
      created_at: iso(daysAgo(rnd(180))),
    });
  }

  // ── Documents ──────────────────────────────────────────────
  const docTypes = ['document','presentation','spreadsheet','pdf','image'];
  const docNames = ['Q3 Financial Report','Marketing Plan 2025','Product Roadmap','Employee Handbook','Sales Playbook','Security Policy','Project Charter','Board Deck','Brand Guidelines','Engineering Doc','Data Strategy','Onboarding Guide','Annual Report','Contract Template','Meeting Notes'];
  for (let i = 0; i < 120; i++) {
    await insert('documents', {
      id: uid(), organization_id: ORG_ID,
      name: pick(docNames), type: pick(docTypes),
      folder: pick(['My Drive','Team','Shared','Company','Finance','Marketing']),
      owner_id: pick(Object.values(users)),
      size: rnd(4000000) + 10000, starred: Math.random() < 0.2,
      content: 'Sample document content for preview and indexing.',
      created_at: iso(daysAgo(rnd(400))), updated_at: iso(daysAgo(rnd(30))),
    });
  }

  // ── Office Documents ───────────────────────────────────────
  const officeWriter = (name: string, blocks: any) => ({
    id: uid(), organization_id: ORG_ID, name, kind: 'writer',
    folder: pick(['My Drive','Team','Company']), owner_id: pick(Object.values(users)),
    starred: Math.random() < 0.3 ? 1 : 0, archived: 0,
    content: JSON.stringify({ blocks }), version: 3,
    created_at: iso(daysAgo(rnd(120))), updated_at: iso(daysAgo(rnd(20))),
  });

  const officeSheet = (name: string, rows: any) => ({
    id: uid(), organization_id: ORG_ID, name, kind: 'spreadsheet',
    folder: pick(['My Drive','Finance','Operations']), owner_id: pick(Object.values(users)),
    starred: Math.random() < 0.3 ? 1 : 0, archived: 0,
    content: JSON.stringify({ rows }), version: 4,
    created_at: iso(daysAgo(rnd(120))), updated_at: iso(daysAgo(rnd(20))),
  });

  const officePresentation = (name: string, slideTitles: string[]) => ({
    id: uid(), organization_id: ORG_ID, name, kind: 'presentation',
    folder: pick(['My Drive','Marketing','Board']), owner_id: pick(Object.values(users)),
    starred: Math.random() < 0.4 ? 1 : 0, archived: 0,
    content: JSON.stringify({ slides: slideTitles.map((t, i) => ({ id: 's' + i, title: t, body: '• Key point\n• Supporting detail', layout: i === 0 ? 'title' : 'bullets' })) }),
    version: 2, created_at: iso(daysAgo(rnd(120))), updated_at: iso(daysAgo(rnd(20))),
  });

  await insert('office_documents', officeWriter('Q3 2025 Business Report', [
    { type: 'heading1', text: 'Q3 2025 Business Report' },
    { type: 'paragraph', text: 'Acme Corporation delivered a strong third quarter, driven by enterprise expansion and operational efficiency.' },
    { type: 'heading2', text: 'Revenue Highlights' },
    { type: 'list', text: 'Total revenue grew 18% quarter-over-quarter' },
    { type: 'list', text: 'Renewals above target with 96% retention' },
    { type: 'list', text: 'New logo acquisition up 12% in Enterprise segment' },
    { type: 'heading2', text: 'Key Initiatives' },
    { type: 'paragraph', text: 'The data platform migration is on track, and the AI assistant pilot showed measurable gains in support resolution time.' },
    { type: 'quote', text: 'Operational excellence and customer focus remain our north star.' },
  ]));

  await insert('office_documents', officeWriter('Meeting Minutes — Product Review', [
    { type: 'heading1', text: 'Product Review — Meeting Minutes' },
    { type: 'paragraph', text: 'Date: September 2025 · Attendees: Product, Eng, Design, Sales' },
    { type: 'heading2', text: 'Decisions' },
    { type: 'check', text: 'Ship v2.3 with the new onboarding flow', checked: true },
    { type: 'check', text: 'Defer chat export feature to next sprint', checked: false },
    { type: 'heading2', text: 'Action Items' },
    { type: 'list', text: 'John to finalize API contract for billing (by Friday)' },
    { type: 'list', text: 'Emily to share campaign analytics with the product team' },
    { type: 'list', text: 'Michael to review pricing tier changes' },
  ]));

  await insert('office_documents', officeWriter('Proposal — Enterprise Platform License', [
    { type: 'heading1', text: 'Enterprise Platform License Proposal' },
    { type: 'paragraph', text: 'Prepared for: TechStart Inc. · Prepared by: Alex Rivera, CEO' },
    { type: 'heading2', text: 'Executive Summary' },
    { type: 'paragraph', text: 'This proposal outlines a three-year platform license delivering unified CRM, Office, and analytics capabilities across the organization.' },
    { type: 'heading2', text: 'Commercial Terms' },
    { type: 'list', text: 'Annual license: $120,000 (first year)' },
    { type: 'list', text: 'Includes 250 seats and priority support' },
    { type: 'list', text: 'Success fee on implementation: $15,000' },
    { type: 'quote', text: 'We are confident this partnership will accelerate TechStart\'s digital transformation.' },
  ]));

  await insert('office_documents', officeWriter('Onboarding Playbook', [
    { type: 'heading1', text: 'Employee Onboarding Playbook' },
    { type: 'heading2', text: 'Week 1 — Foundations' },
    { type: 'number', text: 'Account provisioning and security training' },
    { type: 'number', text: 'Introduction to the company operating system' },
    { type: 'number', text: 'Meet the team and set up 1:1s' },
    { type: 'heading2', text: 'Week 2 — Deep Dive' },
    { type: 'list', text: 'Product walkthrough with engineering' },
    { type: 'list', text: 'Shadow customer-facing teams' },
  ]));

  const sheet = (rows: any) => rows;

  await insert('office_documents', officeSheet('Revenue — Quarterly Analysis', sheet([
    ['Month', 'Revenue', 'Expenses', 'Profit'],
    ['Jul', 142000, 98000, '=B2-C2'],
    ['Aug', 168000, 101000, '=B3-C3'],
    ['Sep', 193000, 112000, '=B4-C4'],
    ['Total', '=SUM(B2:B4)', '=SUM(C2:C4)', '=SUM(D2:D4)'],
    [],
    ['Best month', '=MAX(B2:B4)', '', ''],
    ['Average', '=AVERAGE(B2:B4)', '', ''],
  ])));

  await insert('office_documents', officeSheet('Sales Tracker 2025', sheet([
    ['Rep', 'Quota', 'Closed', 'Pipeline', 'Achievement'],
    ['Sarah Chen', 500000, 462000, 180000, '=C2/B2'],
    ['David Kim', 450000, 410000, 150000, '=C3/B3'],
    ['Nina Patel', 400000, 388000, 210000, '=C4/B4'],
    ['Oscar Lee', 500000, 430000, 90000, '=C5/B5'],
    ['Team', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '=C6/B6'],
  ])));

  await insert('office_documents', officeSheet('Budget — FY2026', sheet([
    ['Department', 'Budget', 'Spent', 'Remaining'],
    ['Engineering', 2400000, 1850000, '=B2-C2'],
    ['Sales', 1800000, 1420000, '=B3-C3'],
    ['Marketing', 1200000, 980000, '=B4-C4'],
    ['Operations', 800000, 610000, '=B5-C5'],
    ['Total', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)'],
  ])));

  await insert('office_documents', officePresentation('Company All-Hands — Q4 Kickoff', [
    'Q4 Kickoff', 'Where We\'ve Been', 'Q4 Priorities', 'Product Roadmap', 'Thanks & Questions',
  ]));

  await insert('office_documents', officePresentation('Sales Enablement Deck', [
    'Sales Enablement', 'Platform Overview', 'Value Proposition', 'Competitive Landscape', 'Objection Handling', 'Next Steps',
  ]));

  await insert('office_documents', officePresentation('Board Update — Growth Strategy', [
    'Growth Strategy Update', 'Market Context', 'Key Wins', 'Forward Plan', 'Appendix',
  ]));

  // ── Contracts ──────────────────────────────────────────────
  const contractTitles = ['Master Service Agreement','Vendor Contract','Client Agreement','NDA','Partnership Agreement','Software License','Services Agreement','Consulting Contract'];
  for (let i = 0; i < 55; i++) {
    await insert('contracts', {
      id: uid(), organization_id: ORG_ID,
      title: pick(contractTitles), company_id: pick(companyIds),
      status: pick(['Active','Active','Active','Draft','Expiring','Signed','Expired']),
      value: money(5000, 250000), currency: pick(['USD','USD','USD','IDR']),
      start_date: iso(daysAgo(rnd(200))), expiry_date: iso(daysAhead(rnd(365))),
      counterparty: pick(companyNames), created_at: iso(daysAgo(rnd(400))), updated_at: iso(daysAgo(rnd(30))),
    });
  }

  // ── Tickets ────────────────────────────────────────────────
  const ticketSubjects = ['Cannot login','Password reset','Billing question','Feature request','Bug report','Integration issue','Slow performance','API error','Account setup','Renewal question','Configuration help'];
  for (let i = 0; i < 120; i++) {
    await insert('tickets', {
      id: uid(), organization_id: ORG_ID,
      number: 'TK-' + String(4000 + i), subject: pick(ticketSubjects),
      description: 'Detailed description of the support issue.',
      priority: pick(['Low','Medium','Medium','High','High','Critical']),
      status: pick(['Open','Open','In Progress','Waiting','Resolved','Closed']),
      category: pick(['Billing','Technical','General','Account']),
      assignee_id: pick(Object.values(users)), company_id: pick(companyIds),
      due_date: iso(daysAhead(rnd(14))), sla: '2h', created_at: iso(daysAgo(rnd(200))),
    });
  }

  // ── Assets ─────────────────────────────────────────────────
  const assetNames = ['MacBook Pro','Dell XPS','iPhone 15','iPad Pro','Surface Laptop','Monitor','Desk','Chair','Keyboard','Headset'];
  for (let i = 0; i < 40; i++) {
    await insert('assets', {
      id: uid(), organization_id: ORG_ID,
      name: pick(assetNames), asset_id: 'AST-' + String(1800 + i),
      assigned_to: pick(employees.map(e => e.name)),
      status: pick(['Active','Active','In Repair','Retired']),
      category: 'Hardware',
      purchase_date: iso(daysAgo(rnd(800))), warranty_until: iso(daysAhead(rnd(700))),
      created_at: iso(daysAgo(rnd(400))),
    });
  }

  // ── Conversations & Messages ───────────────────────────────
  const convSeed = [{ kind: 'channel', name: 'engineering' },{ kind: 'channel', name: 'sales' },{ kind: 'channel', name: 'marketing' },{ kind: 'channel', name: 'general' },{ kind: 'channel', name: 'announcements' },{ kind: 'dm', name: 'Sarah Chen' },{ kind: 'dm', name: 'John Kim' },{ kind: 'dm', name: 'Emily Davis' }];
  const convIds: string[] = [];
  convSeed.forEach(c => { const id = uid(); convIds.push(id);
    await insert('conversations', { id, organization_id: ORG_ID, kind: c.kind, name: c.name, created_at: iso(daysAgo(300)) });
  });
  const msgBodies = ['The API deployment is ready.','I\'ll review it now.','Please check the database migration.','Can we sync tomorrow afternoon?','Ship it! Looks good.','Let\'s add that to the backlog.','Great work everyone.','Anyone free for a quick call?','I\'ve updated the documentation.','The build is passing.','See you in the standup.','This needs more research.','Approved. Let\'s proceed.','Any blockers today?','Perfect, thanks!','Let me check and get back to you.','That makes sense.','Closing this issue.','Registration is live.','Maintenance window tomorrow.'];
  for (let i = 0; i < 320; i++) {
    await insert('messages', { id: uid(), organization_id: ORG_ID, conversation_id: pick(convIds), user_id: pick(Object.values(users)), body: pick(msgBodies), created_at: iso(daysAgo(rnd(120))) });
  }

  // ── Emails ─────────────────────────────────────────────────
  const emailSeed = [
    { f: 'inbox', from: 'Sarah Chen', fromEmail: 'sarah.chen@acme.com', subject: 'Q4 Sales Pipeline Review', body: 'Hi team, I\'ve updated the Q4 pipeline numbers. We\'re tracking well against our targets and should close the quarter strong.', read: 0, star: 1 },
    { f: 'inbox', from: 'John Kim', fromEmail: 'john.kim@acme.com', subject: 'Project Phoenix - Sprint Update', body: 'We completed 23 out of 28 story points this sprint. Two items carried over to next week due to dependency on the API team.', read: 0, star: 0 },
    { f: 'inbox', from: 'Emily Davis', fromEmail: 'emily.davis@acme.com', subject: 'Marketing Campaign Results', body: 'Great news! Our October campaign exceeded expectations. Open rate is up to 42% and conversions are trending well.', read: 1, star: 0 },
    { f: 'inbox', from: 'Michael Patel', fromEmail: 'michael.patel@acme.com', subject: 'Invoice #INV-2847 - Payment Received', body: 'Payment of $45,000 has been received for Invoice #INV-2847 from Acme Corporation. Thank you for your business.', read: 0, star: 1 },
    { f: 'inbox', from: 'Legal Department', fromEmail: 'legal@acme.com', subject: 'Contract Renewal - TechStart Inc.', body: 'The master service agreement with TechStart Inc. is set to expire at the end of the quarter. We need to initiate the renewal process.', read: 1, star: 0 },
    { f: 'sent', from: 'Alex Rivera', fromEmail: 'demo@example.com', toEmail: 'sarah.chen@acme.com', subject: 'Re: Q4 Sales Pipeline Review', body: 'Thanks Sarah, this looks great. Let\'s review the top three opportunities in our next 1:1.', read: 1, star: 0 },
    { f: 'sent', from: 'Alex Rivera', fromEmail: 'demo@example.com', toEmail: 'vendor@example.com', subject: 'Contract signature', body: 'Please find the signed contract attached. We look forward to working together.', read: 1, star: 0 },
    { f: 'drafts', from: 'Alex Rivera', fromEmail: 'demo@example.com', toEmail: 'hr@acme.com', subject: 'Q4 Hiring Plan', body: 'Drafting a summary of our planned hires for next quarter. Will finalize this week.', read: 1, star: 0 },
  ];
  emailSeed.forEach(e => {
    await insert('emails', {
      id: uid(), organization_id: ORG_ID, folder: e.f,
      from_name: e.from, from_email: e.fromEmail,
      to_email: e.toEmail || 'demo@example.com', subject: e.subject, body: e.body,
      read: e.read, starred: e.star, user_id: users['Alex Rivera'],
      created_at: iso(daysAgo(rnd(20))),
    });
  });

  // ── Events ─────────────────────────────────────────────────
  const eventTitles = ['Team Standup','Client Meeting','Product Review','Board Sync','Design Review','Sprint Planning','Customer Call','Quarterly Planning','Interview','Vendor Demo','Workshop','One-on-one'];
  for (let i = 0; i < 120; i++) {
    const d = new Date(daysAhead(rnd(60) - 30)); d.setHours(9 + rnd(8), Math.floor(rnd(4)) * 15, 0, 0);
    const end = new Date(d.getTime() + (30 + rnd(4) * 30) * 60000);
    await insert('events', { id: uid(), organization_id: ORG_ID, title: pick(eventTitles), start: iso(d), end: iso(end), kind: pick(['Meeting','Call','Workshop','Review']), location: pick(['Zoom','Google Meet','Conf Room A','Conf Room B','Office']), attendees: JSON.stringify([pick(employees).name, pick(employees).name, 'Alex Rivera']), all_day: 0, created_at: iso(daysAgo(rnd(100))) });
  }

  // ── Automations ────────────────────────────────────────────
  await insert('automations', { id: uid(), organization_id: ORG_ID, name: 'New Lead Notification', trigger: 'Lead Created', definition: JSON.stringify({ actions: [{ type: 'notify', target: 'sales' }] }), status: 'Active', created_at: iso(daysAgo(90)) });
  await insert('automations', { id: uid(), organization_id: ORG_ID, name: 'Invoice Overdue Reminder', trigger: 'Invoice Overdue', definition: JSON.stringify({ actions: [{ type: 'email' }] }), status: 'Active', created_at: iso(daysAgo(90)) });
  await insert('automations', { id: uid(), organization_id: ORG_ID, name: 'Contract Renewal Alert', trigger: 'Contract Expiring', definition: JSON.stringify({ actions: [{ type: 'notify' }] }), status: 'Active', created_at: iso(daysAgo(60)) });

  // ── Campaigns ──────────────────────────────────────────────
  ['Spring Launch','Product Announcement','Email Nurture','Webinar Series','Account Based Marketing','Lead Generation','Brand Awareness','Retargeting'].forEach(cn => {
    await insert('campaigns', { id: uid(), organization_id: ORG_ID, name: cn, status: pick(['Active','Active','Active','Completed','Draft','Paused']), type: pick(['Email','Social','Webinar','Paid','Content']), budget: money(1000, 50000), revenue: money(5000, 120000), leads: rnd(800), open_rate: Math.round(20 + Math.random() * 40), ctr: Math.round(1 + Math.random() * 8), created_at: iso(daysAgo(rnd(300))) });
  });

  // ── Knowledge Pages ────────────────────────────────────────
  ['Getting Started','Company Handbook','Engineering Standards','Sales Playbook','HR Policies','Security Guidelines','Design System','Onboarding Guide','FAQ','Product Documentation'].forEach(kb => {
    await insert('knowledge_pages', { id: uid(), organization_id: ORG_ID, title: kb, content: '**' + kb + '**\n\nDetailed knowledge base content for the organization.', created_at: iso(daysAgo(rnd(400))), updated_at: iso(daysAgo(rnd(20))) });
  });

  // ── Notifications ──────────────────────────────────────────
  const notifs = [
    { c: 'sales', t: 'New deal assigned to you', b: 'Acme Enterprise Deal was assigned by Sarah Chen' },
    { c: 'mention', t: 'Sarah mentioned you', b: '#engineering — please check the migration' },
    { c: 'finance', t: 'Invoice #1932 paid', b: 'Acme Solutions paid $12,500' },
    { c: 'project', t: 'Project deadline tomorrow', b: 'Project Phoenix is due tomorrow' },
    { c: 'security', t: 'Security alert', b: 'New device signed in from Jakarta' },
  ];
  notifs.forEach((n, i) => { await insert('notifications', { id: uid(), organization_id: ORG_ID, user_id: users['Alex Rivera'], category: n.c, title: n.t, body: n.b, read: i < 3 ? 0 : 1, created_at: iso(daysAgo(i * 2)) }); });

  // ── Feature Flags ──────────────────────────────────────────
  ['crm','hr','finance','projects','support','marketing','legal','itsm','analytics','ai','automation'].forEach(f => {
    await insert('feature_flags', { id: uid(), organization_id: ORG_ID, name: f, enabled: 1, description: f + ' module flag', created_at: iso(daysAgo(400)) });
  });

  // ── Audit Logs ─────────────────────────────────────────────
  ['Login','View Dashboard','Create Deal','Update Task','Export Report','Open Ticket','Edit Contract','Send Message'].forEach(a => {
    await insert('audit_logs', { id: uid(), organization_id: ORG_ID, user_id: pick(Object.values(users)), action: a, object: 'System', object_id: '', ip: '203.0.113.' + rnd(200), result: 'Success', created_at: iso(daysAgo(rnd(30))) });
  });

  // ── AI Conversations ───────────────────────────────────────
  await insert('ai_conversations', { id: uid(), organization_id: ORG_ID, user_id: users['Alex Rivera'], role: 'user', content: 'Analyze the sales pipeline', created_at: iso(daysAgo(1)) });
  await insert('ai_conversations', { id: uid(), organization_id: ORG_ID, user_id: users['Alex Rivera'], role: 'assistant', content: 'Your pipeline is $4.62M with 28 active deals. 3 enterprise deals have a high probability of closing this week.', meta: JSON.stringify({ sources: ['CRM Pipeline','Sales Dashboard'] }), created_at: iso(daysAgo(1)) });

  console.log('');
  console.log('✓ Database seeded successfully');
  console.log('──────────────────────────────────');
  console.log('  Organization:  Acme Corporation');
  console.log('  Users:         ' + Object.keys(users).length);
  console.log('  Employees:     ~' + employees.length);
  console.log('  Companies:     105');
  console.log('  Contacts:      520');
  console.log('  Deals:         120');
  console.log('  Projects:      26');
  console.log('  Tasks:         620');
  console.log('  Invoices:      120');
  console.log('  Tickets:       120');
  console.log('  Contracts:     55');
  console.log('  Documents:     120');
  console.log('  Office:        10');
  console.log('  Events:        120');
  console.log('──────────────────────────────────');
  console.log('  Demo Login:');
  console.log('  Email:    demo@example.com');
  console.log('  Password: demo123');
  console.log('──────────────────────────────────');
  
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
