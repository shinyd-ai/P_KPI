"use client";

interface TimeInputProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
}

const CHIPS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "1.5h", minutes: 90 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
];

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function hoursToMinutes(h: number): number {
  return Math.round(h * 60);
}

export default function TimeInput({ value, onChange }: TimeInputProps) {
  const hoursStr = value !== null ? String(value / 60) : "";

  function handleChip(minutes: number) {
    onChange(value === minutes ? null : minutes);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onChange(null);
      return;
    }
    const h = parseFloat(raw);
    if (!isNaN(h) && h >= 0) {
      onChange(hoursToMinutes(h));
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <button
            key={chip.minutes}
            type="button"
            onClick={() => handleChip(chip.minutes)}
            className="px-2.5 py-1 text-xs rounded-full border font-medium transition-all"
            style={
              value === chip.minutes
                ? {
                    background: "linear-gradient(135deg, #4f7cff 0%, #6366f1 100%)",
                    color: "#fff",
                    borderColor: "transparent",
                    boxShadow: "0 1px 4px rgba(79,124,255,0.3)",
                  }
                : {
                    background: "#fff",
                    color: "#64748b",
                    borderColor: "rgba(0,0,0,0.10)",
                  }
            }
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={hoursStr}
          onChange={handleInput}
          placeholder="0"
          className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-center"
        />
        <span className="text-xs text-slate-400">h</span>
        {value !== null && value > 0 && (
          <span className="text-xs font-semibold" style={{ color: "#6366f1" }}>
            {formatTime(value)}
          </span>
        )}
      </div>
    </div>
  );
}
