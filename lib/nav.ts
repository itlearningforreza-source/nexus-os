export type NavItem = {
  label: string;
  href: string;
  icon: any;
  badge?: number;
};

export const mainNav: { section: string; items: NavItem[] }[] = [
  {
    section: "",
    items: [
      { label: "Home", href: "/dashboard", icon: "home" },
      { label: "Inbox", href: "/inbox", icon: "inbox" },
      { label: "Chat", href: "/chat", icon: "chat" },
      { label: "Calendar", href: "/calendar", icon: "calendar" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "CRM", href: "/crm", icon: "crm" },
      { label: "Sales", href: "/sales", icon: "sales" },
      { label: "Marketing", href: "/marketing", icon: "marketing" },
      { label: "Support", href: "/support", icon: "support" },
    ],
  },
  {
    section: "Work",
    items: [
      { label: "Projects", href: "/projects", icon: "projects" },
      { label: "Knowledge", href: "/knowledge", icon: "knowledge" },
      { label: "Documents", href: "/documents", icon: "documents" },
    ],
  },
  {
    section: "Office",
    items: [
      { label: "Office Suite", href: "/office", icon: "documents" },
      { label: "Writer", href: "/office?kind=writer", icon: "file" },
      { label: "Spreadsheet", href: "/office?kind=spreadsheet", icon: "table" },
      { label: "Presentation", href: "/office?kind=presentation", icon: "layers" },
    ],
  },
  {
    section: "People & Company",
    items: [
      { label: "HR", href: "/hr", icon: "hr" },
      { label: "Finance", href: "/finance", icon: "finance" },
      { label: "Legal", href: "/legal", icon: "legal" },
      { label: "IT", href: "/it", icon: "it" },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { label: "Analytics", href: "/analytics", icon: "analytics" },
      { label: "Automation", href: "/automation", icon: "automation" },
      { label: "AI", href: "/ai", icon: "ai" },
    ],
  },
  {
    section: "Admin",
    items: [
      { label: "Admin", href: "/admin", icon: "admin" },
      { label: "Settings", href: "/settings", icon: "settings" },
    ],
  },
];

export const createOptions: { label: string; href: string; icon: any }[] = [
  { label: "Person", href: "/crm/contacts?create=true", icon: "user" },
  { label: "Company", href: "/crm/companies?create=true", icon: "building" },
  { label: "Deal", href: "/sales?create=true", icon: "sales" },
  { label: "Task", href: "/projects?create=task", icon: "check-circle" },
  { label: "Project", href: "/projects?create=project", icon: "projects" },
  { label: "Invoice", href: "/finance?create=true", icon: "receipt" },
  { label: "Document", href: "/documents?create=true", icon: "file" },
  { label: "Contract", href: "/legal?create=true", icon: "legal" },
  { label: "Ticket", href: "/support?create=true", icon: "ticket" },
  { label: "Event", href: "/calendar?create=true", icon: "calendar" },
  { label: "Employee", href: "/hr?create=true", icon: "hr" },
  { label: "Campaign", href: "/marketing?create=true", icon: "marketing" },
  { label: "Writer Doc", href: "/office/new?kind=writer", icon: "file" },
  { label: "Spreadsheet", href: "/office/new?kind=spreadsheet", icon: "table" },
  { label: "Presentation", href: "/office/new?kind=presentation", icon: "layers" },
];
