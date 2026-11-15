import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("tasks", {
  searchFields: ["title"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "project_id" }, { name: "title" }, { name: "description" },
    { name: "status" }, { name: "priority" }, { name: "assignee_id" },
    { name: "due_date", type: "date" }, { name: "tags", type: "json" },
    { name: "completed", type: "int" },
  ],
});