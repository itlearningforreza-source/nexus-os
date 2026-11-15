// Spreadsheet formula engine — safe, sandboxed parser/evaluator.
// Supports cell refs (A1, $A$1, A$1, $A1), ranges (A1:B3), cross-sheet refs
// (Sheet1!A1), arithmetic, aggregation, logical, conditional, lookup, text,
// date and error functions. No arbitrary code, network or IO can run here.

export type CellValue = string | number | boolean | null;

function colToIndex(col: string): number {
  let n = 0;
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
  return n - 1;
}

function indexToCol(i: number): string {
  let n = i + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function refToIndex(ref: string): { row: number; col: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})$/.exec(ref);
  if (!m) return null;
  return { row: parseInt(m[2], 10) - 1, col: colToIndex(m[1].toUpperCase()) };
}

export function indexToRef(row: number, col: number): string {
  return `${indexToCol(col)}${row + 1}`;
}

export function columnLabel(i: number): string {
  return indexToCol(i);
}

export const ERROR = {
  DIV0: "#DIV/0!",
  VALUE: "#VALUE!",
  REF: "#REF!",
  NAME: "#NAME?",
  NA: "#N/A",
  NUM: "#NUM!",
} as const;

export interface WorkbookLike {
  getCell(sheet: string, row: number, col: number): CellValue;
  sheetNames(): string[];
}

type Token = { t: "num" | "str" | "bool" | "op" | "fn" | "ref" | "lparen" | "rparen" | "comma" | "colon" | "bang" | "err"; v?: any };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (c === '"') {
      let str = "";
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && i + 1 < s.length) {
          str += s[i + 1];
          i += 2;
          continue;
        }
        str += s[i];
        i++;
      }
      i++;
      tokens.push({ t: "str", v: str });
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let num = "";
      while (i < s.length && /[0-9.]/.test(s[i])) {
        num += s[i];
        i++;
      }
      const v = parseFloat(num);
      tokens.push({ t: "num", v: Number.isNaN(v) ? 0 : v });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let word = "";
      while (i < s.length && /[A-Za-z0-9_.]/.test(s[i])) {
        word += s[i];
        i++;
      }
      const upper = word.toUpperCase();
      let j = i;
      while (j < s.length && s[j] !== "(" && s[j] !== "!" && s[j] !== ":") j++;
      const nextIsParen = j < s.length && s[j] === "(";
      if (nextIsParen && !/^[A-Za-z]+\d+$/.test(word)) {
        tokens.push({ t: "fn", v: upper });
        continue;
      }
      if (upper === "TRUE" || upper === "FALSE") {
        tokens.push({ t: "bool", v: upper === "TRUE" });
        continue;
      }
      tokens.push({ t: "ref", v: word });
      continue;
    }
    if (c === "$") {
      let refStr = "$";
      i++;
      while (i < s.length && /[A-Za-z0-9$]/.test(s[i])) {
        refStr += s[i];
        i++;
      }
      tokens.push({ t: "ref", v: refStr });
      continue;
    }
    const two = s.slice(i, i + 2);
    if (two === "<=" || two === ">=" || two === "<>") {
      tokens.push({ t: "op", v: two });
      i += 2;
      continue;
    }
    if ("+-*/^%<>=&".includes(c)) {
      tokens.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ t: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ t: "rparen" });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ t: "comma" });
      i++;
      continue;
    }
    if (c === ":") {
      tokens.push({ t: "colon" });
      i++;
      continue;
    }
    if (c === "!") {
      tokens.push({ t: "bang" });
      i++;
      continue;
    }
    tokens.push({ t: "err", v: c });
    i++;
  }
  return tokens;
}

interface EvalCtx {
  grid: CellValue[][];
  sheet?: string;
  cache: Map<string, CellValue>;
  wb?: WorkbookLike;
  visiting: Set<string>;
}

function evaluateExpression(
  tokens: Token[],
  ctx: EvalCtx
): CellValue {
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const next = (): Token | undefined => tokens[pos++];

  function number(v: CellValue): number {
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    throw new Error("VALUE");
  }

  function tryNum(v: CellValue): number | null {
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  function evalCellRaw(row: number, col: number): CellValue {
    const grid = ctx.grid;
    if (!grid[row]) return null;
    const raw = grid[row][col];
    if (raw == null || raw === "") return null;
    if (typeof raw === "string" && raw.startsWith("=")) {
      if (ctx.visiting.has(`${row}:${col}`)) return ERROR.REF;
      ctx.visiting.add(`${row}:${col}`);
      try {
        return evaluate(raw.slice(1), { grid, cache: ctx.cache, wb: ctx.wb, visiting: ctx.visiting });
      } catch {
        return ERROR.VALUE;
      } finally {
        ctx.visiting.delete(`${row}:${col}`);
      }
    }
    return raw;
  }

  function lookupCellEval(row: number, col: number): CellValue {
    const key = `${row}:${col}`;
    if (ctx.cache.has(key)) return ctx.cache.get(key)!;
    const v = evalCellRaw(row, col);
    ctx.cache.set(key, v);
    return v;
  }

  function cellValue(ref: string): CellValue {
    const full = /^(.+)?!(\$?[A-Za-z]{1,3}\$?\d+)$/.exec(ref);
    if (full) {
      const sheet = full[1];
      const r = refToIndex(full[2]);
      if (!r || !ctx.wb) return ERROR.REF;
      return ctx.wb.getCell(sheet, r.row, r.col);
    }
    const r = refToIndex(ref);
    if (!r) return null;
    return lookupCellEval(r.row, r.col);
  }

  function rangeValue(a: string, b: string): CellValue[] {
    const ra = refToIndex(a);
    const rb = refToIndex(b);
    if (!ra || !rb) return [];
    const out: CellValue[] = [];
    const r1 = Math.min(ra.row, rb.row);
    const r2 = Math.max(ra.row, rb.row);
    const c1 = Math.min(ra.col, rb.col);
    const c2 = Math.max(ra.col, rb.col);
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        out.push(lookupCellEval(r, c));
      }
    }
    return out;
  }

  function splitRangeIntoRows(range: CellValue[]): CellValue[][] {
    if (!range.length) return [];
    // In this engine ranges come flattened; for VLOOKUP we group by row width.
    // This is an approximation without sheet geometry.
    return range.map((v) => [v]);
  }

  function parseArgs(): CellValue[] {
    const args: CellValue[] = [];
    if (peek()?.t === "rparen") {
      next();
      return args;
    }
    while (pos < tokens.length) {
      if (peek()?.t === "rparen") {
        next();
        break;
      }
      args.push(parseComparison());
      if (peek()?.t === "comma") {
        next();
        continue;
      }
      if (peek()?.t === "rparen") {
        next();
        break;
      }
      throw new Error("Bad argument");
    }
    return args;
  }

  function applyCompare(op: string, a: CellValue, b: CellValue): boolean {
    try {
      const na = number(a);
      const nb = number(b);
      switch (op) {
        case "=": case "==": return na === nb;
        case "<>": case "!=": return na !== nb;
        case "<": return na < nb;
        case ">": return na > nb;
        case "<=": return na <= nb;
        case ">=": return na >= nb;
      }
    } catch {
      // fall through to string compare
    }
    const sa = String(a ?? "");
    const sb = String(b ?? "");
    switch (op) {
      case "=": case "==": return sa === sb;
      case "<>": case "!=": return sa !== sb;
      case "<": return sa < sb;
      case ">": return sa > sb;
      case "<=": return sa <= sb;
      case ">=": return sa >= sb;
    }
    return false;
  }

  function truthy(v: CellValue): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
      const u = v.toUpperCase();
      if (u === "TRUE") return true;
      if (u === "FALSE") return false;
      const n = Number(v);
      if (!Number.isNaN(n)) return n !== 0;
      return v !== "" && v !== "0";
    }
    return false;
  }

  function applies(crit: string, v: CellValue): boolean {
    if (crit.startsWith(">=")) return (tryNum(v) ?? 0) >= Number(crit.slice(2));
    if (crit.startsWith("<=")) return (tryNum(v) ?? 0) <= Number(crit.slice(2));
    if (crit.startsWith(">")) return (tryNum(v) ?? 0) > Number(crit.slice(1));
    if (crit.startsWith("<")) return (tryNum(v) ?? 0) < Number(crit.slice(1));
    if (crit.startsWith("<>")) return String(v) !== crit.slice(2);
    return String(v) === crit;
  }

  function callFunction(name: string, args: CellValue[]): CellValue {
    const flat: CellValue[] = [];
    for (const a of args) {
      if (Array.isArray(a)) flat.push(...a);
      else flat.push(a);
    }

    switch (name) {
      case "SUM":
        return flat.reduce((s: number, v) => {
          const n = tryNum(v);
          return n == null ? s : s + n;
        }, 0);
      case "AVERAGE": {
        const nums: number[] = [];
        for (const v of flat) {
          const n = tryNum(v);
          if (n != null) nums.push(n);
        }
        if (!nums.length) return ERROR.DIV0;
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      }
      case "MIN": {
        const nums = flat.map(tryNum).filter((v): v is number => v != null);
        return nums.length ? Math.min(...nums) : 0;
      }
      case "MAX": {
        const nums = flat.map(tryNum).filter((v): v is number => v != null);
        return nums.length ? Math.max(...nums) : 0;
      }
      case "COUNT":
        return flat.filter((v) => typeof v === "number").length;
      case "COUNTA":
        return flat.filter((v) => v != null && v !== "").length;
      case "IF":
        return truthy(Array.isArray(args[0]) ? args[0][0] : args[0]) ? args[1] : args[2];
      case "AND":
        return flat.every(truthy);
      case "OR":
        return flat.some(truthy);
      case "NOT":
        return !truthy(args[0]);
      case "IFS": {
        for (let i = 0; i + 1 < args.length; i += 2) {
          if (truthy(args[i])) return args[i + 1];
        }
        return ERROR.NA;
      }
      case "COUNTIF": {
        const crit = String(args[1] ?? "");
        return flat.filter((v) => applies(crit, v)).length;
      }
      case "SUMIF": {
        const crit = String(args[1] ?? "");
        const base = Array.isArray(args[0]) ? flat : flat;
        const target = Array.isArray(args[2]) ? flat : [];
        let total = 0;
        base.forEach((v, i) => {
          if (applies(crit, v)) {
            const tv = target[i] ?? v;
            const n = tryNum(tv);
            if (n != null) total += n;
          }
        });
        return total;
      }
      case "AVERAGEIF": {
        const crit = String(args[1] ?? "");
        const base = Array.isArray(args[0]) ? flat : flat;
        const target = Array.isArray(args[2]) ? flat : [];
        const nums: number[] = [];
        base.forEach((v, i) => {
          if (applies(crit, v)) {
            const tv = target[i] ?? v;
            const n = tryNum(tv);
            if (n != null) nums.push(n);
          }
        });
        if (!nums.length) return ERROR.DIV0;
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      }
      case "COUNTIFS":
      case "SUMIFS": {
        // multi-criteria pair processing (simplified)
        const isCount = name === "COUNTIFS";
        let total: number = isCount ? 0 : 0;
        let matched = 0;
        const rangeA = Array.isArray(args[0]) ? args[0] : [args[0]];
        for (let i = 1; i + 1 < args.length; i += 2) {
          const crit = String(args[i] ?? "");
          const valsArg = args[i + 1];
          const vals: CellValue[] = Array.isArray(valsArg) ? valsArg : [valsArg];
          for (let j = 0; j < vals.length; j++) {
            const baseVal = rangeA[j % rangeA.length];
            const critVal = vals[j % vals.length];
            if (applies(crit, critVal)) {
              matched++;
              if (!isCount) {
                const n = tryNum(baseVal);
                if (n != null) total += n;
              }
            }
          }
        }
        return isCount ? matched : total;
      }
      case "XLOOKUP": {
        const lookup = args[0];
        const arr = Array.isArray(args[1]) ? args[1] : [args[1]];
        const ret = Array.isArray(args[2]) ? args[2] : [args[2]];
        const idx = arr.findIndex((v) => String(v) === String(lookup));
        if (idx >= 0 && ret[idx] !== undefined) return ret[idx];
        return args[3] ?? ERROR.NA;
      }
      case "VLOOKUP": {
        const lookup = args[0];
        const range = Array.isArray(args[1]) ? args[1] : [];
        const colIdx = Math.max(1, tryNum(args[2]) || 1);
        const rowsArr = Array.isArray(range[0]) ? range as CellValue[][] : splitRangeIntoRows(range);
        for (const rowSet of rowsArr) {
          if (String(rowSet[0]) === String(lookup)) return rowSet[colIdx - 1] ?? ERROR.NA;
        }
        return ERROR.NA;
      }
      case "HLOOKUP": {
        const lookup = args[0];
        const range = Array.isArray(args[1]) ? args[1] : [];
        const rowIdx = Math.max(1, tryNum(args[2]) || 1);
        const rowsArr = Array.isArray(range[0]) ? range as CellValue[][] : splitRangeIntoRows(range);
        const columns = rowsArr.reduce<CellValue[][]>((acc, row) => {
          row.forEach((v, ci) => {
            (acc[ci] = acc[ci] || []).push(v);
          });
          return acc;
        }, []);
        for (const colSet of columns) {
          if (String(colSet[0]) === String(lookup)) return colSet[rowIdx - 1] ?? ERROR.NA;
        }
        return ERROR.NA;
      }
      case "INDEX": {
        const arr = Array.isArray(args[0]) ? args[0] : [];
        const rowI = tryNum(args[1]);
        const colI = tryNum(args[2]);
        if (Array.isArray(arr[0]) && rowI != null && colI != null) {
          const table = arr as CellValue[][];
          return table[rowI - 1]?.[colI - 1] ?? ERROR.REF;
        }
        const idx = rowI ?? colI ?? 1;
        return arr[idx - 1] ?? ERROR.REF;
      }
      case "MATCH": {
        const lookup = args[0];
        const arr = Array.isArray(args[1]) ? args[1] : [args[1]];
        const idx = arr.findIndex((v) => String(v) === String(lookup));
        return idx === -1 ? ERROR.NA : idx + 1;
      }
      case "LEFT":
        return String(args[0] ?? "").slice(0, tryNum(args[1]) ?? 1);
      case "RIGHT":
        return String(args[0] ?? "").slice(-(tryNum(args[1]) ?? 1));
      case "MOD": {
        const a = tryNum(args[0]);
        const b = tryNum(args[1]);
        if (a == null || b == null || b === 0) return ERROR.DIV0;
        return a % b;
      }
      case "MID": {
        const start = (tryNum(args[1]) ?? 1) - 1;
        const len = tryNum(args[2]) ?? 0;
        return String(args[0] ?? "").slice(start, start + len);
      }
      case "LEN":
        return String(args[0] ?? "").length;
      case "LOWER":
        return String(args[0] ?? "").toLowerCase();
      case "UPPER":
        return String(args[0] ?? "").toUpperCase();
      case "TRIM":
        return String(args[0] ?? "").replace(/\s+/g, " ").trim();
      case "CONCAT":
      case "CONCATENATE":
        return flat.map((v) => (Array.isArray(v) ? v.join("") : String(v ?? ""))).join("");
      case "TEXT": {
        const v = args[0];
        const fmt = String(args[1] ?? "");
        if (typeof v === "number") {
          if (fmt.includes("0.00")) return v.toFixed(2);
          if (fmt.includes("%")) return (v * 100).toFixed(fmt.includes("0.0") ? 1 : 0) + "%";
          return String(v);
        }
        return String(v ?? "");
      }
      case "DATE": {
        const y = tryNum(args[0]) ?? 0;
        const m = tryNum(args[1]) ?? 1;
        const d = tryNum(args[2]) ?? 1;
        return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
      case "YEAR":
        return new Date(String(args[0])).getFullYear();
      case "MONTH":
        return new Date(String(args[0])).getMonth() + 1;
      case "DAY":
        return new Date(String(args[0])).getDate();
      case "TODAY": {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      case "NOW": {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }
      case "IFERROR":
        return typeof args[0] === "string" && args[0].startsWith("#") ? args[1] : args[0];
      default:
        return ERROR.NAME;
    }
  }

  function parsePrimary(): CellValue {
    const t = next();
    if (!t) return null;
    if (t.t === "num") return t.v;
    if (t.t === "str") return t.v;
    if (t.t === "bool") return t.v;
    if (t.t === "err") return t.v;
    if (t.t === "ref") {
      let refName = t.v;
      if (peek()?.t === "colon") {
        next();
        const b = next();
        if (!b || b.t !== "ref") return ERROR.REF;
        return rangeValue(refName, b.v) as any as CellValue;
      }
      if (peek()?.t === "bang") {
        next();
        const r = next();
        if (!r || r.t !== "ref") return ERROR.REF;
        refName = refName + "!" + r.v;
      }
      return cellValue(refName);
    }
    if (t.t === "fn") {
      const lp = next();
      if (!lp || lp.t !== "lparen") return ERROR.VALUE;
      return callFunction(t.v, parseArgs());
    }
    if (t.t === "lparen") {
      const inner = parseComparison();
      const close = next();
      if (!close || close.t !== "rparen") return ERROR.VALUE;
      return inner;
    }
    return null;
  }

  function parseUnary(): CellValue {
    const t = peek();
    if (t && t.t === "op" && (t.v === "+" || t.v === "-")) {
      next();
      const v = parseUnary();
      try {
        const n = number(v);
        return t.v === "-" ? -n : n;
      } catch {
        return ERROR.VALUE;
      }
    }
    return parsePrimary();
  }

  function parseMul(): CellValue {
    let left = parseUnary();
    while (peek()?.t === "op" && (peek()!.v === "*" || peek()!.v === "/" || peek()!.v === "^" || peek()!.v === "%")) {
      const op = next()!.v;
      const right = parseUnary();
      if (op === "*") {
        try {
          left = number(left) * number(right);
        } catch {
          return ERROR.VALUE;
        }
      } else if (op === "/") {
        try {
          const d = number(right);
          if (d === 0) return ERROR.DIV0;
          left = number(left) / d;
        } catch {
          return ERROR.VALUE;
        }
      } else if (op === "^") {
        try {
          left = Math.pow(number(left), number(right));
        } catch {
          return ERROR.VALUE;
        }
      } else {
        try {
          left = number(left) / 100;
        } catch {
          return ERROR.VALUE;
        }
      }
    }
    return left;
  }

  function parseAdditive(): CellValue {
    let left = parseMul();
    while (peek()?.t === "op" && (peek()!.v === "+" || peek()!.v === "-" || peek()!.v === "&")) {
      const op = next()!.v;
      const right = parseMul();
      if (op === "&") {
        left = String(left ?? "") + String(right ?? "");
      } else if (op === "+") {
        try {
          left = number(left) + number(right);
        } catch {
          return ERROR.VALUE;
        }
      } else {
        try {
          left = number(left) - number(right);
        } catch {
          return ERROR.VALUE;
        }
      }
    }
    return left;
  }

  function parseComparison(): CellValue {
    let left = parseAdditive();
    while (peek()?.t === "op" && ["=", "==", "<>", "!=", "<", ">", "<=", ">="].includes(peek()!.v)) {
      const op = next()!.v;
      const right = parseAdditive();
      left = applyCompare(op, left, right);
    }
    return left;
  }

  return parseComparison();
}

export function evaluate(
  formula: string,
  ctx: {
    grid: CellValue[][];
    sheet?: string;
    cache?: Map<string, CellValue>;
    wb?: WorkbookLike;
    visiting?: Set<string>;
  }
): CellValue {
  if (typeof formula !== "string") return null;
  let trimmed = formula.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("=")) trimmed = trimmed.slice(1);
  const tokens = tokenize(trimmed);
  const cache = ctx.cache || new Map<string, CellValue>();
  const visiting = ctx.visiting || new Set<string>();
  try {
    return evaluateExpression(tokens, { grid: ctx.grid, sheet: ctx.sheet, cache, wb: ctx.wb, visiting });
  } catch {
    return ERROR.VALUE;
  }
}