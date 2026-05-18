"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import DecisionPanel from "./DecisionPanel";

interface HistoryItem {
  id: number;
  query: string;
  result_summary: string;
  decision_action: string;
  recommended_name: string;
  recommended_price: string;
  products: any[];
  decision: any;
  budget: any;
  date: string;
}

interface Props {
  token: string;
  onReanalyze: (query: string) => void;
  onBack: () => void;
}

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  buy_now: { label: "Şimdi Al", color: "var(--green)" },
  wait: { label: "Bekle", color: "var(--amber)" },
  consider_alternative: { label: "Alternatif", color: "var(--muted)" },
};

export default function HistoryPage({ token, onReanalyze, onBack }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    fetch("/api/auth/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (selected) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSelected(null)} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "6px 14px", fontSize: 13,
            color: "var(--muted)", cursor: "pointer",
          }}>← Geçmişe Dön</button>
          <p style={{ fontSize: 14, color: "var(--text)", flex: 1 }}>"{selected.query}"</p>
          <button onClick={() => { onReanalyze(selected.query); }} style={{
            background: "var(--green)", border: "none",
            borderRadius: 8, padding: "7px 16px", fontSize: 13,
            color: "#000", fontWeight: 600, cursor: "pointer",
          }}>🔄 Yeniden Analiz Et</button>
        </div>

        {selected.decision && (
          <DecisionPanel decision={selected.decision} budget={selected.budget} />
        )}

        {selected.products && selected.products.length > 0 && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>
              Ürünler ({selected.products.length})
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 14,
            }}>
              {selected.products.map((product, i) => (
                <ProductCard
                  key={i}
                  product={product}
                  isRecommended={
                    selected.decision?.recommended?.name === product.name &&
                    selected.decision?.recommended?.price === product.price
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "6px 14px", fontSize: 13,
          color: "var(--muted)", cursor: "pointer",
        }}>← Geri</button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>
          Arama Geçmişim
        </h1>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          Yükleniyor...
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{
          textAlign: "center", padding: 60,
          color: "var(--muted)", fontSize: 14,
        }}>
          Henüz arama geçmişin yok.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => {
          const cfg = ACTION_LABEL[item.decision_action] || { label: "—", color: "var(--muted)" };
          const date = new Date(item.date).toLocaleString("tr-TR", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          });
          return (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12, padding: "14px 16px",
                cursor: "pointer", transition: "border-color 0.15s",
                display: "flex", alignItems: "center", gap: 14,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.query}
                </p>
                {item.recommended_name && (
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.recommended_name} — {Number(item.recommended_price).toLocaleString("tr-TR")} ₺
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: cfg.color }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{date}</span>
                <span style={{ fontSize: 12, color: "var(--green)" }}>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
