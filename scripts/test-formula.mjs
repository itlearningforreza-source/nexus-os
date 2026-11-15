#!/usr/bin/env node
// Nexus OS — spreadsheet formula engine unit tests.
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sheetPath = path.join(__dirname, "..", "lib", "sheet.ts");
const require = createRequire(import.meta.url);
const { evaluate, ERROR, indexToRef, refToIndex, columnLabel } = require(sheetPath);

let passed = 0;
let failed = 0;

function eq(expr, grid, expected, label) {
  const got = evaluate(expr, { grid: grid || [] });
  const ok = String(got) === String(expected);
  if (ok) passed++;
  else {
    failed++;
    console.log(`  ✗ ${label}: =${expr} => ${JSON.stringify(got)} expected ${JSON.stringify(expected)}`);
  }
}

function same(got, expected, label) {
  const ok = String(got) === String(expected);
  if (ok) passed++;
  else {
    failed++;
    console.log(`  ✗ ${label}: ${JSON.stringify(got)} expected ${JSON.stringify(expected)}`);
  }
}

console.log("Nexus OS Formula Engine Tests");
console.log("────────────────────────────────");

// arithmetic & precedence
eq("1+2*3", null, 7, "operator precedence");
eq("(1+2)*3", null, 9, "grouping");
eq("10/4", null, 2.5, "division");
eq("MOD(5,2)", null, 1, "MOD function");
eq("5*10%", null, 0.5, "percentage operator");
eq("-3+5", null, 2, "unary minus");

// comparisons
eq("5>3", null, true, "greater-than");
eq("5<3", null, false, "less-than");
eq("5<=5", null, true, "less-than-or-equal");
eq("6<>7", null, true, "not-equal");

// cell refs & ranges
const grid = [
  [10, 20, 30],
  [40, 50, 60],
  [70, 80, 90],
];
eq("A1", grid, 10, "cell reference");
eq("B2+C2", grid, 110, "reference arithmetic");
eq("SUM(A1:C3)", grid, 450, "SUM range");
eq("AVERAGE(A1:C3)", grid, 50, "AVERAGE range");
eq("MIN(A1:C3)", grid, 10, "MIN range");
eq("MAX(A1:C3)", grid, 90, "MAX range");
eq("COUNT(A1:C3)", grid, 9, "COUNT range");
eq("SUM(B2:C2)", grid, 110, "single-row range");

// functions, nesting, logicals
eq("SUM(1,2,3)", null, 6, "SUM literals");
eq('IF(5>3,"yes","no")', null, "yes", "IF true branch");
eq('IF(5<3,"yes","no")', null, "no", "IF false branch");
eq('IF(A1>=20,"big","small")', grid, "small", "IF with comparison ref");
eq("AND(1,1,0)", null, false, "AND short-circuits on falsy");
eq("OR(0,0,1)", null, true, "OR finds truthy");
eq("NOT(1)", null, false, "NOT truthy value");
eq("NOT(0)", null, true, "NOT falsy value");
eq('IFS(0,"a",1,"b")', null, "b", "IFS first matching pair");
eq("SUM(IF(1,2,3),4)", null, 6, "nested function call");
eq("SUM(1,2,)", null, 3, "trailing comma tolerated");
eq("SUM()", null, 0, "empty argument list");
eq('IF(TRUE,1,2)', null, 1, "IF with TRUE literal");
eq("AND(TRUE,FALSE)", null, false, "TRUE/FALSE literals");

// text functions & concatenation
eq('"HELLO"&" "&"world"', null, "HELLO world", "concatenation operator");
eq('CONCAT("a","b","c")', null, "abc", "CONCAT");
eq('UPPER("abc")', null, "ABC", "UPPER");
eq('LOWER("ABC")', null, "abc", "LOWER");
eq('TRIM("  x  ")', null, "x", "TRIM");
eq('LEN("hello")', null, 5, "LEN");
eq('LEFT("hello",2)', null, "he", "LEFT");
eq('RIGHT("hello",2)', null, "lo", "RIGHT");
eq('MID("hello",2,3)', null, "ell", "MID");

// lookups
const sales = [
  ["Rep", "Amount"],
  ["Anna", 100],
  ["Bob", 200],
  ["Cara", 300],
];
eq('XLOOKUP("Bob",A2:A4,B2:B4)', sales, 200, "XLOOKUP");
eq("MATCH(200,B2:B4,0)", sales, 2, "MATCH");
eq("INDEX(B2:B4,3)", sales, 300, "INDEX");
eq('COUNTIF(B2:B4,">100")', sales, 2, "COUNTIF with numeric criterion");

// errors
eq("1/0", null, ERROR.DIV0, "division by zero");
eq('SUM(1,"x")', null, 1, "non-numeric ignored in SUM");
eq("FOO(1)", null, ERROR.NAME, "unknown function");

// coordinate helpers
const a1 = refToIndex("A1");
same(a1 && `${a1.row},${a1.col}`, "0,0", "refToIndex A1");
const c5 = refToIndex("C5");
same(c5 && `${c5.row},${c5.col}`, "4,2", "refToIndex C5");
same(indexToRef(0, 0), "A1", "indexToRef A1");
same(indexToRef(25, 27), "AB26", "indexToRef AB26");
same(columnLabel(0), "A", "columnLabel A");
same(columnLabel(27), "AB", "columnLabel AB");

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);