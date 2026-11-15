import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("companies", {
  searchFields: ["name", "industry"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "name" }, { name: "industry" }, { name: "website" },
    { name: "city" }, { name: "country" }, { name: "employees", type: "int" },
    { name: "annual_revenue", type: "real" }, { name: "health" },
    { name: "owner_id" }, { name: "tags", type: "json" },
  ],
});