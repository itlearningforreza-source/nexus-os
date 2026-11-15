import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("deals", {
  searchFields: ["title"],
  defaultOrder: "created_at DESC",
  allowedFields: [
    { name: "title" }, { name: "company_id" }, { name: "contact_id" },
    { name: "owner_id" }, { name: "stage" }, { name: "value", type: "real" },
    { name: "probability", type: "int" }, { name: "expected_close", type: "date" },
    { name: "source" },
  ],
});