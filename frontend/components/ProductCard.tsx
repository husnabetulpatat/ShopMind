"use client";

import PriceTrend from "./PriceTrend";

interface Product {
  name: string;
  price: number;
  url: string;
  platform: string;
  rating: number;
  review_count: number;
  sentiment_score: number;
  sentiment_label: string;
  price_trend: string;
  price_change_pct: number;
  key_positives?: string[];
  key_negatives?: string[];
}

interface Props {
  product: Product;
  isRecommended?: boolean;
}

const TREND_ICON: Record<string, string> = { falling: "↓", rising: "↑", stable: "→" };
const TREND_COLOR: Record<string, string> = { falling: "var(--green)", rising: "var(--red)", stable: "var(--muted)" };
const SENTIMENT_COLOR: Record<string, string> = { positive: "var(--green)", neutral: "var(--amber)", negative: "var(--red)" };

export default function ProductCard({ product, isRecommended }: Props) {
  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${isRecommended ? "var(--green)" : "var(--border)"}`,
      borderRadius: 12,
      padding: "16px",
      position: "relative",
      animation: "slide-up 0.3s ease forwards",
    }}>
      {isRecommended && (
        <div style={{
          position: "absolute", top: -10, left: 16,
          background: "var(--green)", color: "#000",
          fontSize: 11, fontWeight: 600,
          padding: "2px 10px", borderRadius: 20,
        }}>ÖNERİLEN</div>
      )}

      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: "var(--text)", marginBottom: 4 }}>
          {product.name}
        </p>
        <span style={{
          fontSize: 11, background: "var(--surface2)",
          border: "1px solid var(--border)", borderRadius: 6,
          padding: "2px 8px", color: "var(--muted)",
        }}>{product.platform}</span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
          {product.price.toLocaleString("tr-TR")} ₺
        </span>
        <span style={{ fontSize: 13, color: TREND_COLOR[product.price_trend] || "var(--muted)", fontWeight: 500 }}>
          {TREND_ICON[product.price_trend]} {Math.abs(product.price_change_pct).toFixed(1)}%
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Puan</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{product.rating > 0 ? product.rating.toFixed(1) : "—"}</div>
          {product.review_count > 0 && <div style={{ fontSize: 10, color: "var(--muted)" }}>{product.review_count} yorum</div>}
        </div>
        <div style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Duygu</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: SENTIMENT_COLOR[product.sentiment_label] || "var(--muted)" }}>
            {product.sentiment_label === "positive" ? "Olumlu" : product.sentiment_label === "negative" ? "Olumsuz" : "Nötr"}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>{(product.sentiment_score * 100).toFixed(0)}%</div>
        </div>
      </div>

      {product.key_positives && product.key_positives.slice(0, 2).map((pos, i) => (
        <div key={i} style={{ fontSize: 12, color: "var(--green)", marginBottom: 2 }}>+ {pos}</div>
      ))}
      {product.key_negatives && product.key_negatives.slice(0, 1).map((neg, i) => (
        <div key={i} style={{ fontSize: 12, color: "var(--red)", marginBottom: 2 }}>− {neg}</div>
      ))}

      <PriceTrend
        productName={product.name}
        currentPrice={product.price}
        trend={product.price_trend}
        changePct={product.price_change_pct}
      />

      {product.url && (
        <a href={product.url} target="_blank" rel="noopener noreferrer" style={{
          display: "block", textAlign: "center", padding: "8px", marginTop: 12,
          background: isRecommended ? "var(--green)" : "var(--surface2)",
          color: isRecommended ? "#000" : "var(--text)",
          borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none",
          border: `1px solid ${isRecommended ? "var(--green)" : "var(--border)"}`,
        }}>Ürüne Git →</a>
      )}
    </div>
  );
}
