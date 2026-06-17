import React, { useState } from 'react';
import { ScatterPlot, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from 'recharts';

const SCADAScatterPlot = ({ backendData }) => {
  // 1. State untuk mengatur variabel mana yang sedang aktif di Sumbu Y
  const [selectedYAxis, setSelectedYAxis] = useState('pressure');

  // Konfigurasi label, satuan, dan warna berdasarkan variabel SCADA
  const axisConfigs = {
    pressure: { label: 'Pressure', unit: ' bar', color: '#0284c7' },
    flow_rate: { label: 'Flow Rate', unit: ' m³/h', color: '#10b981' },
    temperature: { label: 'Temperature', unit: ' °C', color: '#f59e0b' },
    pump_speed: { label: 'Pump Speed', unit: ' rpm', color: '#8b5cf6' },
  };

  // Jika data dari backend belum siap, tampilkan loading placeholder
  if (!backendData || (!backendData.normal_details && !backendData.anomaly_details)) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[450px] flex items-center justify-center">
        <p className="text-slate-400 font-medium animate-pulse">Menunggu eksekusi algoritma...</p>
      </div>
    );
  }

  // 2. Transformasi data agar Sumbu X berisi urutan index kronologi (1, 2, 3...)
  // Data dibalik agar urutan waktu mengalir secara logis dari kiri (lama) ke kanan (terbaru)
  const formatDataPoints = (detailsArray) => {
    return detailsArray.map((item, index) => ({
      ...item,
      indexId: index + 1, // Sumbu X sebagai representasi urutan log data
    }));
  };

  const normalData = formatDataPoints(backendData.normal_details || []);
  const anomalyData = formatDataPoints(backendData.anomaly_details || []);

  // 3. Memisahkan data anomali ke dalam kategori 'warning' dan 'critical/leak/blockage' demi akurasi warna UI
  const warningData = anomalyData.filter(d => d.type === 'degradation');
  const criticalAnomalyData = anomalyData.filter(d => d.type === 'leak' || d.type === 'blockage');

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
      
      {/* HEADER GRAFIK & DROPDOWN SELEKTOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-50 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Visualisasi Distribusi Log SCADA</h3>
          <p className="text-sm text-slate-500">Analisis sebaran kondisi sensor berdasarkan kronologi urutan waktu</p>
        </div>
        
        {/* Kontrol Interaktif Dropdown Sumbu Y */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 px-2 uppercase tracking-wider">Sumbu Y:</label>
          <select 
            value={selectedYAxis} 
            onChange={(e) => setSelectedYAxis(e.target.value)}
            className="bg-white text-sm font-medium text-slate-700 py-1.5 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
          >
            <option value="pressure">📊 Pressure (Bar)</option>
            <option value="flow_rate">🌊 Flow Rate (m³/h)</option>
            <option value="temperature">🌡️ Temperature (°C)</option>
            <option value="pump_speed">⚡ Pump Speed (RPM)</option>
          </select>
        </div>
      </div>

      {/* AREA GRAFIK SCATTER PLOT */}
      <div className="w-full h-[350px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterPlot margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            
            {/* Sumbu X: Urutan Log Data Kronologis */}
            <XAxis 
              type="number" 
              dataKey="indexId" 
              name="Urutan Log" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Urutan Log Sensor (Kronologi Waktu ➡️)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 12, fontWeight: 500 }}
            />
            
            {/* Sumbu Y: Nilai Sensor Dinamis Sesuai Pilihan Dropdown */}
            <YAxis 
              type="number" 
              dataKey={selectedYAxis} 
              name={axisConfigs[selectedYAxis].label} 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              label={{ value: `${axisConfigs[selectedYAxis].label} (${axisConfigs[selectedYAxis].unit.trim()})`, angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 12, fontWeight: 500 }}
            />

            {/* ZAxis dipasang konstan agar ukuran dot grafik seragam dan rapi */}
            <ZAxis type="number" range={[60, 60]} />
            
            {/* Kustomisasi Tooltip Pop-up Informasi saat titik disentuh mouse */}
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs flex flex-col gap-1.5 min-w-[200px]">
                      <div className="border-b border-slate-700 pb-1 font-bold flex justify-between items-center">
                        <span>Log Ke-#{data.indexId}</span>
                        <span className={`px-1.5 py-0.5 rounded uppercase tracking-wide text-[10px] ${
                          data.severity === 'high' ? 'bg-red-500' : data.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>{data.type}</span>
                      </div>
                      <p><span className="text-slate-400">Timestamp:</span> {data.timestamp}</p>
                      <p><span className="text-slate-400">Segment ID:</span> {data.segment_id}</p>
                      <p><span className="text-slate-400">Pressure:</span> {data.pressure} bar</p>
                      <p><span className="text-slate-400">Flow Rate:</span> {data.flow_rate} m³/h</p>
                      <p><span className="text-slate-400">Confidence AI:</span> {data.confidence}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />

            {/* 🟢 LAYER 1: DATA NORMAL */}
            <Scatter name="Kondisi Normal" data={normalData} fill="#10b981" />

            {/* 🟡 LAYER 2: DATA WARNING (K-Means Mid Cluster / Degradasi) */}
            {warningData.length > 0 && (
              <Scatter name="Indikasi Warning" data={warningData} fill="#f59e0b" />
            )}

            {/* 🔴 LAYER 3: DATA ANOMALI (Kebocoran / Penyumbatan) */}
            {criticalAnomalyData.length > 0 && (
              <Scatter name="Terdeteksi Anomali" data={criticalAnomalyData} fill="#ef4444" />
            )}
          </ScatterPlot>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SCADAScatterPlot;