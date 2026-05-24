// AlgorithmExecution.jsx

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
} from "lucide-react";

const AlgorithmExecution = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState("kmeans");

  const [selectedNormalization, setSelectedNormalization] =
    useState("minmax");

  const [isLoading, setIsLoading] = useState(false);

  const [executionResult, setExecutionResult] =
    useState({
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
    });

  const [history, setHistory] = useState([]);

  // =====================================================
  // RUN ANALYSIS
  // =====================================================

  const handleRun = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/algoritma/run",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            algorithm: selectedAlgorithm,
            normalization:
              selectedNormalization,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const result = {
          algorithm: data.algorithm,

          normalization:
            data.normalization,

          anomaly: data.anomaly,

          normal: data.normal,

          cluster: data.cluster,

          silhouette:
            data.silhouette,

          eps: data.eps,

          min_samples:
            data.min_samples,

          status: data.status,

          anomaly_details:
            data.anomaly_details || [],
        };

        setExecutionResult(result);

        setHistory((prev) => [
          result,
          ...prev,
        ]);
      } else {
        alert(
          "Backend Error : " +
            data.message
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Backend belum berjalan atau terjadi kesalahan koneksi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-sm">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="flex items-center gap-3 mb-3">

              <div className="w-12 h-12 rounded-2xl bg-[#336B87]/10 text-[#336B87] flex items-center justify-center">
                <BrainCircuit size={24} />
              </div>

              <div>

                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                  SCADA AI ANALYSIS
                </p>

                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Algorithm Execution
                </h1>

              </div>

            </div>

            <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
              Execute anomaly detection using
              K-Means and DBSCAN for predictive
              maintenance analysis.
            </p>

          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">

            <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500">
              System Status
            </p>

            <h3 className="text-lg font-black text-emerald-700 mt-1">
              {isLoading
                ? "Processing Analysis..."
                : "Ready To Execute"}
            </h3>

          </div>

        </div>

      </div>

      {/* MAIN */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT */}

        <div className="space-y-6">

          {/* CONFIG */}

          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">

            <div className="mb-6">

              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                Configuration
              </p>

              <h2 className="text-2xl font-black text-slate-900 mt-1">
                Execution Setup
              </h2>

            </div>

            {/* ALGORITHM */}

            <div className="space-y-2 mb-5">

              <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">
                Select Algorithm
              </label>

              <select
                value={
                  selectedAlgorithm
                }
                onChange={(e) =>
                  setSelectedAlgorithm(
                    e.target.value
                  )
                }
                className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none font-semibold"
              >

                <option value="kmeans">
                  K-Means Clustering
                </option>

                <option value="dbscan">
                  DBSCAN
                </option>

              </select>

            </div>

            {/* NORMALIZATION */}

            <div className="space-y-2 mb-5">

              <label className="text-[11px] uppercase tracking-widest font-black text-slate-400">
                Normalization
              </label>

              <select
                value={
                  selectedNormalization
                }
                onChange={(e) =>
                  setSelectedNormalization(
                    e.target.value
                  )
                }
                className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none font-semibold"
              >

                <option value="minmax">
                  Min-Max Scaling
                </option>

                <option value="zscore">
                  Z-Score Standardization
                </option>

              </select>

            </div>

            {/* INFO */}

            {selectedAlgorithm ===
              "kmeans" && (

              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

                <div className="flex items-start gap-3">

                  <Workflow
                    className="text-emerald-600 mt-1"
                    size={20}
                  />

                  <div>

                    <h3 className="font-black text-emerald-700">
                      Automatic Cluster Detection
                    </h3>

                    <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                      Sistem menentukan jumlah
                      cluster terbaik otomatis.
                    </p>

                  </div>

                </div>

              </div>

            )}

            {selectedAlgorithm ===
              "dbscan" && (

              <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                <div className="flex items-start gap-3">

                  <Database
                    className="text-blue-600 mt-1"
                    size={20}
                  />

                  <div>

                    <h3 className="font-black text-blue-700">
                      Automatic DBSCAN
                    </h3>

                    <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                      EPS dan Min Samples akan
                      ditentukan otomatis.
                    </p>

                  </div>

                </div>

              </div>

            )}

            {/* BUTTON */}

            <button
              onClick={handleRun}
              disabled={isLoading}
              className={`w-full h-14 rounded-2xl text-white font-black tracking-widest uppercase flex items-center justify-center gap-3 shadow-lg transition-all

              ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#336B87] hover:scale-[1.01]"
              }`}
            >

              {isLoading ? (
                <>

                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Processing...

                </>
              ) : (
                <>

                  <Play size={18} />

                  Run Analysis

                </>
              )}

            </button>

          </div>

          {/* FEATURES */}

          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">

            <div className="mb-5">

              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                Active Features
              </p>

              <h2 className="text-xl font-black text-slate-900 mt-1">
                Selected Variables
              </h2>

            </div>

            <div className="space-y-4">

              {[
                {
                  icon: (
                    <Gauge size={18} />
                  ),
                  name: "Pressure",
                },

                {
                  icon: (
                    <Waves size={18} />
                  ),
                  name: "Flow Rate",
                },

                {
                  icon: (
                    <Thermometer size={18} />
                  ),
                  name: "Temperature",
                },

                {
                  icon: (
                    <Cpu size={18} />
                  ),
                  name: "Pump Speed",
                },
              ].map((item, index) => (

                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200"
                >

                  <div className="flex items-center gap-3 text-[#336B87]">

                    {item.icon}

                    <span className="font-bold text-slate-700">
                      {item.name}
                    </span>

                  </div>

                  <span className="text-xs font-black text-emerald-600 uppercase">
                    Active
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="xl:col-span-2 space-y-6">

          {/* RESULT */}

          <div className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-sm">

            <div className="flex items-center justify-between mb-6">

              <div>

                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                  Execution Result
                </p>

                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  Analysis Output
                </h2>

              </div>

              <div className="w-12 h-12 rounded-2xl bg-[#336B87]/10 text-[#336B87] flex items-center justify-center">

                <Sparkles size={22} />

              </div>

            </div>

            {executionResult.algorithm ? (

              <>

                {/* RESULT CARD */}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

                  <CardResult
                    title="Algorithm"
                    value={
                      executionResult.algorithm
                    }
                    desc="Model"
                    icon={
                      <BrainCircuit size={20} />
                    }
                  />

                  <CardResult
                    title="Cluster"
                    value={
                      executionResult.cluster
                    }
                    desc="Detected Cluster"
                    icon={
                      <Activity size={20} />
                    }
                  />

                  <CardResult
                    title="Anomaly"
                    value={
                      executionResult.anomaly
                    }
                    desc="Anomaly Data"
                    icon={
                      <ShieldAlert size={20} />
                    }
                  />

                  <CardResult
                    title="Normal"
                    value={
                      executionResult.normal
                    }
                    desc="Normal Data"
                    icon={
                      <CheckCircle2 size={20} />
                    }
                  />

                  <CardResult
                    title="EPS"
                    value={
                      executionResult.eps
                    }
                    desc="DBSCAN Epsilon"
                    icon={
                      <Database size={20} />
                    }
                  />

                  <CardResult
                    title="Min Samples"
                    value={
                      executionResult.min_samples
                    }
                    desc="DBSCAN MinPts"
                    icon={
                      <Cpu size={20} />
                    }
                  />

                  <CardResult
                    title="Score"
                    value={
                      executionResult.silhouette
                    }
                    desc="Silhouette"
                    icon={
                      <Target size={20} />
                    }
                  />

                  <CardResult
                    title="Status"
                    value={
                      executionResult.status
                    }
                    desc="Analysis Quality"
                    icon={
                      <Sparkles size={20} />
                    }
                  />

                </div>

                {/* LOG */}

                <div className="mt-8">

                  <div className="flex items-center gap-3 mb-5">

                    <AlertTriangle className="text-red-500" />

                    <div>

                      <h3 className="text-xl font-black text-slate-900">
                        Anomaly Detection Log
                      </h3>

                      <p className="text-sm text-slate-500">
                        Segment anomaly details
                      </p>

                    </div>

                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">

                    <table className="w-full">

                      <thead className="bg-slate-50">

                        <tr>

                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                            Segment ID
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                            Pressure
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                            Flow Rate
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                            Temperature
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                            Pump Speed
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                            Anomaly Type
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {executionResult
                          .anomaly_details
                          ?.length > 0 ? (

                          executionResult.anomaly_details.map(
                            (
                              item,
                              index
                            ) => (

                              <tr
                                key={index}
                                className="border-t border-slate-100 hover:bg-red-50"
                              >

                                <td className="px-4 py-4 font-black text-slate-700">
                                  {
                                    item.segment_id
                                  }
                                </td>

                                <td className="px-4 py-4">
                                  {
                                    item.pressure
                                  }
                                </td>

                                <td className="px-4 py-4">
                                  {
                                    item.flow_rate
                                  }
                                </td>

                                <td className="px-4 py-4">
                                  {
                                    item.temperature
                                  }
                                </td>

                                <td className="px-4 py-4">
                                  {
                                    item.pump_speed
                                  }
                                </td>

                                <td className="px-4 py-4">

                                  <span
                                    className={`
                                    px-3 py-1 rounded-xl text-xs font-black uppercase

                                    ${
                                      item.type ===
                                      "leak"
                                        ? "bg-red-100 text-red-700"

                                        : item.type ===
                                          "blockage"
                                        ? "bg-orange-100 text-orange-700"

                                        : item.type ===
                                          "degradation"
                                        ? "bg-yellow-100 text-yellow-700"

                                        : item.type ===
                                          "surge"
                                        ? "bg-purple-100 text-purple-700"

                                        : "bg-slate-100 text-slate-700"
                                    }
                                  `}
                                  >
                                    {
                                      item.type
                                    }
                                  </span>

                                </td>

                              </tr>
                            )
                          )

                        ) : (

                          <tr>

                            <td
                              colSpan={6}
                              className="text-center py-10 text-slate-400"
                            >
                              No anomaly detected.
                            </td>

                          </tr>

                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              </>

            ) : (

              <div className="h-[250px] rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center">

                <BarChart3
                  size={50}
                  className="text-slate-300 mb-4"
                />

                <h3 className="text-xl font-black text-slate-700">
                  No Analysis Executed
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Execute algorithm to generate AI analysis.
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
};

// =====================================================
// CARD RESULT
// =====================================================

const CardResult = ({
  title,
  value,
  desc,
  icon,
}) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">

      <div className="flex items-center justify-between mb-4">

        <div className="text-[#336B87]">
          {icon}
        </div>

        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
          {title}
        </span>

      </div>

      <h2 className="text-3xl font-black text-slate-900">
        {value}
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        {desc}
      </p>

    </div>
  );
};

export default AlgorithmExecution;