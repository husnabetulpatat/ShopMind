"use client";

interface Decision {
  action: string;
  recommended: any;
  reason: string;
  wait_days?: number | null;
  expected_drop_pct?: number | null;
  score_breakdown?: {
    price_score: number;
    quality_score: number;
    timing_score: number;
  };
}

interface Props {
  decision: Decision;
  budget?: any;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  buy_now: { label: "Şimdi Al", color: "#000", bg: "var(--green)", icon: "✓" },
  wait: { label: "Bekle", color: "#000", bg: "var(--amber)", icon: "⏳" },
  consider_alternative: { label: "Alternatif Düşün", color: "var(--text)", bg: "var(--surface2)", icon: "↗" },
};

export default function DecisionPanel({ decision, budget }: Props) {
  const cfg = ACTION_CONFIG[decision.action] || ACTION_CONFIG.buy_now;
  const scores = decision.score_breakdown;

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "20px",
      marginBottom: 24,
      animation: "slide-up 0.3s ease forwards",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          background: cfg.bg,
          color: cfg.color,
          borderRadius: 10,
          padding: "8px 20px",
          fontSize: 16,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </div>
        {decision.action === "wait" && decision.wait_days && (
          <span style={{ fontSize: 13, color: "var(--amber)" }}>
            {decision.wait_days} gün
            {decision.expected_drop_pct ? ` · %${decision.expected_drop_pct.toFixed(0)} düşüş bekleniyor` : ""}
          </span>
        )}
      </div>

      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: scores ? 16 : 0 }}>
        {decision.reason}
      </p>

      {scores && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {[
            { label: "Fiyat", value: scores.price_score },
            { label: "Kalite", value: scores.quality_score },
            { label: "Zamanlama", value: scores.timing_score },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1,
              minWidth: 80,
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "10px 12px",
            }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  flex: 1,
                  height: 4,
                  background: "var(--border)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${value * 10}%`,
                    height: "100%",
                    background: value >= 7 ? "var(--green)" : value >= 4 ? "var(--amber)" : "var(--red)",
                    borderRadius: 2,
                  }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", minWidth: 20 }}>
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {budget && (
        <div style={{
          marginTop: 14,
          padding: "10px 14px",
          background: "var(--surface2)",
          borderRadius: 8,
          border: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--muted)",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <span>Bütçe: <strong style={{ color: "var(--text)" }}>{budget.stated_budget?.toLocaleString("tr-TR")} ₺</strong></span>
          {budget.installment_months > 0 && (
            <span>{budget.installment_months} taksit: <strong style={{ color: "var(--text)" }}>{budget.monthly_payment?.toLocaleString("tr-TR")} ₺/ay</strong></span>
          )}
          <span>USD: <strong style={{ color: "var(--text)" }}>{budget.usd_rate?.toFixed(2)}</strong></span>
          <span>EUR: <strong style={{ color: "var(--text)" }}>{budget.eur_rate?.toFixed(2)}</strong></span>
        </div>
      )}
    </div>
  );
}
