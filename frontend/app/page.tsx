"use client";

import { useState, useEffect } from "react";
import AuthPage from "@/components/AuthPage";
import ChatInterface from "@/components/ChatInterface";
import HistoryPage from "@/components/HistoryPage";

interface AuthUser { email: string; full_name: string; }
type View = "chat" | "history";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState<View>("chat");
  const [reanalyzeQuery, setReanalyzeQuery] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("sm_token");
    const u = localStorage.getItem("sm_user");
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    setChecking(false);
  }, []);

  const handleAuth = (t: string, u: AuthUser) => { setToken(t); setUser(u); };

  const handleLogout = () => {
    localStorage.removeItem("sm_token");
    localStorage.removeItem("sm_user");
    setToken(null); setUser(null);
  };

  const handleReanalyze = (query: string) => {
    setReanalyzeQuery(query);
    setView("chat");
  };

  if (checking) return null;
  if (!token) return <AuthPage onAuth={handleAuth} />;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Top bar */}
      <div style={{
        borderBottom: "1px solid var(--border)", padding: "10px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--surface)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛒</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>ShopMind</span>
          <span style={{
            fontSize: 10, fontWeight: 600, marginLeft: 4,
            background: "linear-gradient(90deg, #4285f4, #34a853)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Powered by Gemini</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setView(view === "history" ? "chat" : "history")}
            style={{
              background: view === "history" ? "var(--green)" : "transparent",
              border: "1px solid var(--border)", borderRadius: 8,
              padding: "5px 12px", fontSize: 12,
              color: view === "history" ? "#000" : "var(--muted)",
              cursor: "pointer", fontWeight: view === "history" ? 600 : 400,
            }}
          >
            📋 Geçmiş
          </button>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {user?.full_name || user?.email}
          </span>
          <button onClick={handleLogout} style={{
            background: "transparent", border: "1px solid var(--border)",
            borderRadius: 8, padding: "5px 12px", fontSize: 12,
            color: "var(--muted)", cursor: "pointer",
          }}>Çıkış</button>
        </div>
      </div>

      {view === "chat" ? (
        <ChatInterface token={token} initialQuery={reanalyzeQuery} onQueryUsed={() => setReanalyzeQuery("")} />
      ) : (
        <HistoryPage token={token} onReanalyze={handleReanalyze} onBack={() => setView("chat")} />
      )}
    </main>
  );
}
