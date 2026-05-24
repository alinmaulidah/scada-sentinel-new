import React, { useState } from "react";
import {
  Settings2,
  Bell,
  Monitor,
  Moon,
  Sun,
  Database,
  Save,
  RefreshCw,
  ShieldCheck,
  Cpu,
} from "lucide-react";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);

  const [notifications, setNotifications] =
    useState(true);

  const [autoRefresh, setAutoRefresh] =
    useState(true);

  const [aiDetection, setAiDetection] =
    useState(true);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
            System Configuration
          </p>

          <h1 className="text-3xl font-black text-slate-800 mt-2">
            System Settings
          </h1>
        </div>

        <button className="flex items-center gap-2 px-5 py-3 bg-[#336B87] hover:bg-[#28576d] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200">
          <Save size={15} />
          Save Changes
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="xl:col-span-2 space-y-6">

          {/* APPEARANCE */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-12 h-12 rounded-2xl bg-[#336B87]/10 flex items-center justify-center text-[#336B87]">
                <Monitor size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Appearance
                </h2>

                <p className="text-sm text-slate-400">
                  Customize dashboard appearance
                </p>
              </div>
            </div>

            <div className="space-y-4">

              {/* DARK MODE */}
              <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">

                <div className="flex items-center gap-4">

                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                    {darkMode ? (
                      <Moon size={20} />
                    ) : (
                      <Sun size={20} />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Dark Mode
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      Enable dark interface theme
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setDarkMode(!darkMode)
                  }
                  className={`
                    w-14 h-8 rounded-full transition-all relative
                    ${
                      darkMode
                        ? "bg-[#336B87]"
                        : "bg-slate-300"
                    }
                  `}
                >
                  <div
                    className={`
                      absolute top-1 w-6 h-6 rounded-full bg-white transition-all
                      ${
                        darkMode
                          ? "translate-x-7"
                          : "translate-x-1"
                      }
                    `}
                  />
                </button>
              </div>

              {/* AUTO REFRESH */}
              <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">

                <div className="flex items-center gap-4">

                  <div className="w-11 h-11 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                    <RefreshCw size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Auto Refresh
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      Refresh monitoring data automatically
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setAutoRefresh(!autoRefresh)
                  }
                  className={`
                    w-14 h-8 rounded-full transition-all relative
                    ${
                      autoRefresh
                        ? "bg-[#336B87]"
                        : "bg-slate-300"
                    }
                  `}
                >
                  <div
                    className={`
                      absolute top-1 w-6 h-6 rounded-full bg-white transition-all
                      ${
                        autoRefresh
                          ? "translate-x-7"
                          : "translate-x-1"
                      }
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                <Bell size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Notifications
                </h2>

                <p className="text-sm text-slate-400">
                  Alert and anomaly notification settings
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">

              <div>
                <h3 className="text-sm font-black text-slate-800">
                  Enable Notifications
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Receive leak detection and anomaly alerts
                </p>
              </div>

              <button
                onClick={() =>
                  setNotifications(!notifications)
                }
                className={`
                  w-14 h-8 rounded-full transition-all relative
                  ${
                    notifications
                      ? "bg-[#336B87]"
                      : "bg-slate-300"
                  }
                `}
              >
                <div
                  className={`
                    absolute top-1 w-6 h-6 rounded-full bg-white transition-all
                    ${
                      notifications
                        ? "translate-x-7"
                        : "translate-x-1"
                    }
                  `}
                />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* AI SETTINGS */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
                <Cpu size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-800">
                  AI Detection
                </h2>

                <p className="text-sm text-slate-400">
                  Smart anomaly detection engine
                </p>
              </div>
            </div>

            <div className="space-y-4">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    Enable AI Analysis
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Real-time K-Means clustering
                  </p>
                </div>

                <button
                  onClick={() =>
                    setAiDetection(!aiDetection)
                  }
                  className={`
                    w-14 h-8 rounded-full transition-all relative
                    ${
                      aiDetection
                        ? "bg-[#336B87]"
                        : "bg-slate-300"
                    }
                  `}
                >
                  <div
                    className={`
                      absolute top-1 w-6 h-6 rounded-full bg-white transition-all
                      ${
                        aiDetection
                          ? "translate-x-7"
                          : "translate-x-1"
                      }
                    `}
                  />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mt-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Model Status
                    </p>

                    <h3 className="text-lg font-black text-emerald-600 mt-1">
                      Active
                    </h3>
                  </div>

                  <ShieldCheck
                    size={34}
                    className="text-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DATABASE */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                <Database size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Database
                </h2>

                <p className="text-sm text-slate-400">
                  SCADA data connection
                </p>
              </div>
            </div>

            <div className="space-y-4">

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Current Server
                </p>

                <h3 className="text-sm font-black text-slate-800 mt-2">
                  localhost:5000
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">

                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  Connection Status
                </p>

                <h3 className="text-sm font-black text-emerald-700 mt-2">
                  Connected Successfully
                </h3>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;