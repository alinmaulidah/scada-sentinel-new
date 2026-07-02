import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Zap,
  TrendingDown,
  Bell,
  CheckCheck,
  X,
  ChevronRight,
} from "lucide-react";

/**
 * ALERT BANNER — EARLY WARNING SYSTEM
 * =====================================
 * Komponen notifikasi real-time yang otomatis muncul
 * ketika terdeteksi anomali kritis (High severity).
 *
 * Fitur:
 * - Muncul otomatis dalam 3 detik setelah ada data baru
 * - Berkedip (pulse animation) untuk menarik perhatian operator
 * - Tombol "Acknowledge" untuk mensimulasikan respons lapangan
 * - Menampilkan jumlah & tipe insiden kritis
 *
 * Justifikasi Akademis:
 * Sistem peringatan dini adalah komponen vital SCADA Control Room.
 * Operator harus mengetahui insiden kritis dalam < 10 detik (ANSI/ISA-18.2).
 */

const SEVERITY_CONFIG = {
  High: {
    icon: ShieldAlert,
    bg: "from-red-600 to-red-700",
    border: "border-red-400",
    text: "text-red-50",
    pulse: true,
  },
  Medium: {
    icon: AlertTriangle,
    bg: "from-amber-500 to-amber-600",
    border: "border-amber-400",
    text: "text-amber-50",
    pulse: false,
  },
  Safe: {
    icon: Bell,
    bg: "from-emerald-500 to-emerald-600",
    border: "border-emerald-400",
    text: "text-emerald-50",
    pulse: false,
  },
};

export default function AlertBanner({ logs = [] }) {
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevLogLenRef = useRef(0);

  // Hitung log kritis yang BELUM di-acknowledge
  const criticalLogs = logs.filter(
    (l) =>
      (l.severity === "High" || l.prediction === "Surge" || l.prediction === "Leak") &&
      !acknowledgedIds.has(l.id)
  );

  const mediumLogs = logs.filter(
    (l) =>
      l.severity === "Medium" &&
      !acknowledgedIds.has(l.id)
  );

  // Auto-show: trigger ketika ada critical log baru masuk
  useEffect(() => {
    if (logs.length > prevLogLenRef.current && criticalLogs.length > 0 && !dismissed) {
      setVisible(true);
    }
    prevLogLenRef.current = logs.length;
  }, [logs.length, criticalLogs.length, dismissed]);

  const handleAcknowledge = useCallback(() => {
    const allCriticalIds = new Set([
      ...acknowledgedIds,
      ...criticalLogs.map((l) => l.id),
      ...mediumLogs.map((l) => l.id),
    ]);
    setAcknowledgedIds(allCriticalIds);
    setVisible(false);
  }, [acknowledgedIds, criticalLogs, mediumLogs]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
  }, []);

  // Kondisi tidak ada alert
  if (!visible || (criticalLogs.length === 0 && mediumLogs.length === 0)) {
    // Tampilkan banner hijau "System Normal" jika tidak ada insiden
    if (dismissed && criticalLogs.length === 0) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
          <Bell size={14} />
          Sistem dalam kondisi aman. Tidak ada insiden kritis terdeteksi.
          <button
            onClick={() => setDismissed(false)}
            className="ml-auto text-emerald-500 hover:text-emerald-800 underline text-[10px]"
          >
            Reset Alert
          </button>
        </div>
      );
    }
    return null;
  }

  const hasCritical = criticalLogs.length > 0;
  const cfg = SEVERITY_CONFIG[hasCritical ? "High" : "Medium"];
  const Icon = cfg.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 ${cfg.border} bg-gradient-to-r ${cfg.bg} shadow-lg ${
        cfg.pulse ? "animate-pulse" : ""
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.15) 10px, rgba(255,255,255,0.15) 20px)",
        }}
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5">
        {/* Kiri: Icon + Teks */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${cfg.text} bg-white/20`}>
            <Icon size={18} />
          </div>
          <div className={cfg.text}>
            <p className="text-sm font-black leading-tight">
              {hasCritical
                ? `PERINGATAN KRITIS - ${criticalLogs.length} Insiden Aktif`
                : `PERHATIAN — ${mediumLogs.length} Insiden Sedang`}
            </p>
            <p className="text-[11px] opacity-90 mt-0.5">
              {hasCritical
                ? `Terdeteksi ${criticalLogs.filter((l) => l.prediction === "Surge").length} Surge & ${criticalLogs.filter((l) => l.prediction === "Leak").length} Leak. Segera lakukan tindakan!`
                : `Beberapa parameter menunjukkan deviasi dari batas normal.`}
            </p>
          </div>
        </div>

        {/* Kanan: Tombol Aksi */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAcknowledge}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded-lg text-xs font-black transition-all shadow-sm active:scale-95"
          >
            <CheckCheck size={14} />
            Acknowledge Alert
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Tutup sementara"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Daftar Ringkas Insiden */}
      {criticalLogs.length > 0 && (
        <div className="relative border-t border-white/20 px-5 py-2">
          <div className="flex flex-wrap gap-2">
            {criticalLogs.slice(0, 5).map((log) => (
              <span
                key={log.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/15 text-white rounded-md text-[10px] font-bold"
              >
                <ChevronRight size={10} />
                {log.prediction} @ seg-{log.segment_id || "?"}
              </span>
            ))}
            {criticalLogs.length > 5 && (
              <span className="text-[10px] text-white/70 font-bold">
                +{criticalLogs.length - 5} lainnya
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
