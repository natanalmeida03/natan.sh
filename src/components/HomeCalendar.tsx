"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Bell,
  Flame,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";

interface DayData {
  note?: { content: string; mood: string | null } | null;
  reminders: {
    id: string;
    title: string;
    due_at: string;
    is_completed: boolean;
    categories?: { name: string; color?: string | null } | null;
  }[];
  habits: {
    id: string;
    title: string;
    icon?: string | null;
    logged: boolean;
  }[];
}

interface MarkedDates {
  [date: string]: { hasNote?: boolean; hasReminder?: boolean; hasHabit?: boolean };
}

interface HomeCalendarProps {
  onDateSelect: (date: string) => Promise<DayData>;
  onMonthChange: (year: number, month: number) => Promise<MarkedDates>;
}

const MOOD_MAP: Record<string, string> = {
  great: "😄",
  good: "🙂",
  neutral: "😐",
  bad: "😕",
  awful: "😞",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HomeCalendar({
  onDateSelect,
  onMonthChange,
}: HomeCalendarProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Carrega os marcadores quando muda o mês
  useEffect(() => {
    let cancelled = false;
    async function loadMarkers() {
      const markers = await onMonthChange(currentYear, currentMonth + 1);
      if (!cancelled) setMarkedDates(markers);
    }
    loadMarkers();
    return () => { cancelled = true; };
  }, [currentYear, currentMonth, onMonthChange]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  const handleDayClick = useCallback(
    async (day: number) => {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      setSelectedDate(dateStr);
      setPanelOpen(true);
      setLoadingDay(true);
      try {
        const data = await onDateSelect(dateStr);
        setDayData(data);
      } catch {
        setDayData({ note: null, reminders: [], habits: [] });
      }
      setLoadingDay(false);
    },
    [currentMonth, currentYear, onDateSelect]
  );

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedDate(null);
    setDayData(null);
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("en-us", {
    month: "long",
    year: "numeric",
  });

  const selectedDateFormatted = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-us", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="border border-[#2E2E2E]/15 rounded-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-[#2E2E2E]/40" />
            <h3 className="text-xs sm:text-sm font-semibold text-[#2E2E2E]">
              {monthName}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goToToday}
              className="text-[10px] font-mono text-[#2E2E2E]/40 hover:text-[#2E2E2E] transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#2E2E2E]/5"
            >
              today
            </button>
            <button
              onClick={prevMonth}
              className="p-1 text-[#2E2E2E]/40 hover:text-[#2E2E2E] transition-colors cursor-pointer rounded hover:bg-[#2E2E2E]/5"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 text-[#2E2E2E]/40 hover:text-[#2E2E2E] transition-colors cursor-pointer rounded hover:bg-[#2E2E2E]/5"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[9px] sm:text-[10px] font-mono text-[#2E2E2E]/30 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const marks = markedDates[dateStr];

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg
                  text-xs sm:text-sm transition-all cursor-pointer relative
                  ${isSelected
                    ? "bg-[#2E2E2E] text-white font-semibold"
                    : isToday
                      ? "bg-[#2E2E2E]/8 text-[#2E2E2E] font-semibold"
                      : "text-[#2E2E2E]/70 hover:bg-[#2E2E2E]/5"
                  }
                `}
              >
                <span>{day}</span>
                {marks && (
                  <div className="flex items-center gap-0.5 mt-px absolute bottom-1 sm:bottom-1.5">
                    {marks.hasNote && (
                      <span className={`w-0.75 h-0.75 rounded-full ${isSelected ? "bg-white/70" : "bg-blue-400"}`} />
                    )}
                    {marks.hasReminder && (
                      <span className={`w-0.75 h-0.75 rounded-full ${isSelected ? "bg-white/70" : "bg-amber-400"}`} />
                    )}
                    {marks.hasHabit && (
                      <span className={`w-0.75 h-0.75 rounded-full ${isSelected ? "bg-white/70" : "bg-green-400"}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dot legend */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#2E2E2E]/5">
          <span className="flex items-center gap-1 text-[9px] font-mono text-[#2E2E2E]/30">
            <span className="w-1.25 h-1.25 rounded-full bg-blue-400" /> note
          </span>
          <span className="flex items-center gap-1 text-[9px] font-mono text-[#2E2E2E]/30">
            <span className="w-1.25 h-1.25 rounded-full bg-amber-400" /> reminder
          </span>
          <span className="flex items-center gap-1 text-[9px] font-mono text-[#2E2E2E]/30">
            <span className="w-1.25 h-1.25 rounded-full bg-green-400" /> habit
          </span>
        </div>
      </div>

      {/* Day detail panel */}
      {panelOpen && (
        <div className="border-t border-[#2E2E2E]/10 bg-[#2E2E2E]/2">
          <div className="px-3 sm:px-4 py-3">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] sm:text-xs font-mono text-[#2E2E2E]/50 capitalize">
                {selectedDateFormatted}
              </p>
              <button
                onClick={closePanel}
                className="p-0.5 text-[#2E2E2E]/30 hover:text-[#2E2E2E] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {loadingDay ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-4 h-4 border-2 border-[#2E2E2E]/15 border-t-[#2E2E2E]/60 rounded-full animate-spin" />
              </div>
            ) : dayData ? (
              <div className="flex flex-col gap-3">
                {/* Daily note section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText size={11} className="text-blue-400" />
                    <span className="text-[10px] sm:text-xs font-semibold text-[#2E2E2E]/60">
                      Note
                    </span>
                    {dayData.note?.mood && (
                      <span className="text-sm ml-auto">{MOOD_MAP[dayData.note.mood] || ""}</span>
                    )}
                  </div>
                  {dayData.note?.content ? (
                    <p className="text-xs text-[#2E2E2E]/70 leading-relaxed font-mono bg-white/60 rounded-md px-2.5 py-2 border border-[#2E2E2E]/5">
                      {dayData.note.content}
                    </p>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-[#2E2E2E]/25 italic font-mono">
                      No note for this day
                    </p>
                  )}
                </div>

                {/* Reminders section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bell size={11} className="text-amber-400" />
                    <span className="text-[10px] sm:text-xs font-semibold text-[#2E2E2E]/60">
                      Reminders
                    </span>
                    {dayData.reminders.length > 0 && (
                      <span className="text-[9px] font-mono text-[#2E2E2E]/30 ml-auto">
                        {dayData.reminders.length}
                      </span>
                    )}
                  </div>
                  {dayData.reminders.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {dayData.reminders.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 bg-white/60 rounded-md border border-[#2E2E2E]/5"
                        >
                          <span
                            className={`text-xs flex-1 truncate ${
                              r.is_completed
                                ? "line-through text-[#2E2E2E]/30"
                                : "text-[#2E2E2E]/70"
                            }`}
                          >
                            {r.title}
                          </span>
                          <span className="text-[9px] font-mono text-[#2E2E2E]/30 shrink-0">
                            {new Date(r.due_at).toLocaleTimeString("en-us", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {r.categories && (
                            <span
                              className="text-[8px] px-1 py-0.5 rounded shrink-0"
                              style={{
                                backgroundColor: r.categories.color
                                  ? `${r.categories.color}20`
                                  : "#2E2E2E10",
                                color: r.categories.color || "#2E2E2E",
                              }}
                            >
                              {r.categories.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-[#2E2E2E]/25 italic font-mono">
                      No reminders
                    </p>
                  )}
                </div>

                {/* Habits section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Flame size={11} className="text-green-400" />
                    <span className="text-[10px] sm:text-xs font-semibold text-[#2E2E2E]/60">
                      Habits
                    </span>
                    {dayData.habits.length > 0 && (
                      <span className="text-[9px] font-mono text-[#2E2E2E]/30 ml-auto">
                        {dayData.habits.filter((h) => h.logged).length}/{dayData.habits.length}
                      </span>
                    )}
                  </div>
                  {dayData.habits.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {dayData.habits.map((h) => (
                        <span
                          key={h.id}
                          className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-md border ${
                            h.logged
                              ? "bg-green-50 border-green-200 text-green-600"
                              : "bg-white/60 border-[#2E2E2E]/5 text-[#2E2E2E]/40"
                          }`}
                        >
                          {h.icon && <span className="text-xs">{h.icon}</span>}
                          {h.title}
                          {h.logged && <span className="text-green-500">✓</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-[#2E2E2E]/25 italic font-mono">
                      No habits tracked
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}