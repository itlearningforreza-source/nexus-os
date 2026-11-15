import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("projects", {
  searchFields: ["name"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "name" }, { name: "description" }, { name: "status" },
    { name: "health" }, { name: "owner_id" }, { name: "company_id" },
    { name: "start_date", type: "date" }, { name: "end_date", type: "date" },
    { name: "progress", type: "int" },
  ],
});