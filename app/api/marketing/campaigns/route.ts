import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("campaigns", {
  searchFields: ["name"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "name" }, { name: "status" }, { name: "type" },
    { name: "budget", type: "real" }, { name: "revenue", type: "real" },
    { name: "leads", type: "int" }, { name: "open_rate", type: "real" },
    { name: "ctr", type: "real" },
  ],
});