"use client";

const AGENTS = [
  { key: "intent", label: "Niyet" },
  { key: "finance", label: "Finans" },
  { key: "search", label: "Arama" },
  { key: "sentiment", label: "Duygu" },
  { key: "decision", label: "Karar" },
];

type AgentStatus = "idle" | "running" | "done" | "error" | "skipped" | "empty";

interface TraceEntry {
  agent: string;
  status: string;
  summary: string;
}

interface Props {
  trace: TraceEntry[];
  activeAgent: string | null;
}

export default function AgentTracer({ trace, activeAgent }: Props) {
  const getStatus = (key: string): AgentStatus => {
    if (activeAgent === key) return "running";
    const entry = trace.find((t) => t.agent === key);
    if (!entry) return "idle";
    return entry.status as AgentStatus;
  };

  const getSummary = (key: string) => {
    return trace.find((t) => t.agent === key)?.summary || "";
  };

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {AGENTS.map((agent, i) => {
          const status = getStatus(agent.key);
          const summary = getSummary(agent.key);
          const color =
            status === "done" ? "var(--green)" :
            status === "running" ? "var(--amber)" :
            status === "error" ? "var(--red)" :
            "var(--muted)";

          return (
            <div key={agent.key} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 120 }}>
              {i > 0 && (
                <div style={{ width: 16, height: 1, background: "var(--border)", flexShrink: 0 }} />
              )}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                    animation: status === "running" ? "pulse-dot 1s ease infinite" : "none",
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: status === "idle" ? "var(--muted)" : "var(--text)" }}>
                    {agent.label}
                  </span>
                </div>
                {summary && (
                  <p style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginLeft: 14,
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 180,
                  }}>
                    {summary}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
