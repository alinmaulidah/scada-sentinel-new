import React from "react";

/**
 * THRESHOLD GAUGE BAR
 * ===================
 * Visualisasi indikator batang yang menunjukkan posisi
 * nilai sensor saat ini terhadap batas ambang (threshold).
 *
 * Menampilkan 3 zona:
 * - Hijau  (Safe Zone)    : 0% — 60% dari max
 * - Kuning (Warning Zone) : 60% — 85% dari max
 * - Merah  (Critical Zone): 85% — 100% dari max
 *
 * @param {number} value    - Nilai sensor saat ini
 * @param {number} min      - Batas minimum (default: 0)
 * @param {number} max      - Batas maksimum (threshold atas)
 * @param {string} unit     - Satuan (Bar, m³/h, °C, RPM)
 * @param {string} label    - Label parameter
 * @param {number[]} setpoints - [safeMax, warningMax] opsional
 *
 * Justifikasi Akademis:
 * Visualisasi threshold berbasis rentang memudahkan operator
 * memahami seberapa dekat parameter ke batas kritis.
 * Sesuai standar ISA-101 untuk HMI (Human Machine Interface).
 */

export default function ThresholdGauge({
  value = 0,
  min = 0,
  max = 10,
  unit = "",
  label = "Parameter",
  setpoints = null,
}) {
  const safeMax = setpoints ? setpoints[0] : max * 0.6;
  const warnMax = setpoints ? setpoints[1] : max * 0.85;

  const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const safePct = ((safeMax - min) / (max - min)) * 100;
  const warnPct = ((warnMax - min) / (max - min)) * 100;

  // Tentukan zona & warna
  let zone = "safe";
  let zoneColor = "bg-emerald-500";
  let zoneLabel = "Aman";
  let textColor = "text-emerald-700";

  if (value > warnMax) {
    zone = "critical";
    zoneColor = "bg-red-500";
    zoneLabel = "Kritis!";
    textColor = "text-red-700";
  } else if (value > safeMax) {
    zone = "warning";
    zoneColor = "bg-amber-500";
    zoneLabel = "Waspada";
    textColor = "text-amber-700";
  }

  return (
    <div className="space-y-1.5">
      {/* Label + Nilai */}
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <span className={`text-xs font-black ${textColor} tabular-nums`}>
          {Number(value).toFixed(2)} {unit}
          <span className="ml-1 text-[10px] font-semibold opacity-75">
            ({zoneLabel})
          </span>
        </span>
      </div>

      {/* Bar Container */}
      <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        {/* Zona Hijau (Safe) */}
        <div
          className="absolute inset-y-0 left-0 bg-emerald-200/50 border-r border-emerald-300/50"
          style={{ width: `${safePct}%` }}
        />
        {/* Zona Kuning (Warning) */}
        <div
          className="absolute inset-y-0 bg-amber-200/50 border-r border-amber-300/50"
          style={{ left: `${safePct}%`, width: `${warnPct - safePct}%` }}
        />
        {/* Zona Merah (Critical) */}
        <div
          className="absolute inset-y-0 right-0 bg-red-200/50"
          style={{ width: `${100 - warnPct}%` }}
        />

        {/* Indikator Nilai (Jarum) */}
        <div
          className={`absolute inset-y-1 w-1.5 ${zoneColor} rounded-full shadow-sm ring-1 ring-white transition-all duration-500`}
          style={{ left: `calc(${pct}% - 3px)` }}
        />

        {/* Indikator Percentage di dalam bar */}
        <div
          className="absolute inset-y-0 flex items-center justify-center text-[9px] font-black text-slate-400 pointer-events-none"
          style={{ left: `${Math.min(pct + 1, 92)}%` }}
        >
          {pct.toFixed(0)}%
        </div>
      </div>

      {/* Label Zona */}
      <div className="flex justify-between text-[9px] font-semibold text-slate-400">
        <span>{min} {unit}</span>
        <span className="text-emerald-500">{safeMax} {unit}</span>
        <span className="text-amber-500">{warnMax} {unit}</span>
        <span className="text-red-400">{max} {unit}</span>
      </div>
    </div>
  );
}
