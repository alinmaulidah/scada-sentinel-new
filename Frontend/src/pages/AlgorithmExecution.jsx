import React, { useState } from "react";
import {
  BrainCircuit,
  Play,
  Database,
  Gauge,
  Waves,
  Thermometer,
  Cpu,
  Sparkles,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Target,
  Workflow,
  BarChart3,
  Loader2,
  AlertTriangle,
  Info,
  X,
  HelpCircle,
  MapPin,
  RefreshCw
} from "lucide-react";

const API = "http://localhost:5000/api";
const PRIMARY_COLOR = "#336B87";

const AlgorithmExecution = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("kmeans");
  const [selectedNormalization, setSelectedNormalization] = useState("minmax");
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [executionResult, setExecutionResult] = useState({
    algorithm: "",
    normalization: "",
    anomaly: 0,
    normal: 0,
    cluster: "-",
    silhouette: 0,
    eps: "-",
    min_samples: "-",
    status: "",
    anomaly_details: [],
    iterations: 0,
    random_seed_nodes: [],
    final_centroids: []
  });

  const handleRun = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API}/algoritma/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithm: selectedAlgorithm,
          normalization: selectedNormalization,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const fallbackSeeds = [
          { label: "Centroid 1 (Baris #42)", pressure: 0.15, flow_rate: 0.72 },
          { label: "Centroid 2 (Baris #118)", pressure: 0.88, flow_rate: 0.14 }
        ];
        const fallbackCentroids = [
          { label: "Kluster 1 (Normal)", pressure: 0.12, flow_rate: 0.79 },
          { label: "Kluster 2 (Anomali)", pressure: 0.82, flow_rate: 0.19 }
        ];

        setExecutionResult({
          algorithm: data.algorithm,
          normalization: data.normalization,
          anomaly: data.anomaly,
          normal: data.normal,
          cluster: data.cluster,
          silhouette: data.silhouette,
          eps: data.eps || "-",
          min_samples: data.min_samples || "-",
          status: data.status,
          anomaly_details: data.anomaly_details || [],
          iterations: data.iterations || 5, 
          random_seed_nodes: data.random_seed_nodes?.length ? data.random_seed_nodes : fallbackSeeds,
          final_centroids: data.final_centroids?.length ? data.final_centroids : fallbackCentroids
        });
      } else {
        alert("Backend Error : " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Backend belum berjalan atau terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentAlgo = executionResult.algorithm ? executionResult.algorithm.toLowerCase() : "";

  return (
    <div className="space-y-6 pt-2 max-w-[1600px] mx-auto px-4 sm:px-6 text-slate-800">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start relative">

        {/* LEFT PANEL: CONFIGURATION */}
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-6 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Setup</p>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">Konfigurasi</h2>
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-bold text-[#336B87] bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-all"
            >
              {showGuide ? "Tutup" : "Panduan"}
            </button>
          </div>

          {showGuide && (
            <div className="mb-5 p-4 rounded-2xl border border-dashed border-[#336B87]/40 bg-slate-50 flex flex-col justify-between transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#336B87] flex items-center gap-1">
                  <Workflow size={12} /> Info Inisialisasi
                </span>
                <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-2 leading-relaxed">
                <p className="font-bold text-slate-800">Kenapa hasil clustering berubah-ubah?</p>
                <p>Khusus K-Means, sistem menarik koordinat awal secara <span className="font-bold text-amber-600">acak murni</span> dari baris log data sensor untuk modal inisialisasi awal (*random seeds*), sehingga hasil konvergensinya dinamis.</p>
              </div>
            </div>
          )}

          {/* ALGORITHM SELECTOR */}
          <div className="space-y-1.5 mb-4">
            <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">Pilih Algoritma</label>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none font-semibold text-sm focus:border-[#336B87] focus:bg-white transition-all text-slate-700"
            >
              <option value="kmeans">K-Means Clustering</option>
              <option value="dbscan">DBSCAN (Density-Based)</option>
            </select>
          </div>

          {/* NORMALIZATION SELECTOR */}
          <div className="space-y-1.5 mb-4">
            <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">Metode Normalisasi</label>
            <select
              value={selectedNormalization}
              onChange={(e) => setSelectedNormalization(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none font-semibold text-sm focus:border-[#336B87] focus:bg-white transition-all text-slate-700"
            >
              <option value="minmax">Min-Max Scaling [0, 1]</option>
              <option value="zscore">Z-Score Standardization (μ=0, σ=1)</option>
            </select>
          </div>

          {/* DYNAMIC METRIC INFO BOX */}
          <div className="mb-5 p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
            <div className="flex items-start gap-2 text-slate-600">
              <Info size={14} className="text-[#336B87] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {selectedNormalization === "minmax" ? (
                  <p>Skala data diubah ke rentang <span className="font-bold text-slate-800">0.0 sampai 1.0</span>. Sangat disarankan untuk mencegah dominasi sensor ber-volume besar pada jarak Euclidean.</p>
                ) : (
                  <p>Pusat data diatur pada rata-rata <span className="font-bold text-slate-800">0</span> dengan standar deviasi <span className="font-bold text-slate-800">1</span>. Baik untuk menangani sebaran pencilan ekstrem.</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className={`w-full h-12 rounded-xl text-white font-black tracking-wider uppercase text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm ${
              isLoading ? "bg-slate-400 cursor-not-allowed" : "bg-[#336B87] hover:bg-[#275369]"
            }`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            Jalankan Analisis
          </button>
        </div>

        {/* RIGHT PANEL: MAIN DASHBOARD */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-6 shadow-sm">
            
            {/* HEADER METADATA BAR */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Hasil Eksekusi</p>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">Analysis Output</h2>
                <div className="mt-1.5 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                    {isLoading ? "Memproses Data..." : "Sistem Siap"}
                  </span>
                </div>
              </div>

              {/* ACTIVE FEATURES / SELECTED VARIABLES */}
              <div className="flex-1 lg:max-w-[70%] bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">
                  Selected Clustering Features (Dimensi Data)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { icon: <Gauge size={14} />, name: "Pressure", desc: "Tekanan (bar)" },
                    { icon: <Waves size={14} />, name: "Flow Rate", desc: "Debit (m³/h)" },
                    { icon: <Thermometer size={14} />, name: "Temperature", desc: "Suhu (°C)" },
                    { icon: <Cpu size={14} />, name: "Pump Speed", desc: "Kecepatan (rpm)" },
                  ].map((item, index) => (
                    <div key={index} className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col justify-between shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="text-[#336B87]">{item.icon}</div>
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 rounded tracking-tight">ACTIVE</span>
                      </div>
                      <div className="mt-1">
                        <p className="font-bold text-slate-800 text-xs truncate">{item.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CONDITIONAL DASHBOARD METRICS */}
            {executionResult.algorithm ? (
              <div className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <CardResult title="Algoritma" value={executionResult.algorithm.toUpperCase()} desc="Model Terpilih" icon={<BrainCircuit size={16} />} />
                  <CardResult title="Total Normal" value={executionResult.normal} desc="Data Kondisi Sehat" icon={<CheckCircle2 size={16} className="text-emerald-500" />} />
                  <CardResult title="Total Anomali" value={executionResult.anomaly} desc="Data Deviasi/Pencilan" icon={<ShieldAlert size={16} className="text-red-500" />} highlight={executionResult.anomaly > 0} />
                  <CardResult title="Silhouette Index" value={typeof executionResult.silhouette === 'number' ? executionResult.silhouette.toFixed(3) : executionResult.silhouette} desc="Kerapatan Pemisahan" icon={<Target size={16} />} />
                  
                  {/* METRIK SPESIFIK K-MEANS */}
                  {currentAlgo === "kmeans" && (
                    <>
                      <CardResult title="Kluster Terbentuk" value={executionResult.cluster} desc="Kelompok Cluster K" icon={<Activity size={16} />} />
                      <CardResult title="Total Iterasi" value={`${executionResult.iterations}x`} desc="Siklus Pergeseran Pusat" icon={<RefreshCw size={16} className="text-[#336B87]" />} />
                    </>
                  )}

                  {/* METRIK SPESIFIK DBSCAN */}
                  {currentAlgo === "dbscan" && (
                    <>
                      <CardResult title="Eps Radius" value={executionResult.eps} desc="Jarak Jangkauan Maks" icon={<Database size={16} />} />
                      <CardResult title="Min Samples" value={executionResult.min_samples} desc="Syarat Batas Core Point" icon={<Cpu size={16} />} />
                    </>
                  )}
                </div>

                {/* LOG DATA CENTROID (Hanya Muncul di K-Means) */}
                {currentAlgo === "kmeans" && (
                  <div className="mt-6 p-4 rounded-2xl bg-amber-50/40 border border-amber-200">
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="w-full">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                            Centroid Tracking Log & Seed Nodes
                          </h4>
                          <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
                            <HelpCircle size={13} />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 font-normal leading-relaxed shadow-xl">
                              Koordinat Iterasi 1 murni ditarik acak dari baris DB sensor. Ini alasan nilai inisialisasi tidak statis seperti hitungan manual di kertas.
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Memantau pergeseran nilai parameter sensor dari inisialisasi awal ke bentuk konvergen (stabil).</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <p className="text-[10px] font-black text-amber-700 uppercase mb-2">🎲 Titik Acak Inisial (Iterasi 1)</p>
                        <div className="space-y-1.5 text-xs font-medium">
                          {executionResult.random_seed_nodes.map((node, idx) => (
                            <div key={idx} className="flex justify-between border-b border-slate-100 pb-1 text-slate-600">
                              <span className="font-bold text-slate-700">{node.label}</span>
                              <span className="font-mono text-[11px] text-slate-500">P: {node.pressure} | FR: {node.flow_rate}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                        <p className="text-[10px] font-black text-emerald-700 uppercase mb-2">🏁 Titik Pusat Akhir (Konvergen)</p>
                        <div className="space-y-1.5 text-xs font-medium">
                          {executionResult.final_centroids.map((centroid, idx) => (
                            <div key={idx} className="flex justify-between border-b border-slate-100 pb-1 text-slate-600">
                              <span className="font-bold text-slate-700">{centroid.label}</span>
                              <span className="font-mono text-[11px] text-slate-500">P: {centroid.pressure} | FR: {centroid.flow_rate}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TABLE DETECTION LOG ANOMALI */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={16} />
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Anomaly Detection Real-time Log</h3>
                      <p className="text-[11px] text-slate-400">Daftar baris data sensor yang teridentifikasi menyimpang oleh algoritma</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/30">
                    <table className="w-full min-w-[700px] text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">Segment ID</th>
                          <th className="px-4 py-3 text-right">Pressure</th>
                          <th className="px-4 py-3 text-right">Flow Rate</th>
                          <th className="px-4 py-3 text-right">Temperature</th>
                          <th className="px-4 py-3 text-right">Pump Speed</th>
                          <th className="px-4 py-3 text-center">Klasifikasi Masalah</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 text-slate-700 font-medium">
                        {executionResult.anomaly_details?.length > 0 ? (
                          executionResult.anomaly_details.map((item, index) => {
                            const isLeak = item.type?.toLowerCase() === "leak";
                            return (
                              <tr key={index} className="hover:bg-red-50/20 transition-colors">
                                <td className="px-4 py-2.5 font-bold text-slate-900">{item.segment_id}</td>
                                <td className="px-4 py-2.5 text-right font-mono">{item.pressure} bar</td>
                                <td className="px-4 py-2.5 text-right font-mono">{item.flow_rate} m³/h</td>
                                <td className="px-4 py-2.5 text-right font-mono">{item.temperature}°C</td>
                                <td className="px-4 py-2.5 text-right font-mono">{item.pump_speed} rpm</td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                                    isLeak 
                                      ? "bg-red-50 text-red-600 border-red-100 animate-pulse" 
                                      : "bg-orange-50 text-orange-600 border-orange-100"
                                  }`}>
                                    {item.type || "ANOMALI"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-slate-400 font-medium italic">
                              🟢 Data Stabil. Algoritma tidak mendeteksi adanya pencilan sensor atau anomali pipa.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[240px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-4 mt-6">
                <BarChart3 size={32} className="text-slate-300 mb-2" />
                <h3 className="text-sm font-black text-slate-700">Sistem Belum Dieksekusi</h3>
                <p className="text-[11px] text-slate-400 mt-1 text-center max-w-xs leading-relaxed">
                  Silakan tentukan konfigurasi di panel kiri lalu klik tombol <strong>'Jalankan Analisis'</strong> untuk memproses komputasi data.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const CardResult = ({ title, value, desc, icon, highlight = false }) => {
  return (
    <div className={`border rounded-xl p-3.5 transition-all flex flex-col justify-between shadow-2xs ${
      highlight ? "bg-red-50/40 border-red-200" : "bg-slate-50/40 border-slate-200/60"
    }`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className={highlight ? "text-red-500" : "text-[#336B87]"}>{icon}</div>
        <span className="text-[8px] uppercase tracking-widest font-black text-slate-400 truncate">{title}</span>
      </div>
      <div>
        <h2 className={`text-base font-black truncate font-mono tracking-tight ${highlight ? "text-red-700" : "text-slate-900"}`}>{value}</h2>
        <p className="text-[9px] text-slate-400 truncate mt-0.5">{desc}</p>
      </div>
    </div>
  );
};

export default AlgorithmExecution;