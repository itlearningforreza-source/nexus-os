import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("knowledge_pages", {
  searchFields: ["title"],
  defaultOrder: "updated_at DESC",
  allowedFields: [
    { name: "title" }, { name: "content" }, { name: "parent_id" },
  ],
});