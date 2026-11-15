import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("contracts", {
  searchFields: ["title"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "title" }, { name: "company_id" }, { name: "status" },
    { name: "value", type: "real" }, { name: "currency" },
    { name: "start_date", type: "date" }, { name: "expiry_date", type: "date" },
    { name: "counterparty" },
  ],
});