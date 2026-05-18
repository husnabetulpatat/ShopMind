"use client";

import { useState } from "react";

interface Props {
  onAuth: (token: string, user: { email: string; full_name: string }) => void;
}

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login"
      ? { email, password }
      : { email, password, full_name: fullName };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Hata oluştu");
      localStorage.setItem("sm_token", data.access_token);
      localStorage.setItem("sm_user", JSON.stringify(data.user));
      onAuth(data.access_token, data.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: "var(--green)", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, margin: "0 auto 12px",
          }}>🛒</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>ShopMind</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            Akıllı alışveriş asistanına hoş geldin
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "28px 24px",
        }}>
          {/* Tab */}
          <div style={{
            display: "flex",
            background: "var(--surface2)",
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
          }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "8px", border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: mode === m ? "var(--surface)" : "transparent",
                color: mode === m ? "var(--text)" : "var(--muted)",
                transition: "all 0.15s",
              }}>
                {m === "login" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Ad Soyad</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adın Soyadın"
                  style={{
                    width: "100%", padding: "10px 12px",
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="ornek@email.com"
                style={{
                  width: "100%", padding: "10px 12px",
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="En az 6 karakter"
                style={{
                  width: "100%", padding: "10px 12px",
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: "10px 12px",
              background: "#1a0a0a", border: "1px solid var(--red)",
              borderRadius: 8, fontSize: 13, color: "var(--red)",
            }}>{error}</div>
          )}

          <button
            onClick={submit}
            disabled={loading || !email || !password}
            style={{
              width: "100%", marginTop: 20, padding: "12px",
              background: email && password ? "var(--green)" : "var(--surface2)",
              color: email && password ? "#000" : "var(--muted)",
              border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: email && password ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            {loading ? "..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
          </button>
        </div>

        {/* Gemini badge */}
        <div style={{ textAlign: "center", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Powered by</span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            background: "linear-gradient(90deg, #4285f4, #ea4335, #fbbc04, #34a853)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Google Gemini</span>
        </div>
      </div>
    </div>
  );
}
