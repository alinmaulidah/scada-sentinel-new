import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Database, Activity, BarChart3,
  Settings, LogOut, ChevronLeft, ShieldCheck
} from "lucide-react";

const Sidebar = ({ isOpen, toggleSidebar, activePage, setActivePage, onLogin }) => {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  // ID Menu di sini harus 100% SAMA dengan properti 'path' di App.jsx
  const allMenuItems = [
    {
      id: "overview",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />
    },
    {
      id: "datamanagement",
      label: "Data Management",
      icon: <Database size={20} />
    },
    {
      id: "algorithmexecution", // Sudah diperbaiki (ditambah huruf 'e' agar sinkron dengan App.jsx)
      label: "Algorithm Execution",
      icon: <Activity size={20} />
    },
    {
      id: "monitoring", // Sudah disinkronkan dengan path="/monitoring" di App.jsx
      label: "Monitoring & Report",
      icon: <BarChart3 size={20} />
    },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.id === 'settings') {
      return user?.role === 'admin';
    }
    return true;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogin(false);
    navigate("/login");
  };

  return (
    <aside
      className={`
        ${isOpen ? "w-64" : "w-20"} 
        bg-white border-r border-slate-200/60 transition-all duration-500 
        flex flex-col fixed h-full z-50 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)]
      `}
    >
      {/* --- LOGO SECTION --- */}
      <div className={`h-20 flex items-center ${isOpen ? "px-6 justify-between" : "justify-center"}`}>
        {isOpen ? (
          <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-500">
            <div className="w-9 h-9 bg-[#336B87] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[10px] font-black text-[#336B87] tracking-[0.2em] uppercase leading-none">
                Pipe
              </h1>
              <h1 className="text-lg font-black text-slate-800 tracking-tighter uppercase leading-none mt-1">
                Analytica
              </h1>
            </div>
          </div>
        ) : (
          <div className="w-12 h-12 bg-[#336B87]/5 rounded-xl flex items-center justify-center text-[#336B87] hover:bg-[#336B87] hover:text-white transition-all duration-300 cursor-pointer shadow-sm">
            <ShieldCheck size={24} />
          </div>
        )}
      </div>

      {/* --- MENU NAVIGATION --- */}
      <nav className="flex-1 px-3 space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);     // Mengubah status menu aktif di UI
                navigate(`/${item.id}`);    // Memicu perpindahan halaman React Router secara aman
              }}
              className={`
                flex items-center gap-3.5 w-full px-3.5 py-3 rounded-xl 
                transition-all duration-300 group relative
                ${isActive
                  ? "bg-[#336B87] text-white shadow-lg shadow-blue-900/15"
                  : "text-slate-400 hover:bg-slate-50 hover:text-[#336B87]"
                }
              `}
            >
              <span className={`
                transition-transform duration-500 
                ${isActive ? "scale-110" : "group-hover:scale-110"}
              `}>
                {item.icon}
              </span>

              {isOpen && (
                <span className={`text-[13px] font-bold tracking-tight whitespace-nowrap ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
                  {item.label}
                </span>
              )}

              {!isOpen && (
                <div className="absolute left-[115%] ml-2 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-8px] group-hover:translate-x-0 whitespace-nowrap z-[100]">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* --- INFO USER --- */}
      {isOpen && user && (
        <div className="mx-4 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in duration-700">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Logged in as</p>
          <p className="text-xs font-bold text-[#336B87] truncate">{user.username || 'User'}</p>
          <span className="text-[8px] px-2 py-0.5 bg-[#336B87]/10 text-[#336B87] rounded-md font-black uppercase mt-1 inline-block">
            {user.role}
          </span>
        </div>
      )}

      {/* --- BOTTOM ACTIONS --- */}
      <div className="p-3 space-y-2 mb-2">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-11 bg-slate-50 text-slate-400 hover:text-[#336B87] rounded-xl transition-all border border-slate-100 group"
        >
          <div className={`transition-transform duration-500 ${!isOpen ? "rotate-180" : ""}`}>
            <ChevronLeft size={18} />
          </div>
          {isOpen && <span className="ml-3 text-[10px] font-black uppercase tracking-widest">Minimize</span>}
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full h-11 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all font-black group"
        >
          <LogOut size={18} />
          {isOpen && <span className="ml-3 text-[10px] uppercase tracking-widest">Exit System</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;