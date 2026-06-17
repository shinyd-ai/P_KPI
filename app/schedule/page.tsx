"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TimeBlockStatus = "PLANNED" | "DONE" | "MOVED" | "CANCELED";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface LinkedGoal {
  id: string;
  title: string;
  category?: Category | null;
}

interface LinkedMonthlyPlan {
  id: string;
  title: string;
}

interface DailyPlan {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  monthlyPlan?: LinkedMonthlyPlan | null;
  goal?: LinkedGoal | null;
}

interface TimeBlock {
  id: string;
  date: string;
  title: string;
  startMinutes: number;
  endMinutes: number;
  status: TimeBlockStatus;
  note?: string | null;
  actualMinutes?: number | null;
  dailyPlanId?: string | null;
  dailyPlan?: DailyPlan | null;
  monthlyPlan?: LinkedMonthlyPlan | null;
  goal?: LinkedGoal | null;
}

interface ScheduleData {
  startDate: string;
  endDate: string;
  weekDates: string[];
  timeBlocks: TimeBlock[];
  unplacedPlans: DailyPlan[];
}

interface BlockForm {
  id?: string;
  dailyPlanId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: TimeBlockStatus;
  actualMinutes: string;
  note: string;
}

const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
const hours = Array.from({ length: 18 }, (_, index) => index + 6);
const statusOptions: { value: TimeBlockStatus; label: string }[] = [
  { value: "PLANNED", label: "계획" },
  { value: "DONE", label: "완료" },
  { value: "MOVED", label: "이동" },
  { value: "CANCELED", label: "취소" },
];

const emptyForm: BlockForm = {
  dailyPlanId: "",
  title: "",
  date: "",
  startTime: "21:00",
  endTime: "22:00",
  status: "PLANNED",
  actualMinutes: "",
  note: "",
};

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeApiDate(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map((part) => parseInt(part, 10));
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  return hour * 60 + minute;
}

function minutesToTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDuration(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  if (hour === 0) return `${minute}분`;
  if (minute === 0) return `${hour}시간`;
  return `${hour}시간 ${minute}분`;
}

function formatDay(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
}

function statusLabel(status: TimeBlockStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? "계획";
}

function colorForBlock(block: TimeBlock) {
  return block.goal?.category?.color ?? block.dailyPlan?.goal?.category?.color ?? "#4f46e5";
}

function softColor(color: string) {
  return `${color}18`;
}

function readableSource(plan?: DailyPlan | null, monthlyPlan?: LinkedMonthlyPlan | null, goal?: LinkedGoal | null) {
  if (plan?.monthlyPlan?.title) return plan.monthlyPlan.title;
  if (monthlyPlan?.title) return monthlyPlan.title;
  if (plan?.goal?.title) return plan.goal.title;
  if (goal?.title) return goal.title;
  return "직접 입력";
}

function blockToForm(block: TimeBlock): BlockForm {
  return {
    id: block.id,
    dailyPlanId: block.dailyPlanId ?? "",
    title: block.title,
    date: normalizeApiDate(block.date),
    startTime: minutesToTime(block.startMinutes),
    endTime: minutesToTime(block.endMinutes),
    status: block.status,
    actualMinutes: block.actualMinutes != null ? String(block.actualMinutes) : "",
    note: block.note ?? "",
  };
}

export default function SchedulePage() {
  const [mondayDate, setMondayDate] = useState(() => getMonday(new Date()));
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggingPlanId, setDraggingPlanId] = useState("");
  const [draggingBlockId, setDraggingBlockId] = useState("");
  const [hoveredMoveCell, setHoveredMoveCell] = useState<{ date: string; startMinutes: number } | null>(null);
  const [resizingBlockId, setResizingBlockId] = useState("");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<BlockForm>(() => ({
    ...emptyForm,
    date: toLocalDateString(new Date()),
  }));

  const startDate = toLocalDateString(mondayDate);
  const today = toLocalDateString(new Date());

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/time-blocks?startDate=${startDate}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "시간표를 불러오지 못했습니다.");
      setData(json);
      setSelectedId((current) => {
        if (current && json.timeBlocks.some((block: TimeBlock) => block.id === current)) return current;
        return json.timeBlocks[0]?.id ?? "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "시간표를 불러오지 못했습니다.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate]);

  useEffect(() => {
    let ignore = false;

    async function loadSchedule() {
      try {
        const response = await fetch(`/api/time-blocks?startDate=${startDate}`);
        const json = await response.json();
        if (ignore) return;
        if (!response.ok) throw new Error(json.error ?? "시간표를 불러오지 못했습니다.");
        setData(json);
        setSelectedId((current) => {
          if (current && json.timeBlocks.some((block: TimeBlock) => block.id === current)) return current;
          return json.timeBlocks[0]?.id ?? "";
        });
        setError("");
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "시간표를 불러오지 못했습니다.");
          setData(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadSchedule();
    return () => {
      ignore = true;
    };
  }, [startDate]);

  const selectedBlock = data?.timeBlocks.find((block) => block.id === selectedId) ?? null;
  const draggingBlock = data?.timeBlocks.find((block) => block.id === draggingBlockId) ?? null;

  const stats = useMemo(() => {
    const blocks = data?.timeBlocks ?? [];
    const plannedMinutes = blocks.reduce((sum, block) => sum + (block.endMinutes - block.startMinutes), 0);
    const doneMinutes = blocks
      .filter((block) => block.status === "DONE")
      .reduce((sum, block) => sum + (block.actualMinutes ?? block.endMinutes - block.startMinutes), 0);
    const linkedMinutes = blocks
      .filter((block) => block.dailyPlanId || block.monthlyPlan || block.goal)
      .reduce((sum, block) => sum + (block.endMinutes - block.startMinutes), 0);
    return {
      plannedMinutes,
      doneMinutes,
      linkedPct: plannedMinutes > 0 ? Math.round((linkedMinutes / plannedMinutes) * 100) : 0,
      donePct: plannedMinutes > 0 ? Math.round((doneMinutes / plannedMinutes) * 100) : 0,
    };
  }, [data?.timeBlocks]);

  function goWeek(delta: number) {
    const next = new Date(mondayDate);
    next.setDate(next.getDate() + delta * 7);
    const nextStartDate = toLocalDateString(next);
    setLoading(true);
    setMondayDate(next);
    setForm((current) => ({
      ...current,
      date: nextStartDate,
    }));
  }

  function resetForm() {
    setSelectedId("");
    setForm({
      ...emptyForm,
      date: data?.weekDates.includes(today) ? today : startDate,
    });
  }

  function selectPlan(planId: string) {
    const plan = data?.unplacedPlans.find((item) => item.id === planId);
    setForm((current) => ({
      ...current,
      dailyPlanId: planId,
      title: plan?.title ?? current.title,
      date: plan ? normalizeApiDate(plan.date) : current.date,
      endTime:
        plan?.estimatedMinutes && timeToMinutes(current.startTime) != null
          ? minutesToTime(Math.min((timeToMinutes(current.startTime) ?? 0) + plan.estimatedMinutes, 24 * 60))
          : current.endTime,
    }));
  }

  function selectBlock(block: TimeBlock) {
    setSelectedId(block.id);
    setForm(blockToForm(block));
  }

  function upsertBlockLocally(block: TimeBlock) {
    setData((current) => {
      if (!current) return current;

      const blockDate = normalizeApiDate(block.date);
      const isInWeek = blockDate >= current.startDate && blockDate <= current.endDate;
      const timeBlocks = current.timeBlocks.filter((item) => item.id !== block.id);

      if (isInWeek) {
        timeBlocks.push(block);
      }

      timeBlocks.sort((a, b) => {
        const dateCompare = normalizeApiDate(a.date).localeCompare(normalizeApiDate(b.date));
        return dateCompare !== 0 ? dateCompare : a.startMinutes - b.startMinutes;
      });

      return {
        ...current,
        timeBlocks,
        unplacedPlans: current.unplacedPlans.filter((plan) => plan.id !== block.dailyPlanId),
      };
    });
  }

  function removeBlockLocally(id: string) {
    setData((current) =>
      current
        ? {
            ...current,
            timeBlocks: current.timeBlocks.filter((block) => block.id !== id),
          }
        : current
    );
  }

  async function saveBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const startMinutes = timeToMinutes(form.startTime);
    const endMinutes = timeToMinutes(form.endTime);
    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        id: form.id,
        dailyPlanId: form.dailyPlanId || null,
        title: form.title,
        date: form.date,
        startMinutes,
        endMinutes,
        status: form.status,
        actualMinutes: form.actualMinutes,
        note: form.note,
      };
      const response = await fetch("/api/time-blocks", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "저장하지 못했습니다.");
      upsertBlockLocally(json);
      setSelectedId(json.id);
      setForm(blockToForm(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function createBlockFromPlan(planId: string, date: string, startMinutes: number) {
    const plan = data?.unplacedPlans.find((item) => item.id === planId);
    if (!plan) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/time-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyPlanId: plan.id,
          title: plan.title,
          date,
          startMinutes,
          endMinutes: Math.min(startMinutes + 60, 24 * 60),
          status: "PLANNED",
          actualMinutes: "",
          note: "",
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "시간블록을 만들지 못했습니다.");
      upsertBlockLocally(json);
      setSelectedId(json.id);
      setForm(blockToForm(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "시간블록을 만들지 못했습니다.");
    } finally {
      setSaving(false);
      setDraggingPlanId("");
    }
  }

  async function patchBlock(id: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/time-blocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? "시간블록을 수정하지 못했습니다.");
    upsertBlockLocally(json);
    setSelectedId(json.id);
    setForm(blockToForm(json));
  }

  async function moveBlock(blockId: string, date: string, startMinutes: number) {
    const block = data?.timeBlocks.find((item) => item.id === blockId);
    if (!block) return;

    const duration = block.endMinutes - block.startMinutes;
    const endMinutes = Math.min(startMinutes + duration, 24 * 60);
    const adjustedStart = Math.max(0, endMinutes - duration);

    setSaving(true);
    setError("");
    upsertBlockLocally({
      ...block,
      date,
      startMinutes: adjustedStart,
      endMinutes,
    });
    try {
      await patchBlock(block.id, {
        date,
        startMinutes: adjustedStart,
        endMinutes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "시간블록을 이동하지 못했습니다.");
      await fetchSchedule();
    } finally {
      setSaving(false);
      setDraggingBlockId("");
    }
  }

  async function resizeBlock(block: TimeBlock, nextEndMinutes: number) {
    const roundedEnd = Math.round(nextEndMinutes / 30) * 30;
    const endMinutes = Math.min(Math.max(roundedEnd, block.startMinutes + 30), 24 * 60);

    setSaving(true);
    setError("");
    upsertBlockLocally({
      ...block,
      endMinutes,
    });
    try {
      await patchBlock(block.id, { endMinutes });
    } catch (err) {
      setError(err instanceof Error ? err.message : "시간을 조정하지 못했습니다.");
      await fetchSchedule();
    } finally {
      setSaving(false);
      setResizingBlockId("");
    }
  }

  function shiftDate(date: string, deltaDays: number) {
    const next = new Date(`${date}T00:00:00`);
    next.setDate(next.getDate() + deltaDays);
    return toLocalDateString(next);
  }

  function quickPatchSelected(payload: Partial<Pick<TimeBlock, "date" | "startMinutes" | "endMinutes">>) {
    if (!selectedBlock) return;

    const nextBlock = {
      ...selectedBlock,
      ...payload,
    };
    upsertBlockLocally(nextBlock);
    setForm(blockToForm(nextBlock));
    setSaving(true);
    setError("");

    patchBlock(selectedBlock.id, payload)
      .catch(async (err) => {
        setError(err instanceof Error ? err.message : "시간블록을 수정하지 못했습니다.");
        await fetchSchedule();
      })
      .finally(() => setSaving(false));
  }

  function moveSelectedMinutes(deltaMinutes: number) {
    if (!selectedBlock) return;
    const duration = selectedBlock.endMinutes - selectedBlock.startMinutes;
    const startMinutes = Math.min(Math.max(selectedBlock.startMinutes + deltaMinutes, 0), 24 * 60 - duration);
    quickPatchSelected({
      startMinutes,
      endMinutes: startMinutes + duration,
    });
  }

  function resizeSelectedMinutes(deltaMinutes: number) {
    if (!selectedBlock) return;
    const endMinutes = Math.min(Math.max(selectedBlock.endMinutes + deltaMinutes, selectedBlock.startMinutes + 30), 24 * 60);
    quickPatchSelected({ endMinutes });
  }

  function startBlockMove(block: TimeBlock, event: React.PointerEvent<HTMLDivElement>) {
    if (resizingBlockId) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingBlockId(block.id);
    setHoveredMoveCell(null);

    const startX = event.clientX;
    const startY = event.clientY;
    const target = event.currentTarget;

    function findCell(clientX: number, clientY: number) {
      target.style.pointerEvents = "none";
      const elements = document.elementsFromPoint(clientX, clientY);
      target.style.pointerEvents = "";

      return document
        .elementsFromPoint(clientX, clientY)
        .concat(elements)
        .map((element) => element.closest("[data-schedule-cell]"))
        .find(Boolean) as HTMLElement | undefined;
    }

    function getCellStartMinutes(cell: HTMLElement, clientY: number) {
      const hour = parseInt(cell.dataset.hour ?? "", 10);
      if (!Number.isInteger(hour)) return null;

      const rect = cell.getBoundingClientRect();
      const half = clientY - rect.top >= rect.height / 2 ? 30 : 0;
      return hour * 60 + half;
    }

    function handleMove(moveEvent: PointerEvent) {
      const cell = findCell(moveEvent.clientX, moveEvent.clientY);
      const date = cell?.dataset.date;
      const startMinutes = cell ? getCellStartMinutes(cell, moveEvent.clientY) : null;
      if (!date || startMinutes == null) {
        setHoveredMoveCell(null);
        return;
      }
      setHoveredMoveCell({ date, startMinutes });
    }

    function handleUp(upEvent: PointerEvent) {
      if (target.hasPointerCapture(upEvent.pointerId)) {
        target.releasePointerCapture(upEvent.pointerId);
      }
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);

      const moved = Math.abs(upEvent.clientX - startX) > 6 || Math.abs(upEvent.clientY - startY) > 6;
      setDraggingBlockId("");
      setHoveredMoveCell(null);

      if (!moved) {
        selectBlock(block);
        return;
      }

      const cell = findCell(upEvent.clientX, upEvent.clientY);
      const date = cell?.dataset.date;
      const startMinutes = cell ? getCellStartMinutes(cell, upEvent.clientY) : null;

      if (!date || startMinutes == null) return;
      moveBlock(block.id, date, startMinutes);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  async function deleteBlock() {
    if (!form.id) return;
    setSaving(true);
    setError("");
    removeBlockLocally(form.id);
    try {
      const response = await fetch(`/api/time-blocks?id=${form.id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "삭제하지 못했습니다.");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제하지 못했습니다.");
      await fetchSchedule();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-6 md:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Weekly time blocks</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">주간 시간표</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => goWeek(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50" aria-label="이전 주">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              {startDate} - {data?.endDate ?? ""}
            </div>
            <button onClick={() => goWeek(1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50" aria-label="다음 주">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button onClick={() => setMondayDate(getMonday(new Date()))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
              이번 주
            </button>
            <button onClick={resetForm} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800">
              새 블록
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800">미배치 계획</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                  {data?.unplacedPlans.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
                    <span className="spinner" />
                    불러오는 중
                  </div>
                ) : data && data.unplacedPlans.length > 0 ? (
                  data.unplacedPlans.map((plan) => {
                    const color = plan.goal?.category?.color ?? "#64748b";
                    return (
                      <button
                        key={plan.id}
                        onClick={() => selectPlan(plan.id)}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("application/x-pkpi-plan", plan.id);
                          event.dataTransfer.setData("text/plain", plan.id);
                          event.dataTransfer.effectAllowed = "copy";
                          setDraggingPlanId(plan.id);
                        }}
                        onDragEnd={() => setDraggingPlanId("")}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-white"
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                          <div className="min-w-0">
                            <p className="break-keep text-sm font-bold leading-snug text-slate-800">{plan.title}</p>
                            <p className="mt-1 text-xs text-slate-400">{normalizeApiDate(plan.date)} · {readableSource(plan)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-md px-2 py-1 text-xs font-bold" style={{ background: softColor(color), color }}>
                            {plan.goal?.category?.name ?? "일간"}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {plan.estimatedMinutes ? formatDuration(plan.estimatedMinutes) : "시간 미정"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">이번 주 미배치 계획이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-black text-slate-800">주간 요약</h3>
              <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-400">계획</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{formatDuration(stats.plannedMinutes)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-400">실행</p>
                  <p className="mt-1 text-lg font-black text-emerald-700">{formatDuration(stats.doneMinutes)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-400">연결</p>
                  <p className="mt-1 text-lg font-black text-indigo-700">{stats.linkedPct}%</p>
                </div>
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-black text-slate-800">시간 배치</h3>
                <p className="text-xs font-semibold text-slate-400">06:00부터 23:00까지 표시</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[860px] grid-cols-[64px_repeat(7,minmax(104px,1fr))]">
                <div className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white" />
                {(data?.weekDates ?? Array.from({ length: 7 }, (_, index) => {
                  const date = new Date(mondayDate);
                  date.setDate(mondayDate.getDate() + index);
                  return toLocalDateString(date);
                })).map((date, index) => (
                  <div key={date} className={`border-b border-r border-slate-200 px-3 py-3 text-center ${date === today ? "bg-indigo-50/70" : "bg-white"}`}>
                    <p className="text-sm font-black text-slate-800">{dayLabels[index]}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">{formatDay(date)}</p>
                  </div>
                ))}

                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="sticky left-0 z-10 h-16 border-r border-slate-200 bg-white px-2 pt-2 text-xs font-semibold text-slate-400">
                      {minutesToTime(hour * 60)}
                    </div>
                    {(data?.weekDates ?? []).map((date, dayIndex) => {
                      const hourBlocks = (data?.timeBlocks ?? []).filter((block) => {
                        const blockDate = normalizeApiDate(block.date);
                        return blockDate === date && block.startMinutes >= hour * 60 && block.startMinutes < (hour + 1) * 60;
                      });
                      return (
                        <div
                          key={`${date}-${hour}`}
                          data-schedule-cell="true"
                          data-date={date}
                          data-hour={hour}
                          onDragOver={(event) => {
                            if (!draggingPlanId && !draggingBlockId) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = draggingBlockId ? "move" : "copy";
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const blockId = event.dataTransfer.getData("application/x-pkpi-block");
                            const planId =
                              event.dataTransfer.getData("application/x-pkpi-plan") ||
                              event.dataTransfer.getData("text/plain");
                            if (blockId) {
                              moveBlock(blockId, date, hour * 60);
                            } else if (planId) {
                              createBlockFromPlan(planId, date, hour * 60);
                            }
                          }}
                          className={`relative h-16 border-r border-t border-slate-100 px-1 py-1 transition ${
                            hoveredMoveCell?.date === date && Math.floor(hoveredMoveCell.startMinutes / 60) === hour
                              ? "bg-indigo-200/80"
                              : draggingPlanId || draggingBlockId
                                ? "bg-indigo-50/50 hover:bg-indigo-100/70"
                                : "bg-slate-50/40"
                          }`}
                        >
                          {draggingBlock &&
                            hoveredMoveCell?.date === date &&
                            Math.floor(hoveredMoveCell.startMinutes / 60) === hour && (() => {
                              const color = colorForBlock(draggingBlock);
                              const height = `${Math.max(((draggingBlock.endMinutes - draggingBlock.startMinutes) / 60) * 64 - 4, 38)}px`;
                              const top = hoveredMoveCell.startMinutes % 60 === 30 ? "33px" : "1px";
                              return (
                                <div
                                  className="pointer-events-none absolute left-1 right-1 z-20 rounded-md border-2 border-dashed px-2 py-1 shadow-lg"
                                  style={{
                                    top,
                                    height,
                                    borderColor: color,
                                    background: softColor(color),
                                    color,
                                  }}
                                >
                                  <div className="truncate text-[11px] font-black">{draggingBlock.title}</div>
                                  <p className="mt-0.5 truncate text-[10px] font-semibold opacity-80">
                                    {minutesToTime(hoveredMoveCell.startMinutes)}-{minutesToTime(Math.min(hoveredMoveCell.startMinutes + draggingBlock.endMinutes - draggingBlock.startMinutes, 24 * 60))}
                                  </p>
                                </div>
                              );
                            })()}
                          {hourBlocks.map((block) => {
                            const color = colorForBlock(block);
                            const top = `${((block.startMinutes - hour * 60) / 60) * 64}px`;
                            const height = `${Math.max(((block.endMinutes - block.startMinutes) / 60) * 64 - 4, 38)}px`;
                            const isSelected = selectedId === block.id;
                            return (
                              <div
                                key={block.id}
                                role="button"
                                tabIndex={0}
                                onPointerDown={(event) => startBlockMove(block, event)}
                                onClick={() => selectBlock(block)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    selectBlock(block);
                                  }
                                }}
                                className={`absolute left-1 right-1 z-10 cursor-grab overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm transition hover:z-30 hover:shadow-md active:cursor-grabbing ${
                                  draggingBlockId === block.id ? "z-30 opacity-60 ring-2 ring-indigo-300" : ""
                                } ${isSelected ? "ring-2 ring-slate-900/15" : ""}`}
                                style={{
                                  top,
                                  height,
                                  background: softColor(color),
                                  borderColor: isSelected ? color : "rgba(15,23,42,0.08)",
                                  color,
                                }}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="truncate text-[11px] font-black">{block.title}</span>
                                  <span className="shrink-0 rounded bg-white/70 px-1 text-[10px] font-bold">
                                    {statusLabel(block.status)}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-[10px] font-semibold opacity-80">
                                  {minutesToTime(block.startMinutes)}-{minutesToTime(block.endMinutes)}
                                </p>
                                <span
                                  role="separator"
                                  aria-label="시간 조정"
                                  onPointerDown={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setResizingBlockId(block.id);

                                    const startY = event.clientY;
                                    const originalEnd = block.endMinutes;
                                    const target = event.currentTarget;
                                    target.setPointerCapture(event.pointerId);

                                    function handleMove(moveEvent: PointerEvent) {
                                      const deltaMinutes = Math.round(((moveEvent.clientY - startY) / 32) * 30);
                                      const previewEnd = Math.min(Math.max(Math.round((originalEnd + deltaMinutes) / 30) * 30, block.startMinutes + 30), 24 * 60);
                                      setForm((current) =>
                                        current.id === block.id
                                          ? { ...current, endTime: minutesToTime(previewEnd) }
                                          : current
                                      );
                                    }

                                    function handleUp(upEvent: PointerEvent) {
                                      target.releasePointerCapture(upEvent.pointerId);
                                      window.removeEventListener("pointermove", handleMove);
                                      window.removeEventListener("pointerup", handleUp);
                                      const deltaMinutes = Math.round(((upEvent.clientY - startY) / 32) * 30);
                                      resizeBlock(block, originalEnd + deltaMinutes);
                                    }

                                    window.addEventListener("pointermove", handleMove);
                                    window.addEventListener("pointerup", handleUp);
                                  }}
                                  className="absolute inset-x-2 bottom-1 z-40 h-2 cursor-ns-resize rounded-full bg-white/70"
                                />
                              </div>
                            );
                          })}
                          {loading && dayIndex === 0 && hour === 6 && (
                            <span className="absolute left-2 top-2 text-xs text-slate-300">불러오는 중</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <form onSubmit={saveBlock} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {form.id ? "Edit block" : "New block"}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    {form.id ? "시간블록 수정" : "시간블록 추가"}
                  </h3>
                </div>
                {selectedBlock && (
                  <span className="rounded-md px-2 py-1 text-xs font-black" style={{ background: softColor(colorForBlock(selectedBlock)), color: colorForBlock(selectedBlock) }}>
                    {statusLabel(selectedBlock.status)}
                  </span>
                )}
              </div>

              {selectedBlock && (
                <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">
                  <button type="button" onClick={() => quickPatchSelected({ date: shiftDate(normalizeApiDate(selectedBlock.date), -1) })} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                    전날
                  </button>
                  <button type="button" onClick={() => quickPatchSelected({ date: shiftDate(normalizeApiDate(selectedBlock.date), 1) })} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                    다음날
                  </button>
                  <button type="button" onClick={() => moveSelectedMinutes(-30)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                    30분 앞
                  </button>
                  <button type="button" onClick={() => moveSelectedMinutes(30)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                    30분 뒤
                  </button>
                  <button type="button" onClick={() => resizeSelectedMinutes(-30)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                    30분 줄이기
                  </button>
                  <button type="button" onClick={() => resizeSelectedMinutes(30)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                    30분 늘리기
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">일간계획 연결</span>
                  <select
                    value={form.dailyPlanId}
                    onChange={(event) => selectPlan(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">직접 입력</option>
                    {data?.unplacedPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {normalizeApiDate(plan.date)} · {plan.title}
                      </option>
                    ))}
                    {selectedBlock?.dailyPlan && (
                      <option value={selectedBlock.dailyPlan.id}>
                        {normalizeApiDate(selectedBlock.dailyPlan.date) || form.date} · {selectedBlock.dailyPlan.title}
                      </option>
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">제목</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="예: AI 프로젝트 기능 개선"
                    required
                  />
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">날짜</span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">시작</span>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">종료</span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      required
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">상태</span>
                    <select
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TimeBlockStatus }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">실제 분</span>
                    <input
                      type="number"
                      min="0"
                      max="1440"
                      value={form.actualMinutes}
                      onChange={(event) => setForm((current) => ({ ...current, actualMinutes: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      placeholder="선택"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">메모</span>
                  <textarea
                    value={form.note}
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                    className="min-h-20 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="실행 내용이나 이동 사유"
                  />
                </label>
              </div>

              <div className="mt-4 flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? "저장 중" : form.id ? "수정" : "추가"}
                </button>
                {form.id && (
                  <button type="button" onClick={deleteBlock} disabled={saving} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                    삭제
                  </button>
                )}
              </div>
            </form>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-black text-slate-800">회고로 이어질 지표</h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-bold">
                    <span className="text-slate-500">목표 연결 시간</span>
                    <span className="text-slate-800">{stats.linkedPct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-900" style={{ width: `${stats.linkedPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-bold">
                    <span className="text-slate-500">계획 대비 실행</span>
                    <span className="text-slate-800">{stats.donePct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.donePct}%` }} />
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-400">다음 단계</p>
                  <p className="mt-1 break-keep text-sm leading-relaxed text-slate-600">
                    시간블록 완료와 일간계획 완료를 자동 동기화할지는 실제 사용 후 결정하는 편이 안전합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
