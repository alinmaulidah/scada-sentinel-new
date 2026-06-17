import React, { useState, useEffect } from "react";
import {
  UserCircle2,
  Mail,
  ShieldCheck,
  Phone,
  MapPin,
  Pencil,
  BadgeCheck,
  X,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function MyProfile() {
  // Ambil data dasar login dari localStorage
  const sessionUser = JSON.parse(localStorage.getItem("user")) || {};
  
  // 🚨 TIPS: Jika di DB kamu ID admin-nya adalah 1, ganti angka 2 di bawah ini menjadi 1
  const userId = sessionUser.id || 2; 

  // State Data Profil Utama
  const [profileData, setProfileData] = useState({
    username: "",
    role: "",
    email: "",
    phone: "",
    location: "",
    status: "",
  });

  // State Form Edit (Untuk Modal)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    location: "",
  });

  // State Interface Kontrol
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); 

  // Fetch Data Profil Terbaru dari Database saat pertama kali masuk halaman
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setMessage({ text: "", type: "" });
      
      console.log("Request ke backend untuk User ID:", userId);
      const response = await axios.get(`${API}/profile/${userId}`);
      
      if (response.data?.success) {
        const dbData = response.data.data;
        setProfileData(dbData);
        
        // Daftarkan data DB ke form input edit profile
        setFormData({
          username: dbData.username || "",
          email: dbData.email || "",
          phone: dbData.phone || "",
          location: dbData.location || "",
        });
      }
    } catch (error) {
      console.error("Gagal sinkronisasi profil dengan database:", error);
      const errorMsg = error.response?.data?.message || "Gagal terhubung ke server database.";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      // ✅ Solusi Utama: Apapun yang terjadi (sukses/gagal), loading HARUS berhenti!
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  // Handle Input Form Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Submit Form Update
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    try {
      setIsSubmitting(true);
      const response = await axios.put(`${API}/profile/${userId}`, formData);
      
      if (response.data?.success) {
        setMessage({ text: response.data.message || "Profil berhasil diperbarui!", type: "success" });
        
        // Update Local Storage jika username berubah agar sinkron dengan sidebar/navbar
        const updatedSession = { ...sessionUser, username: formData.username };
        localStorage.setItem("user", JSON.stringify(updatedSession));

        // Ambil ulang data profil segar dari database
        await fetchUserProfile();

        // Tutup modal dalam waktu 1.5 detik
        setTimeout(() => {
          setIsModalOpen(false);
          setMessage({ text: "", type: "" });
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Gagal memperbarui profil SCADA Engineer.";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔄 Tampilan Spinner Loading
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#336B87]" size={40} />
        <p className="text-sm font-medium text-slate-500">Sinkronisasi kredensial akun SCADA...</p>
        
        {/* Tampilkan pesan error di bawah spinner jika backend ternyata mati */}
        {message.text && (
          <p className="text-xs text-red-500 font-semibold bg-red-50 px-4 py-2 rounded-xl mt-2 border border-red-100">
            {message.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-600">
      
      {/* ================= I. HEADER PROFILE CARD ================= */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* AVATAR */}
            <div className="w-28 h-28 rounded-[2rem] bg-[#336B87]/10 flex items-center justify-center text-[#336B87] shrink-0">
              <UserCircle2 size={70} />
            </div>
            
            {/* INTRINSIC INFO */}
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  {profileData.username || "Administrator"}
                </h1>
                <BadgeCheck size={22} className="text-[#336B87] shrink-0" />
              </div>
              <p className="text-slate-500 font-semibold mt-1">
                SCADA Monitoring Engineer
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#336B87]/10 text-[#336B87]">
                <ShieldCheck size={16} />
                <span className="text-xs font-black uppercase tracking-wider">
                  {profileData.role || "Admin"}
                </span>
              </div>
            </div>
          </div>

          {/* EDIT BUTTON */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-6 rounded-2xl bg-[#336B87] hover:bg-[#28566d] text-white flex items-center justify-center gap-3 font-black uppercase tracking-wider text-xs transition-all active:scale-[0.98] shadow-sm self-center lg:self-center"
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* ================= II. INFORMATIONAL DETAILS SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PERSONAL CARD */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-7 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 mb-6 tracking-tight">
            Personal Information
          </h2>
          <div className="space-y-5">
            <InfoItem
              icon={<Mail size={18} />}
              label="Email Address"
              value={profileData.email || "Belum dikonfigurasi"}
            />
            <InfoItem
              icon={<Phone size={18} />}
              label="Phone Number"
              value={profileData.phone || "Belum dikonfigurasi"}
            />
            <InfoItem
              icon={<MapPin size={18} />}
              label="Location"
              value={profileData.location || "Belum dikonfigurasi"}
            />
          </div>
        </div>

        {/* ACCOUNT SECURITY CARD */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-7 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 mb-6 tracking-tight">
            Account Information
          </h2>
          <div className="space-y-5">
            <InfoItem
              icon={<ShieldCheck size={18} />}
              label="System Authority Access Role"
              value={profileData.role || "Administrator"}
            />
            <InfoItem
              icon={<UserCircle2 size={18} />}
              label="Unique Username ID"
              value={profileData.username || "admin"}
            />
            <InfoItem
              icon={<BadgeCheck size={18} />}
              label="Account Lifecycle Status"
              value={profileData.status || "Active & Verified"}
            />
          </div>
        </div>
      </div>

      {/* ================= III. MODAL POP-UP FORM EDIT PROFILE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Update Engineer Profile</h3>
                <p className="text-xs text-slate-400 mt-0.5">Modifikasi data identitas telemetri personel SCADA</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitUpdate} className="p-8 space-y-6">
              
              {/* Alert Status Feedback */}
              {message.text && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold leading-relaxed ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {message.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* USERNAME & EMAIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block">Username</label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full h-11 px-4 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:border-[#336B87] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full h-11 px-4 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:border-[#336B87] outline-none transition-all"
                  />
                </div>
              </div>

              {/* TELEPON & LOKASI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full h-11 px-4 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:border-[#336B87] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block">Work Location Base</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full h-11 px-4 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:border-[#336B87] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons Footer Modal */}
              <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-5 rounded-xl border border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: "#336B87" }}
                  className="h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </                    >
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Sub-Komponen Item Informasi (Reusable)
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-[#336B87] shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-800 mt-1 leading-tight">
        {value}
      </p>
    </div>
  </div>
);