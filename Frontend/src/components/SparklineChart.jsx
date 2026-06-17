import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";

/**
 * SPARKLINE MICRO-CHART
 * =====================
 * Komponen mini-chart untuk ditampilkan di dalam sel tabel.
 * Menampilkan tren 5 data point terakhir agar operator bisa
 * mendeteksi anomali secara visual tanpa membebani performa.
 *
 * @param {number[]} data  - Array nilai numerik (panjang bebas, diambil 5 terakhir)
 * @param {string}   color - Warna area chart (default: PRIMARY_COLOR)
 * @param {number}   width - Lebar chart (default: 80px)
 * @param {number}   height - Tinggi chart (default: 28px)
 */
export default function SparklineChart({
  data = [],
  color = "#336B87",
  width = 80,
  height = 28,
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const last5 = data.slice(-5);
    return last5.map((val, idx) => ({
      i: idx,
      value: Number(val),
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <span className="text-[10px] text-slate-300 font-mono italic">
        —
      </span>
    );
  }

  const allSame = chartData.every((d) => d.value === chartData[0].value);
  const trendColor = allSame
    ? "#94a3b8"
    : chartData[chartData.length - 1].value > chartData[0].value
      ? "#ef4444"
      : "#22c55e";

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={trendColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
        <Tooltip
          contentStyle={{
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 4,
            border: "1px solid #e2e8f0",
            background: "#fff",
          }}
          labelFormatter={() => ""}
          formatter={(val) => [val.toFixed(2), ""]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={trendColor}
          strokeWidth={1.2}
          fill={`url(#sparkGrad-${color.replace("#", "")})`}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
