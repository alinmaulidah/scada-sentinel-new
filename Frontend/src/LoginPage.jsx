import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import {
  BrainCircuit,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import api from "./lib/api";
import { saveSession } from "./lib/session";

function Login({ onLogin }) {

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const navigate = useNavigate();

  /* =========================================
     AUTO FILL REMEMBER ME
  ========================================= */

  useEffect(() => {

    const savedUser =
      localStorage.getItem(
        "remembered_username"
      );

    if (savedUser) {

      setUsername(savedUser);
      setRememberMe(true);
    }

    localStorage.removeItem("remembered_password");

  }, []);

  /* =========================================
     LOGIN
  ========================================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    setErrorMessage("");

    setIsLoading(true);

    try {

      const response = await api.post("/login", { username, password });

      /* SAVE SESSION */

      saveSession(response.data);

      /* REMEMBER ME */

      if (rememberMe) {

        localStorage.setItem(
          "remembered_username",
          username
        );

      } else {

        localStorage.removeItem(
          "remembered_username"
        );

      }

      /* LOGIN SUCCESS */

      onLogin(true);

      navigate("/Dashboard");

    } catch (error) {

      const msg =
        error.response?.data?.message ||
        "Failed to connect server";

      setErrorMessage(msg);

    } finally {

      setIsLoading(false);

    }

  };

  return (

    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">

      {/* BACKGROUND GLOW */}

      <div className="absolute top-[-200px] left-[-150px] w-[400px] h-[400px] bg-[#336B87]/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-[-180px] right-[-100px] w-[350px] h-[350px] bg-cyan-200/30 rounded-full blur-3xl"></div>

      {/* CARD */}

      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200 shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden">

        {/* TOP BAR */}

        <div className="h-1 w-full bg-gradient-to-r from-[#336B87] via-cyan-400 to-[#336B87]"></div>

        <div className="p-10">

          {/* HEADER */}

          <div className="flex flex-col items-center mb-10">

            

            

            <img
              src="/logo-pipeline.png"
              alt="Pipeline Analytica"
              className="w-24 h-24 object-contain"
            />

            
          </div>

          {/* ERROR */}

          {errorMessage && (

            <div className="mb-5 flex items-start gap-2 g-red-50 border border-red-100 text-red-500 px-4 py-3 rounded-2xl">

              <AlertTriangle size={18} />

              <div>

                <p className="text-xs font-black uppercase tracking-widest">
                  Login Failed
                </p>

                <p className="text-xs mt-1">
                  {errorMessage}
                </p>

              </div>

            </div>

          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* USERNAME */}

            <div>

              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">

                Username

              </label>

              <div className="mt-2 flex items-center gap-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-[#336B87]/10 focus-within:border-[#336B87] transition-all">

                <User
                  size={18}
                  className="text-slate-400"
                />

                <input
                  type="text"
                  placeholder=" username"
                  className="w-full bg-transparent py-4 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">

                Password

              </label>

              <div className="mt-2 flex items-center gap-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-[#336B87]/10 focus-within:border-[#336B87] transition-all">

                <Lock
                  size={18}
                  className="text-slate-400"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder=" password"
                  className="w-full bg-transparent py-4 outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="text-slate-400 hover:text-[#336B87] transition-colors"
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>

            {/* REMEMBER */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#336B87] focus:ring-[#336B87]"
                />

                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">

                  Remember Me

                </span>

              </div>

              <div className="flex items-center gap-1 text-emerald-600">

                <ShieldCheck size={14} />

                <span className="text-[10px] font-black uppercase tracking-widest">

                  Secure Access

                </span>

              </div>

            </div>

            {/* BUTTON */}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-white transition-all duration-300 shadow-lg active:scale-[0.98]
              
              ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#336B87] hover:shadow-blue-900/20 hover:-translate-y-0.5"
              }`}
            >

              {isLoading
                ? "Verifying..."
                : "Sign In to System"}

            </button>

          </form>

          {/* FOOTER */}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">

          </div>

        </div>

      </div>

    </div>

  );

}

export default Login;
