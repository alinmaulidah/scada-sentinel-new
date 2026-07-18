import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  Moon,
  RefreshCw,
  Save,
  Sun,
} from "lucide-react";
import Security from "./Security";
import { applyTheme, getAppSettings, saveAppSettings } from "../lib/appSettings";

const Toggle = ({ checked, onChange, label, description, icon }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="flex min-w-0 items-center gap-3">
      <div className="shrink-0 rounded-xl bg-white p-2 text-[#336B87] shadow-sm">{icon}</div>
      <div>
        <h3 className="text-sm font-black text-slate-800">{label}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-[#336B87]" : "bg-slate-300"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

export default function Settings() {
  const [settings, setSettings] = useState(getAppSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    applyTheme(settings.darkMode);
  }, [settings.darkMode]);

  const toggle = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    saveAppSettings(settings);
    setSaved(true);
  };

  return (
    <div className="space-y-5 px-3 py-4 sm:px-0 sm:py-0">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pengaturan Sistem</p>
          <h1 className="mt-1 text-2xl font-black text-slate-800 sm:text-3xl">Settings</h1>
          <p className="mt-1 text-xs text-slate-500">Perubahan disimpan di perangkat dan berlaku pada sesi berikutnya.</p>
        </div>
        <button onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#336B87] px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#28576d]">
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? "Tersimpan" : "Simpan Perubahan"}
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-800">Preferensi Aplikasi</h2>
        <p className="mt-1 text-xs text-slate-500">Aktifkan hanya fitur yang memang ingin digunakan selama demonstrasi.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <Toggle
            checked={settings.darkMode}
            onChange={() => toggle("darkMode")}
            label="Mode gelap"
            description="Mengubah tampilan aplikasi agar nyaman pada kondisi minim cahaya."
            icon={settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
          />
          <Toggle
            checked={settings.autoRefresh}
            onChange={() => toggle("autoRefresh")}
            label="Refresh monitoring otomatis"
            description="Memperbarui hasil Monitoring terbaru setiap 15 detik saat halaman dibuka."
            icon={<RefreshCw size={18} />}
          />
          <Toggle
            checked={settings.aiDetection}
            onChange={() => toggle("aiDetection")}
            label="Izinkan eksekusi analisis"
            description="Jika nonaktif, tombol Jalankan Analisis dikunci untuk mencegah eksekusi tidak disengaja."
            icon={<BrainCircuit size={18} />}
          />
        </div>
      </section>

      <Security />
    </div>
  );
}
