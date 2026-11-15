import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("invoices", {
  searchFields: ["number"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "number" }, { name: "company_id" }, { name: "contact_id" },
    { name: "status" }, { name: "issue_date", type: "date" },
    { name: "due_date", type: "date" }, { name: "amount", type: "real" },
    { name: "paid_amount", type: "real" }, { name: "currency" },
  ],
});