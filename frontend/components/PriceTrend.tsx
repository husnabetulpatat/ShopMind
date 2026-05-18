"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  productName: string;
  currentPrice: number;
  trend: string;
  changePct: number;
}

function generateMockHistory(currentPrice: number, trend: string, changePct: number) {
  const points = 7;
  const data = [];
  for (let i = points; i >= 0; i--) {
    const dayLabel = i === 0 ? "Bugün" : `${i}g önce`;
    let price: number;
    if (trend === "falling") {
      price = currentPrice * (1 + (Math.abs(changePct) / 100) * (i / points)) + (Math.random() - 0.5) * currentPrice * 0.01;
    } else if (trend === "rising") {
      price = currentPrice * (1 - (Math.abs(changePct) / 100) * (i / points)) + (Math.random() - 0.5) * currentPrice * 0.01;
    } else {
      price = currentPrice + (Math.random() - 0.5) * currentPrice * 0.03;
    }
    data.push({ day: dayLabel, price: Math.round(price) });
  }
  return data;
}

const TREND_COLOR: Record<string, string> = {
  falling: "#22c55e",
  rising: "#ef4444",
  stable: "#888",
};

export default function PriceTrend({ currentPrice, trend, changePct }: Props) {
  const data = generateMockHistory(currentPrice, trend, changePct);
  const color = TREND_COLOR[trend] || "#888";

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Fiyat Trendi (7 gün)</div>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data}>
          <XAxis dataKey="day" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 11,
              color: "var(--text)",
            }}
            formatter={(value: number) => [`${value.toLocaleString("tr-TR")} ₺`, "Fiyat"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
