"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/primitive";
import { Dropdown, DropdownItem, MenuDivider, Tooltip } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { refToIndex, indexToRef, evaluate, columnLabel, ERROR, type CellValue } from "@/lib/sheet";
import { parseContent, spreadsheetTemplate, type SpreadsheetData } from "@/lib/office";

type Doc = {
  id: string;
  name: string;
  content?: string;
  version?: number;
};

const ROWS = 40;
const COLS = 16;

export function SpreadsheetEditor({ doc }: { doc: Doc }) {
  const toast = useToast();
  const data = parseContent<SpreadsheetData>(doc.content || "{}", { rows: [] });
  const [grid, setGrid] = React.useState<CellValue[][]>(
    Array.isArray(data.rows) && data.rows.length ? (data.rows as CellValue[][]) : spreadsheetTemplate(ROWS, COLS).rows as CellValue[][]
  );
  const [title, setTitle] = React.useState(doc.name);
  const [sel, setSel] = React.useState({ row: 0, col: 0 });
  const [selRange, setSelRange] = React.useState<{ row: number; col: number } | null>(null);
  const [formula, setFormula] = React.useState("");
  const [mouseDown, setMouseDown] = React.useState(false);
  const [saveState, setSaveState] = React.useState<"saved" | "saving" | "dirty">("saved");
  const saveTimer = React.useRef(0);
  const cellInputRef = React.useRef<HTMLInputElement>(null);

  const cache = React.useRef(new Map<string, CellValue>());

  React.useEffect(() => {
    // recompute formulas on grid change
    cache.current.clear();
  }, [grid]);

  const selectedRef = React.useRef(sel);
  React.useEffect(() => {
    selectedRef.current = sel;
  }, [sel]);

  const selectedLabel = indexToRef(sel.row, sel.col);

  const getDisplay = React.useCallback(
    (r: number, c: number): string => {
      const raw = grid[r]?.[c];
      if (raw == null || raw === "") return "";
      if (typeof raw === "string" && raw.startsWith("=")) {
        try {
          const v = evaluate(raw.slice(1), { grid, cache: cache.current });
          if (typeof v === "number") {
            return Number.isInteger(v) ? String(v) : v.toFixed(2);
          }
          return String(v ?? "");
        } catch {
          return ERROR.VALUE;
        }
      }
      return String(raw);
    },
    [grid]
  );

  const isFormula = (r: number, c: number) => typeof grid[r]?.[c] === "string" && (grid[r][c] as string).startsWith("=");
  const cellError = (r: number, c: number) => {
    const d = getDisplay(r, c);
    return typeof d === "string" && d.startsWith("#");
  };

  const scheduleSave = React.useCallback(
    (g?: CellValue[][], t?: string) => {
      const payload = { rows: g ?? grid };
      setSaveState("dirty");
      clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        setSaveState("saving");
        try {
          const res = await fetch(`/api/office?id=${doc.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: JSON.stringify(payload), name: t ?? title }),
          });
          setSaveState(res.ok ? "saved" : "dirty");
        } catch {
          setSaveState("dirty");
        }
      }, 800);
    },
    [grid, title, doc.id]
  );

  const updateCell = (r: number, c: number, v: string) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      if (!next[r]) next[r] = [];
      next[r] = next[r].map((x, i) => (i === c ? (v === "" ? "" : interpretCell(v)) : x));
      scheduleSave(next);
      return next;
    });
    cache.current.clear();
  };

  function interpretCell(v: string): CellValue {
    if (v.startsWith("=")) return v;
    const n = Number(v);
    if (v.trim() !== "" && !Number.isNaN(n)) return typeof v === "string" && v.trim().toUpperCase() === "TRUE" ? true : n;
    const u = v.trim().toUpperCase();
    if (u === "TRUE") return true;
    if (u === "FALSE") return false;
    return v;
  }

  const saveNow = async () => {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/office?id=${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify({ rows: grid }), name: title }),
      });
      setSaveState(res.ok ? "saved" : "dirty");
      if (res.ok) toast({ title: "Saved", variant: "success" });
    } catch {
      setSaveState("dirty");
      toast({ title: "Failed to save", variant: "error" });
    }
  };

  const doExport = async (format: string) => {
    try {
      const res = await fetch("/api/office/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      const blob = new Blob([data.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "export.txt";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", variant: "success" });
    } catch {
      toast({ title: "Export failed", variant: "error" });
    }
  };

  const commitFormula = () => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      if (!next[sel.row]) next[sel.row] = [];
      next[sel.row][sel.col] = formula;
      scheduleSave(next);
      return next;
    });
    cache.current.clear();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" && sel.row > 0) setSel({ row: sel.row - 1, col: sel.col });
    if (e.key === "ArrowDown" && sel.row < ROWS - 1) setSel({ row: sel.row + 1, col: sel.col });
    if (e.key === "ArrowLeft" && sel.col > 0) setSel({ row: sel.row, col: sel.col - 1 });
    if (e.key === "ArrowRight" && sel.col < COLS - 1) setSel({ row: sel.row, col: sel.col + 1 });
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveNow();
    }
  };

  const insertSampleData = () => {
    const next: CellValue[][] = spreadsheetTemplate(ROWS, COLS).rows as CellValue[][];
    const sample = [
      ["Month", "Revenue", "Expenses", "Profit"],
      ["Jan", 12000, 7800, "=B2-C2"],
      ["Feb", 15400, 8200, "=B3-C3"],
      ["Mar", 13100, 9100, "=B4-C4"],
      ["Apr", 17800, 8400, "=B5-C5"],
      ["May", 16200, 9800, "=B6-C6"],
      ["Jun", 19900, 8500, "=B7-C7"],
      ["Total", "=SUM(B2:B7)", "=SUM(C2:C7)", "=SUM(D2:D7)"],
      ["Avg", "=AVERAGE(B2:B7)", "", ""],
      ["Best month", "=MAX(B2:B7)", "", ""],
    ];
    sample.forEach((rowArr, ri) => {
      rowArr.forEach((v, ci) => {
        if (next[ri]) next[ri][ci] = v;
      });
    });
    setGrid(next);
    setSel({ row: 0, col: 0 });
    scheduleSave(next);
    toast({ title: "Sample data inserted", variant: "success" });
  };

  const clearAll = () => {
    const next: CellValue[][] = spreadsheetTemplate(ROWS, COLS).rows.map((r) => r.map(() => "")) as CellValue[][];
    setGrid(next);
    scheduleSave(next);
    toast({ title: "Cleared sheet", variant: "info" });
  };

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/office" className="rounded-lg p-1.5 text-ink-faint hover:bg-subtle hover:text-ink">
            <Icon name="chevron-left" size={17} />
          </Link>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleSave(undefined, e.target.value);
            }}
            className="w-72 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-[15px] font-semibold text-ink outline-none hover:border-line focus:border-accent"
            aria-label="Spreadsheet title"
          />
          <span className="flex items-center gap-1 text-[11px] text-ink-faint">
            {saveState === "saved" && <><Icon name="check" size={12} /> Saved</>}
            {saveState === "saving" && <><Icon name="refresh" size={12} className="animate-spin" /> Saving…</>}
            {saveState === "dirty" && <><Icon name="alert" size={12} /> Unsaved</>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={insertSampleData}>
            <Icon name="zap" size={14} /> Sample data
          </Button>
          <Button variant="secondary" size="sm" onClick={() => doExport("csv")}>
            <Icon name="download" size={14} /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => doExport("markdown")}>
            <Icon name="file" size={14} /> MD
          </Button>
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm">
                <Icon name="more" size={14} />
              </Button>
            }
          >
            {(close) => (
              <>
                <DropdownItem icon="refresh" onClick={() => { close(); clearAll(); }}>
                  Clear sheet
                </DropdownItem>
                <DropdownItem icon="grid" onClick={() => { close(); toast({ title: "Row/column resizing coming soon", variant: "info" }); }}>
                  Insert column
                </DropdownItem>
              </>
            )}
          </Dropdown>
          <Button size="sm" onClick={saveNow} disabled={saveState === "saved"}>
            <Icon name="save" size={14} /> Save
          </Button>
        </div>
      </div>

      {/* Formula bar */}
      <div className="editor-surface mb-3 flex items-center gap-2 px-3 py-2">
        <div className="w-16 shrink-0 rounded border border-line bg-subtle px-2 py-1 text-center text-[12px] font-medium text-ink-soft">
          {selectedLabel}
        </div>
        <div className="flex w-6 shrink-0 items-center justify-center text-ink-faint">
          <Icon name="plus" size={14} className="rotate-45" />
        </div>
        <input
          ref={cellInputRef}
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          onBlur={() => {
            if (formula !== String(grid[sel.row]?.[sel.col] ?? "")) commitFormula();
          }}
          onFocus={() => setFormula(String(grid[sel.row]?.[sel.col] ?? ""))}
          className="w-full rounded border border-transparent bg-transparent px-2 py-1 font-mono text-[13px] text-ink outline-none focus:border-accent"
          placeholder="Enter value or formula, e.g. =SUM(A1:A5)"
          aria-label="Formula bar"
        />
      </div>

      {/* Grid */}
      <div className="sheet-wrap" onKeyDown={onKey} tabIndex={0} role="grid" aria-label="Spreadsheet grid">
        <table className="sheet-grid">
          <thead>
            <tr>
              <th className="corner" />
              {Array.from({ length: COLS }, (_, c) => (
                <th key={c} className="col-head" data-col={c}>
                  {columnLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <th className="row-head">{r + 1}</th>
                {Array.from({ length: COLS }, (_, c) => {
                  const isSel = sel.row === r && sel.col === c;
                  return (
                    <td
                      key={c}
                      className={cn(
                        "p-0",
                        isSel && "sel",
                        isFormula(r, c) && "formula-cell",
                        cellError(r, c) && "error-cell"
                      )}
                      onClick={(e) => {
                        if (e.shiftKey && selRange) {
                          const minR = Math.min(sel.row, r);
                          const maxR = Math.max(sel.row, r);
                          const minC = Math.min(sel.col, c);
                          const maxC = Math.max(sel.col, c);
                          // select range visually
                          if (cellInputRef.current) {
                            const range = `${indexToRef(minR, minC)}:${indexToRef(maxR, maxC)}`;
                            setFormula(range);
                            setSelRange({ row: r, col: c });
                          }
                        } else {
                          setSel({ row: r, col: c });
                          setFormula(String(grid[r]?.[c] ?? ""));
                        }
                      }}
                      onMouseDown={() => setMouseDown(true)}
                      onMouseUp={() => setMouseDown(false)}
                      onMouseEnter={() => {
                        if (mouseDown) setSel({ row: r, col: c });
                      }}
                      data-cell={`${r}:${c}`}
                    >
                      <div className={cn("h-full w-full px-1 leading-[28px]", isFormula(r, c) && "formula-cell", cellError(r, c) && "error-cell")}>
                        {getDisplay(r, c)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 text-[12px] text-ink-faint">
        <span className="flex items-center gap-1">
          <Icon name="info" size={13} /> Click a cell to edit, type <code>=SUM(A1:A4)</code> for formulas
        </span>
        {selectedRef && (
          <span className="hidden sm:inline">
            Reference: {selectedLabel}
          </span>
        )}
      </div>
    </div>
  );
}