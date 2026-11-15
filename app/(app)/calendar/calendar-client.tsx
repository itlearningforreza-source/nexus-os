"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button, Badge } from "@/components/ui/primitive";
import { Modal } from "@/components/ui/overlay";
import { Input, Textarea, Select } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

const COLORS: Record<string, string> = {
  meeting: "bg-blue-500",
  deadline: "bg-red-500",
  task: "bg-amber-500",
  personal: "bg-emerald-500",
  default: "bg-purple-500",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarClient({
  events,
  user,
  initialCreateOpen = false,
}: {
  events: any[];
  user: any;
  initialCreateOpen?: boolean;
}) {
  const toast = useToast();
  const [view, setView] = React.useState<"month" | "week" | "agenda">("month");
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [showCreate, setShowCreate] = React.useState(initialCreateOpen);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const [form, setForm] = React.useState({
    title: "",
    start: "",
    end: "",
    kind: "meeting",
    location: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => {
      const eDate = e.start?.split("T")[0];
      return eDate === dateStr;
    });
  };

  const handleCreate = async () => {
    if (!form.title || !form.start) {
      toast({ title: "Title and start time required", variant: "error" });
      return;
    }
    try {
      await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          start: form.start,
          end: form.end || form.start,
          kind: form.kind,
          location: form.location,
        }),
      });
      toast({ title: "Event created", variant: "success" });
      setShowCreate(false);
      setForm({ title: "", start: "", end: "", kind: "meeting", location: "" });
      window.location.reload();
    } catch {
      toast({ title: "Failed to create event", variant: "error" });
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Manage your schedule and events"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-line">
              {(["month", "week", "agenda"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1.5 text-[13px] font-medium transition-colors capitalize",
                    view === v
                      ? "bg-subtle text-ink"
                      : "text-ink-soft hover:text-ink"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={15} /> New Event
            </Button>
          </div>
        }
      />

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="rounded-lg p-1.5 hover:bg-subtle transition-colors"
          >
            <Icon name="chevron-down" size={18} className="rotate-90" />
          </button>
          <h3 className="text-lg font-semibold min-w-[180px] text-center">
            {MONTHS[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="rounded-lg p-1.5 hover:bg-subtle transition-colors"
          >
            <Icon name="chevron-down" size={18} className="-rotate-90" />
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={goToday}>
          Today
        </Button>
      </div>

      {view === "month" && (
        <div className="card overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-line">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-ink-faint"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-28 border-b border-r border-line bg-subtle/50"
              />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day}
                  className={cn(
                    "h-28 border-b border-r border-line p-1.5 cursor-pointer hover:bg-subtle/50 transition-colors",
                    isToday(day) && "bg-accent-subtle/30"
                  )}
                  onClick={() => {
                    setSelectedDate(new Date(year, month, day));
                    setShowCreate(true);
                  }}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day)
                        ? "bg-accent text-white"
                        : "text-ink-soft"
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] font-medium text-white",
                          COLORS[e.kind] || COLORS.default
                        )}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-ink-faint">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "agenda" && (
        <div className="card divide-y divide-line">
          {events.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-faint">
              No upcoming events
            </div>
          ) : (
            events.slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    COLORS[e.kind] || COLORS.default
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <p className="text-xs text-ink-faint">
                    {e.start
                      ? new Date(e.start).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
                <Badge tone="neutral">{e.kind}</Badge>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Event"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Event</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Meeting with team..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start"
              type="datetime-local"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
            />
            <Input
              label="End"
              type="datetime-local"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
            />
          </div>
          <Select
            label="Type"
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
          >
            <option value="meeting">Meeting</option>
            <option value="deadline">Deadline</option>
            <option value="task">Task</option>
            <option value="personal">Personal</option>
          </Select>
          <Input
            label="Location"
            placeholder="Optional"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
