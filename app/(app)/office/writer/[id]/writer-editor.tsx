"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/primitive";
import { Dropdown, DropdownItem, MenuDivider, Tooltip } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { parseContent, wordCount, readingTime, type WriterBlock } from "@/lib/office";

type Doc = {
  id: string;
  name: string;
  kind: string;
  content?: string;
  version?: number;
  updated_at?: string;
};

export function WriterEditor({ doc }: { doc: Doc }) {
  const toast = useToast();
  const router = useRouter();
  const parsed = parseContent<{ blocks?: WriterBlock[] }>(doc.content || "{}", { blocks: [] });
  const initialBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  const [blocks, setBlocks] = React.useState<WriterBlock[]>(
    initialBlocks.length ? initialBlocks : [{ type: "heading1", text: doc.name || "Untitled" }]
  );
  const [title, setTitle] = React.useState(doc.name);
  const [active, setActive] = React.useState<number | null>(null);
  const [saveState, setSaveState] = React.useState<"saved" | "saving" | "dirty">("saved");
  const lastSaveRef = React.useRef(0);
  const [wordCounts, setWordCounts] = React.useState(0);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    setWordCounts(blocks.reduce((s, b) => s + wordCount(b.text), 0));
  }, [blocks]);

  // Autosave with debounce.
  const scheduleSave = React.useCallback(
    (b?: WriterBlock[], t?: string) => {
      const body = JSON.stringify({ blocks: b ?? blocks });
      const name = t ?? title;
      setSaveState("dirty");
      clearTimeout(lastSaveRef.current);
      lastSaveRef.current = window.setTimeout(async () => {
        setSaveState("saving");
        try {
          const res = await fetch(`/api/office?id=${doc.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: body, name }),
          });
          setSaveState(res.ok ? "saved" : "dirty");
        } catch {
          setSaveState("dirty");
        }
      }, 800);
    },
    [blocks, title, doc.id]
  );

  const update = (i: number, patch: Partial<WriterBlock>) => {
    setBlocks((prev) => {
      const next = prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
      scheduleSave(next);
      return next;
    });
  };

  const updateTitle = (t: string) => {
    setTitle(t);
    scheduleSave(undefined, t);
  };

  const addBlock = (i: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(i + 1, 0, { type: "paragraph", text: "" });
      scheduleSave(next);
      return next;
    });
    setActive(i + 1);
    setTimeout(() => {
      const el = document.querySelector<HTMLTextAreaElement>(`[data-block="${i + 1}"]`);
      el?.focus();
    }, 30);
  };

  const removeBlock = (i: number) => {
    if (blocks.length <= 1) return;
    setBlocks((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      scheduleSave(next);
      return next;
    });
  };

  const changeType = (i: number, type: string) => {
    setBlocks((prev) => {
      const next = prev.map((b, idx) => (idx === i ? { ...b, type } : b));
      scheduleSave(next);
      return next;
    });
  };

  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      scheduleSave(next);
      return next;
    });
    setActive(j);
  };

  const saveNow = async () => {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/office?id=${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify({ blocks }), name: title }),
      });
      setSaveState(res.ok ? "saved" : "dirty");
      if (res.ok) toast({ title: "Saved", variant: "success" });
    } catch {
      setSaveState("dirty");
      toast({ title: "Failed to save", variant: "error" });
    }
  };

  const doExport = async (format: string) => {
    setExporting(true);
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
    } finally {
      setExporting(false);
    }
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      changeType(i, blocks[i].type);
      addBlock(i);
    }
    if (e.key === "Backspace" && blocks[i].text === "" && blocks.length > 1) {
      e.preventDefault();
      removeBlock(i);
      setActive(i - 1);
      setTimeout(() => {
        const el = document.querySelector<HTMLTextAreaElement>(`[data-block="${i - 1}"]`);
        el?.focus();
      }, 30);
    }
    if (e.key === "ArrowUp" && i > 0) {
      e.preventDefault();
      setActive(i - 1);
      setTimeout(() => {
        const el = document.querySelector<HTMLTextAreaElement>(`[data-block="${i - 1}"]`);
        el?.focus();
      }, 30);
    }
    if (e.key === "ArrowDown" && i < blocks.length - 1) {
      e.preventDefault();
      setActive(i + 1);
      setTimeout(() => {
        const el = document.querySelector<HTMLTextAreaElement>(`[data-block="${i + 1}"]`);
        el?.focus();
      }, 30);
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveNow();
    }
  };

  const blockStyle: Record<string, string> = {
    heading1: "text-[1.6rem] font-bold",
    heading2: "text-[1.2rem] font-semibold",
    heading3: "text-[1.02rem] font-semibold",
    quote: "border-l-[3px] border-accent pl-3 italic",
    list: "list-disc",
    code: "font-mono",
    check: "",
    paragraph: "",
  };

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/office" className="rounded-lg p-1.5 text-ink-faint hover:bg-subtle hover:text-ink">
            <Icon name="chevron-left" size={17} />
          </Link>
          <input
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            className="w-72 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-[15px] font-semibold text-ink outline-none hover:border-line focus:border-accent"
            aria-label="Document title"
          />
          <span className="flex items-center gap-1 text-[11px] text-ink-faint">
            {saveState === "saved" && <><Icon name="check" size={12} /> Saved</>}
            {saveState === "saving" && <><Icon name="refresh" size={12} className="animate-spin" /> Saving…</>}
            {saveState === "dirty" && <><Icon name="alert" size={12} /> Unsaved</>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[12px] text-ink-faint sm:inline">
            {wordCounts.toLocaleString()} words · {readingTime(blocks.map((b) => b.text).join(" "))}
          </span>
          <Button variant="secondary" size="sm" onClick={saveNow} disabled={saveState === "saved"}>
            <Icon name="save" size={14} /> Save
          </Button>
          <Dropdown
            width="w-40"
            trigger={
              <Button variant="secondary" size="sm">
                <Icon name="download" size={14} /> Export
              </Button>
            }
          >
            {(close) => (
              <>
                <DropdownItem icon="file" onClick={() => { close(); doExport("markdown"); }}>
                  Markdown
                </DropdownItem>
                <DropdownItem icon="file" onClick={() => { close(); doExport("html"); }}>
                  HTML
                </DropdownItem>
                <DropdownItem icon="file" onClick={() => { close(); doExport("txt"); }}>
                  Plain text
                </DropdownItem>
                <MenuDivider />
                <DropdownItem icon="file" onClick={() => { close(); doExport("json"); }}>
                  JSON
                </DropdownItem>
              </>
            )}
          </Dropdown>
          <Dropdown
            width="w-44"
            trigger={
              <Button variant="secondary" size="sm">
                <Icon name="more" size={14} />
              </Button>
            }
          >
            {(close) => (
              <>
                <DropdownItem icon="copy" onClick={() => { close(); router.push(`/office/new?kind=writer`); }}>
                  Duplicate
                </DropdownItem>
                <DropdownItem icon="archive" onClick={() => { close(); }} danger>
                  Archive
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>

      {/* Toolbar */}
      <div className="editor-surface mb-4 px-3 py-2 toolbar sticky top-0 z-10">
        <Tooltip label="Paragraph">
          <Dropdown
            width="w-44"
            trigger={
              <button className="toolbar-btn">
                {active != null && blocks[active] ? blocks[active].type : "Paragraph"} <Icon name="chevron-down" size={13} />
              </button>
            }
          >
            {(close) => (
              <>
                {["paragraph", "heading1", "heading2", "heading3", "quote", "list", "number", "code", "check"].map((t) => (
                  <DropdownItem
                    key={t}
                    icon="edit"
                    onClick={() => {
                      if (active != null) changeType(active, t);
                      close();
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </DropdownItem>
                ))}
              </>
            )}
          </Dropdown>
        </Tooltip>
        <div className="toolbar-divider" />
        <Tooltip label="Bold">
          <button className="toolbar-btn" data-active={active != null && blocks[active]?.meta?.bold ? true : undefined} onClick={() => {
            if (active == null) return;
            const b = blocks[active];
            const bold = !b.meta?.bold;
            update(active, { meta: { ...(b.meta || {}), bold } });
          }}>
            <span className="font-bold">B</span>
          </button>
        </Tooltip>
        <Tooltip label="Italic">
          <button className="toolbar-btn" onClick={() => {
            if (active == null) return;
            const b = blocks[active];
            update(active, { meta: { ...(b.meta || {}), italic: !b.meta?.italic } });
          }}>
            <span className="italic">I</span>
          </button>
        </Tooltip>
        <Tooltip label="Strikethrough">
          <button className="toolbar-btn" onClick={() => {
            if (active == null) return;
            const b = blocks[active];
            update(active, { meta: { ...(b.meta || {}), strike: !b.meta?.strike } });
          }}>
            <span className="line-through">S</span>
          </button>
        </Tooltip>
        <div className="toolbar-divider" />
        <select
          className="toolbar-select"
          aria-label="Block type"
          value={active != null ? blocks[active]?.type : "paragraph"}
          onChange={(e) => {
            if (active != null) changeType(active, e.target.value);
          }}
        >
          {["paragraph", "heading1", "heading2", "heading3", "quote", "list", "number", "code", "check"].map((t) => (
            <option key={t} value={t}>
              {t === "heading1" ? "Heading 1" : t === "heading2" ? "Heading 2" : t === "heading3" ? "Heading 3" : t === "paragraph" ? "Body" : t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <div className="toolbar-divider" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const el = document.querySelector<HTMLTextAreaElement>("#block-search");
            el?.focus();
          }}
        >
          <Icon name="search" size={14} />
        </Button>
      </div>

      {/* Document body */}
      <div className="doc-page">
        {blocks.map((b, i) => (
          <div key={i} className="group relative">
            <div
              className={cn(
                "absolute -left-10 top-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                active === i && "opacity-100"
              )}
            >
              <button onClick={() => moveBlock(i, -1)} className="rounded p-0.5 text-ink-faint hover:text-ink" aria-label="Move up">
                <Icon name="chevron-up" size={13} />
              </button>
              <button onClick={() => moveBlock(i, 1)} className="rounded p-0.5 text-ink-faint hover:text-ink" aria-label="Move down">
                <Icon name="chevron-down" size={13} />
              </button>
              <button onClick={() => addBlock(i)} className="rounded p-0.5 text-ink-faint hover:text-ink" aria-label="Add block">
                <Icon name="plus" size={13} />
              </button>
            </div>
            <div
              className={cn(
                "writer-block rounded px-1 py-0.5 transition-colors",
                active === i && "bg-accent-subtle/40"
              )}
              data-type={b.type}
            >
              {b.type === "check" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update(i, { checked: !b.checked })}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      b.checked ? "border-accent bg-accent text-white" : "border-line-strong"
                    )}
                    aria-label="Toggle checkbox"
                  >
                    {b.checked && <Icon name="check" size={11} />}
                  </button>
                  <textarea
                    data-block={i}
                    value={b.text}
                    onChange={(e) => update(i, { text: e.target.value })}
                    onKeyDown={(e) => onKey(e, i)}
                    onFocus={() => setActive(i)}
                    className={cn(
                      "w-full resize-none border-none bg-transparent leading-relaxed outline-none",
                      blockStyle[b.type],
                      b.checked && "text-ink-faint line-through"
                    )}
                    rows={1}
                    placeholder={i === 0 ? "Title" : "Type something…"}
                    style={{ fontStyle: b.meta?.italic ? "italic" : undefined, textDecoration: b.meta?.strike ? "line-through" : undefined, fontWeight: b.meta?.bold ? 700 : undefined }}
                  />
                </div>
              ) : (
                <textarea
                  data-block={i}
                  value={b.text}
                  onChange={(e) => update(i, { text: e.target.value })}
                  onKeyDown={(e) => onKey(e, i)}
                  onFocus={() => setActive(i)}
                  className={cn(
                    "w-full resize-none border-none bg-transparent leading-relaxed outline-none",
                    blockStyle[b.type],
                    b.type === "list" && "pl-4",
                    b.type === "quote" && "pl-3 italic"
                  )}
                  rows={1}
                  placeholder={i === 0 ? "Title" : "Type something…"}
                  style={{ fontStyle: b.meta?.italic ? "italic" : undefined, textDecoration: b.meta?.strike ? "line-through" : undefined, fontWeight: b.meta?.bold ? 700 : undefined }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {exporting && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-ink px-3 py-2 text-[12px] font-medium text-white shadow-overlay">
          Exporting…
        </div>
      )}
    </div>
  );
}