import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmt   = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const today = ()  => new Date().toISOString().slice(0, 10);

const STATUS_COLORS = {
  confirmed: { bg: "rgba(96,165,250,.15)",  text: "#60a5fa" },
  completed: { bg: "rgba(52,211,153,.15)",  text: "#34d399" },
  pending:   { bg: "rgba(245,158,11,.15)",  text: "#f59e0b" },
  cancelled: { bg: "rgba(239,68,68,.15)",   text: "#f87171" },
};

// ─────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const I = {
  dash:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  emp:      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  cust:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  serv:     "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  appt:     "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  add:      "M12 5v14M5 12h14",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  del:      "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  close:    "M18 6L6 18M6 6l12 12",
  scissors: "M6 3a3 3 0 110 6 3 3 0 010-6zM18 15a3 3 0 110 6 3 3 0 010-6zM8.12 8.12l7.76 7.76M16 6l-7.88 7.88",
  menu:     "M3 12h18M3 6h18M3 18h18",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff:   "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  back:     "M19 12H5M12 5l-7 7 7 7",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  check:    "M20 6L9 17l-5-5",
  spinner:  "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  alert:    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
};

// ─────────────────────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --bg:#0d0b14; --card:#16131f; --border:#2a2540; --text:#f0ecff; --muted:#7c6fa0; --accent:#c084fc; }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  input, select, textarea { font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  input:focus, select:focus, textarea:focus { border-color: var(--accent) !important; outline: none; }
  option { background: var(--card); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
`;

// ─────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────
const IS = {
  width: "100%", padding: "10px 12px", background: "var(--bg)",
  border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)",
  fontSize: ".9rem", outline: "none", boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,6,18,.75)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, width: "100%", maxWidth: wide ? 620 : 480, boxShadow: "0 32px 80px rgba(0,0,0,.5)", margin: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}>
            <Icon d={I.close} size={18} />
          </button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, ghost, danger, disabled, full, small, type = "button" }) {
  const bg  = danger ? "#e53e3e" : ghost ? "none" : "var(--accent)";
  const col = ghost ? "var(--text)" : "var(--bg)";
  const bdr = ghost ? "1px solid var(--border)" : "none";
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: small ? "6px 12px" : "9px 18px", borderRadius: 8, border: bdr, background: disabled ? "var(--border)" : bg, color: disabled ? "var(--muted)" : col, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: small ? ".8rem" : ".88rem", width: full ? "100%" : undefined, transition: "opacity .15s", fontFamily: "inherit" }}>
      {children}
    </button>
  );
}

function Badge({ status }) {
  const c = STATUS_COLORS[status] || { bg: "rgba(255,255,255,.1)", text: "#ccc" };
  return <span style={{ fontSize: ".75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: c.bg, color: c.text, textTransform: "capitalize" }}>{status}</span>;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem 1.5rem", borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", fontFamily: "'Playfair Display',serif" }}>{value}</div>
      <div style={{ fontWeight: 700, color: "var(--text)", marginTop: 2, fontSize: ".9rem" }}>{label}</div>
      {sub && <div style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ErrBox({ msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "9px 14px", color: "#f87171", fontSize: ".83rem", marginBottom: "1rem" }}>
      <Icon d={I.alert} size={15} /> {msg}
    </div>
  );
}

function Spinner({ size = 20 }) {
  return <Icon d={I.spinner} size={size} cls="spin" />;
}

function Loading({ msg = "Loading…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16, color: "var(--muted)" }}>
      <div className="spin" style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)" }} />
      <div style={{ fontSize: ".88rem" }}>{msg}</div>
    </div>
  );
}

function Confirm({ msg, onOk, onCancel, loading }) {
  return (
    <Modal title="Confirm Delete" onClose={onCancel}>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>{msg}</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn ghost onClick={onCancel}>Cancel</Btn>
        <Btn danger onClick={onOk} disabled={loading}>
          {loading ? "Deleting…" : "Delete"}
        </Btn>
      </div>
    </Modal>
  );
}

function RoleBanner({ msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 10, padding: "10px 14px", marginBottom: "1.25rem", fontSize: ".82rem", color: "#f59e0b" }}>
      <Icon d={I.shield} size={15} /> {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTH PAGES
// ─────────────────────────────────────────────────────────────
function Page({ children, visible }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(192,132,252,.1) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(96,165,250,.07) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 420, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity .4s,transform .4s" }}>
        {children}
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", boxShadow: "0 0 40px rgba(192,132,252,.3)" }}>
        <Icon d={I.scissors} size={26} />
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>Naturals Narasannpeta</div>
      <div style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 2 }}>Salon Management System</div>
    </div>
  );
}

function LoginPage({ onForgot }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [visible, setVisible]   = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 40); }, []);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
    // on success, onAuthStateChange in App will fire automatically
  };

  return (
    <Page visible={visible}>
      <BrandMark />
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: "2rem", boxShadow: "0 24px 64px rgba(0,0,0,.35)" }}>
        <h2 style={{ margin: "0 0 .25rem", fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }}>Sign in to your account</h2>
        <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: "1.5rem" }}>Manage your salon from one place.</p>
        <Field label="Email">
          <input style={IS} type="email" placeholder="you@example.com" value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </Field>
        <Field label="Password">
          <div style={{ position: "relative" }}>
            <input style={{ ...IS, paddingRight: 44 }} type={showPass ? "text" : "password"} placeholder="••••••••"
              value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <button onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, display: "flex" }}>
              <Icon d={showPass ? I.eyeOff : I.eye} size={16} />
            </button>
          </div>
        </Field>
        <div style={{ textAlign: "right", marginBottom: "1rem", marginTop: "-.5rem" }}>
          <button onClick={onForgot} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: ".82rem", cursor: "pointer", fontWeight: 600 }}>
            Forgot password?
          </button>
        </div>
        {error && <ErrBox msg={error} />}
        <Btn full onClick={handleLogin} disabled={loading}>
          {loading ? <><div className="spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> Signing in…</> : "Sign In →"}
        </Btn>
      </div>
    </Page>
  );
}

function ForgotPage({ onBack }) {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 40); }, []);

  const handleReset = async () => {
    if (!email) { setError("Enter your email."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <Page visible={visible}>
      <BrandMark />
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: "2rem", boxShadow: "0 24px 64px rgba(0,0,0,.35)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: ".82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: "1.25rem", padding: 0 }}>
          <Icon d={I.back} size={14} /> Back to login
        </button>

        {!sent ? <>
          <h2 style={{ margin: "0 0 .25rem", fontSize: "1.1rem", fontWeight: 800, color: "var(--text)" }}>Reset your password</h2>
          <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: "1.5rem" }}>Enter your email and we'll send a reset link.</p>
          <Field label="Email">
            <input style={IS} type="email" placeholder="you@example.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleReset()} />
          </Field>
          {error && <ErrBox msg={error} />}
          <Btn full onClick={handleReset} disabled={loading}>
            {loading ? "Sending…" : "Send Reset Link →"}
          </Btn>
        </> : <>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(52,211,153,.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <Icon d={I.check} size={28} />
            </div>
            <h2 style={{ margin: "0 0 .5rem", fontSize: "1.1rem", fontWeight: 800, color: "#34d399" }}>Check your email!</h2>
            <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              A password reset link has been sent to <strong style={{ color: "var(--text)" }}>{email}</strong>.
            </p>
            <Btn full onClick={onBack}>Back to Login →</Btn>
          </div>
        </>}
      </div>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
function Dashboard({ employees, customers, services, appointments }) {
  const active      = services.filter(s => s.is_active);
  const cats        = {};
  services.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1; });
  const todayAppts  = appointments.filter(a => a.date === today());
  const upcoming    = appointments
    .filter(a => a.date >= today() && a.status !== "cancelled")
    .sort((a, b) => (a.date + a.time) > (b.date + b.time) ? 1 : -1)
    .slice(0, 6);

  const getName = (list, id) => list.find(x => x.id === id)?.name || "—";

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", marginBottom: "1.5rem", color: "var(--text)" }}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Employees"     value={employees.length}   sub={`${employees.filter(e => e.status === "active").length} active`}           accent="#a78bfa" />
        <StatCard label="Customers"     value={customers.length}   sub="registered clients"                                                          accent="#34d399" />
        <StatCard label="Services"      value={active.length}      sub={`${Object.keys(cats).length} categories`}                                    accent="#f59e0b" />
        <StatCard label="Today's Appts" value={todayAppts.length}  sub={`${appointments.filter(a => a.status === "confirmed").length} confirmed total`} accent="#60a5fa" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem" }}>
          <h4 style={{ margin: "0 0 1rem", fontSize: ".82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Services by Category</h4>
          {services.length === 0 ? <div style={{ color: "var(--muted)", fontSize: ".85rem" }}>No services yet.</div> :
            Object.entries(cats).map(([cat, count]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 10 }}>
                <div style={{ flex: 1, fontSize: ".88rem", color: "var(--text)" }}>{cat}</div>
                <div style={{ flex: 2, background: "var(--bg)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                  <div style={{ width: `${(count / services.length) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: 99 }} />
                </div>
                <div style={{ width: 16, textAlign: "right", fontSize: ".82rem", color: "var(--muted)" }}>{count}</div>
              </div>
            ))}
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem" }}>
          <h4 style={{ margin: "0 0 1rem", fontSize: ".82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Appointment Status</h4>
          {appointments.length === 0 ? <div style={{ color: "var(--muted)", fontSize: ".85rem" }}>No appointments yet.</div> :
            Object.entries(STATUS_COLORS).map(([status, col]) => {
              const cnt = appointments.filter(a => a.status === status).length;
              return (
                <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Badge status={status} />
                  <div style={{ flex: 1, margin: "0 12px", background: "var(--bg)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                    <div style={{ width: `${appointments.length ? (cnt / appointments.length) * 100 : 0}%`, height: "100%", background: col.text, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: ".82rem", color: "var(--muted)", width: 16, textAlign: "right" }}>{cnt}</span>
                </div>
              );
            })}
        </div>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem" }}>
        <h4 style={{ margin: "0 0 1rem", fontSize: ".82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Upcoming Appointments</h4>
        {upcoming.length === 0
          ? <div style={{ color: "var(--muted)", fontSize: ".88rem" }}>No upcoming appointments.</div>
          : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
            <tbody>
              {upcoming.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 600, color: "var(--text)" }}>{getName(customers, a.customer_id)}</td>
                  <td style={{ padding: "10px 8px", color: "var(--muted)" }}>{getName(services, a.service_id)}</td>
                  <td style={{ padding: "10px 8px", color: "var(--muted)" }}>{getName(employees, a.employee_id)}</td>
                  <td style={{ padding: "10px 8px", color: "var(--muted)", whiteSpace: "nowrap" }}>{a.date} <span style={{ color: "var(--accent)", fontWeight: 600 }}>{a.time}</span></td>
                  <td style={{ padding: "10px 8px" }}><Badge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPLOYEES  (Supabase columns: id, name, role, phone, email, joined_date, status)
// ─────────────────────────────────────────────────────────────
function Employees({ employees, reload, isAdmin }) {
  const [modal, setModal]       = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [apiErr, setApiErr]     = useState("");

  const blank = { name: "", role: "", phone: "", email: "", joined_date: today(), status: "active" };
  const [form, setForm] = useState(blank);

  const openAdd  = () => { setForm(blank); setApiErr(""); setModal("add"); };
  const openEdit = (e) => { setForm({ ...e }); setApiErr(""); setModal({ edit: e }); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setApiErr("");
    const payload = { name: form.name, role: form.role, phone: form.phone, email: form.email, joined_date: form.joined_date, status: form.status };
    let err;
    if (modal === "add") ({ error: err } = await supabase.from("employees").insert([payload]));
    else ({ error: err } = await supabase.from("employees").update(payload).eq("id", form.id));
    setSaving(false);
    if (err) { setApiErr(err.message); return; }
    await reload();
    setModal(null);
  };

  const del = async (id) => {
    setDeleting(true);
    const { error: err } = await supabase.from("employees").delete().eq("id", id);
    setDeleting(false);
    if (err) { alert(err.message); return; }
    await reload();
    setConfirmId(null);
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.role || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", margin: 0, color: "var(--text)" }}>Employees</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, width: 200 }} />
          {isAdmin && <Btn onClick={openAdd}><Icon d={I.add} size={15} /> Add</Btn>}
        </div>
      </div>
      {!isAdmin && <RoleBanner msg="Staff can view but only the owner can add, edit, or delete employees." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "1rem" }}>
        {filtered.map(emp => (
          <div key={emp.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--accent)", opacity: .5 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(192,132,252,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 700, color: "var(--accent)" }}>
                {emp.name.charAt(0)}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(emp)} disabled={!isAdmin} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: isAdmin ? "pointer" : "not-allowed", color: "var(--muted)", opacity: isAdmin ? 1 : .4, display: "flex" }}><Icon d={I.edit} size={13} /></button>
                <button onClick={() => isAdmin && setConfirmId(emp.id)} disabled={!isAdmin} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: isAdmin ? "pointer" : "not-allowed", color: "#e53e3e", opacity: isAdmin ? 1 : .4, display: "flex" }}><Icon d={I.del} size={13} /></button>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text)" }}>{emp.name}</div>
            <div style={{ color: "var(--accent)", fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>{emp.role}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {emp.phone && <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>📞 {emp.phone}</div>}
              {emp.email && <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>✉️ {emp.email}</div>}
              {emp.joined_date && <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>📅 Since {emp.joined_date}</div>}
            </div>
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: ".74rem", fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: emp.status === "active" ? "rgba(52,211,153,.15)" : "rgba(156,163,175,.15)", color: emp.status === "active" ? "#34d399" : "#9ca3af" }}>{emp.status}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: "var(--muted)", fontSize: ".88rem", gridColumn: "1/-1", padding: "2rem 0" }}>No employees found.</div>}
      </div>

      {(modal === "add" || modal?.edit) && isAdmin && (
        <Modal title={modal === "add" ? "Add Employee" : "Edit Employee"} onClose={() => setModal(null)}>
          <Field label="Full Name"><input style={IS} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></Field>
          <Field label="Role"><input style={IS} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior Stylist" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Phone"><input style={IS} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Joined Date"><input type="date" style={IS} value={form.joined_date} onChange={e => setForm({ ...form, joined_date: e.target.value })} /></Field>
          </div>
          <Field label="Email"><input style={IS} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Status">
            <select style={IS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          {apiErr && <ErrBox msg={apiErr} />}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn ghost onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
          </div>
        </Modal>
      )}
      {confirmId && isAdmin && <Confirm msg="Delete this employee? This cannot be undone." loading={deleting} onOk={() => del(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CUSTOMERS  (id, name, phone, email, visits, last_visit, notes)
// ─────────────────────────────────────────────────────────────
function Customers({ customers, reload, isAdmin }) {
  const [modal, setModal]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [apiErr, setApiErr]       = useState("");

  const blank = { name: "", phone: "", email: "", visits: 0, last_visit: today(), notes: "" };
  const [form, setForm] = useState(blank);

  const openAdd  = () => { setForm(blank); setApiErr(""); setModal("add"); };
  const openEdit = (c) => { setForm({ ...c }); setApiErr(""); setModal({ edit: c }); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setApiErr("");
    const payload = { name: form.name, phone: form.phone, email: form.email, visits: Number(form.visits), last_visit: form.last_visit, notes: form.notes };
    let err;
    if (modal === "add") ({ error: err } = await supabase.from("customers").insert([payload]));
    else ({ error: err } = await supabase.from("customers").update(payload).eq("id", form.id));
    setSaving(false);
    if (err) { setApiErr(err.message); return; }
    await reload();
    setModal(null);
  };

  const del = async (id) => {
    setDeleting(true);
    const { error: err } = await supabase.from("customers").delete().eq("id", id);
    setDeleting(false);
    if (err) { alert(err.message); return; }
    await reload();
    setConfirmId(null);
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", margin: 0, color: "var(--text)" }}>Customers</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search name / phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, width: 210 }} />
          <Btn onClick={openAdd}><Icon d={I.add} size={15} /> Add</Btn>
        </div>
      </div>
      {!isAdmin && <RoleBanner msg="Staff can view and add customers, but only the owner can delete them." />}

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Customer", "Contact", "Visits", "Last Visit", "Notes", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 14px", color: "var(--muted)", fontWeight: 600, fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No customers found.</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text)" }}>{c.name}</td>
                <td style={{ padding: "12px 14px", color: "var(--muted)" }}><div>{c.phone}</div><div style={{ fontSize: ".78rem" }}>{c.email}</div></td>
                <td style={{ padding: "12px 14px" }}><span style={{ background: "var(--accent)", color: "var(--bg)", borderRadius: 99, padding: "2px 10px", fontWeight: 700, fontSize: ".8rem" }}>{c.visits}</span></td>
                <td style={{ padding: "12px 14px", color: "var(--muted)" }}>{c.last_visit}</td>
                <td style={{ padding: "12px 14px", color: "var(--muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.notes || "—"}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "var(--muted)", display: "flex" }}><Icon d={I.edit} size={13} /></button>
                    <button onClick={() => isAdmin && setConfirmId(c.id)} disabled={!isAdmin} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: isAdmin ? "pointer" : "not-allowed", color: "#e53e3e", opacity: isAdmin ? 1 : .4, display: "flex" }}><Icon d={I.del} size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal?.edit) && (
        <Modal title={modal === "add" ? "Add Customer" : "Edit Customer"} onClose={() => setModal(null)}>
          <Field label="Full Name"><input style={IS} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Phone"><input style={IS} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Visits"><input type="number" style={IS} value={form.visits} onChange={e => setForm({ ...form, visits: e.target.value })} /></Field>
          </div>
          <Field label="Email"><input style={IS} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Last Visit"><input type="date" style={IS} value={form.last_visit} onChange={e => setForm({ ...form, last_visit: e.target.value })} /></Field>
          <Field label="Notes"><textarea style={{ ...IS, minHeight: 68, resize: "vertical" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          {apiErr && <ErrBox msg={apiErr} />}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn ghost onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
          </div>
        </Modal>
      )}
      {confirmId && isAdmin && <Confirm msg="Remove this customer?" loading={deleting} onOk={() => del(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SERVICES  (id, name, category, duration_min, price, is_active)
// ─────────────────────────────────────────────────────────────
function Services({ services, reload, isAdmin }) {
  const [modal, setModal]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [apiErr, setApiErr]       = useState("");

  const blank = { name: "", category: "Hair", duration_min: 60, price: 0, is_active: true };
  const [form, setForm] = useState(blank);

  const cats = ["All", ...new Set(services.map(s => s.category))];
  const openAdd  = () => { setForm(blank); setApiErr(""); setModal("add"); };
  const openEdit = (s) => { setForm({ ...s }); setApiErr(""); setModal({ edit: s }); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setApiErr("");
    const payload = { name: form.name, category: form.category, duration_min: Number(form.duration_min), price: Number(form.price), is_active: form.is_active };
    let err;
    if (modal === "add") ({ error: err } = await supabase.from("services").insert([payload]));
    else ({ error: err } = await supabase.from("services").update(payload).eq("id", form.id));
    setSaving(false);
    if (err) { setApiErr(err.message); return; }
    await reload();
    setModal(null);
  };

  const del = async (id) => {
    setDeleting(true);
    const { error: err } = await supabase.from("services").delete().eq("id", id);
    setDeleting(false);
    if (err) { alert(err.message); return; }
    await reload();
    setConfirmId(null);
  };

  const filtered = services.filter(s =>
    (catFilter === "All" || s.category === catFilter) &&
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const catColors = { Hair: "#a78bfa", Nails: "#34d399", Skin: "#f59e0b", Special: "#f87171", Other: "#60a5fa" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", margin: 0, color: "var(--text)" }}>Services</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, width: 180 }} />
          {isAdmin && <Btn onClick={openAdd}><Icon d={I.add} size={15} /> Add</Btn>}
        </div>
      </div>
      {!isAdmin && <RoleBanner msg="Staff can view services but only the owner can add, edit, or delete them." />}

      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "5px 14px", borderRadius: 99, border: `1px solid ${catFilter === c ? "var(--accent)" : "var(--border)"}`, background: catFilter === c ? "var(--accent)" : "none", color: catFilter === c ? "var(--bg)" : "var(--muted)", cursor: "pointer", fontWeight: 600, fontSize: ".8rem" }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "1rem" }}>
        {filtered.map(s => {
          const col = catColors[s.category] || catColors.Other;
          return (
            <div key={s.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, bottom: 0, background: col }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--text)", marginBottom: 4 }}>{s.name}</div>
                  <span style={{ fontSize: ".73rem", fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: `${col}22`, color: col }}>{s.category}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => isAdmin && openEdit(s)} disabled={!isAdmin} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: isAdmin ? "pointer" : "not-allowed", color: "var(--muted)", opacity: isAdmin ? 1 : .4, display: "flex" }}><Icon d={I.edit} size={13} /></button>
                  <button onClick={() => isAdmin && setConfirmId(s.id)} disabled={!isAdmin} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: isAdmin ? "pointer" : "not-allowed", color: "#e53e3e", opacity: isAdmin ? 1 : .4, display: "flex" }}><Icon d={I.del} size={13} /></button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: col, fontFamily: "'Playfair Display',serif" }}>{fmt(s.price)}</div>
                  <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>⏱ {s.duration_min} min</div>
                </div>
                <span style={{ fontSize: ".73rem", fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: s.is_active ? "rgba(52,211,153,.15)" : "rgba(156,163,175,.15)", color: s.is_active ? "#34d399" : "#9ca3af" }}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ color: "var(--muted)", fontSize: ".88rem", gridColumn: "1/-1", padding: "2rem 0" }}>No services found.</div>}
      </div>

      {(modal === "add" || modal?.edit) && isAdmin && (
        <Modal title={modal === "add" ? "Add Service" : "Edit Service"} onClose={() => setModal(null)}>
          <Field label="Service Name"><input style={IS} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Haircut & Blow Dry" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Category">
              <select style={IS} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {["Hair", "Nails", "Skin", "Special", "Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Duration (min)"><input type="number" style={IS} value={form.duration_min} onChange={e => setForm({ ...form, duration_min: e.target.value })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Price (₹)"><input type="number" style={IS} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field>
            <Field label="Status">
              <select style={IS} value={form.is_active ? "active" : "inactive"} onChange={e => setForm({ ...form, is_active: e.target.value === "active" })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
          {apiErr && <ErrBox msg={apiErr} />}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn ghost onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
          </div>
        </Modal>
      )}
      {confirmId && isAdmin && <Confirm msg="Delete this service?" loading={deleting} onOk={() => del(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APPOINTMENTS  (id, customer_id, employee_id, service_id, date, time, status, notes)
// ─────────────────────────────────────────────────────────────
function Appointments({ appointments, reload, employees, customers, services, isAdmin }) {
  const [modal, setModal]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [apiErr, setApiErr]       = useState("");

  const blankForm = { customer_id: "", employee_id: "", service_id: "", date: today(), time: "10:00", status: "pending", notes: "" };
  const [form, setForm] = useState(blankForm);

  const openAdd  = () => { setForm(blankForm); setApiErr(""); setModal("add"); };
  const openEdit = (a) => { setForm({ ...a }); setApiErr(""); setModal({ edit: a }); };
  const getName  = (list, id) => list.find(x => x.id === id)?.name || "—";

  const save = async () => {
    if (!form.customer_id || !form.employee_id || !form.service_id || !form.date) return;
    setSaving(true); setApiErr("");
    const payload = {
      customer_id: form.customer_id, employee_id: form.employee_id,
      service_id: form.service_id, date: form.date,
      time: form.time, status: form.status, notes: form.notes,
    };
    let err;
    if (modal === "add") ({ error: err } = await supabase.from("appointments").insert([payload]));
    else ({ error: err } = await supabase.from("appointments").update(payload).eq("id", form.id));
    setSaving(false);
    if (err) { setApiErr(err.message); return; }
    await reload();
    setModal(null);
  };

  const del = async (id) => {
    setDeleting(true);
    const { error: err } = await supabase.from("appointments").delete().eq("id", id);
    setDeleting(false);
    if (err) { alert(err.message); return; }
    await reload();
    setConfirmId(null);
  };

  const filtered = appointments
    .filter(a => filter === "all" || a.status === filter)
    .filter(a => {
      const cn = getName(customers, a.customer_id).toLowerCase();
      const en = getName(employees, a.employee_id).toLowerCase();
      return cn.includes(search.toLowerCase()) || en.includes(search.toLowerCase());
    })
    .sort((a, b) => (a.date + a.time) < (b.date + b.time) ? 1 : -1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", margin: 0, color: "var(--text)" }}>Appointments</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input placeholder="Search customer / staff…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, width: 220 }} />
          <Btn onClick={openAdd}><Icon d={I.add} size={15} /> Add</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["all", "pending", "confirmed", "completed", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 14px", borderRadius: 99, border: `1px solid ${filter === s ? "var(--accent)" : "var(--border)"}`, background: filter === s ? "var(--accent)" : "none", color: filter === s ? "var(--bg)" : "var(--muted)", cursor: "pointer", fontWeight: 600, fontSize: ".8rem", textTransform: "capitalize" }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Customer", "Service", "Staff", "Date & Time", "Status", "Notes", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 14px", color: "var(--muted)", fontWeight: 600, fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No appointments found.</td></tr>}
            {filtered.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text)" }}>{getName(customers, a.customer_id)}</td>
                <td style={{ padding: "12px 14px", color: "var(--muted)" }}>{getName(services, a.service_id)}</td>
                <td style={{ padding: "12px 14px", color: "var(--muted)" }}>{getName(employees, a.employee_id)}</td>
                <td style={{ padding: "12px 14px", color: "var(--muted)", whiteSpace: "nowrap" }}>{a.date} <span style={{ color: "var(--accent)", fontWeight: 600 }}>{a.time}</span></td>
                <td style={{ padding: "12px 14px" }}><Badge status={a.status} /></td>
                <td style={{ padding: "12px 14px", color: "var(--muted)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.notes || "—"}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(a)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "var(--muted)", display: "flex" }}><Icon d={I.edit} size={13} /></button>
                    {isAdmin
                      ? <button onClick={() => setConfirmId(a.id)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#e53e3e", display: "flex" }}><Icon d={I.del} size={13} /></button>
                      : <button disabled style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "not-allowed", color: "var(--border)", display: "flex", opacity: .4 }}><Icon d={I.del} size={13} /></button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal?.edit) && (
        <Modal title={modal === "add" ? "New Appointment" : "Edit Appointment"} onClose={() => setModal(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Customer">
              <select style={IS} value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">— select —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Staff">
              <select style={IS} value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">— select —</option>
                {employees.filter(e => e.status === "active").map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Service">
            <select style={IS} value={form.service_id} onChange={e => setForm({ ...form, service_id: e.target.value })}>
              <option value="">— select —</option>
              {services.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} — {fmt(s.price)}</option>)}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date"><input type="date" style={IS} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Time"><input type="time" style={IS} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></Field>
          </div>
          <Field label="Status">
            <select style={IS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {["pending", "confirmed", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea style={{ ...IS, minHeight: 68, resize: "vertical" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" /></Field>
          {apiErr && <ErrBox msg={apiErr} />}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn ghost onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Appointment"}</Btn>
          </div>
        </Modal>
      )}
      {confirmId && <Confirm msg="Delete this appointment?" loading={deleting} onOk={() => del(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [authPage, setAuthPage]       = useState("login");
  const [session, setSession]         = useState(undefined); // undefined = loading, null = logged out
  const [profile, setProfile]         = useState(null);
  const [tab, setTab]                 = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [employees,    setEmployees]    = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [services,     setServices]     = useState([]);
  const [appointments, setAppointments] = useState([]);

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load profile when session changes ──
  useEffect(() => {
    if (!session?.user) { setProfile(null); return; }
    supabase.from("user_profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => {
        setProfile(data || { id: session.user.id, name: session.user.email, role: "Staff", is_admin: false });
      });
  }, [session]);

  // ── Load all data ──
  const loadData = useCallback(async () => {
    setDataLoading(true);
    const [er, cr, sr, ar] = await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("customers").select("*").order("name"),
      supabase.from("services").select("*").order("name"),
      supabase.from("appointments").select("*").order("date", { ascending: false }),
    ]);
    setEmployees(er.data || []);
    setCustomers(cr.data || []);
    setServices(sr.data || []);
    setAppointments(ar.data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => { if (session) loadData(); }, [session, loadData]);

  const isAdmin     = profile?.is_admin ?? false;
  const userName    = profile?.name || session?.user?.email || "User";
  const userRole    = profile?.role || "Staff";
  const todayCount  = appointments.filter(a => a.date === today() && a.status !== "cancelled").length;

  const nav = [
    { id: "dashboard",    label: "Dashboard",    icon: I.dash },
    { id: "appointments", label: "Appointments", icon: I.appt },
    { id: "employees",    label: "Employees",    icon: I.emp  },
    { id: "customers",    label: "Customers",    icon: I.cust },
    { id: "services",     label: "Services",     icon: I.serv },
  ];

  // ── Render ──
  if (session === undefined) {
    return (
      <>
        <style>{CSS}</style>
        <Loading msg="Initialising…" />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <style>{CSS}</style>
        {authPage === "login"  && <LoginPage  onForgot={() => setAuthPage("forgot")} />}
        {authPage === "forgot" && <ForgotPage onBack={() => setAuthPage("login")} />}
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: sidebarOpen ? 224 : 0, minWidth: sidebarOpen ? 224 : 0, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", transition: "all .25s", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon d={I.scissors} size={18} />
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: "1rem", color: "var(--text)", whiteSpace: "nowrap" }}>Naturals Narasannpeta</div>
                <div style={{ fontSize: ".68rem", color: "var(--muted)", whiteSpace: "nowrap" }}>Salon Manager</div>
              </div>
            </div>
          </div>

          <nav style={{ padding: "1rem .75rem", flex: 1 }}>
            {nav.map(n => {
              const active = tab === n.id;
              return (
                <button key={n.id} onClick={() => setTab(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", background: active ? "rgba(192,132,252,.15)" : "none", color: active ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: ".87rem", textAlign: "left", marginBottom: 2, whiteSpace: "nowrap", position: "relative" }}>
                  <Icon d={n.icon} size={16} />
                  {n.label}
                  {n.id === "appointments" && todayCount > 0 && (
                    <span style={{ marginLeft: "auto", background: "var(--accent)", color: "var(--bg)", borderRadius: 99, fontSize: ".68rem", fontWeight: 800, padding: "1px 7px" }}>{todayCount}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".9rem", color: "var(--bg)", flexShrink: 0 }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
                <div style={{ fontSize: ".7rem", color: isAdmin ? "var(--accent)" : "var(--muted)" }}>{userRole}{isAdmin && " 👑"}</div>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} style={{ width: "100%", padding: "7px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", cursor: "pointer", fontSize: ".78rem", fontWeight: 600, fontFamily: "inherit" }}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--card)", flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}><Icon d={I.menu} size={20} /></button>
            <div style={{ flex: 1, fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--text)", textTransform: "capitalize" }}>{tab}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {dataLoading && <div className="spin" style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)" }} />}
              {isAdmin && <span style={{ background: "rgba(192,132,252,.12)", color: "var(--accent)", padding: "4px 12px", borderRadius: 99, fontWeight: 700, fontSize: ".78rem", display: "flex", alignItems: "center", gap: 5 }}><Icon d={I.shield} size={12} /> Owner</span>}
              <span style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)", padding: "4px 12px", borderRadius: 99, fontSize: ".78rem" }}>{employees.length} staff · {customers.length} clients</span>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            {tab === "dashboard"    && <Dashboard    employees={employees} customers={customers} services={services} appointments={appointments} />}
            {tab === "appointments" && <Appointments appointments={appointments} reload={loadData} employees={employees} customers={customers} services={services} isAdmin={isAdmin} />}
            {tab === "employees"    && <Employees    employees={employees}    reload={loadData} isAdmin={isAdmin} />}
            {tab === "customers"    && <Customers    customers={customers}    reload={loadData} isAdmin={isAdmin} />}
            {tab === "services"     && <Services     services={services}      reload={loadData} isAdmin={isAdmin} />}
          </main>
        </div>
      </div>
    </>
  );
}
