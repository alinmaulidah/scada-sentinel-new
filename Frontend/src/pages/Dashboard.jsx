import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { HiArrowPath, HiTrash } from "react-icons/hi2";

const PRIMARY = "#336B87";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0); // State baru untuk menyimpan total sensor_logs riil
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  /* ================= FETCH ALL DATA ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Ambil hasil kalkulasi algoritma
      const resAlgo = await fetch("http://localhost:5000/api/algoritma/results");
      const jsonAlgo = await resAlgo.json();

      const formatted = jsonAlgo.map((d, i) => ({
        id: i + 1,
        algorithm: d.algorithm,
        normalization: d.normalization,
        anomaly: Number(d.anomaly || 0),
        score: d.silhouette,
      }));
      setData(formatted);

      // 2. Ambil statistik total data sensor_logs asli dari backend
      const resStats = await fetch("http://localhost:5000/api/dashboard/stats"); // Sesuaikan route API stats Anda
      if (resStats.ok) {
        const jsonStats = await resStats.json();
        setTotalLogs(jsonStats.totalLogs || 0); // Menyimpan jumlah riil (misal: 15)
      }

      generateAIInsight(formatted);
    } catch (err) {
      console.error("Gagal mengambil data sistem:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= AI ANALYSIS ================= */
  const generateAIInsight = (arr) => {
    if (!arr.length) return;

    const best = [...arr].sort((a, b) => b.score - a.score)[0];
    const anomalyCount = arr.reduce((a, b) => a + (b.anomaly || 0), 0);

    let insight = "";
    if (best.score > 0.4) {
      insight += "Model menunjukkan performa klasterisasi yang stabil dan solid. ";
    } else {
      insight += "Struktur klaster kurang stabil, disarankan tuning ulang parameter Epsilon atau MinPts. ";
    }

    if (anomalyCount > 0) {
      insight += `Terdeteksi sejumlah ${anomalyCount} titik anomali pada pipeline yang memerlukan perhatian teknis. `;
    } else {
      insight += "Kondisi aliran pipeline relatif bersih, tidak ada anomali signifikan. ";
    }

    insight += `Rekomendasi konfigurasi terbaik saat ini mengarah pada ${best.algorithm}.`;
    setAiInsight(insight);
  };

  /* ================= RESET DATABASE ================= */
  const handleReset = async () => {
    const confirm = window.confirm("Apakah Anda yakin ingin mereset semua hasil algoritma di database?");
    if (!confirm) return;

    try {
      await fetch("http://localhost:5000/api/algoritma/reset", {
        method: "DELETE",
      });
      setData([]);
      setTotalLogs(0);
      setAiInsight("");
    } catch (err) {
      console.error("Gagal mereset database:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sorted = [...data].sort((a, b) => b.score - a.score);
  const best = sorted[0];

  /* ================= LOGIKA GRAFIK DINAMIS ================= */
  // Titik Anomali (Merah): Mengambil nilai dari jumlah anomali yang ditemukan model
  const scatterDataAnomaly = data.map((d) => ({
    x: d.id,
    y: +(d.score * 100).toFixed(1),
    name: d.algorithm,
    value: d.anomaly
  })).filter(item => item.value > 0); // Hanya muncul jika ada anomali

  // Titik Normal (Hijau): Sisa data setelah dikurangi jumlah anomali (Total Logs - Anomali)
  const scatterDataNormal = data.map((d) => {
    const normalCount = Math.max(0, totalLogs - d.anomaly); // Misal: 15 - 1 = 14 titik normal
    return {
      x: d.id,
      y: +(d.score * 100).toFixed(1),
      name: d.algorithm,
      value: normalCount
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-8 px-4 md:px-8 text-gray-800 font-sans">
      <div className="w-full max-w-[1600px] mx-auto space-y-4">
        
        {/* ================= 4 KPI CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Best Model Optimal */}
          <div 
            style={{ backgroundColor: PRIMARY }} 
            className="p-5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="text-[11px] text-blue-100 font-bold tracking-wider uppercase opacity-90">
              Best Model Optimal
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {best ? best.algorithm : "-"}
            </div>
            <div className="text-[11px] text-white font-bold mt-2 bg-white/20 inline-block px-2.5 py-0.5 rounded backdrop-blur-sm">
              Score: {best ? (best.score * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* Card 2: Total Anomaly */}
          <div className="bg-white border border-gray-200/80 p-5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-[11px] text-gray-400 font-bold tracking-wider uppercase">
              Total Anomaly (Best Model)
            </div>
            <div className="text-2xl font-black text-red-500 mt-1">
              {best ? best.anomaly : 0}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Titik kritis terdeteksi</div>
          </div>

          {/* Card 3: Total Data Pipeline (SUDAH FIX DAN DINAMIS) */}
          <div className="bg-white border border-gray-200/80 p-5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-[11px] text-gray-400 font-bold tracking-wider uppercase">
              Total Data Pipeline
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1 font-mono">
              {loading ? "..." : totalLogs.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 font-medium mt-1">
              Counted from <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-slate-600 font-bold text-[10px]">sensor_logs</span>
            </div>
          </div>

          {/* Card 4: Total Run */}
          <div className="bg-white border border-gray-200/80 p-5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-[11px] text-gray-400 font-bold tracking-wider uppercase">
              Total Run Comparison
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1 font-mono">
              {data.length}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">Kali eksekusi pengujian model</div>
          </div>
        </div>

        {/* ================= MIDDLE GRID: VISUALISASI & RINGKASAN ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Visualisasi Deteksi Anomali */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">Visualisasi Deteksi Anomali</h2>
                <p className="text-xs text-gray-400 mt-0.5">Pemetaan perbandingan sebaran klaster normal vs anomali</p>
              </div>
              
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded border border-blue-100">
                  Algoritma: {best?.algorithm || "-"}
                </span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded border border-purple-100">
                  Normalisasi: {best?.normalization || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                <span className="text-gray-600">Titik Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                <span className="text-gray-600">Titik Anomali</span>
              </div>
            </div>

            <div className="h-[300px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 15, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" dataKey="x" name="ID Run" stroke="#9ca3af" fontSize={11} />
                  <YAxis type="number" dataKey="y" name="Silhouette Score" unit="%" stroke="#9ca3af" fontSize={11} />
                  <Tooltip 
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value, name) => {
                      if (name === "Silhouette Score") return [`${value}%`, name];
                      return [value, name];
                    }}
                  />
                  <Scatter name="Total Data Normal" data={scatterDataNormal} fill="#22c55e" dataKey="value" />
                  <Scatter name="Total Data Anomali" data={scatterDataAnomaly} fill="#ef4444" dataKey="value" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ringkasan Model Terbaik */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-1">Ringkasan Model Terbaik</h2>
              <p className="text-xs text-gray-400 pb-3 border-b border-gray-100">Konfigurasi parameter otomatis paling optimal</p>
              
              {best ? (
                <div className="mt-3 space-y-2.5">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Selected Algorithm</span>
                    <span className="text-sm font-bold text-gray-800">{best.algorithm}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Scaler Method</span>
                    <span className="text-sm font-bold text-gray-800">{best.normalization} Normalization</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Silhouette Score</span>
                      <span className="text-sm font-bold text-teal-600">{(best.score).toFixed(3)}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Anomalies Found</span>
                      <span className="text-sm font-bold text-red-500 font-mono">{best.anomaly} Pts</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic mt-3">Belum ada data eksekusi model.</p>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100/80 shadow-inner">
              <h3 className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: PRIMARY }}>
                ✨ AI Assistant Insight
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {aiInsight || "Menunggu kalkulasi matrik dari sistem..."}
              </p>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM AREA: TABEL PERBANDINGAN ================= */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-base font-bold text-gray-800">Tabel Hasil Perbandingan Algoritma Terbaik</h2>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold shadow-sm hover:bg-gray-50 hover:text-slate-900 transition-colors"
              >
                <HiArrowPath className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                {loading ? "Memuat..." : "Refresh Data"}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-bold border border-red-100 hover:bg-red-100 transition-colors"
              >
                <HiTrash className="w-4 h-4 text-red-500" />
                Reset Semua Hasil
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold">Nama Algoritma</th>
                  <th className="p-4 font-bold">Metode Normalisasi</th>
                  <th className="p-4 font-bold text-center">Jumlah Anomali</th>
                  <th className="p-4 font-bold text-right">Silhouette Score</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {sorted.length > 0 ? (
                  sorted.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                        {d.algorithm}
                        {i === 0 && (
                          <span className="text-[10px] bg-green-100 text-green-700 font-extrabold px-2 py-0.5 rounded-full">
                            BEST
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">{d.normalization}</td>
                      <td className="p-4 text-center font-bold text-red-500 font-mono">{d.anomaly}</td>
                      <td className="p-4 text-right font-black tracking-tight text-slate-700 font-mono">
                        {(d.score * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-400 italic">
                      Tidak ada data di database. Silakan jalankan model atau refresh halaman.
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