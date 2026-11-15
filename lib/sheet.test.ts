import { describe, it, expect } from "vitest";
import { evaluate, refToIndex, indexToRef, ERROR } from "./sheet";

describe("Spreadsheet Formula Engine", () => {
  const createGrid = (rows: number, cols: number) => 
    Array.from({ length: rows }, () => Array(cols).fill(""));

  describe("Basic Arithmetic", () => {
    it("evaluates simple addition", () => {
      const grid = createGrid(2, 2);
      grid[0][0] = 10;
      grid[0][1] = 20;
      expect(evaluate("A1+B1", { grid })).toBe(30);
    });

    it("evaluates subtraction", () => {
      const grid = createGrid(2, 2);
      grid[0][0] = 50;
      grid[0][1] = 30;
      expect(evaluate("A1-B1", { grid })).toBe(20);
    });

    it("evaluates multiplication", () => {
      const grid = createGrid(2, 2);
      grid[0][0] = 6;
      grid[0][1] = 7;
      expect(evaluate("A1*B1", { grid })).toBe(42);
    });

    it("evaluates division", () => {
      const grid = createGrid(2, 2);
      grid[0][0] = 100;
      grid[0][1] = 4;
      expect(evaluate("A1/B1", { grid })).toBe(25);
    });

    it("handles division by zero", () => {
      const grid = createGrid(2, 2);
      grid[0][0] = 10;
      grid[0][1] = 0;
      expect(evaluate("A1/B1", { grid })).toBe(ERROR.DIV0);
    });

    it("respects operator precedence", () => {
      const grid = createGrid(2, 2);
      grid[0][0] = 2;
      grid[0][1] = 3;
      expect(evaluate("A1+B1*2", { grid })).toBe(8); // 2 + (3*2) = 8
    });

    it("handles parentheses", () => {
      const grid = createGrid(2, 2);
      grid[0][0] = 2;
      grid[0][1] = 3;
      expect(evaluate("(A1+B1)*2", { grid })).toBe(10); // (2+3)*2 = 10
    });
  });

  describe("Cell References", () => {
    it("resolves A1 notation", () => {
      const grid = createGrid(5, 5);
      grid[0][0] = 42;
      expect(evaluate("A1", { grid })).toBe(42);
    });

    it("resolves absolute references", () => {
      const grid = createGrid(5, 5);
      grid[0][0] = 42;
      expect(evaluate("$A$1", { grid })).toBe(42);
    });

    it("handles out of bounds references", () => {
      const grid = createGrid(2, 2);
      expect(evaluate("Z999", { grid })).toBeNull();
    });
  });

  describe("Range References", () => {
    it("resolves range A1:B2", () => {
      const grid = createGrid(3, 3);
      grid[0][0] = 1;
      grid[0][1] = 2;
      grid[1][0] = 3;
      grid[1][1] = 4;
      const result = evaluate("A1:B2", { grid });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4);
    });
  });

  describe("Functions", () => {
    describe("SUM", () => {
      it("sums a range of numbers", () => {
        const grid = createGrid(5, 2);
        grid[0][0] = 10;
        grid[1][0] = 20;
        grid[2][0] = 30;
        expect(evaluate("SUM(A1:A3)", { grid })).toBe(60);
      });

      it("ignores non-numeric values", () => {
        const grid = createGrid(5, 2);
        grid[0][0] = 10;
        grid[1][0] = "text";
        grid[2][0] = 30;
        expect(evaluate("SUM(A1:A3)", { grid })).toBe(40);
      });

      it("handles empty cells", () => {
        const grid = createGrid(5, 2);
        grid[0][0] = 10;
        grid[1][0] = "";
        grid[2][0] = 30;
        expect(evaluate("SUM(A1:A3)", { grid })).toBe(40);
      });
    });

    describe("AVERAGE", () => {
      it("calculates average", () => {
        const grid = createGrid(5, 2);
        grid[0][0] = 10;
        grid[1][0] = 20;
        grid[2][0] = 30;
        expect(evaluate("AVERAGE(A1:A3)", { grid })).toBe(20);
      });

      it("returns 0 for empty range (engine behavior)", () => {
        const grid = createGrid(5, 2);
        expect(evaluate("AVERAGE(A1:A3)", { grid })).toBe(0);
      });
    });

    describe("MIN/MAX", () => {
      it("finds minimum", () => {
        const grid = createGrid(5, 2);
        grid[0][0] = 10;
        grid[1][0] = 5;
        grid[2][0] = 20;
        expect(evaluate("MIN(A1:A3)", { grid })).toBe(5);
      });

      it("finds maximum", () => {
        const grid = createGrid(5, 2);
        grid[0][0] = 10;
        grid[1][0] = 5;
        grid[2][0] = 20;
        expect(evaluate("MAX(A1:A3)", { grid })).toBe(20);
      });
    });

    describe("COUNT/COUNTA", () => {
      it("counts numeric cells", () => {
        const grid = createGrid(5, 2);
        grid[0][0] = 10;
        grid[1][0] = "text";
        grid[2][0] = 20;
        expect(evaluate("COUNT(A1:A3)", { grid })).toBe(2);
      });

      it("counts non-empty cells", () => {
        const grid = createGrid(5, 2);
        grid[0][0] = 10;
        grid[1][0] = "text";
        grid[2][0] = "";
        expect(evaluate("COUNTA(A1:A3)", { grid })).toBe(2);
      });
    });

    describe("IF", () => {
      it("returns true branch for numeric comparison", () => {
        const grid = createGrid(2, 2);
        grid[0][0] = 10;
        const result = evaluate("IF(A1>5, 1, 0)", { grid });
        expect(result).toBe(1);
      });

      it("returns false branch for numeric comparison", () => {
        const grid = createGrid(2, 2);
        grid[0][0] = 3;
        const result = evaluate("IF(A1>5, 1, 0)", { grid });
        expect(result).toBe(0);
      });
    });

    describe("Logical Functions", () => {
      it("evaluates AND", () => {
        expect(evaluate("AND(TRUE, TRUE)", { grid: createGrid(1, 1) })).toBe(true);
        expect(evaluate("AND(TRUE, FALSE)", { grid: createGrid(1, 1) })).toBe(false);
      });

      it("evaluates OR", () => {
        expect(evaluate("OR(FALSE, TRUE)", { grid: createGrid(1, 1) })).toBe(true);
        expect(evaluate("OR(FALSE, FALSE)", { grid: createGrid(1, 1) })).toBe(false);
      });

      it("evaluates NOT", () => {
        expect(evaluate("NOT(TRUE)", { grid: createGrid(1, 1) })).toBe(false);
        expect(evaluate("NOT(FALSE)", { grid: createGrid(1, 1) })).toBe(true);
      });
    });
  });

  describe("Error Handling", () => {
    it("returns NAME error for unknown function", () => {
      expect(evaluate("UNKNOWN()", { grid: createGrid(1, 1) })).toBe(ERROR.NAME);
    });

    it("returns REF error for circular reference", () => {
      const grid = createGrid(2, 2);
      grid[0][0] = "=B1";
      grid[0][1] = "=A1";
      expect(evaluate("A1", { grid })).toBe(ERROR.REF);
    });

    it("handles empty formula", () => {
      expect(evaluate("", { grid: createGrid(1, 1) })).toBeNull();
      expect(evaluate("   ", { grid: createGrid(1, 1) })).toBeNull();
    });
  });

  describe("Reference Utilities", () => {
    it("converts ref to index", () => {
      expect(refToIndex("A1")).toEqual({ row: 0, col: 0 });
      expect(refToIndex("B2")).toEqual({ row: 1, col: 1 });
      expect(refToIndex("AA10")).toEqual({ row: 9, col: 26 });
      expect(refToIndex("invalid")).toBeNull();
    });

    it("converts index to ref", () => {
      expect(indexToRef(0, 0)).toBe("A1");
      expect(indexToRef(1, 1)).toBe("B2");
      expect(indexToRef(9, 26)).toBe("AA10");
    });

    it("round trips ref <-> index", () => {
      const refs = ["A1", "Z100", "AA1", "XFD1048576"];
      for (const ref of refs) {
        const idx = refToIndex(ref);
        if (idx) {
          expect(indexToRef(idx.row, idx.col)).toBe(ref);
        }
      }
    });
  });
});
