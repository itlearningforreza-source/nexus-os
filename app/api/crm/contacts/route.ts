import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("contacts", {
  searchFields: ["first_name", "last_name", "email"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "first_name" }, { name: "last_name" }, { name: "email" },
    { name: "phone" }, { name: "company_id" }, { name: "title" },
    { name: "owner_id" }, { name: "status" },
    { name: "tags", type: "json" }, { name: "score", type: "int" },
  ],
});