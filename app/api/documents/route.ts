import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("documents", {
  searchFields: ["name"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "name" }, { name: "type" }, { name: "folder" },
    { name: "owner_id" }, { name: "size", type: "int" },
    { name: "starred", type: "int" }, { name: "content" },
  ],
});