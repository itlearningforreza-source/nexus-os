export type WriterBlock = {
  type: string;
  text: string;
  checked?: boolean;
  meta?: Record<string, unknown>;
};

export type SpreadsheetData = {
  rows: unknown[][];
  colWidths?: number[];
  frozen?: number;
};

export type Slide = {
  id: string;
  title: string;
  body: string;
  layout: "title" | "bullets" | "two-column" | "quote" | "chart";
};

export type PresentationData = {
  slides: Slide[];
};

export function writerTemplate(name: string): WriterBlock[] {
  return [
    { type: "heading1", text: name || "Untitled document" },
    { type: "paragraph", text: "Start writing here…" },
  ];
}

export function spreadsheetTemplate(rows = 20, cols = 8): SpreadsheetData {
  const grid: unknown[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(Array.from({ length: cols }, () => ""));
  }
  return { rows: grid, colWidths: Array.from({ length: cols }, () => 110), frozen: 0 };
}

export function presentationTemplate(name = "Untitled presentation", slides = 4): PresentationData {
  return {
    slides: Array.from({ length: slides }, (_, i) => ({
      id: `s${i + 1}`,
      title: i === 0 ? name : `Section ${i}`,
      body: i === 0 ? "Your subtitle goes here" : "• Key point\n• Supporting detail",
      layout: i === 0 ? "title" : "bullets",
    })),
  };
}

export function uid(prefix = "id") {
  return prefix + "-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function parseContent<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function wordCount(text: string): number {
  const t = (text || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function readingTime(text: string): string {
  const w = wordCount(text);
  const mins = Math.max(1, Math.round(w / 200));
  return `${mins} min read`;
}