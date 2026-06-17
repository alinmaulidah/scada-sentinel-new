import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ZAxis,
} from "recharts";
import { 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  Database, 
  Activity, 
  Cpu, 
  HelpCircle, 
  ArrowRight, 
  FileText, 
  Settings, 
  LayoutDashboard,
  CheckCircle2,
  ShieldAlert,
  Info
} from "lucide-react";
import axios from "axios";

const PRIMARY_COLOR = "#336B87";
const API = "http://localhost:5000/api";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  
  // State Panduan Langkah (User-Friendly)
  const [activeStep, setActiveStep] = useState(1);
  const [showGuide, setShowGuide] = useState(true);

  /* ================= FETCH DATA & STATS ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      const resAlgo = await axios.get(`${API}/algoritma/results`);
      const jsonAlgo = resAlgo.data || [];

      const formatted = jsonAlgo.map((d, i) => ({
        id: i + 1,
        algorithm: d.algorithm,
        normalization: d.normalization,
        anomaly: Number(d.anomaly || 0),
        score: d.silhouette,
      }));
      setData(formatted);

      const resScada = await axios.get(`${API}/scada-data?page=1&limit=1`);
      if (resScada.data) {
        setTotalLogs(resScada.data.totalRecords || 0);
      }

      generateAIInsight(formatted);
    } catch (err) {
      console.error("Gagal menyelaraskan data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DYNAMIC AI ANALYSIS SYSTEM ================= */
  const generateAIInsight = (arr) => {
    if (!arr.length) {
      setAiInsight("Belum ada data pengujian algoritma di dalam matriks database.");
      return;
    }
    
    // Ambil model terbaik berdasarkan Silhouette Score tertinggi
    const bestModel = [...arr].sort((a, b) => b.score - a.score)[0];
    const isKmeans = bestModel.algorithm.toLowerCase().includes("k-means") || bestModel.algorithm.toLowerCase().includes("kmeans");
    const anomalyCount = bestModel.anomaly;

    let textInsight = `Evaluasi model terbaik menetapkan ${bestModel.algorithm} dengan standardisasi ${bestModel.normalization}. `;

    // Evaluasi Kedekatan Jarak Klaster Secara Akademis
    if (bestModel.score >= 0.5) {
      textInsight += "Struktur klasterisasi dinilai solid, valid, dan memiliki pemisahan jarak antar-klaster yang kuat (Substantial Structure). ";
    } else if (bestModel.score >= 0.25) {
      textInsight += "Struktur klaster tergolong lemah (Weak Structure). Diperlukan evaluasi fitur kausalitas data sensor kembali. ";
    } else {
      textInsight += "Kerapatan jarak rendah (No Substantial Structure). Disarankan untuk melakukan tuning ulang hyperparameter model. ";
    }

    // Deteksi Causal Analysis Berdasarkan Metode Algoritma Terpilih
    if (anomalyCount > 0) {
      if (isKmeans) {
        textInsight += `Sistem mendeteksi ${anomalyCount} data pencilan (outliers) berdasarkan jarak Euclidean terjauh dari centroid klaster utama. Periksa potensi penyimpangan drastis pada parameter Pressure atau Flow Rate.`;
      } else {
        textInsight += `Sistem mengisolasi ${anomalyCount} titik data sebagai anomali (noise) berdasarkan pemetaan densitas kerapatan rendah lingkungan. Segera investigasi log operasional sensor terkait.`;
      }
    } else {
      textInsight += "Seluruh parameter log operasional berada di dalam radius klaster aman (Safe State/Kondisi Normal).";
    }

    setAiInsight(textInsight);
  };

  const handleReset = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mereset seluruh riwayat matriks perbandingan algoritma?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API}/algoritma/reset`);
      setData([]);
      setAiInsight("");
    } catch (err) {
      console.error("Gagal mereset data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sorted = [...data].sort((a, b) => b.score - a.score);
  const best = sorted[0];

  /* ================= OPTIMIZED SCATTER PLOT DATA CORRELATION ================= */
  // Memetakan performa sebaran perbandingan: Sumbu X (Jumlah Anomali), Sumbu Y (Silhouette Score)
  const scatterPlotData = data.map((d) => ({
    x: d.anomaly,
    y: +(d.score * 100).toFixed(1),
    algo: d.algorithm,
    scaler: d.normalization,
  }));

  // Pembagian Status Tingkat Bahaya Anomali secara Visual Dinamis
  const getAnomalyStatusColor = (count) => {
    if (!count || count === 0) return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", label: "SAFE OPERATIONAL" };
    if (count <= 5) return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", label: "WARNING / POTENTIAL FAULT" };
    return { bg: "bg-red-50", text: "text-red-500", border: "border-red-100", label: "CRITICAL ANOMALY DETECTED" };
  };

  const currentStatus = getAnomalyStatusColor(best?.anomaly);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans text-slate-600 antialiased">
      <div className="max-w-[1600px] mx-auto space-y-5">
        
        {/* ================= PANEL PANDUAN INTERAKTIF (SENTINEL GUIDE) ================= */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <HelpCircle size={18} style={{ color: PRIMARY_COLOR }} />
              <h2 className="text-xs font-black text-slate-800 tracking-wide uppercase">Alur Pemrosesan Komparasi Sistem & Audit Pipeline</h2>
            </div>
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 font-bold transition-all shadow-2xs w-full sm:w-auto text-slate-700"
            >
              {showGuide ? "Sembunyikan Panduan" : "Tampilkan Panduan Pengujian"}
            </button>
          </div>

          {showGuide && (
            <div className="p-4 md:p-5 grid grid-cols-1 lg:grid-cols-4 gap-5">
              
              {/* Menu Navigasi Langkah Kontrol */}
              <div className="flex flex-row lg:flex-col gap-1.5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-3 lg:pb-0 lg:pr-4 overflow-x-auto">
                {[
                  { step: 1, label: "1. Data Management", icon: <Database size={13} /> },
                  { step: 2, label: "2. Eksekusi Algoritma", icon: <Settings size={13} /> },
                  { step: 3, label: "3. Monitoring & Report", icon: <FileText size={13} /> },
                  { step: 4, label: "4. Rangkuman Dashboard", icon: <LayoutDashboard size={13} /> },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(s.step)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left whitespace-nowrap w-full ${
                      activeStep === s.step
                        ? "bg-slate-800 text-white shadow-md shadow-slate-800/10"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100/80"
                    }`}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Konten Utama Berdasarkan Langkah */}
              <div className="lg:col-span-3 min-h-[160px] flex flex-col justify-between">
                <div>
                  {/* LANGKAH 1 */}
                  {activeStep === 1 && (
                    <div className="space-y-3 animate-fadeIn">
                      <span className="text-[9px] bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border border-blue-100">Tahap Ingesti</span>
                      <h3 className="text-xs font-bold text-slate-800">Unggah Dataset Sensor SCADA (Kaggle Dataset)</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Lakukan impor berkas log operasional berformat <b>.csv</b> or <b>.xlsx</b> pada menu manajemen data. Sistem membaca relasi multivariat yang terdiri dari data kontinu (sensor fisik), status mekanis alat, hingga log historis indikator kejadian:
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 pt-1">
                        {[
                          "timestamp", "segment_id", "pressure", "flow_rate", 
                          "temperature", "valve_status", "pump_state", "pump_speed", 
                          "compressor_state", "energy_consumption", "alarm_triggered", "event_type", "target"
                        ].map((v, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200/60 px-2 py-1 rounded text-[10px] font-mono text-slate-700 flex items-center gap-1.5">
                            <span className="text-slate-400 font-sans text-[9px] font-bold">#{idx+1}</span> {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LANGKAH 2 */}
                  {activeStep === 2 && (
                    <div className="space-y-3 animate-fadeIn">
                      <span className="text-[9px] bg-purple-50 text-purple-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border border-purple-100">Tahap Modeling</span>
                      <h3 className="text-xs font-bold text-slate-800">Komparasi Metode Pengelompokan Klaster</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Sistem melakukan ekstraksi matematis pada 4 kluster parameter fisis utama. Matriks ini ditransformasi menggunakan normalisasi skala jarak sebelum diproses ke dalam model <b>K-Means Clustering</b> (berbasis *Centroid Distance*) atau <b>DBSCAN</b> (berbasis *Density Neighborhood*):
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {["pressure (tekanan)", "flow_rate (debit)", "temperature (suhu)", "pump_speed (RPM)"].map((v) => (
                          <span key={v} className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] px-2.5 py-1 rounded border border-slate-200 flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-slate-500" /> {v}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium italic flex items-center gap-1">
                        <Info size={12} /> *Keempat matriks di atas merupakan variabel kausal fisik penentu jenis gangguan utama (Surge, Leak, Blockage, Degradation).
                      </p>
                    </div>
                  )}

                  {/* LANGKAH 3 */}
                  {activeStep === 3 && (
                    <div className="space-y-3 animate-fadeIn">
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-100">Tahap Audit</span>
                      <h3 className="text-xs font-bold text-slate-800">Isolasi Tabular & Eksportasi Dokumen Cetak</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Melalui menu <b>Monitoring & Report</b>, validator/operator dapat melacak letak indeks baris data anomali secara presisi. Record tersebut dapat diisolasi berdasarkan klaster deviasinya dan diunduh langsung menjadi berkas laporan laporan fisik **PDF Cetak** untuk kebutuhan dokumentasi lapangan.
                      </p>
                    </div>
                  )}

                  {/* LANGKAH 4 */}
                  {activeStep === 4 && (
                    <div className="space-y-3 animate-fadeIn">
                      <span className="text-[9px] bg-orange-50 text-orange-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border border-orange-100">Tahap Rekapitulasi</span>
                      <h3 className="text-xs font-bold text-slate-800">Penetapan Konfigurasi Model Terbaik di Dashboard</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Halaman ini secara otomatis menyeleksi hasil kalkulasi dengan **Silhouette Score tertinggi** sebagai acuan utama. Hasil keputusan ini disalurkan ke dalam grafik sebaran serta modul **AI Advisor** untuk melahirkan saran teknis preventif yang objektif.
                      </p>
                    </div>
                  )}
                </div>

                {/* Tombol Navigasi Footer Langkah */}
                <div className="flex justify-end pt-3 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => setActiveStep(activeStep < 4 ? activeStep + 1 : 1)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 shadow-2xs transition-all"
                  >
                    {activeStep === 4 ? "Ulangi Alur" : "Langkah Selanjutnya"}
                    <ArrowRight size={12} />
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* ================= KPI METRICS CARDS AREA ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div style={{ backgroundColor: PRIMARY_COLOR }} className="p-4 rounded-xl text-white shadow-2xs flex flex-col justify-between min-h-[105px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100">Best Model Selected</span>
              <Cpu size={16} className="opacity-75" />
            </div>
            <div className="text-xl font-black tracking-tight mt-1 truncate">
              {best ? best.algorithm : "N/A"}
            </div>
            <div className="text-[10px] bg-white/20 font-bold px-2 py-0.5 rounded w-max mt-1">
              SC-Score: {best ? (best.score * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between min-h-[105px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Anomalies</span>
              <AlertTriangle size={16} className={best?.anomaly > 0 ? "text-red-500" : "text-slate-300"} />
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${best?.anomaly > 0 ? "text-red-500" : "text-slate-800"}`}>
              {best ? best.anomaly.toLocaleString() : 0} <span className="text-xs text-slate-400 font-sans font-medium">Pts</span>
            </div>
            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-max border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
              {currentStatus.label}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between min-h-[105px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dataset Volume</span>
              <Database size={16} style={{ color: PRIMARY_COLOR }} />
            </div>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1">
              {loading ? "..." : totalLogs.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-medium">Rows</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded w-max">
              Continuous SCADA Logging
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between min-h-[105px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experiment Iteration</span>
              <Activity size={16} className="text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-slate-700 font-mono mt-1">
              {data.length} <span className="text-xs text-slate-400 font-sans font-medium">Times</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Matriks Komparasi Database</div>
          </div>
        </div>

        {/* ================= MIDDLE VISUALIZATION GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Grafik Scatter Plot Komparasi Eksperimen */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-black text-slate-800">Visualisasi Sebaran Efisiensi Model</h2>
                <p className="text-[11px] text-slate-400 font-medium">Pemetaan hubungan koordinat jumlah deteksi anomali terhadap akurasi skor validitas</p>
              </div>
              {best && (
                <div className="flex gap-1.5 text-[10px] font-bold">
                  <span className="px-2 py-0.5 bg-slate-800 text-white rounded shadow-2xs">{best.algorithm}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">{best.normalization} Scaling</span>
                </div>
              )}
            </div>

            <div className="h-[280px] w-full text-xs font-mono">
              {scatterPlotData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 15, right: 20, bottom: 10, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Anomali Terdeteksi" stroke="#94a3b8" label={{ value: 'Jumlah Titik Anomali (Pts)', position: 'insideBottom', offset: -5, fontClassName: 'font-sans' }} />
                    <YAxis type="number" dataKey="y" name="Silhouette Score" unit="%" stroke="#94a3b8" domain={[0, 100]} />
                    <ZAxis type="category" dataKey="algo" name="Algoritma" />
                    <Tooltip 
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-lg text-xs font-sans space-y-1 shadow-md border border-slate-800">
                              <p className="font-bold text-blue-400 border-b border-slate-800 pb-1 mb-1">{p.algo}</p>
                              <p><span className="text-slate-400">Scaling:</span> {p.scaler}</p>
                              <p><span className="text-slate-400">Anomali:</span> <span className="font-mono text-red-400 font-bold">{p.x} Pts</span></p>
                              <p><span className="text-slate-400">Silhouette:</span> <span className="font-mono text-emerald-400 font-bold">{p.y}%</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Konfigurasi Eksperimen" data={scatterPlotData} fill={PRIMARY_COLOR} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 italic font-sans">
                  Menunggu eksekusi komparasi algoritma untuk memetakan koordinat...
                </div>
              )}
            </div>
          </div>

          {/* Rangkuman Konfigurasi Terbaik & AI Advisor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-sm font-black text-slate-800">Summary Pemodelan Terbaik</h2>
              <p className="text-[11px] text-slate-400 font-medium pb-2 border-b border-slate-100">Kalkulasi hyperparameter otomatis paling optimal</p>
              
              {best ? (
                <div className="mt-3 space-y-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-xs">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Selected Algorithm</span>
                    <span className="font-bold text-slate-800">{best.algorithm}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-xs">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Prapemrosesan Fitur</span>
                    <span className="font-bold text-slate-700">{best.normalization} Normalization</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Silhouette Score</span>
                      <span className="font-black text-blue-600 font-mono text-sm">{(best.score).toFixed(3)}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Outliers/Noise</span>
                      <span className={`font-black font-mono text-sm ${best.anomaly > 0 ? "text-red-500" : "text-slate-700"}`}>{best.anomaly} Pts</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic mt-4">Belum ada riwayat komparasi yang terekam di sistem database.</p>
              )}
            </div>

            <div className={`p-3.5 rounded-xl border ${best?.anomaly > 0 ? "bg-red-50/40 border-red-100" : "bg-slate-50 border-slate-200/80"}`}>
              <h3 style={{ color: PRIMARY_COLOR }} className="text-[10px] font-black uppercase tracking-wider mb-1.5 flex items-center gap-1">
                {best?.anomaly > 0 ? <ShieldAlert size={12} className="text-red-500" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
                ⚡ Sentinel AI Advisor
              </h3>
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                {aiInsight || "Menunggu kalkulasi evaluasi matriks algoritma untuk menyusun rekomendasi..."}
              </p>
            </div>
          </div>

        </div>

        {/* ================= BOTTOM AREA: COMPARISON MATRIX TABLE ================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-800">Matriks Perbandingan Algoritma</h2>
              <p className="text-[11px] text-slate-400 font-medium">Urutan performa seluruh konfigurasi model berdasarkan kriteria Silhouette Score tertinggi</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs text-slate-700"
              >
                <RefreshCw size={13} className={loading ? "animate-spin text-slate-400" : "text-slate-500"} />
                Sinkronkan Matrix
              </button>
              <button
                onClick={handleReset}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100/70 transition-colors"
              >
                <Trash2 size={13} />
                Wipe History
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="p-4 pl-5">Algoritma & Model Setup</th>
                  <th className="p-4">Normalisasi Fitur</th>
                  <th className="p-4 text-center">Deteksi Anomali / Outliers</th>
                  <th className="p-4 text-right pr-5">Silhouette Validation Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {sorted.length > 0 ? (
                  sorted.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-5 font-bold text-slate-800 flex items-center gap-2">
                        {d.algorithm}
                        {i === 0 && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                            OPTIMAL CONFIG
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 font-mono">{d.normalization}</td>
                      <td className="p-4 text-center font-bold text-red-500 font-mono">{d.anomaly} Pts</td>
                      <td className="p-4 text-right pr-5 font-black text-slate-800 font-mono text-xs">
                        {(d.score).toFixed(3)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-400 italic font-sans bg-slate-50/30">
                      Matriks pengujian kosong. Silakan jalankan simulasi model pada menu Eksekusi Algoritma terlebih dahulu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}