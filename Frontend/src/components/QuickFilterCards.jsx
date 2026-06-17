import React, { useMemo } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Search,
  X,
} from "lucide-react";

/**
 * QUICK FILTER CARDS + INSTANT SEARCH
 * ====================================
 * Komponen untuk menyaring log monitoring dengan cepat
 * berdasarkan tingkat keparahan severity dan segment_id.
 *
 * Fitur:
 * - Kartu pintasan: Kritis / Peringatan / Aman / Semua
 * - Menampilkan count badge untuk tiap tingkat keparahan
 * - Input pencarian instan berdasarkan segment_id
 * - Fully memoized untuk performa optimal
 *
 * Justifikasi Akademis:
 * Operator SCADA sering menghadapi puluhan-hingga-ratusan log.
 * Filter berbasis severity memungkinkan triase insiden
 * dalam < 1 detik (ISO 11064: Ergonomic design of control centres).
 */

const SEVERITY_CARDS = [
  {
    key: "all",
    label: "Semua",
    icon: null,
    color: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
    activeColor: "bg-slate-700 text-white border-slate-700",
    dot: null,
  },
  {
    key: "Critical",
    label: "Kritis",
    icon: Shield,
    color:
      "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300",
    activeColor: "bg-red-600 text-white border-red-600",
    dot: "bg-red-500",
  },
  {
    key: "Warning",
    label: "Peringatan",
    icon: AlertTriangle,
    color:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300",
    activeColor: "bg-amber-500 text-white border-amber-500",
    dot: "bg-amber-500",
  },
  {
    key: "Safe",
    label: "Aman",
    icon: CheckCircle,
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
    activeColor: "bg-emerald-600 text-white border-emerald-600",
    dot: "bg-emerald-500",
  },
];

export default function QuickFilterCards({
  selectedSeverity = "all",
  onSeverityChange,
  searchSegmentId = "",
  onSearchChange,
  logs = [],
}) {
  // Hitung jumlah log per severity (memoized)
  const counts = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter(
      (l) => l.severity === "High" || l.prediction === "Surge" || l.prediction === "Leak"
    ).length;
    const warning = logs.filter(
      (l) =>
        l.severity === "Medium" ||
        l.prediction === "Blockage" ||
        l.prediction === "Degradation"
    ).length;
    const safe = logs.filter(
      (l) =>
        l.severity === "Safe" ||
        l.prediction === "Normal"
    ).length;
    return { total, critical, warning, safe };
  }, [logs]);

  const getCount = (key) => {
    switch (key) {
      case "Critical": return counts.critical;
      case "Warning": return counts.warning;
      case "Safe": return counts.safe;
      default: return counts.total;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Filter Cards */}
      <div className="flex flex-wrap gap-2">
        {SEVERITY_CARDS.map((card) => {
          const isActive = selectedSeverity === card.key;
          const count = getCount(card.key);
          const Icon = card.icon;

          return (
            <button
              key={card.key}
              onClick={() => onSeverityChange(card.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm ${
                isActive ? card.activeColor : card.color
              }`}
            >
              {/* Dot indicator */}
              {card.dot && (
                <span
                  className={`w-2 h-2 rounded-full ${card.dot} ${isActive ? "!bg-white" : ""}`}
                />
              )}
              {Icon && <Icon size={13} />}
              {card.label}
              {/* Count Badge */}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-white text-slate-500 border border-gray-200"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={13} className="text-slate-400" />
        </div>
        <input
          type="text"
          value={searchSegmentId}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari Segment ID..."
          className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
        />
        {searchSegmentId && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-300 hover:text-slate-500"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
