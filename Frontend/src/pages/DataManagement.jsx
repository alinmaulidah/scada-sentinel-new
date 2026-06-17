import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Upload, Database, Search, ChevronLeft, ChevronRight, Trash2, AlertTriangle, CheckCircle } from "lucide-react";

const API = "http://localhost:5000/api";
const PRIMARY_COLOR = "#336B87"; 

const DataManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/scada-data?page=${page}&limit=10&search=${search}`);
      setData(res.data.results || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.totalRecords || 0);
    } catch (err) { 
      console.error("Gagal mengambil data SCADA:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchData, 300);
    return () => clearTimeout(delay);
  }, [page, search]);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        await axios.post(`${API}/import-scada`, { data: json });
        alert("Data master SCADA berhasil diimport ke database!");
        setPage(1);
        fetchData();
      } catch (err) {
        console.error("Gagal mengimpor data:", err);
        alert("Terjadi kesalahan saat mengimpor data. Periksa format kolom Excel Anda.");
      } finally {
        setLoading(false);
        e.target.value = ""; // Reset input file
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleWipeDatabase = async () => {
    if (!window.confirm("PERINGATAN AKADEMIS: Apakah Anda yakin ingin menghapus SELURUH log data sensor di database? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      setLoading(true);
      await axios.delete(`${API}/clear-sensor-logs`);
      setPage(1);
      setData([]);
      setTotalRecords(0);
      setTotalPages(1);
      alert("Database berhasil dikosongkan.");
    } catch (err) {
      console.error("Gagal mengosongkan database:", err);
      alert("Gagal membersihkan database.");
    } finally {
      setLoading(false);
    }
  };

  // Helper fungsi untuk menjaga aplikasi tidak crash jika data null/undefined
  const formatNum = (val, decimal = 2) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "0.00";
    return Number(val).toFixed(decimal);
  };

  // Helper pewarnaan dinamis berdasarkan tipe event (Sangat Bagus untuk Demo Sidang!)
  const getEventBadgeClass = (eventType) => {
    const type = eventType ? eventType.toLowerCase() : "normal";
    switch(type) {
      case "normal":
        return "bg-slate-50 text-slate-400 border-slate-100";
      case "surge":
        return "bg-cyan-50 text-cyan-600 border-cyan-100";
      case "leak":
        return "bg-red-50 text-red-600 border-red-100 font-bold animate-pulse";
      case "blockage":
        return "bg-orange-50 text-orange-600 border-orange-100 font-bold";
      case "degradation":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-gray-50 text-gray-500 border-gray-100";
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen font-sans text-slate-600">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* HEADER AREA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div style={{ backgroundColor: PRIMARY_COLOR }} className="p-2.5 rounded-xl text-white shadow-sm">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800">SCADA Pipelines Master Data</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                Total Records In Database: <span className="text-slate-700 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{totalRecords.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* ACTIONS AREA */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                className="w-full sm:w-72 bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-slate-300 transition-all text-xs font-medium" 
                placeholder="Cari Segment ID atau Tipe Event (e.g. Leak)..." 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              />
            </div>
            
            <label 
              style={{ backgroundColor: PRIMARY_COLOR }} 
              className="hover:opacity-90 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Upload size={14} /> IMPORT DATA
              <input type="file" hidden accept=".xlsx, .xls, .csv" onChange={handleImport} disabled={loading} />
            </label>

            <button 
              onClick={handleWipeDatabase} 
              disabled={loading}
              className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-30"
              title="Kosongkan Semua Log Database"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* FULL 13-VARIABLE TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed min-w-[1300px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="p-3.5 text-center w-14">No</th>
                  <th className="p-3.5 w-40">Timestamp</th>
                  <th className="p-3.5 w-20 text-center">Seg ID</th>
                  <th className="p-3.5 w-24 text-right">Pressure</th>
                  <th className="p-3.5 w-24 text-right">Flow Rate</th>
                  <th className="p-3.5 w-20 text-right">Temp</th>
                  <th className="p-3.5 w-20 text-center">Valve</th>
                  <th className="p-3.5 w-20 text-center">Pump State</th>
                  <th className="p-3.5 w-24 text-right">Pump Speed</th>
                  <th className="p-3.5 w-20 text-center">Compressor</th>
                  <th className="p-3.5 w-24 text-right">Energy Cons.</th>
                  <th className="p-3.5 w-20 text-center">Alarm</th>
                  <th className="p-3.5 w-28 text-center">Event Type</th>
                  <th className="p-3.5 w-18 text-center bg-slate-100 font-black text-slate-600 border-l border-gray-200">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="14" className="p-16 text-center text-xs font-semibold text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Menyelaraskan data real-time dengan database...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((d, index) => {
                    const isAnomaly = d.target == 1 || (d.event_type && d.event_type.toLowerCase() !== 'normal');
                    return (
                      <tr key={d.id || index} className={`hover:bg-slate-50 transition-colors text-[11px] font-medium text-slate-600 ${isAnomaly ? 'bg-red-50/20' : ''}`}>
                        <td className="p-3 text-center text-gray-300 font-bold">{(page - 1) * 10 + index + 1}</td>
                        <td className="p-3 font-mono text-gray-400 whitespace-nowrap">{d.timestamp || "-"}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{d.segment_id}</td>
                        <td className="p-3 text-right font-semibold text-blue-600 font-mono">{formatNum(d.pressure, 2)} bar</td>
                        <td className="p-3 text-right text-slate-700 font-mono">{formatNum(d.flow_rate, 2)} m³/h</td>
                        <td className="p-3 text-right text-slate-500 font-mono">{formatNum(d.temperature, 1)}°C</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide border ${d.valve_status == 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-400 border-transparent'}`}>
                            {d.valve_status == 1 ? 'OPEN' : 'CLOSE'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide border ${d.pump_state == 1 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-gray-100 text-gray-400 border-transparent'}`}>
                            {d.pump_state == 1 ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-right text-slate-600">{formatNum(d.pump_speed, 0)} rpm</td>
                        <td className="p-3 text-center font-bold text-slate-500 font-mono">{d.compressor_state ?? "-"}</td>
                        <td className="p-3 font-mono text-right text-slate-400">{formatNum(d.energy_consumption, 1)} kWh</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide border ${d.alarm_triggered == 1 ? 'border-red-200 bg-red-50 text-red-600 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                            {d.alarm_triggered == 1 ? '⚠️ ALARM' : '🟢 CLEAR'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] border tracking-wider font-bold ${getEventBadgeClass(d.event_type)}`}>
                            {(d.event_type || "NORMAL").toUpperCase()}
                          </span>
                        </td>
                        <td className={`p-3 text-center font-black border-l border-gray-200 text-xs ${d.target == 1 ? 'text-red-600 bg-red-50/50' : 'text-slate-400 bg-slate-50/50'}`}>
                          {d.target}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="14" className="p-16 text-center text-xs font-medium text-gray-400 italic">
                      Tidak ditemukan riwayat log sensor. Silakan unggah file master (.xlsx/.csv).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION PANEL */}
        <div className="flex items-center justify-between px-1 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Showing <span className="text-slate-800 font-mono">{(page - 1) * 10 + 1} - {Math.min(page * 10, totalRecords)}</span> of <span className="text-slate-800 font-mono">{totalRecords}</span> rows
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1 || loading} 
              onClick={() => setPage(page - 1)} 
              className="p-1.5 hover:bg-slate-50 border border-gray-200 rounded-lg disabled:opacity-20 transition-all active:scale-90 text-slate-600 bg-white shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>
            
            <div className="bg-slate-50 border border-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-700 font-mono shadow-inner">
              {page} <span className="text-gray-300 mx-1">/</span> {totalPages}
            </div>
            
            <button 
              disabled={page === totalPages || loading} 
              onClick={() => setPage(page + 1)} 
              className="p-1.5 hover:bg-slate-50 border border-gray-200 rounded-lg disabled:opacity-20 transition-all active:scale-90 text-slate-600 bg-white shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DataManagement;