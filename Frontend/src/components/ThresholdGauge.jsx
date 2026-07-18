import React from "react";

/**
 * Menampilkan posisi nilai dalam rentang tampilan dataset. Komponen ini tidak
 * menetapkan batas operasi, batas keselamatan, maupun status alarm.
 */
export default function ThresholdGauge({
  value = 0,
  min = 0,
  max = 10,
  unit = "",
  label = "Parameter",
}) {
  const numericValue = Number(value);
  const pct = Math.min(Math.max(((numericValue - min) / (max - min)) * 100, 0), 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs font-black text-slate-700 tabular-nums whitespace-nowrap">
          {Number.isFinite(numericValue) ? numericValue.toFixed(2) : "—"} {unit}
        </span>
      </div>

      <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className="absolute inset-y-1 w-1.5 bg-[#336B87] rounded-full shadow-sm ring-1 ring-white transition-all duration-500"
          style={{ left: `calc(${pct}% - 3px)` }}
        />
        <div
          className="absolute inset-y-0 flex items-center text-[9px] font-black text-slate-400 pointer-events-none"
          style={{ left: `${Math.min(pct + 2, 88)}%` }}
        >
          {pct.toFixed(0)}%
        </div>
      </div>

      <div className="flex justify-between text-[9px] font-semibold text-slate-400">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}
