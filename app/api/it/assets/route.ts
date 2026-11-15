import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("assets", {
  searchFields: ["name", "asset_id", "assigned_to"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "name" }, { name: "asset_id" }, { name: "assigned_to" },
    { name: "status" }, { name: "category" },
    { name: "purchase_date", type: "date" }, { name: "warranty_until", type: "date" },
  ],
});