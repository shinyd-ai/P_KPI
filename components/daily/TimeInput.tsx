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
      <div className="flex flex-wrap gap-1">
        {CHIPS.map((chip) => (
          <button
            key={chip.minutes}
            type="button"
            onClick={() => handleChip(chip.minutes)}
            className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
              value === chip.minutes
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-blue-300 hover:text-blue-600"
            }`}
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
          className="w-16 border border-zinc-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <span className="text-xs text-zinc-400">h</span>
        {value !== null && value > 0 && (
          <span className="text-xs text-blue-500 font-medium">{formatTime(value)}</span>
        )}
      </div>
    </div>
  );
}


