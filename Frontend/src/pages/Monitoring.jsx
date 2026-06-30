import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  TrendingDown,
  Activity,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDownIcon,
  Minus,
  FileText,
  History,
  Layers,
} from "lucide-react";
import axios from "axios";

// ==================== KOMPONEN MODULAR ====================
import SparklineChart from "../components/SparklineChart";
import AlertBanner from "../components/AlertBanner";
import ThresholdGauge from "../components/ThresholdGauge";
import QuickFilterCards from "../components/QuickFilterCards";

// ==================== LIBRARY PDF ====================
import jsPDF from "jspdf";
import "jspdf-autotable";

// ==================== KONSTANTA ====================
const API_BASE = "http://localhost:5000/api";
const REFRESH_INTERVAL = 10000;
const PRIMARY_COLOR = "#336B87";
const SPARKLINE_WINDOW = 12;

// ==================== THRESHOLD SET-POINTS (MAOP & Standar Operasi) ====================
const THRESHOLDS = {
  pressure:    { min: 0, max: 8.0, safeMax: 4.0, warnMax: 5.5, unit: "Bar" },
  flow_rate:   { min: 0, max: 15.0, safeMax: 8.0, warnMax: 10.0, unit: "m³/h" },
  temperature: { min: 0, max: 90.0, safeMax: 55.0, warnMax: 65.0, unit: "°C" },
  pump_speed:  { min: 0, max: 2000, safeMax: 1400, warnMax: 1600, unit: "RPM" },
};

/* ================================================================
   MATRIKS PREDIKSI — Sesuai Kondisi Tabel Aturan Sistem
   ================================================================ */
const PREDICTION_MATRIX = {
  Normal: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    btnClass: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white",
    icon: CheckCircle2,
    logicRelation: "Sesuai Set Point.",
    P: { status: "Stabil", trend: "stable", textClass: "text-emerald-600" },
    Q: { status: "Stabil", trend: "stable", textClass: "text-emerald-600" },
    T: { status: "Normal", trend: "stable", textClass: "text-emerald-600" },
    N: { status: "Stabil", trend: "stable", textClass: "text-emerald-600" },
  },
  Leak: {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    btnClass: "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-600 hover:text-white",
    icon: AlertTriangle,
    logicRelation: "Pompa \"ngebut\" tapi tekanan tekor.",
    P: { status: "↓↓ Turun", trend: "sharp_down", textClass: "text-red-600 font-black" },
    Q: { status: "↓ Turun", trend: "down", textClass: "text-orange-600" },
    T: { status: "Stabil", trend: "stable", textClass: "text-emerald-600" },
    N: { status: "↑ Naik", trend: "up", textClass: "text-amber-600" },
  },
  Blockage: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    btnClass: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white",
    icon: ShieldAlert,
    logicRelation: "Kerja keras tapi aliran mampet.",
    P: { status: "↑↑ Naik", trend: "sharp_up", textClass: "text-red-600 font-black" },
    Q: { status: "↓↓ Turun", trend: "sharp_down", textClass: "text-red-600 font-black" },
    T: { status: "↑ Naik", trend: "up", textClass: "text-orange-600" },
    N: { status: "↑ Naik", trend: "up", textClass: "text-amber-600" },
  },
  Surge: {
    badge: "bg-red-50 text-red-700 border-red-200",
    btnClass: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white",
    icon: Zap,
    logicRelation: "Mesin dan aliran \"berantem\".",
    P: { status: "~ Liar", trend: "chaotic", textClass: "text-red-600 animate-pulse" },
    Q: { status: "~ Liar", trend: "chaotic", textClass: "text-red-600 animate-pulse" },
    T: { status: "Stabil", trend: "stable", textClass: "text-emerald-600" },
    N: { status: "~ Tidak Stabil", trend: "chaotic", textClass: "text-orange-600" },
  },
  Degradation: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    btnClass: "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white",
    icon: TrendingDown,
    logicRelation: "Efisiensi rendah, boros energi.",
    P: { status: "↓ Turun", trend: "down", textClass: "text-amber-600" },
    Q: { status: "↓ Turun", trend: "down", textClass: "text-amber-600" },
    T: { status: "↑ Naik", trend: "up", textClass: "text-orange-600" },
    N: { status: "↑↑ Tinggi", trend: "sharp_up", textClass: "text-red-600 font-black" },
  },
};

// ==================== HELPER FUNCTIONS ====================
const formatDateTimeID = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB — ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch { return "—"; }
};

const formatDateLong = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} — ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")} WIB`;
  } catch { return "—"; }
};

const getCfg = (pred) => PREDICTION_MATRIX[pred] || PREDICTION_MATRIX.Normal;
const fmt = (v) => (isNaN(Number(v)) ? "—" : Number(v).toFixed(1));

const mapSeverityToFilter = (severity) => {
  switch (severity) {
    case "High": return "Critical";
    case "Medium": return "Warning";
    case "Safe": return "Safe";
    default: return "Warning";
  }
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

/**
 * Generate insight dari data anomali secara lokal (untuk data history
 * yang tidak menyertakan field `insight` dari backend /api/monitoring).
 */
const generateInsightLocal = (item, typeStr) => {
  const p = Number(item.pressure || 0);
  const f = Number(item.flow_rate || 0);
  const t = Number(item.temperature || 0);
  const s = Number(item.pump_speed || 0);
  const type = String(item.type || typeStr || "normal").toLowerCase();

  if (type === "leak" || (p < 2.5 && f > 8.0)) return {
    prediction: "Leak", severity: "High",
    reason: `Tekanan drop kritis (${p.toFixed(2)} Bar), aliran tinggi (${f.toFixed(1)} m\u00B3/h). Hilangnya back-pressure fluida akibat kebocoran dinding pipa.`,
    impact: "Risiko kehilangan volume komoditas, pencemaran lingkungan, kegagalan pasokan hilir.",
    solution: "Isolasi block-valve terdekat, kecilkan RPM pompa, kerahkan tim mekanis lapangan.",
  };
  if (type === "surge" || (p > 5.5 && s > 1600)) return {
    prediction: "Surge", severity: "High",
    reason: `Lonjakan tekanan masif (${p.toFixed(2)} Bar) & RPM tinggi (${s} RPM). Efek Water Hammer akibat penutupan katup mendadak.`,
    impact: "Tekanan melampaui batas MAOP, risiko deformasi plastis atau pipa pecah.",
    solution: "Ramp-down RPM segera, buka bypass valve darurat, periksa surge relief system.",
  };
  if (type === "blockage" || (p > 4.5 && f < 3.0)) return {
    prediction: "Blockage", severity: "High",
    reason: `Tekanan hulu naik (${p.toFixed(2)} Bar) tapi aliran buntu (${f.toFixed(1)} m\u00B3/h). Akumulasi endapan atau malfungsi katup kontrol.`,
    impact: "Hambatan mekanis total di dalam pipa, risiko kerusakan pompa.",
    solution: "Lakukan Pigging operation segera dan bersihkan pipa secara menyeluruh.",
  };
  if (type === "degradation" || t > 65.0 || (s > 1500 && f < 6.0)) return {
    prediction: "Degradation", severity: "Medium",
    reason: `Suhu operasional tinggi (${t.toFixed(1)}\u00B0C) atau pompa kerja keras (${s} RPM) dengan yield aliran rendah.`,
    impact: "Penurunan efisiensi termal/mekanis komponen, risiko kerusakan bearing.",
    solution: "Re-greasing bearing penggerak, cek heat exchanger, kalibrasi ulang instrumen.",
  };
  if (type === "normal") return {
    prediction: "Normal", severity: "Safe",
    reason: "Seluruh parameter sensor berada pada rentang operasional safe-zone standar.",
    impact: "Sistem distribusi pipa berjalan stabil tanpa indikasi fluktuasi anomali.",
    solution: "Lanjutkan monitoring berkala dan preventive maintenance sesuai jadwal.",
  };
  return {
    prediction: "Anomaly", severity: "Medium",
    reason: "Deviasi parameter telemetri berada di luar batas kerapatan densitas klaster normal (DBSCAN Noise).",
    impact: "Ketidakstabilan transisi operasional atau potensi malfungsi sensor instrumen.",
    solution: "Pantau visualisasi tren grafik dalam 1 jam ke depan dan validasi silang data.",
  };
};

/* ================================================================
   MAIN COMPONENT: Monitoring
   ================================================================ */
export default function Monitoring() {
  const [allLogs, setAllLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [selectedPred, setSelectedPred] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [searchSegmentId, setSearchSegmentId] = useState("");

  // --- FITUR #2: DROPDOWN RIWAYAT EKSEKUSI ---
  const [historyList, setHistoryList] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null); // null = mode Live
  const [historyLoading, setHistoryLoading] = useState(false);

  // Buffer historis untuk sparkline per segment_id
  const historyBuffer = useRef(new Map());

  // ==================== FETCH HISTORY LIST (sekali saat mount) ====================
  const fetchHistoryList = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/algorithm_results`);
      const runs = data?.data || data || [];
      setHistoryList(runs);
    } catch (err) {
      console.warn("Gagal fetch history list:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchHistoryList();
  }, [fetchHistoryList]);

  // ==================== FETCH DATA UTAMA ====================
  const fetchLatestMonitoring = useCallback(async () => {
    const { data } = await axios.get(`${API_BASE}/monitoring`);
    return { responseData: data?.data || [], responseMeta: data?.meta || null };
  }, []);

  const fetchHistoryRunData = useCallback(async (runId) => {
    const { data } = await axios.get(`${API_BASE}/algorithm_results`);
    const runs = data?.data || data || [];
    const found = runs.find((r) => Number(r.id) === Number(runId));
    if (!found) throw new Error("Riwayat tidak ditemukan");
    return found;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      let responseData, responseMeta;

      if (selectedRunId === null) {
        // Mode Live — gunakan endpoint /api/monitoring (sudah ada insight)
        const result = await fetchLatestMonitoring();
        responseData = result.responseData;
        responseMeta = result.responseMeta;

        if (responseMeta) setMeta(responseMeta);

        const logs = responseData.map((item, idx) => {
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
            precision: run.precision_score,
            recall: run.recall_score,
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

        const logs = allItems.map((item, idx) => {
          const segId = item.segment_id || `seg-${idx}`;
          const insight = generateInsightLocal(item, item._type || "normal");
          return buildLogEntry(
            {
              ...item,
              prediction: insight.prediction,
              severity: insight.severity,
              insight: {
                reason: insight.reason,
                impact: insight.impact,
                solution: insight.solution,
              },
            },
            segId,
            idx,
            insight.severity
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
  }, [selectedRunId, fetchLatestMonitoring, fetchHistoryRunData]);

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

  // Trigger fetch setiap selectedRunId berubah (termasuk mount pertama)
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh HANYA untuk mode Live (selectedRunId === null)
  useEffect(() => {
    if (selectedRunId !== null) return;
    const iv = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [fetchData, selectedRunId]);

  const toggleExpandLog = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // ==================== FILTERING (MEMOIZED) ====================
  const filteredLogs = useMemo(() => {
    return allLogs.filter((l) => {
      // Filter prediction
      if (selectedPred !== "all" && l.prediction !== selectedPred) return false;
      // Filter severity
      if (selectedSeverity !== "all" && l.severityCategory !== selectedSeverity) return false;
      // Filter segment_id (instant search)
      if (
        searchSegmentId &&
        l.segment_id &&
        !String(l.segment_id).toLowerCase().includes(searchSegmentId.toLowerCase())
      )
        return false;
      return true;
    });
  }, [allLogs, selectedPred, selectedSeverity, searchSegmentId]);

  // ==================== STATISTIK (MEMOIZED) ====================
  const stats = useMemo(() => {
    const total = allLogs.length;
    const anomaly = allLogs.filter((l) => l.prediction !== "Normal").length;
    const normal = allLogs.filter((l) => l.prediction === "Normal").length;
    return { total, anomaly, normal };
  }, [allLogs]);

  // ==================== TREND ICON HELPER ====================
  const getTrendIcon = (sparkData, key) => {
    const arr = sparkData?.[key] || [];
    if (arr.length < 2) return <Minus size={10} className="text-slate-300" />;
    const first = arr[0];
    const last = arr[arr.length - 1];
    if (last > first * 1.02) return <TrendingUp size={10} className="text-red-500" />;
    if (last < first * 0.98) return <TrendingDownIcon size={10} className="text-emerald-500" />;
    return <Minus size={10} className="text-slate-400" />;
  };

  // ==================== EXPORT PDF (FITUR #3) ====================
  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // ---- Kop Surat ----
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

    // ---- Tabel ----
    const tableHead = [[
      "Waktu", "Segmen", "P (Bar)", "Q (m\u00B3/h)", "T (\u00B0C)", "N (RPM)", "Prediksi", "Severity"
    ]];

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

    // ---- Footer halaman ----
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
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-slate-600">
      <div className="max-w-[1600px] mx-auto space-y-3">

        {/* ================================================================
            I. HEADER + NORMALISASI BADGE (FITUR #1)
            ================================================================ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-base font-black text-slate-800 flex items-center gap-1.5">
              <Activity size={16} style={{ color: PRIMARY_COLOR }} />
              Monitoring System
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
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-slate-400">Algoritma:</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold border border-slate-200">
                      {meta.algorithm.toUpperCase()}
                    </span>
                    {/* FITUR #1: BADGE NORMALISASI */}
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

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPred}
              onChange={(e) => setSelectedPred(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs font-bold text-slate-600 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              {["Normal", "Leak", "Blockage", "Surge", "Degradation"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={fetchData}
              disabled={historyLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={historyLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ================================================================
            II. ALERT BANNER
            ================================================================ */}
        <AlertBanner logs={allLogs} />

        {/* ================================================================
            III. PANEL KONTROL: FILTER + DROPDOWN HISTORY (FITUR #2) + EXPORT PDF (FITUR #3)
            ================================================================ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

            {/* Quick Filter Cards */}
            <div className="flex-1">
              <QuickFilterCards
                selectedSeverity={selectedSeverity}
                onSeverityChange={setSelectedSeverity}
                searchSegmentId={searchSegmentId}
                onSearchChange={setSearchSegmentId}
                logs={allLogs}
              />
            </div>

            {/* Dropdown History + Export PDF */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* FITUR #2: Dropdown Pilih Riwayat Eksekusi */}
              <div className="relative">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <History size={12} className="text-slate-400" />
                  <select
                    value={selectedRunId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedRunId(val === "" ? null : Number(val));
                    }}
                    className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none min-w-[220px]"
                  >
                    <option value="">Live Data Terbaru</option>
                    {historyList.map((run) => (
                      <option key={run.id} value={run.id}>
                        [ID {run.id}] {run.algorithm?.toUpperCase() || "?"} + {getNormLabel(run.normalization)} - {formatDateTimeID(run.created_at)}
                      </option>
                    ))}
                  </select>
                  {historyLoading && <RefreshCw size={10} className="animate-spin text-slate-400" />}
                </div>
              </div>

              {/* FITUR #3: Tombol Export PDF */}
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <FileText size={13} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Indikator mode history */}
          {selectedRunId !== null && meta?.executed_at && (
            <p className="mt-2 text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              <History size={10} />
              Menampilkan data historis sesi #{selectedRunId} - {formatDateLong(meta.executed_at)}
              {" "}
              <button
                onClick={() => setSelectedRunId(null)}
                className="text-blue-600 hover:underline font-bold"
              >
                Kembali ke Live
              </button>
            </p>
          )}
        </div>

        {/* ================================================================
            IV. TABEL PREDIKSI UTAMA (DENGAN SPARKLINE — FITUR #1)
            ================================================================ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
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
                {filteredLogs.length === 0 ? (
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
                  filteredLogs.map((log) => {
                    const cfg = getCfg(log.prediction);
                    const isExpanded = expandedLogId === log.id;

                    return (
                      <React.Fragment key={log.id}>
                        {/* MAIN ROW */}
                        <tr
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isExpanded ? "bg-slate-50/40" : ""
                          } ${
                            log.severityCategory === "Critical"
                              ? "border-l-2 border-l-red-400"
                              : ""
                          }`}
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

                          {/* Pressure Sparkline + Value */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              {getTrendIcon(log.sparkData, "pressure")}
                              <SparklineChart
                                data={log.sparkData?.pressure || []}
                                color="#ef4444"
                                width={60}
                                height={22}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {fmt(log.pressure)}
                          </td>

                          {/* Flow Rate Sparkline + Value */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              {getTrendIcon(log.sparkData, "flow_rate")}
                              <SparklineChart
                                data={log.sparkData?.flow_rate || []}
                                color="#0891b2"
                                width={60}
                                height={22}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-cyan-700">
                            {fmt(log.flow_rate)}
                          </td>

                          {/* Temperature Sparkline + Value */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              {getTrendIcon(log.sparkData, "temperature")}
                              <SparklineChart
                                data={log.sparkData?.temperature || []}
                                color="#e11d48"
                                width={60}
                                height={22}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                            {fmt(log.temperature)}
                          </td>

                          {/* Pump Speed Sparkline + Value */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              {getTrendIcon(log.sparkData, "pump_speed")}
                              <SparklineChart
                                data={log.sparkData?.pump_speed || []}
                                color="#9333ea"
                                width={60}
                                height={22}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-purple-600">
                            {Math.round(log.pump_speed)}
                          </td>

                          {/* Prediction Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black rounded-full border ${cfg.badge}`}
                              >
                                <cfg.icon size={11} /> {log.prediction.toUpperCase()}
                              </span>
                              <span
                                className={`text-[9px] font-bold ${
                                  log.severity === "High"
                                    ? "text-red-500"
                                    : log.severity === "Medium"
                                      ? "text-amber-500"
                                      : "text-emerald-500"
                                }`}
                              >
                                {log.severity}
                              </span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleExpandLog(log.id)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 inline-flex items-center gap-1 shadow-sm ${cfg.btnClass}`}
                            >
                              Detail Analisis
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </td>
                        </tr>

                        {/* ================================================================
                            POP-UP INLINE DENGAN THRESHOLD GAUGE (FITUR #3)
                            ================================================================ */}
                        {isExpanded && (
                          <tr className="bg-slate-50/30">
                            <td colSpan={11} className="p-4 border-t border-b border-dashed border-gray-200">
                              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">

                                {/* — Bagian 1: Threshold Gauge (4 parameter) — */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Activity size={14} style={{ color: PRIMARY_COLOR }} />
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                      Indikator Ambang Batas Operasional (MAOP)
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <ThresholdGauge
                                      label="Pressure"
                                      value={log.pressure}
                                      min={THRESHOLDS.pressure.min}
                                      max={THRESHOLDS.pressure.max}
                                      unit={THRESHOLDS.pressure.unit}
                                      setpoints={[THRESHOLDS.pressure.safeMax, THRESHOLDS.pressure.warnMax]}
                                    />
                                    <ThresholdGauge
                                      label="Flow Rate"
                                      value={log.flow_rate}
                                      min={THRESHOLDS.flow_rate.min}
                                      max={THRESHOLDS.flow_rate.max}
                                      unit={THRESHOLDS.flow_rate.unit}
                                      setpoints={[THRESHOLDS.flow_rate.safeMax, THRESHOLDS.flow_rate.warnMax]}
                                    />
                                    <ThresholdGauge
                                      label="Temperature"
                                      value={log.temperature}
                                      min={THRESHOLDS.temperature.min}
                                      max={THRESHOLDS.temperature.max}
                                      unit={THRESHOLDS.temperature.unit}
                                      setpoints={[THRESHOLDS.temperature.safeMax, THRESHOLDS.temperature.warnMax]}
                                    />
                                    <ThresholdGauge
                                      label="Pump Speed"
                                      value={log.pump_speed}
                                      min={THRESHOLDS.pump_speed.min}
                                      max={THRESHOLDS.pump_speed.max}
                                      unit={THRESHOLDS.pump_speed.unit}
                                      setpoints={[THRESHOLDS.pump_speed.safeMax, THRESHOLDS.pump_speed.warnMax]}
                                    />
                                  </div>
                                </div>

                                {/* — Bagian 2: Aturan Logika Kondisi Matriks — */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={14} style={{ color: PRIMARY_COLOR }} />
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                      Korelasi Aturan Logika Matriks
                                    </span>
                                  </div>
                                  <p className="text-xs font-extrabold text-slate-800 mb-2">
                                    Hubungan Logika: <span className="italic">"{cfg.logicRelation}"</span>
                                  </p>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                    <div className="bg-white p-2 rounded border border-gray-100">
                                      Pressure (P): <span className={cfg.P.textClass}>{cfg.P.status}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-100">
                                      Flow (Q): <span className={cfg.Q.textClass}>{cfg.Q.status}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-100">
                                      Temp (T): <span className={cfg.T.textClass}>{cfg.T.status}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-100">
                                      Pump Speed (N): <span className={cfg.N.textClass}>{cfg.N.status}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* — Bagian 3: Deskripsi Insight Penyebab & Solusi — */}
                                {log.insight && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] leading-relaxed">
                                    <div className="p-2.5 bg-red-50/50 text-slate-700 rounded-lg border border-red-100">
                                      <strong className="text-red-700 block text-[10px] uppercase font-black mb-0.5">
                                        Penyebab Otomatis
                                      </strong>
                                      {log.insight.reason}
                                    </div>
                                    <div className="p-2.5 bg-amber-50/50 text-slate-700 rounded-lg border border-amber-100">
                                      <strong className="text-amber-700 block text-[10px] uppercase font-black mb-0.5">
                                        Dampak Sistem
                                      </strong>
                                      {log.insight.impact}
                                    </div>
                                    <div className="p-2.5 bg-emerald-50/50 text-slate-700 rounded-lg border border-emerald-100">
                                      <strong className="text-emerald-700 block text-[10px] uppercase font-black mb-0.5">
                                        Solusi Direkomendasikan
                                      </strong>
                                      {log.insight.solution}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================================================================
            V. FOOTER: METRIK AKURASI ALGORITMA (TAMBAHAN SKRIPSI)
            ================================================================ */}
        {meta?.metrics && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity size={12} style={{ color: PRIMARY_COLOR }} />
              Metrics Akurasi — {meta.algorithm?.toUpperCase() || "Algorithm"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Silhouette", val: meta.metrics.silhouette, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Davies-Bouldin", val: meta.metrics.davies_bouldin, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Accuracy", val: meta.metrics.accuracy, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Precision", val: meta.metrics.precision, color: "text-cyan-600", bg: "bg-cyan-50" },
                { label: "Recall", val: meta.metrics.recall, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "F1-Score", val: meta.metrics.f1_score, color: "text-amber-600", bg: "bg-amber-50" },
              ].map((m) => (
                <div
                  key={m.label}
                  className={`${m.bg} rounded-lg p-3 text-center border border-gray-100`}
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</p>
                  <p className={`text-base font-black ${m.color} tabular-nums`}>
                    {m.val != null ? Number(m.val).toFixed(4) : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}