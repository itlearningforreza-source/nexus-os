import { crudHandlers } from "@/lib/crud";

export const { GET, POST, PATCH, DELETE } = crudHandlers("events", {
  searchFields: ["title"],
  defaultOrder: "start ASC",
  allowedFields: [
    { name: "title" }, { name: "start", type: "date" }, { name: "end", type: "date" },
    { name: "kind" }, { name: "location" }, { name: "attendees", type: "json" },
    { name: "all_day", type: "int" },
  ],
});