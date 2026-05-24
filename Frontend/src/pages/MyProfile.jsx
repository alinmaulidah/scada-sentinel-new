import React from "react";

import {
  UserCircle2,
  Mail,
  ShieldCheck,
  Phone,
  MapPin,
  Pencil,
  BadgeCheck,
} from "lucide-react";

const MyProfile = () => {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div className="flex items-center gap-5">

            {/* AVATAR */}

            <div className="w-28 h-28 rounded-[2rem] bg-[#336B87]/10 flex items-center justify-center text-[#336B87]">

              <UserCircle2 size={70} />

            </div>

            {/* INFO */}

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-3xl font-black text-slate-800">
                  {user?.username || "Administrator"}
                </h1>

                <BadgeCheck
                  size={22}
                  className="text-[#336B87]"
                />

              </div>

              <p className="text-slate-500 font-semibold mt-1">
                SCADA Monitoring Engineer
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#336B87]/10 text-[#336B87]">

                <ShieldCheck size={16} />

                <span className="text-xs font-black uppercase tracking-wider">
                  {user?.role || "Admin"}
                </span>

              </div>

            </div>

          </div>

          {/* BUTTON */}

          <button className="h-12 px-6 rounded-2xl bg-[#336B87] hover:bg-[#28566d] text-white flex items-center gap-3 font-black uppercase tracking-wider text-xs transition-all">

            <Pencil size={16} />

            Edit Profile

          </button>

        </div>

      </div>

      {/* DETAILS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PERSONAL */}

        <div className="bg-white rounded-[2rem] border border-slate-200 p-7 shadow-sm">

          <h2 className="text-lg font-black text-slate-800 mb-6">
            Personal Information
          </h2>

          <div className="space-y-5">

            <InfoItem
              icon={<Mail size={18} />}
              label="Email Address"
              value="admin@pipeanalytica.io"
            />

            <InfoItem
              icon={<Phone size={18} />}
              label="Phone Number"
              value="+62 812-3456-7890"
            />

            <InfoItem
              icon={<MapPin size={18} />}
              label="Location"
              value="Cirebon, Indonesia"
            />

          </div>

        </div>

        {/* ACCOUNT */}

        <div className="bg-white rounded-[2rem] border border-slate-200 p-7 shadow-sm">

          <h2 className="text-lg font-black text-slate-800 mb-6">
            Account Information
          </h2>

          <div className="space-y-5">

            <InfoItem
              icon={<ShieldCheck size={18} />}
              label="Role"
              value={user?.role || "Administrator"}
            />

            <InfoItem
              icon={<UserCircle2 size={18} />}
              label="Username"
              value={user?.username || "admin"}
            />

            <InfoItem
              icon={<BadgeCheck size={18} />}
              label="Account Status"
              value="Active & Verified"
            />

          </div>

        </div>

      </div>

    </div>
  );
};

const InfoItem = ({
  icon,
  label,
  value,
}) => (

  <div className="flex items-start gap-4">

    <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-[#336B87]">

      {icon}

    </div>

    <div>

      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-800 mt-1">
        {value}
      </p>

    </div>

  </div>
);

export default MyProfile;