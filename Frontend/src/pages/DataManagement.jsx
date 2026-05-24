import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Upload, Database, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

const API = "http://localhost:5000/api";
const PRIMARY_COLOR = "#336B87"; // Diselaraskan dengan warna tema Sentinel System

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
        alert("Data berhasil diimport!");
        setPage(1);
        fetchData();
      } catch (err) {
        console.error("Gagal mengimpor data:", err);
        alert("Terjadi kesalahan saat mengimpor data.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleWipeDatabase = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus SELURUH log data sensor di database?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API}/clear-sensor-logs`);
      setPage(1);
      fetchData();
    } catch (err) {
      console.error("Gagal mengosongkan database:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen font-sans text-slate-600">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* COMPACT & MODERN HEADER AREA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div style={{ backgroundColor: PRIMARY_COLOR }} className="p-2.5 rounded-xl text-white shadow-sm">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800">SCADA Master Data</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                Total Records: <span className="text-slate-700 font-mono">{totalRecords.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* ACTIONS AREA */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                className="w-full sm:w-72 bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-slate-300 transition-all text-xs font-medium" 
                placeholder="Cari berdasarkan Segment ID atau Event..." 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              />
            </div>
            
            <label 
              style={{ backgroundColor: PRIMARY_COLOR }} 
              className="hover:opacity-90 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Upload size={14} /> IMPORT
              <input type="file" hidden accept=".xlsx, .xls, .csv" onChange={handleImport} />
            </label>

            <button 
              onClick={handleWipeDatabase} 
              className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              title="Wipe Database"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* FULL 13-VARIABLE TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="p-3.5 text-center w-12">No</th>
                  <th className="p-3.5 w-36">Timestamp</th>
                  <th className="p-3.5 w-20">Seg ID</th>
                  <th className="p-3.5 w-24">Pressure</th>
                  <th className="p-3.5 w-24">Flow Rate</th>
                  <th className="p-3.5 w-20">Temp</th>
                  <th className="p-3.5 w-16 text-center">Valve</th>
                  <th className="p-3.5 w-16 text-center">Pump</th>
                  <th className="p-3.5 w-20 text-right">Speed</th>
                  <th className="p-3.5 w-16 text-center">Comp</th>
                  <th className="p-3.5 w-24 text-right">Energy</th>
                  <th className="p-3.5 w-24 text-center">Alarm</th>
                  <th className="p-3.5 w-28">Event Type</th>
                  <th className="p-3.5 w-16 text-center bg-gray-50 font-black text-gray-500">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 even:bg-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="14" className="p-12 text-center text-xs font-medium text-gray-400 italic">
                      Menyelaraskan data dengan database...
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((d, index) => (
                    <tr key={d.id || index} className="hover:bg-blue-50/40 transition-colors text-[11px] font-medium text-slate-600">
                      <td className="p-3 text-center text-gray-300 font-bold">{(page - 1) * 10 + index + 1}</td>
                      <td className="p-3 font-mono text-gray-400 whitespace-nowrap">{d.timestamp}</td>
                      <td className="p-3 font-bold text-slate-800">{d.segment_id}</td>
                      <td className="p-3 font-semibold text-blue-600 font-mono">{Number(d.pressure).toFixed(2)} bar</td>
                      <td className="p-3 text-slate-700 font-mono">{Number(d.flow_rate).toFixed(2)} m³/h</td>
                      <td className="p-3 text-slate-500 font-mono">{Number(d.temperature).toFixed(1)}°C</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide ${d.valve_status == 1 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>
                          {d.valve_status == 1 ? 'OPEN' : 'CLOSE'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide ${d.pump_state == 1 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
                          {d.pump_state == 1 ? 'ON' : 'OFF'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-right text-gray-500">{Number(d.pump_speed).toFixed(0)} rpm</td>
                      <td className="p-3 text-center font-bold text-gray-400 font-mono">{d.compressor_state}</td>
                      <td className="p-3 font-mono text-right text-gray-400">{Number(d.energy_consumption).toFixed(1)} kWh</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide border ${d.alarm_triggered == 1 ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                          {d.alarm_triggered == 1 ? 'ALARM' : 'CLEAR'}
                        </span>
                      </td>
                      <td className="p-3 font-bold truncate">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${d.event_type.toLowerCase() !== 'normal' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'text-gray-400'}`}>
                          {d.event_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center font-black text-slate-700 bg-gray-50/50 font-mono">{d.target}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="14" className="p-12 text-center text-xs font-medium text-gray-400 italic">
                      Tidak ditemukan riwayat log sensor. Silakan import file master xlsx.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MINIMALIST PAGINATION */}
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Showing <span className="text-slate-800 font-mono">{(page - 1) * 10 + 1} - {Math.min(page * 10, totalRecords)}</span> of <span className="text-slate-800 font-mono">{totalRecords}</span> rows
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1 || loading} 
              onClick={() => setPage(page - 1)} 
              className="p-1.5 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg disabled:opacity-20 transition-all active:scale-90 text-slate-600 bg-transparent"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="bg-white border border-gray-100 px-3 py-1 rounded-lg text-xs font-bold shadow-sm text-slate-700">
              {page} <span className="text-gray-300 mx-1">/</span> {totalPages}
            </div>
            
            <button 
              disabled={page === totalPages || loading} 
              onClick={() => setPage(page + 1)} 
              className="p-1.5 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg disabled:opacity-20 transition-all active:scale-90 text-slate-600 bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DataManagement;