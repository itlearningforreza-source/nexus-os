import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("automations", {
  searchFields: ["name", "trigger"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "name" }, { name: "trigger" }, { name: "status" },
  ],
});