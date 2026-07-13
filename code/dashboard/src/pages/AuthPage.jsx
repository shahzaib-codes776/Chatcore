import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { api } from "../api/client";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await api.signup(form.name, form.email, form.password);
        const result = await api.login(form.email, form.password);
        localStorage.setItem("chatcore_token", result.token);
      } else {
        const result = await api.login(form.email, form.password);
        localStorage.setItem("chatcore_token", result.token);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>
            <Sparkles size={16} color="#0B0E14" />
          </div>
          <span style={styles.logoText}>ChatCore</span>
        </div>

        <h1 style={styles.heading}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={styles.subheading}>
          {mode === "login"
            ? "Log in to manage your AI chat widget."
            : "Set up your business in a few seconds."}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>BUSINESS NAME</label>
              <input
                style={styles.input}
                placeholder="e.g. Ali Traders"
                value={form.name}
                onChange={update("name")}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>EMAIL</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@business.com"
              value={form.email}
              onChange={update("email")}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={update("password")}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : null}
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </button>
        </form>

        <div style={styles.switchRow}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <span
            style={styles.switchLink}
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </span>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-base)",
  },
  card: {
    width: 380,
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 16,
    padding: "32px 28px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 28 },
  logoMark: {
    width: 26,
    height: 26,
    borderRadius: 7,
    background: "var(--accent-teal)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 16,
  },
  heading: {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 22,
    marginBottom: 6,
  },
  subheading: {
    color: "var(--text-secondary)",
    fontSize: 13.5,
    marginBottom: 24,
  },
  field: { marginBottom: 16 },
  label: {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 8,
    padding: "10px 12px",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
  },
  error: {
    color: "var(--error)",
    fontSize: 12.5,
    marginBottom: 14,
  },
  button: {
    width: "100%",
    padding: "11px 16px",
    borderRadius: 9,
    border: "none",
    background: "var(--accent-teal)",
    color: "#0B0E14",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  switchRow: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  switchLink: {
    color: "var(--accent-teal)",
    cursor: "pointer",
    fontWeight: 500,
  },
};
