import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  LogOut,
  Save,
  MessageCircle,
  Loader2,
  Check,
  Upload,
} from "lucide-react";
import { api } from "../api/client";

export default function DashboardPage() {
  const [business, setBusiness] = useState(null);
  const [leads, setLeads] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [openConvo, setOpenConvo] = useState(null);
  const [convoMessages, setConvoMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [analytics, setAnalytics] = useState({ total: 0, daily: [] });
  const [infoDraft, setInfoDraft] = useState("");
  const [widgetColor, setWidgetColor] = useState("#14E8B4");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getMe()
      .then((data) => {
        setBusiness(data.business);
        setInfoDraft(data.business.business_info || "");
        setWidgetColor(data.business.widget_color || "#14E8B4");
        setWelcomeMsg(
          data.business.welcome_message ||
            "Hi! Ask me anything about this business.",
        );
      })
      .catch(() => {
        localStorage.removeItem("chatcore_token");
        navigate("/");
      })
      .finally(() => setLoading(false));

    api
      .getLeads()
      .then((data) => setLeads(data.leads))
      .catch(() => {});

    api
      .getConversations()
      .then((data) => setConversations(data.conversations))
      .catch(() => {});

    api
      .getAnalytics()
      .then((data) => setAnalytics(data))
      .catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem("chatcore_token");
    navigate("/");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const data = await api.updateBusinessInfo(infoDraft);
      setBusiness(data.business);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleBrandingSave() {
    try {
      await api.updateBranding(widgetColor, welcomeMsg);
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 2000);
    } catch (err) {
      console.error(err.message);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const data = await api.uploadDocument(file);
      setBusiness(data.business);
      setInfoDraft(data.business.business_info);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleWebsiteImport() {
    if (!websiteUrl.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const data = await api.importWebsite(websiteUrl.trim());
      setBusiness(data.business);
      setInfoDraft(data.business.business_info);
      setWebsiteUrl("");
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  }

  async function openConversation(id) {
    setOpenConvo(id);
    try {
      const data = await api.getConversationMessages(id);
      setConvoMessages(data.messages);
    } catch (err) {
      console.error(err.message);
    }
  }

  async function sendReply() {
    if (!replyText.trim() || !openConvo) return;
    setReplying(true);
    try {
      await api.replyToConversation(openConvo, replyText);
      setConvoMessages((prev) => [
        ...prev,
        { sender: "business", content: replyText, created_at: new Date() },
      ]);
      setReplyText("");
      const updated = await api.getConversations();
      setConversations(updated.conversations);
    } catch (err) {
      console.error(err.message);
    } finally {
      setReplying(false);
    }
  }

  if (loading) {
    return <div style={styles.loadingPage}>Loading your dashboard...</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>
            <Sparkles size={16} color="#0B0E14" />
          </div>
          <span style={styles.logoText}>ChatCore</span>
        </div>
        <div style={styles.topbarRight}>
          <span style={styles.businessName}>{business?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          {/* LEFT: business info editor */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardEyebrow}>KNOWLEDGE BASE</span>
              <h2 style={styles.cardTitle}>What should ChatCore know?</h2>
              <p style={styles.cardSubtitle}>
                Describe your business, services, pricing, and common questions.
                Your widget answers visitors using only what you write here.
              </p>
            </div>

            <textarea
              style={styles.textarea}
              value={infoDraft}
              onChange={(e) => setInfoDraft(e.target.value)}
              placeholder="e.g. We are a clothing store based in Rawalpindi. We sell shirts, jeans, and shoes. Delivery takes 3-5 days across Pakistan. We accept cash on delivery and bank transfer..."
            />

            <div style={{ marginBottom: 16 }}>
              <label style={styles.uploadBtn}>
                {uploading ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Upload size={14} />
                )}
                {uploading ? "Processing..." : "Upload a PDF document"}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
              {uploadError && <div style={styles.error}>{uploadError}</div>}
            </div>

            <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
              <input
                style={{ ...styles.input, flex: 1 }}
                placeholder="https://yourbusiness.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
              <button
                style={{
                  ...styles.uploadBtn,
                  border: "1px solid var(--border-subtle)",
                }}
                onClick={handleWebsiteImport}
                disabled={importing}
              >
                {importing ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Upload size={14} />
                )}
                {importing ? "Importing..." : "Import from website"}
              </button>
            </div>
            {importError && <div style={styles.error}>{importError}</div>}

            {error && <div style={styles.error}>{error}</div>}

            <button
              style={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2
                  size={15}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : saved ? (
                <Check size={15} />
              ) : (
                <Save size={15} />
              )}
              {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
            </button>
          </section>

          {/* RIGHT: live widget preview (signature element) */}
          <section style={styles.previewCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardEyebrow}>LIVE PREVIEW</span>
              <h2 style={styles.cardTitle}>Your widget</h2>
              <p style={styles.cardSubtitle}>
                This is what visitors on your website will see.
              </p>
            </div>

            <div style={styles.widgetMock}>
              <div style={styles.widgetHeader}>
                <MessageCircle size={14} color="#0B0E14" />
                <span style={styles.widgetHeaderText}>
                  {business?.name || "Your Business"}
                </span>
              </div>
              <div style={styles.widgetBody}>
                <div style={styles.botBubble}>
                  Hi! I'm the assistant for {business?.name || "your business"}.
                  Ask me anything about our services.
                </div>
                {infoDraft ? (
                  <div style={styles.userBubble}>What do you offer?</div>
                ) : (
                  <div style={styles.emptyHint}>
                    Add your business info on the left to see smarter answers
                    here.
                  </div>
                )}
              </div>
              <div style={styles.widgetInputRow}>
                <div style={styles.widgetInput}>Type a message...</div>
              </div>
            </div>

            <div style={styles.embedBox}>
              <span style={styles.embedLabel}>EMBED CODE</span>
              <code style={styles.embedCode}>
                &lt;script src="https://chartcore-widget.netlify.app/widget.js"
                data-business="
                {business?.id}"&gt;&lt;/script&gt;
              </code>
            </div>
          </section>
        </div>

        <section style={{ ...styles.card, marginTop: 20 }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardEyebrow}>ANALYTICS</span>
            <h2 style={styles.cardTitle}>Conversations over time</h2>
            <p style={styles.cardSubtitle}>
              {analytics.total} total conversation
              {analytics.total !== 1 ? "s" : ""}.
            </p>
          </div>

          {analytics.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232733" />
                <XAxis dataKey="date" stroke="#8B93A3" fontSize={12} />
                <YAxis stroke="#8B93A3" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#191D27",
                    border: "1px solid #232733",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#F7F9FA" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#14E8B4"
                  strokeWidth={2}
                  dot={{ fill: "#14E8B4" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              No data yet. Charts will appear once visitors start chatting.
            </p>
          )}
        </section>

        <section style={{ ...styles.card, marginTop: 20 }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardEyebrow}>BRANDING</span>
            <h2 style={styles.cardTitle}>Customize your widget</h2>
            <p style={styles.cardSubtitle}>Match the widget to your brand.</p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label style={styles.label}>WIDGET COLOR</label>
              <input
                type="color"
                value={widgetColor}
                onChange={(e) => setWidgetColor(e.target.value)}
                style={{
                  width: 50,
                  height: 38,
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  background: "none",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={styles.label}>WELCOME MESSAGE</label>
              <input
                style={styles.input}
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
              />
            </div>
            <button style={styles.saveBtn} onClick={handleBrandingSave}>
              {brandingSaved ? <Check size={15} /> : <Save size={15} />}
              {brandingSaved ? "Saved" : "Save branding"}
            </button>
          </div>
        </section>

        {/* LEADS SECTION */}
        <section style={{ ...styles.card, marginTop: 20 }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardEyebrow}>LEADS</span>
            <h2 style={styles.cardTitle}>People who messaged you</h2>
            <p style={styles.cardSubtitle}>
              {leads.length === 0
                ? "No conversations yet. Once your widget is live, visitors will show up here."
                : `${leads.length} conversation${leads.length > 1 ? "s" : ""} so far.`}
            </p>
          </div>

          {leads.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {lead.name || "Anonymous visitor"}
                      {lead.needs_human && (
                        <span
                          style={{
                            background: "#F87171",
                            color: "#0B0E14",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 6,
                          }}
                        >
                          NEEDS ATTENTION
                        </span>
                      )}
                    </span>
                    <span
                      style={{ color: "var(--text-secondary)", fontSize: 11.5 }}
                    >
                      {new Date(lead.created_at).toLocaleString()}
                    </span>
                  </div>
                  {lead.email && (
                    <div
                      style={{
                        color: "var(--accent-teal)",
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      {lead.email}
                    </div>
                  )}
                  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {lead.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ ...styles.card, marginTop: 20 }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardEyebrow}>CONVERSATIONS</span>
            <h2 style={styles.cardTitle}>Chat history</h2>
            <p style={styles.cardSubtitle}>
              Open a conversation to view the full thread and reply.
            </p>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div
              style={{
                flex: "0 0 240px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  style={{
                    background:
                      openConvo === c.id
                        ? "var(--accent-teal-dim)"
                        : "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    padding: 10,
                    cursor: "pointer",
                    fontSize: 12.5,
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <strong>{c.visitor_name || "Anonymous"}</strong>
                    {c.needs_human && !c.resolved && (
                      <span
                        style={{
                          background: "#F87171",
                          color: "#0B0E14",
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: 5,
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      marginTop: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.last_message}
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <p style={{ color: "var(--text-secondary)", fontSize: 12.5 }}>
                  No conversations yet.
                </p>
              )}
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {!openConvo ? (
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  Select a conversation to view it.
                </p>
              ) : (
                <>
                  <div
                    style={{
                      flex: 1,
                      maxHeight: 320,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    {convoMessages.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          alignSelf:
                            m.sender === "visitor" ? "flex-start" : "flex-end",
                          background:
                            m.sender === "visitor"
                              ? "var(--bg-elevated)"
                              : "var(--accent-teal-dim)",
                          padding: "8px 12px",
                          borderRadius: 10,
                          fontSize: 13,
                          maxWidth: "75%",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-secondary)",
                            marginBottom: 3,
                            textTransform: "uppercase",
                          }}
                        >
                          {m.sender}
                        </div>
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      style={styles.saveBtn}
                      onClick={sendReply}
                      disabled={replying}
                    >
                      {replying ? "Sending..." : "Reply"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "var(--bg-base)" },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
    background: "var(--bg-base)",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 8 },
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
  topbarRight: { display: "flex", alignItems: "center", gap: 16 },
  businessName: { color: "var(--text-secondary)", fontSize: 13.5 },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 13,
  },
  main: { padding: "32px", maxWidth: 1100, margin: "0 auto" },
  grid: { display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 },
  card: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 14,
    padding: 24,
  },
  previewCard: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 14,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  cardHeader: { marginBottom: 16 },
  cardEyebrow: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.08em",
    color: "var(--accent-teal)",
  },
  cardTitle: {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 19,
    margin: "6px 0 4px",
  },
  cardSubtitle: {
    color: "var(--text-secondary)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  textarea: {
    width: "100%",
    minHeight: 220,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 10,
    padding: 14,
    color: "var(--text-primary)",
    fontSize: 14,
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
  },
  uploadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "var(--bg-elevated)",
    border: "1px dashed var(--border-subtle)",
    borderRadius: 8,
    padding: "8px 14px",
    color: "var(--text-secondary)",
    fontSize: 13,
    cursor: "pointer",
  },
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
  error: { color: "var(--error)", fontSize: 12.5, marginTop: 10 },
  saveBtn: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--accent-teal)",
    color: "#0B0E14",
    border: "none",
    borderRadius: 9,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 13.5,
  },
  widgetMock: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 12,
    overflow: "hidden",
  },
  widgetHeader: {
    background: "var(--accent-teal)",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  widgetHeaderText: { color: "#0B0E14", fontWeight: 600, fontSize: 13 },
  widgetBody: {
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 120,
  },
  botBubble: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "10px 10px 10px 2px",
    padding: "8px 12px",
    fontSize: 12.5,
    lineHeight: 1.5,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "var(--accent-teal-dim)",
    color: "#F7F9FA",
    borderRadius: "10px 10px 2px 10px",
    padding: "8px 12px",
    fontSize: 12.5,
    maxWidth: "70%",
  },
  emptyHint: {
    color: "var(--text-secondary)",
    fontSize: 12,
    fontStyle: "italic",
  },
  widgetInputRow: {
    padding: "10px 14px",
    borderTop: "1px solid var(--border-subtle)",
  },
  widgetInput: {
    background: "var(--bg-base)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "var(--text-secondary)",
    fontSize: 12.5,
  },
  embedBox: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 10,
    padding: 12,
  },
  embedLabel: {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  embedCode: {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: 11.5,
    color: "var(--accent-teal)",
    wordBreak: "break-all",
    lineHeight: 1.6,
  },
};
