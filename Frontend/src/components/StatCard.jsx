import React from "react";

const StatCard = ({ icon, label, value, color }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group">
      <div
        className={`
          ${color}
          w-14 h-14 rounded-2xl flex items-center justify-center
          text-white mb-5
          group-hover:scale-110 transition-all duration-500
        `}
      >
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>

      <h2 className="text-3xl font-black text-slate-800 mt-2">
        {value}
      </h2>
    </div>
  );
};

export default StatCard;