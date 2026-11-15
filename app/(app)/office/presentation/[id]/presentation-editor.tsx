"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/primitive";
import { Dropdown, DropdownItem, Tooltip } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { parseContent, presentationTemplate, uid, type Slide, type PresentationData } from "@/lib/office";

type Doc = {
  id: string;
  name: string;
  content?: string;
  version?: number;
};

const layoutOptions = [
  { id: "title", label: "Title" },
  { id: "bullets", label: "Bullets" },
  { id: "two-column", label: "Two columns" },
  { id: "quote", label: "Quote" },
  { id: "chart", label: "Chart" },
];

export function PresentationEditor({ doc }: { doc: Doc }) {
  const toast = useToast();
  const data = parseContent<PresentationData>(doc.content || "{}", { slides: [] });
  const [slides, setSlides] = React.useState<Slide[]>(
    Array.isArray(data.slides) && data.slides.length ? data.slides : presentationTemplate(doc.name, 4).slides
  );
  const [active, setActive] = React.useState(0);
  const [title, setTitle] = React.useState(doc.name);
  const [saveState, setSaveState] = React.useState<"saved" | "saving" | "dirty">("saved");
  const [presenting, setPresenting] = React.useState(false);
  const saveTimer = React.useRef(0);

  const scheduleSave = React.useCallback(
    (s?: Slide[], t?: string) => {
      setSaveState("dirty");
      clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        setSaveState("saving");
        try {
          const res = await fetch(`/api/office?id=${doc.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: JSON.stringify({ slides: s ?? slides }), name: t ?? title }),
          });
          setSaveState(res.ok ? "saved" : "dirty");
        } catch {
          setSaveState("dirty");
        }
      }, 800);
    },
    [slides, title, doc.id]
  );

  const saveNow = async () => {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/office?id=${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify({ slides }), name: title }),
      });
      setSaveState(res.ok ? "saved" : "dirty");
      if (res.ok) toast({ title: "Saved", variant: "success" });
    } catch {
      setSaveState("dirty");
      toast({ title: "Failed to save", variant: "error" });
    }
  };

  const setSlide = (i: number, patch: Partial<Slide>) => {
    setSlides((prev) => {
      const next = prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
      scheduleSave(next);
      return next;
    });
  };

  const addSlide = () => {
    setSlides((prev) => {
      const next = [
        ...prev,
        { id: uid("s"), title: "New slide", body: "• Point one\n• Point two", layout: "bullets" as const },
      ];
      scheduleSave(next);
      return next;
    });
    setActive(slides.length);
  };

  const removeSlide = (i: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      scheduleSave(next);
      return next;
    });
    setActive((a) => Math.min(a, slides.length - 2));
  };

  const moveSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      scheduleSave(next);
      return next;
    });
    setActive(j);
  };

  const present = () => setPresenting(true);

  const renderSlide = (s: Slide) => {
    switch (s.layout) {
      case "title":
        return (
          <div className="text-center">
            <h1 className="mb-3">{s.title}</h1>
            <p className="mx-auto max-w-xl text-lg text-ink-soft">{s.body}</p>
          </div>
        );
      case "quote":
        return (
          <div className="mx-auto max-w-xl text-center">
            <blockquote className="border-none text-2xl font-medium italic leading-snug">
              &ldquo;{s.title}&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-ink-soft">{s.body}</p>
          </div>
        );
      case "two-column": {
        const [left, right] = s.body.split("\n").length > 1
          ? s.body.split("\n").slice(0, 2)
          : [s.body, ""];
        return (
          <div className="w-full">
            <h2 className="mb-6 text-center text-2xl font-bold">{s.title}</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="rounded-xl border border-line bg-canvas-subtle p-6 text-base">{left}</div>
              <div className="rounded-xl border border-line bg-canvas-subtle p-6 text-base">{right}</div>
            </div>
          </div>
        );
      }
      case "chart":
        return (
          <div className="w-full">
            <h2 className="mb-4 text-center text-2xl font-bold">{s.title}</h2>
            <div className="flex h-40 items-end justify-center gap-6">
              {[40, 65, 50, 80, 60, 90].map((h, i) => (
                <div key={i} className="flex w-14 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-accent" style={{ height: `${h * 2}px` }} />
                  <span className="text-[11px] text-ink-faint">Q{i + 1}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-ink-soft">{s.body}</p>
          </div>
        );
      default:
        return (
          <div className="w-full">
            <h2 className="mb-6 text-center text-2xl font-bold">{s.title}</h2>
            <div className="slide-bullets mx-auto max-w-2xl">
              {s.body.split("\n").filter(Boolean).map((line, i) => (
                <p key={i} className="mb-2">{line.replace(/^[•\-]\s*/, "• ")}</p>
              ))}
            </div>
          </div>
        );
    }
  };

  const doExport = async () => {
    try {
      const res = await fetch("/api/office/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, format: "markdown" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Export failed");
      const blob = new Blob([data.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "presentation.md";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", variant: "success" });
    } catch {
      toast({ title: "Export failed", variant: "error" });
    }
  };

  // Present mode keyboard nav
  React.useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresenting(false);
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, slides.length - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [presenting, slides.length]);

  if (presenting) {
    const s = slides[active];
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black p-12 text-white"
        onClick={() => setPresenting(false)}
      >
        <div className="w-full max-w-5xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
          {renderSlide(s)}
        </div>
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm">
          <button onClick={() => setActive((a) => Math.max(a - 1, 0))} className="rounded p-1 hover:bg-white/20"><Icon name="chevron-left" size={16} /></button>
          <span>{active + 1} / {slides.length}</span>
          <button onClick={() => setActive((a) => Math.min(a + 1, slides.length - 1))} className="rounded p-1 hover:bg-white/20"><Icon name="chevron-right" size={16} /></button>
          <button onClick={() => setPresenting(false)} className="ml-2 flex items-center gap-1 rounded px-2 py-1 hover:bg-white/20"><Icon name="x" size={14} /> Exit</button>
        </div>
      </div>
    );
  }

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
            onChange={(e) => { setTitle(e.target.value); scheduleSave(undefined, e.target.value); }}
            className="w-72 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-[15px] font-semibold text-ink outline-none hover:border-line focus:border-accent"
            aria-label="Presentation title"
          />
          <span className="flex items-center gap-1 text-[11px] text-ink-faint">
            {saveState === "saved" && <><Icon name="check" size={12} /> Saved</>}
            {saveState === "saving" && <><Icon name="refresh" size={12} className="animate-spin" /> Saving…</>}
            {saveState === "dirty" && <><Icon name="alert" size={12} /> Unsaved</>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={doExport}><Icon name="download" size={14} /> Export</Button>
          <Button variant="secondary" size="sm" onClick={addSlide}><Icon name="plus" size={14} /> Add slide</Button>
          <Button size="sm" onClick={present}><Icon name="play" size={14} /> Present</Button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Slide thumbnails */}
        <div className="w-44 shrink-0 space-y-2">
          <div className="scrollbar-thin max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {slides.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className="flex-1">
                  <div
                    className="slide-thumb aspect-video w-full px-3 py-2"
                    data-active={active === i}
                    onClick={() => setActive(i)}
                  >
                    <p className="truncate text-[11px] font-semibold">{s.title || "Untitled"}</p>
                    <p className="mt-1 line-clamp-3 text-[9px] leading-snug text-ink-soft">{s.body}</p>
                  </div>
                  <p className="mt-0.5 text-center text-[10px] text-ink-faint">{i + 1}. {layoutOptions.find((l) => l.id === s.layout)?.label || "Slide"}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveSlide(i, -1)} className="rounded p-0.5 text-ink-faint hover:text-ink" aria-label="Move up"><Icon name="chevron-up" size={12} /></button>
                  <button onClick={() => moveSlide(i, 1)} className="rounded p-0.5 text-ink-faint hover:text-ink" aria-label="Move down"><Icon name="chevron-down" size={12} /></button>
                  <button onClick={() => removeSlide(i)} className="rounded p-0.5 text-ink-faint hover:text-red-500" aria-label="Remove slide"><Icon name="trash" size={12} /></button>
                </div>
              </div>
            ))}
            <button onClick={addSlide} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong py-2 text-[12px] text-ink-soft hover:bg-subtle">
              <Icon name="plus" size={13} /> New slide
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="min-w-0 flex-1">
          <div className="slide-canvas">{renderSlide(slides[active])}</div>
          <div className="editor-surface mt-4 space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="label">Layout</label>
              <div className="flex flex-wrap gap-1.5">
                {layoutOptions.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSlide(active, { layout: l.id as Slide["layout"] })}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors",
                      slides[active].layout === l.id ? "border-accent bg-accent-subtle text-accent-strong" : "border-line text-ink-soft hover:bg-subtle"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="label">Title</label>
                <input
                  value={slides[active].title}
                  onChange={(e) => setSlide(active, { title: e.target.value })}
                  className="input"
                  placeholder="Slide title"
                />
              </div>
              <div>
                <label className="label">Content</label>
                <textarea
                  value={slides[active].body}
                  onChange={(e) => setSlide(active, { body: e.target.value })}
                  rows={4}
                  className="input resize-none"
                  placeholder="• One point per line"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}