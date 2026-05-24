import React, { useState } from "react";

import {
  Activity,
  BrainCircuit,
  ShieldAlert,
  Gauge,
  Waves,
  Thermometer,
  Cpu,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Target,
} from "lucide-react";

const Monitoring = () => {
  const [expandedId, setExpandedId] = useState(null);

  // ===============================
  // ACTIVE MODEL RESULT
  // ===============================

  const activeModel = {
    algorithm: "DBSCAN",
    normalization: "Min-Max Scaling",
    anomaly: 12,
    accuracy: "96.8%",
    status: "Optimal",
  };

  // ===============================
  // MONITORING DATA
  // ===============================

  const monitoringData = [
    {
      id: 1,
      timestamp: "2026-05-14 10:05:22",
      segment_id: "SEG-01",
      pressure: 0.32,
      flow_rate: 2.1,
      temperature: 33,
      pump_speed: 1450,
      prediction: "Leak",
      severity: "High",

      insight: {
        reason:
          "Pressure turun drastis sementara flow rate tidak stabil sehingga sistem mendeteksi indikasi kebocoran pipeline.",

        impact:
          "Kehilangan tekanan distribusi dan potensi gangguan sistem utama.",

        solution:
          "Lakukan inspeksi valve dan sambungan pipa pada area distribusi utama.",
      },
    },

    {
      id: 2,
      timestamp: "2026-05-14 10:05:28",
      segment_id: "SEG-02",
      pressure: 2.41,
      flow_rate: 5.7,
      temperature: 39,
      pump_speed: 1810,
      prediction: "Surge",
      severity: "High",

      insight: {
        reason:
          "Lonjakan pressure dan flow rate terjadi secara mendadak akibat ketidakstabilan distribusi fluida.",

        impact:
          "Tekanan berlebih dapat mempercepat kerusakan komponen pipeline.",

        solution:
          "Lakukan stabilisasi tekanan dan pengecekan control valve.",
      },
    },

    {
      id: 3,
      timestamp: "2026-05-14 10:05:34",
      segment_id: "SEG-03",
      pressure: 1.43,
      flow_rate: 3.1,
      temperature: 41,
      pump_speed: 1605,
      prediction: "Degradation",
      severity: "Medium",

      insight: {
        reason:
          "Terjadi penurunan performa pompa secara bertahap berdasarkan pola sensor historis.",

        impact:
          "Efisiensi distribusi menurun dan konsumsi energi meningkat.",

        solution:
          "Lakukan predictive maintenance pada pompa industri.",
      },
    },

    {
      id: 4,
      timestamp: "2026-05-14 10:05:41",
      segment_id: "SEG-04",
      pressure: 1.11,
      flow_rate: 3.4,
      temperature: 30,
      pump_speed: 1380,
      prediction: "Normal",
      severity: "Safe",

      insight: {
        reason:
          "Seluruh parameter sensor berada pada rentang operasional normal.",

        impact:
          "Sistem berjalan stabil tanpa indikasi anomali.",

        solution:
          "Lanjutkan monitoring berkala dan preventive maintenance.",
      },
    },
  ];

  // ===============================
  // STYLE
  // ===============================

  const getPredictionStyle = (prediction) => {
    switch (prediction) {
      case "Leak":
        return "bg-red-100 text-red-600";

      case "Surge":
        return "bg-orange-100 text-orange-600";

      case "Degradation":
        return "bg-violet-100 text-violet-600";

      default:
        return "bg-emerald-100 text-emerald-600";
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-600";

      case "Medium":
        return "bg-amber-100 text-amber-600";

      default:
        return "bg-emerald-100 text-emerald-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#336B87]/10 text-[#336B87] flex items-center justify-center">
                <BrainCircuit size={26} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400">
                  SCADA PREDICTIVE MONITORING
                </p>

                <h1 className="text-3xl font-black text-slate-900">
                  Monitoring & Detection Result
                </h1>
              </div>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
              Real-time monitoring result from anomaly detection analysis
              using historical SCADA pipeline data for predictive
              maintenance support.
            </p>
          </div>

          <button className="h-14 px-6 rounded-2xl bg-[#336B87] text-white font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-blue-100 hover:scale-[1.01] transition-all">
            <FileText size={18} />

            Export Report
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* ACTIVE MODEL */}
      {/* ================================================= */}

      <div className="bg-gradient-to-r from-[#336B87] to-[#274B63] rounded-[2rem] p-7 text-white shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] font-black text-blue-100">
              Active Monitoring Model
            </p>

            <h2 className="text-3xl font-black mt-3">
              {activeModel.algorithm} •{" "}
              {activeModel.normalization}
            </h2>

            <p className="text-sm text-blue-100 mt-3 max-w-2xl leading-relaxed">
              Monitoring data below is generated from anomaly detection
              using the selected algorithm and normalization method.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-widest font-black text-blue-100">
                Anomaly
              </p>

              <h2 className="text-3xl font-black mt-2">
                {activeModel.anomaly}
              </h2>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-widest font-black text-blue-100">
                Accuracy
              </p>

              <h2 className="text-3xl font-black mt-2">
                {activeModel.accuracy}
              </h2>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-widest font-black text-blue-100">
                Highest Risk
              </p>

              <h2 className="text-2xl font-black mt-2 text-red-200">
                Leak
              </h2>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-widest font-black text-blue-100">
                Status
              </p>

              <h2 className="text-2xl font-black mt-2 text-emerald-200">
                {activeModel.status}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        {/* TABLE HEADER */}

        <div className="px-7 py-6 border-b border-slate-100">
          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400">
            Detection Monitoring
          </p>

          <h2 className="text-2xl font-black text-slate-900 mt-2">
            SCADA Pipeline Monitoring Result
          </h2>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "Timestamp",
                  "Segment ID",
                  "Pressure",
                  "Flow Rate",
                  "Temperature",
                  "Pump Speed",
                  "Prediction",
                  "Severity",
                  "Detail",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-4 text-center text-[11px] uppercase tracking-widest font-black text-slate-500 whitespace-nowrap"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {monitoringData.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-all">
                    {/* TIMESTAMP */}

                    <td className="px-6 py-5 text-center text-sm font-bold text-slate-700 whitespace-nowrap">
                      {row.timestamp}
                    </td>

                    {/* SEGMENT */}

                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-black">
                        {row.segment_id}
                      </span>
                    </td>

                    {/* PRESSURE */}

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                        <Gauge size={16} className="text-[#336B87]" />

                        {row.pressure}
                      </div>
                    </td>

                    {/* FLOW */}

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                        <Waves size={16} className="text-[#336B87]" />

                        {row.flow_rate}
                      </div>
                    </td>

                    {/* TEMP */}

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                        <Thermometer
                          size={16}
                          className="text-[#336B87]"
                        />

                        {row.temperature}°C
                      </div>
                    </td>

                    {/* PUMP */}

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                        <Cpu size={16} className="text-[#336B87]" />

                        {row.pump_speed}
                      </div>
                    </td>

                    {/* PREDICTION */}

                    <td className="px-6 py-5 text-center">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs uppercase font-black ${getPredictionStyle(
                          row.prediction
                        )}`}
                      >
                        {row.prediction}
                      </span>
                    </td>

                    {/* SEVERITY */}

                    <td className="px-6 py-5 text-center">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs uppercase font-black ${getSeverityStyle(
                          row.severity
                        )}`}
                      >
                        {row.severity}
                      </span>
                    </td>

                    {/* DETAIL */}

                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === row.id
                              ? null
                              : row.id
                          )
                        }
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-[#336B87] hover:text-white text-slate-500 flex items-center justify-center transition-all mx-auto"
                      >
                        {expandedId === row.id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* DETAIL CONTENT */}

                  {expandedId === row.id && (
                    <tr>
                      <td
                        colSpan="9"
                        className="bg-slate-50 px-6 py-6 border-b border-slate-100"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                          {/* ROOT CAUSE */}

                          <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <AlertTriangle
                                size={18}
                                className="text-red-500"
                              />

                              <p className="text-[10px] uppercase tracking-widest font-black text-red-500">
                                Root Cause
                              </p>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">
                              {row.insight.reason}
                            </p>
                          </div>

                          {/* IMPACT */}

                          <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <ShieldAlert
                                size={18}
                                className="text-amber-500"
                              />

                              <p className="text-[10px] uppercase tracking-widest font-black text-amber-500">
                                Impact
                              </p>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">
                              {row.insight.impact}
                            </p>
                          </div>

                          {/* SOLUTION */}

                          <div className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <CheckCircle2
                                size={18}
                                className="text-emerald-500"
                              />

                              <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500">
                                Recommendation
                              </p>
                            </div>

                            <p className="text-sm text-slate-700 font-semibold leading-relaxed">
                              {row.insight.solution}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;