import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("tickets", {
  searchFields: ["subject", "number"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "number" }, { name: "subject" }, { name: "description" },
    { name: "priority" }, { name: "status" }, { name: "category" },
    { name: "assignee_id" }, { name: "company_id" }, { name: "contact_id" },
    { name: "due_date", type: "date" }, { name: "sla" },
  ],
});