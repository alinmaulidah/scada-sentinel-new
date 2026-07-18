import React, { useState } from "react";
import { AlertTriangle, CheckCheck, X } from "lucide-react";

/** Menandai hasil model yang perlu ditinjau; bukan alarm operasional. */
export default function AlertBanner({ logs = [] }) {
  const [dismissed, setDismissed] = useState(false);
  const anomalyLogs = logs.filter((log) => log.prediction !== "Normal");

  if (dismissed || anomalyLogs.length === 0) return null;

  return (
    <div className="relative rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle size={17} />
          </div>
          <div>
            <p className="text-sm font-black">{anomalyLogs.length} observasi ditandai anomali</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
              Ini adalah keluaran model pada dataset penelitian, bukan alarm real-time atau diagnosis kondisi fisik pipa.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-amber-800 border border-amber-200 hover:bg-amber-100"
          >
            <CheckCheck size={14} /> Tandai ditinjau
          </button>
          <button onClick={() => setDismissed(true)} className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg" title="Tutup sementara">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
