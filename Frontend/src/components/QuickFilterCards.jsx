import React, { useMemo } from "react";
import { Shield, AlertTriangle, CheckCircle, Search, X } from "lucide-react";

const SEVERITY_CARDS = [
  { key: "all", label: "Semua", icon: null, color: "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-200", activeColor: "bg-slate-500 text-white border-slate-500" },
  { key: "Critical", label: "Indikasi tinggi", icon: null, color: "bg-red-50 text-red-500 border-red-200 hover:bg-red-100", activeColor: "bg-red-500 text-white border-red-500" },
  { key: "Warning", label: "Indikasi sedang", icon: null, color: "bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100", activeColor: "bg-amber-500 text-white border-amber-500" },
  { key: "Safe", label: "Tidak ditandai", icon: CheckCircle, color: "bg-emerald-50 text-emerald-500 border-emerald-200 hover:bg-emerald-100", activeColor: "bg-emerald-500 text-white border-emerald-500" },
];

export default function QuickFilterCards({ selectedSeverity = "all", onSeverityChange, searchSegmentId = "", onSearchChange, logs = [] }) {
  const counts = useMemo(() => ({
    all: logs.length,
    Critical: logs.filter((log) => log.severityCategory === "Critical").length,
    Warning: logs.filter((log) => log.severityCategory === "Warning").length,
    Safe: logs.filter((log) => log.severityCategory === "Safe").length,
  }), [logs]);

  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {SEVERITY_CARDS.map((card) => {
          const Icon = card.icon;
          const isActive = selectedSeverity === card.key;
          return (
            <button key={card.key} onClick={() => onSeverityChange(card.key)} className={`inline-flex min-h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm ${isActive ? card.activeColor : card.color}`}>
              {Icon && <Icon size={13} />}{card.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-gray-200"}`}>{counts[card.key]}</span>
            </button>
          );
        })}
      </div>
      <div className="relative w-full min-w-[200px] xl:w-52 xl:flex-none">
        <Search size={13} className="absolute inset-y-0 left-3 my-auto text-slate-400 pointer-events-none" />
        <input type="text" value={searchSegmentId} onChange={(event) => onSearchChange(event.target.value)} placeholder="Cari Segment ID..." className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
        {searchSegmentId && <button onClick={() => onSearchChange("")} className="absolute inset-y-0 right-2.5 text-slate-300 hover:text-slate-500"><X size={13} /></button>}
      </div>
    </div>
  );
}
