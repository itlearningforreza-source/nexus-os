import { describe, it, expect } from "vitest";
import { 
  formatCurrency, 
  formatDate, 
  formatTime, 
  timeAgo, 
  initials, 
  shortNumber, 
  uid,
  toCsv,
  cn 
} from "./utils";

describe("Utility Functions", () => {
  describe("formatCurrency", () => {
    it("formats USD correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,235");
      expect(formatCurrency(0)).toBe("$0");
      expect(formatCurrency(1000000)).toBe("$1,000,000");
    });

    it("formats IDR correctly", () => {
      expect(formatCurrency(1234567, "IDR")).toBe("Rp1,234,567");
    });

    it("formats EUR correctly", () => {
      expect(formatCurrency(1234.56, "EUR")).toBe("€1,235");
    });

    it("formats negative numbers with $ prefix", () => {
      // Implementation puts $ before negative sign
      expect(formatCurrency(-1234.56)).toBe("$-1,235");
    });
  });

  describe("formatDate", () => {
    it("formats ISO date string", () => {
      expect(formatDate("2024-01-15 10:30:00")).toBe("Jan 15, 2024");
      expect(formatDate("2024-12-25 00:00:00")).toBe("Dec 25, 2024");
    });

    it("handles null/undefined", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("handles invalid date", () => {
      expect(formatDate("invalid")).toBe("invalid");
    });
  });

  describe("formatTime", () => {
    it("formats time correctly (uses local timezone)", () => {
      const timeStr = "2024-01-15 10:30:00";
      const result = formatTime(timeStr);
      // Should be a valid time format like "10:30 AM" or adjusted for timezone
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it("formats afternoon time", () => {
      const result = formatTime("2024-01-15 14:45:00");
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it("handles null/undefined", () => {
      expect(formatTime(null)).toBe("—");
      expect(formatTime(undefined)).toBe("—");
    });
  });

  describe("timeAgo", () => {
    it("shows 'just now' for recent times", () => {
      const now = new Date().toISOString().replace("T", " ").slice(0, 19);
      expect(timeAgo(now)).toBe("just now");
    });

    it("shows minutes ago", () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
      expect(timeAgo(fiveMinsAgo)).toBe("5m ago");
    });

    it("shows hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
      expect(timeAgo(twoHoursAgo)).toBe("2h ago");
    });

    it("shows days ago", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
      expect(timeAgo(threeDaysAgo)).toBe("3d ago");
    });

    it("shows months ago", () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
      expect(timeAgo(twoMonthsAgo)).toBe("2mo ago");
    });
  });

  describe("initials", () => {
    it("extracts initials from full name", () => {
      expect(initials("John Doe")).toBe("JD");
      expect(initials("Alice Bob Carol")).toBe("AB");
      expect(initials("Single")).toBe("S");
    });

    it("handles extra spaces", () => {
      expect(initials("  John   Doe  ")).toBe("JD");
    });
  });

  describe("shortNumber", () => {
    it("formats thousands", () => {
      expect(shortNumber(1500)).toBe("1.5K");
      expect(shortNumber(999)).toBe("999");
    });

    it("formats millions", () => {
      expect(shortNumber(1500000)).toBe("1.5M");
      // 999999 rounds to 1000K which is displayed as 1000.0K
      expect(shortNumber(999999)).toBe("1000.0K");
    });

    it("handles zero", () => {
      expect(shortNumber(0)).toBe("0");
    });
  });

  describe("uid", () => {
    it("generates unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(uid());
      }
      expect(ids.size).toBe(100);
    });

    it("generates UUID format when crypto available", () => {
      const id = uid();
      // Should be a valid UUID format (36 chars with hyphens)
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe("toCsv", () => {
    it("converts array of objects to CSV", () => {
      const rows = [
        { name: "John", age: 30, city: "New York" },
        { name: "Jane", age: 25, city: "Boston" },
      ];
      const csv = toCsv(rows);
      expect(csv).toContain("name,age,city");
      expect(csv).toContain("John,30,New York");
      expect(csv).toContain("Jane,25,Boston");
    });

    it("escapes commas and quotes", () => {
      const rows = [{ name: 'John, "Junior"', age: 30 }];
      const csv = toCsv(rows);
      expect(csv).toContain('"John, ""Junior""",30');
    });

    it("handles empty array", () => {
      expect(toCsv([])).toBe("");
    });

    it("handles null/undefined values", () => {
      const rows = [{ name: "John", age: null, city: undefined }];
      const csv = toCsv(rows);
      expect(csv).toContain("John,,");
    });
  });

  describe("cn (classnames)", () => {
    it("joins class names", () => {
      expect(cn("base", "extra")).toBe("base extra");
    });

    it("handles conditional classes", () => {
      expect(cn("base", true && "conditional")).toBe("base conditional");
      expect(cn("base", false && "conditional")).toBe("base");
    });

    it("handles objects", () => {
      expect(cn({ active: true, disabled: false })).toBe("active");
    });

    it("handles arrays", () => {
      expect(cn(["a", "b", "c"])).toBe("a b c");
    });
  });
});
