import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("employees", {
  searchFields: ["name", "email", "department"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "name" }, { name: "email" }, { name: "department" },
    { name: "title" }, { name: "manager_id" }, { name: "location" },
    { name: "phone" }, { name: "status" }, { name: "hire_date", type: "date" },
    { name: "salary", type: "real" },
  ],
});