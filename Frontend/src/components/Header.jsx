import React, { useState, useRef, useEffect } from "react";

import {
  Bell,
  UserCircle,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Shield,
  Clock3,
  AlertTriangle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const Header = ({ activePage, onLogin }) => {

  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [isNotifOpen, setIsNotifOpen] =
    useState(false);

  const [time, setTime] = useState(new Date());

  const dropdownRef = useRef(null);

  const notifRef = useRef(null);

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

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setIsNotifOpen(false);
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

  /* =========================
     MOCK NOTIFICATION
  ========================= */

  const notifications = [
    {
      id: 1,
      title: "Leak Detected",
      desc: "Pressure dropped drastically",
      time: "2 min ago",
    },

    {
      id: 2,
      title: "Blockage Warning",
      desc: "Flow rate unstable",
      time: "10 min ago",
    },

    {
      id: 3,
      title: "DBSCAN Completed",
      desc: "Analysis finished successfully",
      time: "15 min ago",
    },
  ];

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {

    // HAPUS SEMUA SESSION
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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

      <div className="h-20 bg-white/70 backdrop-blur-2xl border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">

        {/* LEFT */}

        <div className="flex flex-col">

          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">

            <span>Pipe-Analytica</span>

            <span>/</span>

            <span className="text-[#336B87]">
              {activePage}
            </span>

          </div>

          <h2 className="text-xl font-black text-slate-800 capitalize mt-1">
            {activePage.replace("-", " ")}
          </h2>

        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-5">

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
              System Active
            </span>

          </div>

          {/* PROFILE AREA */}

          <div className="flex items-center gap-4 border-l border-slate-200 pl-5">

            {/* NOTIFICATION */}

            <div className="relative" ref={notifRef}>

              <button
                onClick={() =>
                  setIsNotifOpen(!isNotifOpen)
                }
                className="relative p-3 text-slate-400 hover:text-[#336B87] hover:bg-blue-50 rounded-2xl transition-all"
              >

                <Bell size={19} />

                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>

              </button>

              {/* NOTIF DROPDOWN */}

              {isNotifOpen && (

                <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-[1.8rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                  <div className="px-5 py-4 border-b border-slate-100">

                    <h3 className="text-sm font-black text-slate-800">
                      Notifications
                    </h3>

                  </div>

                  <div className="max-h-96 overflow-y-auto">

                    {notifications.map((notif) => (

                      <div
                        key={notif.id}
                        className="px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer"
                      >

                        <div className="flex items-start gap-3">

                          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center">

                            <AlertTriangle size={18} />

                          </div>

                          <div className="flex-1">

                            <h4 className="text-sm font-black text-slate-800">
                              {notif.title}
                            </h4>

                            <p className="text-xs text-slate-500 mt-1">
                              {notif.desc}
                            </p>

                            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                              {notif.time}
                            </p>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              )}

            </div>

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
                    Administrator
                  </p>

                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    SCADA Engineer
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
                      admin@pipeanalytica.io
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
                      icon={<Shield size={16} />}
                      label="Security"
                      onClick={() =>
                        navigate("/security")
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