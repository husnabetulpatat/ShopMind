"use client";

import { useState, useRef, useEffect } from "react";
import AgentTracer from "./AgentTracer";
import ProductCard from "./ProductCard";
import DecisionPanel from "./DecisionPanel";

const EXAMPLE_QUERIES = [
  "Annem için 10 bin TL bütçeyle tablet öner",
  "En iyi 5000 TL altı oyuncu kulaklığı",
  "Samsung Galaxy A55 mi iPhone 13 mi almalıyım, 20k bütçem var",
  "Ev ofisi için 15.000 TL bütçeyle laptop",
];

interface TraceEntry {
  agent: string;
  status: string;
  summary: string;
}

interface AnalysisResult {
  products: any[];
  decision: any;
  budget: any;
  trace: TraceEntry[];
  errors: string[];
}

type Phase = "idle" | "analyzing" | "done" | "error";

interface ChatProps { token?: string; initialQuery?: string; onQueryUsed?: () => void }

export default function ChatInterface({ token, initialQuery, onQueryUsed }: ChatProps) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);


  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setTimeout(() => analyze(initialQuery), 100);
      onQueryUsed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);
  const analyze = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || phase === "analyzing") return;

    setPhase("analyzing");
    setTrace([]);
    setActiveAgent(null);
    setResult(null);
    setError("");

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/analyze";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ query: trimmed, token: token || "" }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "agent_start") {
        setActiveAgent(msg.agent);
      } else if (msg.type === "agent_done") {
        setActiveAgent(null);
        setTrace((prev) => [...prev, {
          agent: msg.agent,
          status: msg.status,
          summary: msg.summary,
        }]);
      } else if (msg.type === "complete") {
        setResult({
          products: msg.products || [],
          decision: msg.decision,
          budget: msg.budget,
          trace: msg.trace || [],
          errors: msg.errors || [],
        });
        setPhase("done");
        ws.close();
      } else if (msg.type === "error") {
        setError(msg.message || "Bilinmeyen hata");
        setPhase("error");
        ws.close();
      }
    };

    ws.onerror = () => {
      setError("Sunucuya bağlanılamadı. Backend çalışıyor mu?");
      setPhase("error");
    };

    ws.onclose = () => {
      setActiveAgent(null);
    };
  };

  const reset = () => {
    setPhase("idle");
    setTrace([]);
    setActiveAgent(null);
    setResult(null);
    setError("");
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            background: "var(--green)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>
            🛒
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)" }}>ShopMind</h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          Bütçen, fiyat trendleri ve kullanıcı yorumlarını analiz eden yapay zeka alışveriş asistanı
        </p>
      </div>

      {/* Search box */}
      {phase === "idle" && (
        <div style={{ animation: "slide-up 0.3s ease forwards" }}>
          <div style={{
            display: "flex",
            gap: 8,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "6px 6px 6px 16px",
            marginBottom: 16,
          }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze(query)}
              placeholder="Ne almak istiyorsun? Bütçeni de belirt..."
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: 15,
              }}
            />
            <button
              onClick={() => analyze(query)}
              disabled={!query.trim()}
              style={{
                background: query.trim() ? "var(--green)" : "var(--surface2)",
                color: query.trim() ? "#000" : "var(--muted)",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: query.trim() ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              Analiz Et
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => { setQuery(q); analyze(q); }}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  color: "var(--muted)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "var(--green)";
                  (e.target as HTMLButtonElement).style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.target as HTMLButtonElement).style.color = "var(--muted)";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query display during analysis */}
      {phase !== "idle" && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}>
          <p style={{ fontSize: 14, color: "var(--text)" }}>"{query}"</p>
          {phase === "done" && (
            <button onClick={reset} style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 12,
              color: "var(--muted)",
              cursor: "pointer",
              flexShrink: 0,
            }}>
              Yeni Arama
            </button>
          )}
        </div>
      )}

      {/* Agent tracer — visible during and after analysis */}
      {(phase === "analyzing" || phase === "done") && (
        <AgentTracer trace={trace} activeAgent={activeAgent} />
      )}

      {/* Loading state */}
      {phase === "analyzing" && trace.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px", color: "var(--muted)", fontSize: 14 }}>
          Ajanlar başlatılıyor...
        </div>
      )}

      {/* Error */}
      {phase === "error" && (
        <div style={{
          background: "#1a0a0a",
          border: "1px solid var(--red)",
          borderRadius: 12,
          padding: "16px",
          marginBottom: 16,
        }}>
          <p style={{ color: "var(--red)", fontSize: 14, marginBottom: 12 }}>Hata: {error}</p>
          <button onClick={reset} style={{
            background: "var(--red)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            cursor: "pointer",
          }}>
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Results */}
      {phase === "done" && result && (
        <div style={{ animation: "slide-up 0.3s ease forwards" }}>
          {result.decision && (
            <DecisionPanel decision={result.decision} budget={result.budget} />
          )}

          {result.products.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>
                Bulunan Ürünler ({result.products.length})
              </h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 14,
                marginBottom: 24,
              }}>
                {result.products.map((product, i) => (
                  <ProductCard
                    key={i}
                    product={product}
                    isRecommended={
                      result.decision?.recommended?.name === product.name &&
                      result.decision?.recommended?.price === product.price
                    }
                  />
                ))}
              </div>
            </>
          )}

          {false && (result?.errors?.length ?? 0) > 0 && (
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "12px 16px",
              marginTop: 8,
            }}>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Notlar:</p>
              {result?.errors?.map((err, i) => (
                <p key={i} style={{ fontSize: 12, color: "var(--red)" }}>{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
