import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDownIcon,
  Minus,
  FileText,
  History,
  Layers,
} from "lucide-react";
import {
  getLatestMonitoring,
  getMonitoringHistory,
  getMonitoringRun,
} from "../features/monitoring/monitoring.api";
import {
  PER_PAGE,
  PRIMARY_COLOR,
  REFRESH_INTERVAL,
  SPARKLINE_WINDOW,
} from "../features/monitoring/monitoring.constants";

// ==================== KOMPONEN MODULAR ====================
import SparklineChart from "../components/SparklineChart";
import AlertBanner from "../components/AlertBanner";
import ThresholdGauge from "../components/ThresholdGauge";
import QuickFilterCards from "../components/QuickFilterCards";
import { getAppSettings } from "../lib/appSettings";

// ==================== LIBRARY PDF ====================
// CATATAN OPTIMASI: jsPDF & jspdf-autotable TIDAK di-import statis di sini lagi.
// Library ini cukup besar (~500KB+) dan sebelumnya selalu ikut ter-load saat
// halaman Monitoring dibuka, padahal belum tentu user export PDF.
// Sekarang di-load secara dinamis (lazy) hanya saat tombol "Export PDF" diklik.
// Lihat fungsi handleExportPDF di bawah.

// ==================== KONSTANTA ====================
// ==================== SKALA VISUAL DATASET ====================
// Rentang ini hanya skala visual untuk nilai dataset, bukan MAOP, set point,
// atau batas aman fasilitas nyata.
const DISPLAY_RANGES = {
  pressure: { min: 0, max: 200, unit: "Bar" },
  flow_rate: { min: 0, max: 100, unit: "m³/h" },
  temperature: { min: -50, max: 150, unit: "°C" },
  pump_speed: { min: 0, max: 5000, unit: "RPM" },
};

// Ringkasan aturan yang sama dengan interpretasi backend. Ini membantu
// presentasi hasil tanpa mengubah label atau ambang klasifikasi model.
const PATTERN_GUIDE = {
  surge: {
    label: "Surge",
    pressure: "Pressure naik",
    flow: "Flow rate naik",
    rule: "P dan Q berada di atas median + 1,5 IQR pada eksekusi ini.",
    summary: "Pressure dan flow rate sama-sama meningkat dibanding pola tengah data.",
    meaning: "Kenaikan serentak ini konsisten dengan surge-like, tetapi belum membuktikan osilasi tekanan tanpa data waktu kontinu.",
    impact: "Perubahan pressure yang cepat dapat mengganggu kestabilan operasi dan perlu ditinjau sebelum membebani peralatan.",
    priority: "Tinggi verifikasi segera",
    priorityClass: "bg-red-100 text-red-700",
    action: "Bandingkan dengan observasi sebelum dan sesudahnya.",
    className: "border-violet-200 bg-violet-50 text-violet-900",
    chipClass: "bg-violet-100 text-violet-700",
  },
  leak: {
    label: "Leak",
    pressure: "Pressure turun",
    flow: "Flow rate turun",
    rule: "P < median − 1 IQR dan Q < median − 0,5 IQR pada eksekusi ini.",
    summary: "Pressure dan flow rate sama-sama menurun dibanding pola tengah data.",
    meaning: "Pola ini konsisten dengan leak-like, bukan bukti kebocoran fisik.",
    impact: "Pola penurunan dapat berkaitan dengan kehilangan aliran atau tekanan, sehingga perlu pemeriksaan segmen terkait.",
    priority: "Tinggi verifikasi segera",
    priorityClass: "bg-red-100 text-red-700",
    action: "Periksa tren waktu dan data pendukung lapangan.",
    className: "border-sky-200 bg-sky-50 text-sky-900",
    chipClass: "bg-sky-100 text-sky-700",
  },
  blockage: {
    label: "Blockage",
    pressure: "Pressure naik",
    flow: "Flow rate turun",
    rule: "P > median + 1 IQR dan Q < median − 0,5 IQR pada eksekusi ini.",
    summary: "Pressure meningkat saat flow rate menurun.",
    meaning: "Pola ini konsisten dengan blockage-like, tetapi perlu data valve atau tekanan hulu-hilir untuk konfirmasi.",
    impact: "Hambatan aliran berpotensi menurunkan debit dan meningkatkan beban pada bagian hulu sistem.",
    priority: "Tinggi verifikasi segera",
    priorityClass: "bg-red-100 text-red-700",
    action: "Tinjau status valve dan observasi berdekatan.",
    className: "border-orange-200 bg-orange-50 text-orange-900",
    chipClass: "bg-orange-100 text-orange-700",
  },
  degradation: {
    label: "Degradation",
    pressure: "Pola campuran",
    flow: "Tidak memenuhi 3 pola lain",
    rule: "Kategori fallback: perlu tren waktu kontinu untuk menyimpulkan degradasi.",
    summary: "Data ditandai anomali, tetapi kombinasinya tidak cocok dengan surge, leak, atau blockage.",
    meaning: "Karena itu model memakai label Degradation sebagai kategori sisa; ini bukan bukti degradasi fisik bertahap.",
    impact: "Belum ada dampak fisik spesifik yang dapat disimpulkan dari satu observasi ini.",
    priority: "Sedang — telaah tren",
    priorityClass: "bg-amber-100 text-amber-700",
    action: "Bandingkan tren sebelum-sesudah, lalu cek temperature, pump speed, dan status valve.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    chipClass: "bg-amber-100 text-amber-700",
  },
};

// Status ini menjelaskan keluaran algoritma pada dataset, bukan kondisi fisik
// atau alarm operasi pipeline.
const PREDICTION_MATRIX = {
  Normal: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    btnClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white",
    icon: CheckCircle2,
  },
  Anomaly: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    btnClass: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white",
    icon: AlertTriangle,
  },
};

// ==================== HELPER FUNCTIONS ====================
const formatDateTimeID = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} — ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch { return "—"; }
};

const formatDateLong = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} — ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  } catch { return "—"; }
};

const getCfg = (pred) => pred === "Normal" ? PREDICTION_MATRIX.Normal : PREDICTION_MATRIX.Anomaly;
const fmt = (v) => (isNaN(Number(v)) ? "—" : Number(v).toFixed(1));
const getPatternLabel = (pattern) => ({
  leak: "Indikasi Leak",
  blockage: "Indikasi Blockage",
  surge: "Indikasi Surge",
  degradation: "Indikasi Degradation",
}[String(pattern || "").toLowerCase()] || "Indikasi pola lain");

const mapSeverityToFilter = (severity) => {
  switch (severity) {
    case "High": return "Critical";
    case "Medium": return "Warning";
    case "Safe": return "Safe";
    default: return "Warning";
  }
};

// Dipindah ke module-scope (bukan di dalam komponen) supaya fungsi ini
// tidak dibuat ulang setiap kali komponen re-render — sedikit membantu
// mengurangi kerja garbage collector pada mesin dengan RAM terbatas.
const getTrendIcon = (sparkData, key) => {
  const arr = sparkData?.[key] || [];
  if (arr.length < 2) return <Minus size={10} className="text-slate-300" />;
  const first = arr[0];
  const last = arr[arr.length - 1];
  if (last > first * 1.02) return <TrendingUp size={10} className="text-red-500" />;
  if (last < first * 0.98) return <TrendingDownIcon size={10} className="text-emerald-500" />;
  return <Minus size={10} className="text-slate-400" />;
};

// ==================== NORMALISASI LABEL MAPPER (FITUR #1) ====================
const NORM_LABELS = {
  "min-max": "Min-Max Standardization",
  "minmax": "Min-Max Standardization",
  "z-score": "Z-Score Normalization",
  "zscore": "Z-Score Normalization",
  "none": "Tanpa Normalisasi",
  "": "Tanpa Normalisasi",
};

const getNormLabel = (norm) => {
  if (!norm) return "Tanpa Normalisasi";
  const key = String(norm).toLowerCase().replace(/[\s_]/g, "");
  return NORM_LABELS[key] || norm;
};

const createMissingInsight = () => ({
  prediction: "Anomaly",
  severity: "Medium",
  reason: "Interpretasi server tidak tersedia untuk riwayat ini.",
  impact: "Label ini tidak dapat ditafsirkan sebagai diagnosis fisik.",
  solution: "Jalankan ulang analisis bila interpretasi diperlukan.",
});

/* ================================================================
   LOG ROW — dipisah jadi komponen sendiri + React.memo
   ================================================================
   OPTIMASI: Sebelumnya semua baris tabel dibuat langsung di dalam
   .map() pada komponen utama. Akibatnya, setiap kali state apa pun
   di komponen utama berubah (misal: buka/tutup 1 baris detail),
   SEMUA baris (bisa ratusan) ikut di-render ulang oleh React.
   Dengan React.memo, baris yang propnya tidak berubah akan di-skip
   dan tidak dibuat ulang -> jauh lebih ringan di RAM & CPU rendah.
   ================================================================ */
const LogRow = React.memo(function LogRow({ log, isExpanded, onToggle }) {
  const cfg = getCfg(log.prediction);

  return (
    <React.Fragment>
      <tr
        className={`hover:bg-slate-50/60 transition-colors ${
          isExpanded ? "bg-slate-50/40" : ""
        } ${log.severityCategory === "Critical" ? "border-l-2 border-l-red-400" : ""}`}
      >
        <td className="py-3 px-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-slate-400 font-mono font-semibold">
              {formatDateTimeID(log.timestamp)}
            </span>
            <span className="text-[10px] text-slate-300 font-mono">
              seg-{log.segment_id}
            </span>
          </div>
        </td>

        <td className="py-3 px-3 text-center">
          <div className="flex items-center gap-1 justify-center">
            {getTrendIcon(log.sparkData, "pressure")}
            <SparklineChart data={log.sparkData?.pressure || []} color="#ef4444" width={60} height={22} />
          </div>
        </td>
        <td className="py-3 px-3 text-right font-mono font-bold">{fmt(log.pressure)}</td>

        <td className="py-3 px-3 text-center">
          <div className="flex items-center gap-1 justify-center">
            {getTrendIcon(log.sparkData, "flow_rate")}
            <SparklineChart data={log.sparkData?.flow_rate || []} color="#0891b2" width={60} height={22} />
          </div>
        </td>
        <td className="py-3 px-3 text-right font-mono font-bold text-cyan-700">{fmt(log.flow_rate)}</td>

        <td className="py-3 px-3 text-center">
          <div className="flex items-center gap-1 justify-center">
            {getTrendIcon(log.sparkData, "temperature")}
            <SparklineChart data={log.sparkData?.temperature || []} color="#e11d48" width={60} height={22} />
          </div>
        </td>
        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">{fmt(log.temperature)}</td>

        <td className="py-3 px-3 text-center">
          <div className="flex items-center gap-1 justify-center">
            {getTrendIcon(log.sparkData, "pump_speed")}
            <SparklineChart data={log.sparkData?.pump_speed || []} color="#9333ea" width={60} height={22} />
          </div>
        </td>
        <td className="py-3 px-3 text-right font-mono font-bold text-purple-600">{Math.round(log.pump_speed)}</td>

        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col items-center gap-0.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black rounded-full border ${cfg.badge}`}>
              <cfg.icon size={11} /> {log.prediction.toUpperCase()}
            </span>
            <span
              className={`text-[9px] font-bold ${
                log.severity === "High" ? "text-red-500" : log.severity === "Medium" ? "text-amber-500" : "text-emerald-500"
              }`}
            >
              {log.severity}
            </span>
            {log.prediction !== "Normal" && (
              <span className="text-[9px] font-bold text-slate-500">
                {getPatternLabel(log.pattern)}
              </span>
            )}
          </div>
        </td>

        <td className="py-3 px-4 whitespace-nowrap text-center">
          <button
            onClick={() => onToggle(log.id)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 inline-flex items-center gap-1 shadow-sm ${cfg.btnClass}`}
          >
            Detail Analisis
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-slate-50/30">
          <td colSpan={11} className="p-4 border-t border-b border-dashed border-gray-200">
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} style={{ color: PRIMARY_COLOR }} />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Posisi Nilai pada Skala Dataset
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ThresholdGauge label="Pressure" value={log.pressure} {...DISPLAY_RANGES.pressure} />
                  <ThresholdGauge label="Flow Rate" value={log.flow_rate} {...DISPLAY_RANGES.flow_rate} />
                  <ThresholdGauge label="Temperature" value={log.temperature} {...DISPLAY_RANGES.temperature} />
                  <ThresholdGauge label="Pump Speed" value={log.pump_speed} {...DISPLAY_RANGES.pump_speed} />
                </div>
              </div>

              <PatternExplanation log={log} />

            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

const PatternExplanation = ({ log }) => {
  if (log.prediction === "Normal") {
    return (
      <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 text-[11px] text-emerald-800">
        <strong className="block text-[10px] font-black uppercase">Ringkasan pola</strong>
        Observasi ini tidak ditandai sebagai anomali oleh model pada eksekusi yang dipilih.
      </div>
    );
  }

  const guide = PATTERN_GUIDE[log.pattern] || PATTERN_GUIDE.degradation;
  return (
    <div className={`rounded-lg border p-2.5 text-[11px] ${guide.className}`}>
      <strong className="block text-[10px] font-black uppercase">Kesimpulan cepat: {guide.label}</strong>
      <div className="mt-1.5 flex flex-wrap gap-1.5 font-bold">
        <span className={`rounded-full px-2 py-0.5 ${guide.chipClass}`}>{guide.pressure}</span>
        <span className={`rounded-full px-2 py-0.5 ${guide.chipClass}`}>{guide.flow}</span>
      </div>
      <p className="mt-1.5 leading-relaxed"><strong>Dasar klasifikasi:</strong> {guide.summary}</p>
      <p className="mt-1 leading-relaxed"><strong>Makna akademik:</strong> {guide.meaning}</p>
      <div className="mt-2 border-t border-current/15 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <strong className="text-[10px] font-black uppercase">Rekomendasi tindak lanjut</strong>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${guide.priorityClass}`}>{guide.priority}</span>
        </div>
        <p className="mt-1.5 leading-relaxed"><strong>Dampak potensial:</strong> {guide.impact}</p>
        <p className="mt-1 leading-relaxed"><strong>Verifikasi:</strong> {guide.action}</p>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed opacity-75">Rekomendasi ini membantu menentukan pemeriksaan berikutnya; bukan perintah maintenance otomatis atau diagnosis fisik.</p>
    </div>
  );
};

function PatternGuide({ logs, selectedPattern, onPatternChange }) {
  const [showMethodNote, setShowMethodNote] = useState(false);
  const patternCounts = useMemo(() => logs.reduce((counts, log) => {
    const pattern = String(log.pattern || "").toLowerCase();
    if (counts[pattern] !== undefined && log.prediction !== "Normal") counts[pattern] += 1;
    return counts;
  }, { surge: 0, leak: 0, blockage: 0, degradation: 0 }), [logs]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800">Peta Indikasi Pressure–Flow</h2>
          <p className="text-[11px] leading-relaxed text-slate-500">Pilih pola untuk menyaring log dan gunakan sebagai alur penjelasan saat presentasi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold">
          <button type="button" aria-expanded={showMethodNote} onClick={() => setShowMethodNote((show) => !show)} className="inline-flex items-center gap-1 text-[#336B87] hover:underline">
            {showMethodNote ? "Sembunyikan catatan metode" : "Mengapa hanya 2 variabel?"}
            {showMethodNote ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {selectedPattern !== "all" && (
            <button onClick={() => onPatternChange("all")} className="text-[#336B87] hover:underline">Tampilkan semua pola</button>
          )}
        </div>
      </div>
      {showMethodNote && (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
          <strong className="text-slate-800">Empat variabel tetap digunakan oleh model:</strong> pressure, flow rate, temperature, dan pump speed. Peta ini hanya menampilkan pressure–flow karena aturan pemberian label Surge, Leak, dan Blockage pada penelitian memang membandingkan dua variabel tersebut terhadap median dan IQR. Temperature serta pump speed tetap tersedia pada nilai, sparkline, dan detail observasi sebagai konteks untuk memeriksa hasil keduanya tidak disederhanakan menjadi aturan pola pada peta ini.
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PATTERN_GUIDE).map(([key, guide]) => {
          const active = selectedPattern === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onPatternChange(active ? "all" : key)}
              className={`rounded-xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#336B87]/30 ${guide.className} ${active ? "ring-2 ring-[#336B87] shadow-sm" : "hover:-translate-y-0.5 hover:shadow-sm"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black">{guide.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${guide.chipClass}`}>{patternCounts[key]} data</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className={`rounded-full px-2 py-1 ${guide.chipClass}`}>{guide.pressure}</span>
                <span className={`rounded-full px-2 py-1 ${guide.chipClass}`}>{guide.flow}</span>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed opacity-80">{guide.rule}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-400">Indikasi ini adalah aturan klasifikasi pada dataset penelitian, bukan konfirmasi kondisi fisik atau alarm operasional.</p>
    </section>
  );
}

const MobileLogCard = React.memo(function MobileLogCard({ log, isExpanded, onToggle }) {
  const cfg = getCfg(log.prediction);
  const metricCharts = {
    Pressure: ["pressure", "#ef4444"],
    "Flow Rate": ["flow_rate", "#0891b2"],
    Temperature: ["temperature", "#e11d48"],
    "Pump Speed": ["pump_speed", "#9333ea"],
  };
  const metrics = [
    ["Pressure", fmt(log.pressure), "Bar", "text-slate-800"],
    ["Flow Rate", fmt(log.flow_rate), "m³/h", "text-cyan-700"],
    ["Temperature", fmt(log.temperature), "°C", "text-rose-600"],
    ["Pump Speed", Math.round(log.pump_speed), "RPM", "text-purple-600"],
  ];

  return (
    <article className={`rounded-xl border p-3 shadow-sm ${isExpanded ? "border-[#336B87]/40 bg-slate-50/60" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400">{formatDateTimeID(log.timestamp)}</p>
          <p className="mt-0.5 text-xs font-black text-slate-700">Segmen {log.segment_id || "—"}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black ${cfg.badge}`}>
            <cfg.icon size={10} /> {log.prediction.toUpperCase()}
          </span>
          {log.prediction !== "Normal" && <p className="mt-1 text-[9px] font-bold text-slate-500">{getPatternLabel(log.pattern)}</p>}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {metrics.map(([label, value, unit, color]) => {
          const [key, chartColor] = metricCharts[label];
          return (
            <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className={`mt-0.5 text-sm font-black tabular-nums ${color}`}>{value} <span className="text-[9px] font-semibold text-slate-400">{unit}</span></p>
              <div className="mt-1 h-6"><SparklineChart data={log.sparkData?.[key] || []} color={chartColor} width="100%" height={24} /></div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onToggle(log.id)}
        className={`mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black transition-colors ${cfg.btnClass}`}
      >
        {isExpanded ? "Tutup Detail" : "Detail Analisis"}
        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 border-t border-dashed border-slate-200 pt-3 text-[11px] leading-relaxed">
          <PatternExplanation log={log} />
        </div>
      )}
    </article>
  );
});

/* ================================================================
   MAIN COMPONENT: Monitoring
   ================================================================ */
export default function Monitoring() {
  const [searchParams] = useSearchParams();
  const [allLogs, setAllLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [selectedPred, setSelectedPred] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedPattern, setSelectedPattern] = useState("all");
  const [searchSegmentId, setSearchSegmentId] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // --- FITUR: DROPDOWN RIWAYAT EKSEKUSI ---
  const [historyList, setHistoryList] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null); // null = mode Live
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- OPTIMASI: PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);

  // Buffer historis untuk sparkline per segment_id
  const historyBuffer = useRef(new Map());

  // ==================== FETCH HISTORY LIST (sekali saat mount) ====================
  const fetchHistoryList = useCallback(async () => {
    try {
      setHistoryList(await getMonitoringHistory());
    } catch (err) {
      console.warn("Gagal fetch history list:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchHistoryList();
  }, [fetchHistoryList]);

  // ==================== FETCH DATA UTAMA ====================
  const fetchLatestMonitoring = useCallback(async () => {
    const { logs, meta } = await getLatestMonitoring();
    return { responseData: logs, responseMeta: meta };
  }, []);

  const fetchHistoryRunData = useCallback(async (runId) => {
    return getMonitoringRun(runId);
  }, []);

  // Helper: build objek log entry
  const buildLogEntry = useCallback((item, segId, idx, severity) => {
    const prev = historyBuffer.current.get(segId) || {
      pressure: [], flow_rate: [], temperature: [], pump_speed: [],
    };

    const pushVal = (arr, val) => {
      const next = [...arr, Number(val || 0)];
      return next.length > SPARKLINE_WINDOW ? next.slice(-SPARKLINE_WINDOW) : next;
    };

    const newHistory = {
      pressure: pushVal(prev.pressure, item.pressure),
      flow_rate: pushVal(prev.flow_rate, item.flow_rate),
      temperature: pushVal(prev.temperature, item.temperature),
      pump_speed: pushVal(prev.pump_speed, item.pump_speed),
    };
    historyBuffer.current.set(segId, newHistory);

    return {
      id: item.segment_id ? `log-${item.segment_id}-${idx}` : `log-${idx}-${Math.random().toString(36).slice(2, 8)}`,
      segment_id: segId,
      timestamp: item.timestamp || new Date().toISOString(),
      pressure: Number(item.pressure || 0),
      flow_rate: Number(item.flow_rate || 0),
      temperature: Number(item.temperature || 0),
      pump_speed: Number(item.pump_speed || 0),
      prediction: item.prediction || "Normal",
      pattern: item.pattern || item.type || "normal",
      severity: severity || "Medium",
      severityCategory: mapSeverityToFilter(severity || "Medium"),
      insight: item.insight || {
        reason: "Data tidak memiliki insight.",
        impact: "\u2014",
        solution: "\u2014",
      },
      sparkData: newHistory,
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      let responseData, responseMeta;

      if (selectedRunId === null) {
        // Menampilkan hasil eksekusi tersimpan paling baru, bukan aliran SCADA real-time.
        const result = await fetchLatestMonitoring();
        responseData = result.responseData;
        responseMeta = result.responseMeta;

        if (responseMeta) setMeta(responseMeta);

        historyBuffer.current.clear();
        const chronologicalData = [...responseData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const logs = chronologicalData.map((item, idx) => {
          const segId = item.segment_id || `seg-${idx}`;
          return buildLogEntry(item, segId, idx, item.severity || "Medium");
        });
        setAllLogs(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } else {
        // Mode History — ambil dari daftar yang sudah di-cache atau fetch ulang
        setHistoryLoading(true);
        const run = await fetchHistoryRunData(selectedRunId);

        const anomalyDetails = run.anomaly_details || [];
        const normalDetails = run.normal_details || [];

        setMeta({
          algorithm: run.algorithm,
          normalization: run.normalization,
          cluster: run.cluster,
          metrics: {
            silhouette: run.silhouette,
            davies_bouldin: run.davies_bouldin,
            accuracy: run.accuracy,
            precision: run.precision,
            recall: run.recall,
            f1_score: run.f1_score,
          },
          summary: {
            total_anomaly: run.anomaly,
            total_normal: run.normal,
            total_data: run.anomaly + run.normal,
          },
          executed_at: run.created_at,
        });

        const allItems = [
          ...anomalyDetails.map((item) => ({ ...item, _type: "anomaly" })),
          ...normalDetails.map((item) => ({ ...item, _type: "normal" })),
        ];

        historyBuffer.current.clear();
        const chronologicalItems = allItems.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const logs = chronologicalItems.map((item, idx) => {
          const segId = item.segment_id || `seg-${idx}`;
          const insight = item.insight
            ? {
                prediction: item._type === "normal" ? "Normal" : "Anomaly",
                severity: item.severity,
                ...item.insight,
              }
            : createMissingInsight();
          return buildLogEntry(
            {
              ...item,
              prediction: item._type === "normal" ? "Normal" : "Anomaly",
              pattern: item._type === "normal" ? "normal" : item.type,
              severity: item._type === "normal" ? "Safe" : "Medium",
              insight: {
                reason: insight.reason,
                impact: insight.impact,
                solution: insight.solution,
              },
            },
            segId,
            idx,
            item._type === "normal" ? "Safe" : "Medium"
          );
        });
        setAllLogs(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setHistoryLoading(false);
      }
      setError(null);
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Koneksi backend gagal. Pastikan API Server menyala.");
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  }, [selectedRunId, fetchLatestMonitoring, fetchHistoryRunData, buildLogEntry]);

  // Trigger fetch setiap selectedRunId berubah (termasuk mount pertama)
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh HANYA untuk mode Live (selectedRunId === null)
  useEffect(() => {
    if (selectedRunId !== null || !getAppSettings().autoRefresh) return;
    const iv = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [fetchData, selectedRunId]);

  // OPTIMASI: reset ke halaman 1 setiap kali filter/mode berubah,
  // supaya tidak "nyangkut" di halaman kosong.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPred, selectedSeverity, selectedPattern, searchSegmentId, selectedRunId]);

  useEffect(() => {
    setSelectedPred(searchParams.get("status") === "Anomaly" ? "Anomaly" : "all");
  }, [searchParams]);

  const toggleExpandLog = useCallback((id) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  }, []);

  // ==================== FILTERING (MEMOIZED) ====================
  const filteredLogs = useMemo(() => {
    return allLogs.filter((l) => {
      if (selectedPred !== "all" && l.prediction !== selectedPred) return false;
      if (selectedSeverity !== "all" && l.severityCategory !== selectedSeverity) return false;
      if (selectedPattern !== "all" && String(l.pattern).toLowerCase() !== selectedPattern) return false;
      if (
        searchSegmentId &&
        l.segment_id &&
        !String(l.segment_id).toLowerCase().includes(searchSegmentId.toLowerCase())
      )
        return false;
      return true;
    });
  }, [allLogs, selectedPred, selectedSeverity, selectedPattern, searchSegmentId]);

  // ==================== PAGINASI (MEMOIZED) ====================
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * PER_PAGE;
    return filteredLogs.slice(start, start + PER_PAGE);
  }, [filteredLogs, safePage]);

  // ==================== STATISTIK (MEMOIZED) ====================
  const stats = useMemo(() => {
    const total = allLogs.length;
    const anomaly = allLogs.filter((l) => l.prediction !== "Normal").length;
    const normal = allLogs.filter((l) => l.prediction === "Normal").length;
    return { total, anomaly, normal };
  }, [allLogs]);

  // ==================== EXPORT PDF (LAZY-LOADED) ====================
  const handleExportPDF = useCallback(async () => {
    try {
      setIsExporting(true);
      // OPTIMASI: jsPDF & jspdf-autotable baru di-download & dijalankan
      // di sini, saat tombol diklik — bukan saat halaman Monitoring dibuka.
      const [{ default: jsPDF }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(51, 107, 135);
      doc.text("LAPORAN MONITORING ANOMALI SCADA PIPELINE", pageWidth / 2, 18, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Dicetak: ${formatDateLong(new Date().toISOString())}`, pageWidth / 2, 24, { align: "center" });

      doc.setFontSize(8);
      doc.setTextColor(80);
      const algoText = meta?.algorithm ? `Algoritma: ${meta.algorithm.toUpperCase()}` : "";
      const normText = meta?.normalization ? ` | ${getNormLabel(meta.normalization)}` : "";
      const summaryText = `Total: ${stats.total} | Anomali: ${stats.anomaly} | Normal: ${stats.normal} | ${algoText}${normText}`;
      doc.text(summaryText, 14, 31);

      const tableHead = [[
        "Waktu", "Segmen", "P (Bar)", "Q (m\u00B3/h)", "T (\u00B0C)", "N (RPM)", "Prediksi", "Severity"
      ]];

      // Export tetap memakai SELURUH data hasil filter (bukan cuma 1 halaman),
      // karena laporan PDF memang wajar berisi semua baris yang relevan.
      const tableBody = filteredLogs.map((log) => [
        formatDateTimeID(log.timestamp),
        log.segment_id || "\u2014",
        fmt(log.pressure),
        fmt(log.flow_rate),
        fmt(log.temperature),
        String(Math.round(log.pump_speed)),
        log.prediction.toUpperCase(),
        log.severity || "\u2014",
      ]);

      doc.autoTable({
        head: tableHead,
        body: tableBody,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 1.5, halign: "center", valign: "middle" },
        headStyles: { fillColor: [51, 107, 135], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { halign: "left", cellWidth: 40 }, 1: { cellWidth: 22 }, 6: { fontStyle: "bold" } },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `Halaman ${i} dari ${pageCount} \u2014 SCADA Sentinel Pipeline Monitoring System`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      doc.save(`Laporan-Monitoring-SCADA-${timestamp}.pdf`);
    } catch (err) {
      console.error("Export PDF gagal:", err);
    } finally {
      setIsExporting(false);
    }
  }, [filteredLogs, meta, stats]);

  // ==================== RENDER ====================
  if (loading && allLogs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
        <RefreshCw className="animate-spin text-slate-500" size={24} />
        Sinkronisasi Log...
      </div>
    );
  }

  if (error && allLogs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center gap-2">
        <p className="text-xs font-semibold text-red-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1">
          <RefreshCw size={12} /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 font-sans text-slate-600">
      <div className="mx-auto w-full max-w-[1600px] space-y-3">

        {/* ================================================================
            I. HEADER + NORMALISASI BADGE
            ================================================================ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
              Monitoring Hasil Deteksi Anomali
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Total Data: <span className="text-slate-700 font-bold">{stats.total} entries</span></span>
              <span className="text-slate-300">|</span>
              <span>Anomali: <span className="text-red-500 font-bold">{stats.anomaly}</span></span>
              <span className="text-slate-300">|</span>
              <span>Normal: <span className="text-emerald-600 font-bold">{stats.normal}</span></span>
              {meta?.algorithm && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400">Algoritma:</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold border border-slate-200">
                      {meta.algorithm.toUpperCase()}
                    </span>
                    {meta.normalization && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-200">
                        <Layers size={10} />
                        {getNormLabel(meta.normalization)}
                      </span>
                    )}
                  </span>
                </>
              )}
            </p>
          </div>
          </div>

        {/* ================================================================
            II. PETA POLA + ALERT BANNER
            ================================================================ */}
        <PatternGuide
          logs={allLogs}
          selectedPattern={selectedPattern}
          onPatternChange={setSelectedPattern}
        />

        <AlertBanner logs={allLogs} />

        {/* ================================================================
            III. PANEL KONTROL: FILTER + DROPDOWN HISTORY + EXPORT PDF
            ================================================================ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
          <div className="flex flex-col items-stretch justify-between gap-3 xl:flex-row xl:items-center xl:flex-nowrap">

            <div className="min-w-0 flex-1">
              <QuickFilterCards
                selectedSeverity={selectedSeverity}
                onSeverityChange={setSelectedSeverity}
                searchSegmentId={searchSegmentId}
                onSearchChange={setSearchSegmentId}
                logs={allLogs}
              />
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:w-auto xl:flex-none">
              <div className="relative w-full sm:flex-1 sm:min-w-[200px] xl:w-52 xl:flex-none">
                <div className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                  <History size={12} className="text-slate-400" />
                  <select
                    value={selectedRunId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedRunId(val === "" ? null : Number(val));
                    }}
                    className="min-w-0 w-full bg-transparent text-[10px] font-bold text-slate-600 focus:outline-none"
                  >
                    <option value="">Hasil Eksekusi</option>
                    {historyList.map((run) => (
                      <option key={run.id} value={run.id}>
                        [ID {run.id}] {run.algorithm?.toUpperCase() || "?"} + {getNormLabel(run.normalization)} {formatDateTimeID(run.created_at)}
                      </option>
                    ))}
                  </select>
                  {historyLoading && <RefreshCw size={10} className="animate-spin text-slate-400" />}
                </div>
              </div>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-[10px] font-bold text-white shadow-sm transition-all active:scale-95 hover:bg-red-700 disabled:opacity-60 sm:w-auto"
              >
                {isExporting ? <RefreshCw size={13} className="animate-spin" /> : <FileText size={13} />}
                {isExporting ? "Menyiapkan..." : "Export PDF"}
              </button>
            </div>
          </div>

          {selectedRunId !== null && meta?.executed_at && (
            <p className="mt-2 flex flex-wrap items-center gap-1 text-[10px] font-semibold text-amber-600">
              <History size={10} />
              {selectedRunId} - {formatDateLong(meta.executed_at)}
              {" "}
              <button
                onClick={() => setSelectedRunId(null)}
                className="text-blue-600 hover:underline font-bold"
              >
                Kembali ke hasil terbaru
              </button>
            </p>
          )}
        </div>

        {/* ================================================================
            IV. TABEL PREDIKSI UTAMA (DENGAN SPARKLINE, PAGINATED)
            ================================================================ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="space-y-2 p-3 sm:hidden">
            {paginatedLogs.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                Tidak ada log data yang tersedia.
              </div>
            ) : paginatedLogs.map((log) => (
              <MobileLogCard
                key={log.id}
                log={log}
                isExpanded={expandedLogId === log.id}
                onToggle={toggleExpandLog}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-[980px] w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-gray-100 text-slate-400 font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu / Segmen</th>
                  <th className="py-3 px-3 text-center">Tren P</th>
                  <th className="py-3 px-3 text-right">P (Bar)</th>
                  <th className="py-3 px-3 text-center">Tren Q</th>
                  <th className="py-3 px-3 text-right">Q (m³/h)</th>
                  <th className="py-3 px-3 text-center">Tren T</th>
                  <th className="py-3 px-3 text-right">T (°C)</th>
                  <th className="py-3 px-3 text-center">Tren N</th>
                  <th className="py-3 px-3 text-right">N (RPM)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400 font-bold">
                      <div className="flex flex-col items-center gap-2">
                        <Activity size={20} className="text-slate-300" />
                        Tidak ada log data yang tersedia.
                        {searchSegmentId && (
                          <button onClick={() => setSearchSegmentId("")} className="text-xs text-blue-500 hover:underline">
                            Hapus filter pencarian
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <LogRow
                      key={log.id}
                      log={log}
                      isExpanded={expandedLogId === log.id}
                      onToggle={toggleExpandLog}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ================================================================
              PAGINASI — OPTIMASI UTAMA: hanya PER_PAGE (20) baris yang
              pernah ada di DOM sekaligus, bukan seluruh dataset (500+).
              ================================================================ */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-slate-50/50">
              <p className="text-[11px] font-semibold text-slate-400">
                Menampilkan{" "}
                <span className="text-slate-700 font-bold">
                  {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filteredLogs.length)}
                </span>{" "}
                dari <span className="text-slate-700 font-bold">{filteredLogs.length}</span> data
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-bold text-slate-600 px-2">
                  Hal {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================
            V. FOOTER: METRIK AKURASI ALGORITMA
            ================================================================ */}
        {meta?.metrics && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity size={12} style={{ color: PRIMARY_COLOR }} />
              Metrics Akurasi — {meta.algorithm?.toUpperCase() || "Algorithm"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Silhouette", val: meta.metrics.silhouette, color: "text-indigo-600", bg: "bg-indigo-50", note: "Metrik struktur internal", decimal: true },
                { label: "Davies-Bouldin", val: meta.metrics.davies_bouldin, color: "text-purple-600", bg: "bg-purple-50", note: "Metrik struktur internal", decimal: true },
                { label: "Accuracy", val: meta.metrics.accuracy, color: "text-blue-600", bg: "bg-blue-50", note: "Terhadap target dataset", decimal: true },
                { label: "Precision", val: meta.metrics.precision, color: "text-cyan-600", bg: "bg-cyan-50", note: "Terhadap target dataset", decimal: true },
                { label: "Recall", val: meta.metrics.recall, color: "text-amber-600", bg: "bg-amber-50", note: "Terhadap target dataset", decimal: true },
                { label: "F1 Score", val: meta.metrics.f1_score, color: "text-rose-600", bg: "bg-rose-50", note: "Terhadap target dataset", decimal: true },
    {
        label: "Total Klaster",
        val: meta.cluster,
        color: "text-blue-600",
        bg: "bg-blue-50",
        note: "Jumlah klaster terbentuk"
      },
      {
        label: "Total Anomali",
        val: meta.summary?.total_anomaly,
        color: "text-red-500",
        bg: "bg-red-50",
        note: "Data teridentifikasi anomali"
    },
    {
        label: "Total Normal",
        val: meta.summary?.total_normal,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        note: "Data kondisi normal"
    },
    {
        label: "Total Data",
        val: meta.summary?.total_data,
        color: "text-slate-700",
        bg: "bg-slate-50",
        note: "Total data diproses"
    },
].map((m) => (
    <div key={m.label} className={`${m.bg} rounded-lg p-3 text-center border border-gray-100`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</p>
        <p className={`text-base font-black ${m.color} tabular-nums`}>
            {m.val != null
                ? m.decimal ? Number(m.val).toFixed(3) : m.val
                : "—"
            }
        </p>
        <p className="text-[9px] text-slate-400 mt-0.5">{m.note}</p>
    </div>
))}
            </div>
          </div>
        )}
    
      </div>
    </div>
  );
}
