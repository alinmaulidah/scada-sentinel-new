import React, { useState, useRef, useEffect } from "react";
import { clearSession, getSessionUser, setSessionUser } from "../lib/session";
import api from "../lib/api";

import {
  UserCircle,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Clock3,
  Menu,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const Header = ({ activePage, onLogin, onToggleSidebar }) => {

  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [time, setTime] = useState(new Date());

  const dropdownRef = useRef(null);

  /* =========================
     REALTIME CLOCK
  ========================= */

  useEffect(() => {

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);

  }, []);

  /* =========================
     CLOSE DROPDOWN
  ========================= */

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }

    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

  }, []);

  const [profile, setProfile] = useState(() => getSessionUser() || {});

  useEffect(() => {
    let active = true;
    const syncProfile = () => {
      api.get("/profile").then(({ data }) => {
        if (!active || !data?.success) return;
        setProfile(data.data);
        setSessionUser({ ...getSessionUser(), ...data.data });
      }).catch(() => {});
    };

    syncProfile();
    window.addEventListener("profile-updated", syncProfile);
    return () => {
      active = false;
      window.removeEventListener("profile-updated", syncProfile);
    };
  }, []);

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {

    // HAPUS SEMUA SESSION
    clearSession();

    // OPTIONAL
    if (onLogin) {
      onLogin(false);
    }

    // TUTUP DROPDOWN
    setIsProfileOpen(false);

    // PINDAH KE LOGIN
    navigate("/login", { replace: true });

  };

  return (
    <header className="sticky top-0 z-40">

      {/* TOP LINE */}

      <div className="h-[2px] bg-gradient-to-r from-[#336B87] via-cyan-400 to-[#336B87]"></div>

      <div className="min-h-16 bg-white/70 backdrop-blur-2xl border-b border-slate-200 px-3 py-3 sm:h-20 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm gap-3">

        {/* LEFT */}

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button onClick={onToggleSidebar} className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Buka menu navigasi">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex flex-col">

          <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.08em] sm:gap-2 sm:tracking-[0.2em]">

            <img src="/logo-pipeline.png" alt="Pipeline Analytica" className="w-5 h-5 object-contain" />

            <span className="hidden sm:inline">Pipeline Analytica</span>

            <span className="hidden sm:inline">/</span>

            <span className="truncate text-[#336B87]">
              {activePage}
            </span>

          </div>

          <h2 className="truncate text-base sm:text-xl font-black text-slate-800 capitalize mt-1">
            {activePage.replace("-", " ")}
          </h2>
          </div>
        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-2 sm:gap-5 shrink-0">

          {/* CLOCK */}

          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200">

            <Clock3
              size={14}
              className="text-[#336B87]"
            />

            <span className="text-xs font-black text-slate-700">
              {time.toLocaleTimeString()}
            </span>

          </div>

          {/* STATUS */}

          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">

            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>

            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              Mode Penelitian
            </span>

          </div>

          {/* PROFILE AREA */}

          <div className="flex items-center gap-2 sm:gap-4 border-l border-slate-200 pl-3 sm:pl-5">

            {/* PROFILE */}

            <div
              className="relative"
              ref={dropdownRef}
            >

              <div
                onClick={() =>
                  setIsProfileOpen(!isProfileOpen)
                }
                className="flex items-center gap-3 cursor-pointer"
              >

                <div className="text-right hidden sm:block">

                  <p className="text-xs font-black text-slate-800">
                    {profile.username || "Administrator"}
                  </p>

                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {profile.role || "SCADA Engineer"}
                  </p>

                </div>

                <div className="relative">

                  <div className="w-11 h-11 rounded-2xl bg-[#336B87]/10 text-[#336B87] flex items-center justify-center">

                    <UserCircle size={25} />

                  </div>

                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-slate-200 flex items-center justify-center">

                    <ChevronDown
                      size={10}
                      className="text-slate-400"
                    />

                  </div>

                </div>

              </div>

              {/* PROFILE DROPDOWN */}

              {isProfileOpen && (

                <div className="absolute top-full right-0 mt-4 w-64 bg-white rounded-[1.8rem] shadow-2xl border border-slate-100 py-3 animate-in fade-in zoom-in-95 duration-300">

                  <div className="px-5 py-3 border-b border-slate-100">

                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Signed in as
                    </p>

                    <p className="text-sm font-black text-slate-800 mt-1">
                      {profile.email || "Email belum dikonfigurasi"}
                    </p>

                  </div>

                  <div className="px-2 py-2 space-y-1">

                    <DropdownItem
                      icon={<User size={16} />}
                      label="My Profile"
                      onClick={() =>
                        navigate("/myprofile")
                      }
                    />

                    <DropdownItem
                      icon={<Settings size={16} />}
                      label="Settings"
                      onClick={() =>
                        navigate("/settings")
                      }
                    />

                  </div>

                  {/* LOGOUT */}

                  <div className="px-2 pt-2 border-t border-slate-100">

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all text-xs font-black uppercase tracking-widest"
                    >

                      <LogOut size={16} />

                      Sign Out

                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </header>
  );
};

const DropdownItem = ({
  icon,
  label,
  onClick,
}) => (

  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-[#336B87] rounded-2xl transition-all text-xs font-bold"
  >

    <span className="text-slate-400">
      {icon}
    </span>

    {label}

  </button>
);

export default Header;
