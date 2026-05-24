import React, { useState } from "react";

import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Laptop,
  Clock3,
  CheckCircle2,
} from "lucide-react";

const Security = () => {

  const [showOld, setShowOld] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">

        <div className="flex items-center gap-5">

          <div className="w-20 h-20 rounded-[2rem] bg-[#336B87]/10 flex items-center justify-center text-[#336B87]">

            <ShieldCheck size={42} />

          </div>

          <div>

            <h1 className="text-3xl font-black text-slate-800">
              Security Center
            </h1>

            <p className="text-slate-500 font-semibold mt-2">
              Manage account password and login security
            </p>

          </div>

        </div>

      </div>

      {/* GRID */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* CHANGE PASSWORD */}

        <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">

          <h2 className="text-xl font-black text-slate-800 mb-8">
            Change Password
          </h2>

          <div className="space-y-6">

            {/* OLD PASSWORD */}

            <PasswordInput
              label="Current Password"
              show={showOld}
              setShow={setShowOld}
            />

            {/* NEW PASSWORD */}

            <PasswordInput
              label="New Password"
              show={showNew}
              setShow={setShowNew}
            />

            {/* CONFIRM */}

            <PasswordInput
              label="Confirm Password"
              show={showConfirm}
              setShow={setShowConfirm}
            />

            {/* BUTTON */}

            <button className="mt-3 h-14 px-8 rounded-2xl bg-[#336B87] hover:bg-[#28566d] text-white font-black uppercase tracking-widest text-xs transition-all">

              Update Password

            </button>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="space-y-6">

          {/* ACCOUNT STATUS */}

          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">

            <h3 className="text-lg font-black text-slate-800 mb-5">
              Account Protection
            </h3>

            <div className="space-y-5">

              <SecurityItem
                icon={<CheckCircle2 size={18} />}
                title="Account Status"
                value="Protected"
                green
              />

              <SecurityItem
                icon={<Laptop size={18} />}
                title="Current Device"
                value="Windows Desktop"
              />

              <SecurityItem
                icon={<Clock3 size={18} />}
                title="Last Login"
                value="Today, 08:15 AM"
              />

            </div>

          </div>

          {/* SECURITY TIPS */}

          <div className="bg-gradient-to-br from-[#336B87] to-[#28566d] rounded-[2rem] p-6 text-white shadow-lg">

            <h3 className="text-lg font-black">
              Security Tips
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-blue-100 font-medium">

              <li>
                • Use strong password combinations
              </li>

              <li>
                • Avoid sharing admin credentials
              </li>

              <li>
                • Change password regularly
              </li>

              <li>
                • Logout after using the system
              </li>

            </ul>

          </div>

        </div>

      </div>

    </div>
  );
};

const PasswordInput = ({
  label,
  show,
  setShow,
}) => (

  <div>

    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">

      {label}

    </label>

    <div className="mt-2 h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-4">

      <Lock
        size={18}
        className="text-slate-400"
      />

      <input
        type={show ? "text" : "password"}
        placeholder="••••••••••••"
        className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700"
      />

      <button
        onClick={() => setShow(!show)}
        className="text-slate-400 hover:text-[#336B87]"
      >

        {show ? (
          <EyeOff size={18} />
        ) : (
          <Eye size={18} />
        )}

      </button>

    </div>

  </div>
);

const SecurityItem = ({
  icon,
  title,
  value,
  green,
}) => (

  <div className="flex items-start gap-4">

    <div
      className={`
        w-11 h-11 rounded-2xl flex items-center justify-center
        ${green
          ? "bg-emerald-100 text-emerald-600"
          : "bg-slate-100 text-[#336B87]"
        }
      `}
    >

      {icon}

    </div>

    <div>

      <p className="text-xs font-black uppercase tracking-widest text-slate-400">

        {title}

      </p>

      <p className="text-sm font-bold text-slate-800 mt-1">

        {value}

      </p>

    </div>

  </div>
);

export default Security;