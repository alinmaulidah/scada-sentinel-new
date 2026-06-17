import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Laptop,
  Clock3,
  CheckCircle2,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import axios from "axios";

const API = "http://localhost:5000/api";

const Security = () => {
  const sessionUser = JSON.parse(localStorage.getItem("user")) || {};
  const userId = sessionUser.id || 2;

  // State kumpul data input password
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // State visibilitas karakter sandi
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // State pengontrol UI aksi kirim
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // Validasi kelengkapan isian di frontend
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ text: "Seluruh kolom sandi wajib dilengkapi!", type: "error" });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ text: "Konfirmasi password baru tidak sesuai!", type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Ambil username lama agar backend tidak menimpa field info umum menjadi kosong/null
      const responseUser = await axios.get(`${API}/profile/${userId}`);
      const baseProfile = responseUser.data?.data || {};

      const payload = {
        username: baseProfile.username,
        email: baseProfile.email,
        phone: baseProfile.phone,
        location: baseProfile.location,
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword
      };

      const response = await axios.put(`${API}/profile/${userId}`, payload);

      if (response.data?.success) {
        setMessage({ text: "Kata sandi akun SCADA berhasil diubah!", type: "success" });
        // Bersihkan input form kembali kosong
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Gagal mengonfigurasi password baru.";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-600">
      {/* HEADER */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-[2rem] bg-[#336B87]/10 flex items-center justify-center text-[#336B87]">
            <ShieldCheck size={42} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">Security Center</h1>
            <p className="text-slate-500 font-semibold mt-2">
              Manage account password and login security
            </p>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* FORM CHANGE PASSWORD */}
        <form onSubmit={handlePasswordUpdate} className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-slate-800 mb-2">Change Password</h2>

          {message.text && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold leading-relaxed ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {message.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span>{message.text}</span>
            </div>
          )}

          <PasswordInput
            label="Current Password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handleInputChange}
            show={showOld}
            setShow={setShowOld}
          />

          <PasswordInput
            label="New Password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handleInputChange}
            show={showNew}
            setShow={setShowNew}
          />

          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handleInputChange}
            show={showConfirm}
            setShow={setShowConfirm}
          />

          <button 
            type="submit"
            disabled={isSubmitting}
            className="mt-3 h-14 px-8 rounded-2xl bg-[#336B87] hover:bg-[#28566d] disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : "Update Password"}
          </button>
        </form>

        {/* RIGHT SIDE DETAILS */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-5">Account Protection</h3>
            <div className="space-y-5">
              <SecurityItem icon={<CheckCircle2 size={18} />} title="Account Status" value="Protected" green />
              <SecurityItem icon={<Laptop size={18} />} title="Current Device" value="Windows Desktop" />
              <SecurityItem icon={<Clock3 size={18} />} title="Last Login" value="Today, 08:15 AM" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#336B87] to-[#28566d] rounded-[2rem] p-6 text-white shadow-lg">
            <h3 className="text-lg font-black">Security Tips</h3>
            <ul className="mt-5 space-y-3 text-sm text-blue-100 font-medium">
              <li>• Use strong password combinations</li>
              <li>• Avoid sharing admin credentials</li>
              <li>• Change password regularly</li>
              <li>• Logout after using the system</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

const PasswordInput = ({ label, name, value, onChange, show, setShow }) => (
  <div>
    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
    <div className="mt-2 h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-4">
      <Lock size={18} className="text-slate-400" />
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder="••••••••••••"
        className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700"
      />
      <button type="button" onClick={() => setShow(!show)} className="text-slate-400 hover:text-[#336B87]">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

const SecurityItem = ({ icon, title, value, green }) => (
  <div className="flex items-start gap-4">
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${green ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-[#336B87]"}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="text-sm font-bold text-slate-800 mt-1">{value}</p>
    </div>
  </div>
);

export default Security;