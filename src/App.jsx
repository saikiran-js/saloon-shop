import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
const Icon = ({ d, size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
    <path d={d} />
  </svg>
);
const I = {
  dash:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  emp:      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  cust:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  serv:     "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  appt:     "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  bill:     "M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 7h6M9 11h6M9 15h4",
  print:    "M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z",
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
  trophy:   "M8.21 13.89L7 23l5-3 5 3-1.21-9.12M15 7a3 3 0 11-6 0 3 3 0 016 0zM3 6h2l1 4h12l1-4h2",
  coin:     "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  target:   "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  gift:     "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
  trend:    "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  search:   "M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z",
};

// ─────────────────────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --bg:#0d0b14; --card:#16131f; --border:#2a2540; --text:#f0ecff; --muted:#7c6fa0; --accent:#c084fc; }
  [data-theme="light"] { --bg:#f7f8fb; --card:#ffffff; --border:#dbe1ea; --text:#172033; --muted:#687386; --accent:#7c3aed; }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  input, select, textarea { font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  input:focus, select:focus, textarea:focus { border-color: var(--accent) !important; outline: none; }
  option { background: var(--card); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp .35s ease both; }
  @keyframes shimmer { 0%,100% { opacity:.6; } 50% { opacity:1; } }
  .shimmer { animation: shimmer 2s ease infinite; }
  .print-only { display: none; }
  @media print {
    body * { visibility: hidden !important; }
    .print-only, .print-only * { visibility: visible !important; }
    .print-only { display: block !important; position: absolute; left: 0; top: 0; width: 80mm; min-height: 100vh; padding: 8mm; background: white; color: #000; font-family: Arial, sans-serif; }
    @page { size: 80mm auto; margin: 0; }
  }
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

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem 1.5rem", borderTop: `3px solid ${accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text)", fontFamily: "'Playfair Display',serif" }}>{value}</div>
        {icon && <div style={{ color: accent, opacity: .7 }}><Icon d={icon} size={20} /></div>}
      </div>
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
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
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
          <Btn full onClick={handleReset} disabled={loading}>{loading ? "Sending…" : "Send Reset Link →"}</Btn>
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
// OWNER DASHBOARD — Staff, Customers, Calendar + Performance
// ─────────────────────────────────────────────────────────────
function OwnerDashboard({ employees, customers, services, bills }) {
  const [selectedRange, setSelectedRange] = useState({ start: today(), end: today() });
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const getName = (list, id) => list.find(x => x.id === id)?.name || "—";
  const getService = (id) => services.find(s => s.id === id);

  // Calendar helpers
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const prevMonth = () => setCalMonth(p => {
    const m = p.month === 0 ? 11 : p.month - 1;
    const y = p.month === 0 ? p.year - 1 : p.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setCalMonth(p => {
    const m = p.month === 11 ? 0 : p.month + 1;
    const y = p.month === 11 ? p.year + 1 : p.year;
    return { year: y, month: m };
  });

  // Get bills per day for dot indicators
  const apptsByDate = {};
  bills.forEach(b => {
    if (!b.bill_date) return;
    apptsByDate[b.bill_date] = (apptsByDate[b.bill_date] || 0) + 1;
  });

  const { start: selectedStart, end: selectedEnd } = selectedRange;
  const selectDashboardDate = (dateStr) => {
    if (!selectedStart || !selectedEnd || selectedStart !== selectedEnd) {
      setSelectedRange({ start: dateStr, end: dateStr });
      return;
    }
    if (dateStr >= selectedStart) {
      setSelectedRange({ start: selectedStart, end: dateStr });
    } else {
      setSelectedRange({ start: dateStr, end: selectedStart });
    }
  };

  const selectedDates = [];
  if (selectedStart && selectedEnd) {
    const start = new Date(selectedStart);
    const end = new Date(selectedEnd);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      selectedDates.push(d.toISOString().slice(0, 10));
    }
  }
  const selectedMonthDays = new Set(selectedDates.map(d => d.slice(5)));
  const birthdayCustomers = customers.filter(c => c.dob && selectedMonthDays.has(c.dob.slice(5)));
  const birthdayCount = birthdayCustomers.length;

  // Staff performance for selected date range (based on bills)
  const dayBills = bills.filter(b => b.bill_date >= selectedStart && b.bill_date <= selectedEnd);

  const staffPerformance = employees
    .filter(e => e.status === "active")
    .map(emp => {
      const empBills = dayBills.filter(b => b.employee_id === emp.id);
      const billRevenue = empBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const totalRevenue = billRevenue;
      const salary = Number(emp.salary || 0);
      const target = Number(emp.target_amount || 0);
      const pct    = target > 0 ? Math.min((totalRevenue / target) * 100, 150) : 0;
      const bonus  = totalRevenue >= target ? 2500 : 0;
      return {
        ...emp,
        appts:     empBills.length,
        completed: empBills.length,
        revenue: totalRevenue,
        appointmentRevenue: 0,
        billRevenue,
        salary,
        target,
        pct,
        bonus,
        achieved:  totalRevenue >= target,
      };
    })
    .sort((a, b) => b.pct - a.pct);



  // Month-level revenue summary for selected date's month
  const monthStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}`;
  const monthBills = bills.filter(b => String(b.bill_date || "").startsWith(monthStr));
  const monthBillRevenue = monthBills.reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const monthRevenue = monthBillRevenue;

  const totalDayRevenue = staffPerformance.reduce((s, e) => s + e.revenue, 0);

  // Customers visited counts
  const customersTodayCount = new Set(bills.filter(b => b.bill_date === today()).map(b => b.customer_id || b.customer_name)).size;
  const customersMonthCount = new Set(monthBills.map(b => b.customer_id || b.customer_name).filter(Boolean)).size;
  const rankColors = ["#f59e0b", "#94a3b8", "#cd7c54", "#7c6fa0", "#7c6fa0"];
  const rankEmojis = ["🥇", "🥈", "🥉"];
  const monthStaffPerformance = employees
  .filter(e => e.status === "active")
    .map(emp => {
    const empAppts = monthBills.filter(b => b.employee_id === emp.id);

    const revenue = 0;
    const billRevenue = monthBills
      .filter(b => b.employee_id === emp.id)
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const totalRevenue = billRevenue;

    const salary = Number(emp.salary || 0);
    const target = Number(emp.target_amount || 0);

    return {
      ...emp,
      revenue: totalRevenue,
      appointmentRevenue: 0,
      billRevenue,
      target,
      pct:
        target > 0
          ? Math.min((totalRevenue / target) * 100, 150)
          : 0,
      completed: empAppts.length,
      achieved: totalRevenue >= target
    };
  })
  .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="fade-up">
      
     <div style={{ marginBottom: 16 }}>
       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem" }}>
         <StatCard label="Today's Revenue" value={fmt(totalDayRevenue)} sub="completed payments" accent="#34d399" />
         <StatCard label="This Month Revenue" value={fmt(monthRevenue)} sub={`${monthNames[calMonth.month]} revenue`} accent="var(--accent)" />
         <StatCard label="Customers Today" value={customersTodayCount} sub="unique visitors" accent="#60a5fa" />
         <StatCard label="Birthdays" value={birthdayCount} sub={selectedStart === selectedEnd ? `on ${selectedStart}` : `in selected range`} accent="#fbbf24" />
         <StatCard label="Customers This Month" value={customersMonthCount} sub={`${monthNames[calMonth.month]} visitors`} accent="#f59e0b" />
       </div>
     </div>

      {/* ── Calendar + Performance ── */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 1fr", gap: "1.25rem", alignItems: "start" }}>

        {/* Calendar */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}>
              <Icon d="M15 18l-6-6 6-6" size={16} />
            </button>
            <h4 style={{ margin: 0, fontSize: ".88rem", fontWeight: 700, color: "var(--text)" }}>
              {monthNames[calMonth.month]} {calMonth.year}
            </h4>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}>
              <Icon d="M9 18l6-6-6-6" size={16} />
            </button>
          </div>
          <div style={{ padding: "1rem" }}>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: ".68rem", fontWeight: 700, color: "var(--muted)", padding: "2px 0" }}>{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {Array(firstDayOfMonth(calMonth.year, calMonth.month)).fill(null).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array(daysInMonth(calMonth.year, calMonth.month)).fill(null).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = dateStr >= selectedStart && dateStr <= selectedEnd;
                const isToday    = dateStr === today();
                const hasAppts   = apptsByDate[dateStr] > 0;
                return (
                  <button key={day} onClick={() => selectDashboardDate(dateStr)}
                    style={{
                      position: "relative", width: "100%", aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      borderRadius: 8, border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
                      background: isSelected ? "var(--accent)" : "none",
                      color: isSelected ? "var(--bg)" : isToday ? "var(--accent)" : "var(--text)",
                      cursor: "pointer", fontWeight: isToday || isSelected ? 700 : 500, fontSize: ".82rem",
                    }}>
                    {day}
                    {hasAppts && !isSelected && (
                      <div style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border)", paddingTop: "0.875rem", marginTop: "-1px" }}>
            <div style={{ fontSize: ".75rem", color: "var(--muted)", marginBottom: 4 }}>
            Selected: <strong style={{ color: "var(--text)" }}>{selectedStart === selectedEnd ? selectedStart : `${selectedStart} – ${selectedEnd}`}</strong>
          </div>
            <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>Month revenue: <strong style={{ color: "var(--accent)" }}>{fmt(monthRevenue)}</strong></div>
            <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 2 }}>Day total: <strong style={{ color: "#34d399" }}>{fmt(totalDayRevenue)}</strong></div>
          </div>
        </div>

        {/* Staff performance ranking */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: ".82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Period Performance — {selectedStart === selectedEnd ? selectedStart : `${selectedStart} – ${selectedEnd}`}
            </h4>
          </div>

          {staffPerformance.length === 0
            ? <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--muted)", fontSize: ".88rem" }}>No active staff found.</div>
            : <div style={{ padding: "1rem" }}>
                {/* Legend */}
                {staffPerformance.map((emp, idx) => (
                  <div key={emp.id} style={{
                    background: emp.achieved ? "rgba(52,211,153,.04)" : "var(--bg)",
                    border: `1px solid ${emp.achieved ? "rgba(52,211,153,.2)" : "var(--border)"}`,
                    borderRadius: 12, padding: "1rem", marginBottom: "0.75rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Rank badge */}
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: `rgba(${idx === 0 ? "245,158,11" : idx === 1 ? "148,163,184" : idx === 2 ? "205,124,84" : "124,111,160"},.2)`,
                          color: rankColors[idx] || rankColors[4], fontWeight: 800, fontSize: ".82rem", flexShrink: 0
                        }}>
                          {idx < 3 ? rankEmojis[idx] : idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--text)" }}>{emp.name}</div>
                          <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>{emp.role || "Staff"} · {emp.completed} completed · {emp.appts} total appts</div>
                            <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: 2 }}>
                            Bills {fmt(emp.billRevenue)}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 800, color: emp.achieved ? "#34d399" : "var(--text)" }}>
                          {fmt(emp.revenue)}
                        </div>
                      </div>
                    </div>                  
                  </div>
                ))}

                {/* Day summary */}
                

              </div>
          }
        </div>
       <div
  style={{
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    overflow: "hidden"
  }}
>
  <div
    style={{
      padding: "1rem 1.25rem",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
    <h4
      style={{
        margin: 0,
        fontSize: ".82rem",
        fontWeight: 700,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: ".06em"
      }}
    >
      Monthly Ranking — {monthNames[calMonth.month]}
    </h4>

    <span
      style={{
        fontSize: ".75rem",
        color: "var(--accent)",
        fontWeight: 700
      }}
    >
      {fmt(monthRevenue)}
    </span>
  </div>

  <div style={{ padding: "1rem" }}>
    {monthStaffPerformance.map((emp, idx) => (
      <div
        key={emp.id}
        style={{
          padding: ".9rem",
          border: "1px solid var(--border)",
          borderRadius: 10,
          marginBottom: ".75rem"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700
              }}
            >
              {idx === 0
                ? "🥇"
                : idx === 1
                ? "🥈"
                : idx === 2
                ? "🥉"
                : `#${idx + 1}`}{" "}
              {emp.name}
            </div>

            <div
              style={{
                fontSize: ".75rem",
                color: "var(--muted)"
              }}
            >
              {emp.completed} completed services
            </div>
          </div>

          <div
            style={{
              textAlign: "right"
            }}
          >
            <div
              style={{
                fontWeight: 800,
                color: "var(--accent)"
              }}
            >
              {fmt(emp.revenue)}
            </div>

            <div
              style={{
                fontSize: ".7rem",
                color: "var(--muted)"
              }}
            >
              {emp.pct.toFixed(0)}%
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 10, background: "rgba(255,255,255,.06)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(emp.pct, 100)}%`, height: "100%", background: emp.pct >= 100 ? "#34d399" : "var(--accent)", transition: "width .25s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: ".72rem", color: "var(--muted)" }}>
            <span>Target progress</span>
            <span>{Math.min(emp.pct, 100).toFixed(0)}% of 100%</span>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LEGACY DASHBOARD (generic overview — kept for non-dashboard tabs)
// ─────────────────────────────────────────────────────────────
function Dashboard({ employees, customers, services, bills }) {
  const active      = services.filter(s => s.is_active);
  const cats        = {};
  services.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1; });
  const todayAppts  = bills.filter(b => b.bill_date === today());
  const upcoming    = bills
    .filter(b => b.bill_date >= today())
    .sort((a, b) => (a.bill_date + (a.bill_time || "")) > (b.bill_date + (b.bill_time || "")) ? 1 : -1)
    .slice(0, 6);
  const getName = (list, id) => list.find(x => x.id === id)?.name || "—";

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", marginBottom: "1.5rem", color: "var(--text)" }}>Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Employees"     value={employees.length}   sub={`${employees.filter(e => e.status === "active").length} active`}           accent="#a78bfa" />
        <StatCard label="Customers"     value={customers.length}   sub="registered clients"                                                          accent="#34d399" />
        <StatCard label="Services"      value={active.length}      sub={`${Object.keys(cats).length} categories`}                                    accent="#f59e0b" />
        <StatCard label="Today's Sales" value={todayAppts.length}  sub={`${bills.filter(b => b.bill_date === today()).length} transactions`} accent="#60a5fa" />
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.25rem" }}>
        <h4 style={{ margin: "0 0 1rem", fontSize: ".82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Recent Sales</h4>
        {upcoming.length === 0
          ? <div style={{ color: "var(--muted)", fontSize: ".88rem" }}>No recent sales.</div>
          : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
              <tbody>
                {upcoming.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "var(--text)" }}>{a.customer_name || getName(customers, a.customer_id)}</td>
                    <td style={{ padding: "10px 8px", color: "var(--muted)" }}>{a.service_name || getName(services, a.service_id)}</td>
                    <td style={{ padding: "10px 8px", color: "var(--muted)" }}>{a.employee_name || getName(employees, a.employee_id)}</td>
                    <td style={{ padding: "10px 8px", color: "var(--muted)", whiteSpace: "nowrap" }}>{a.bill_date} <span style={{ color: "var(--accent)", fontWeight: 600 }}>{String(a.bill_time || "").slice(0,5)}</span></td>
                    <td style={{ padding: "10px 8px" }}>{fmt(a.total_amount || 0)}</td>
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
// EMPLOYEES
// ─────────────────────────────────────────────────────────────
function Employees({ employees, reload, isAdmin }) {
  const [modal, setModal]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [apiErr, setApiErr]       = useState("");

  const blank = { name: "", emp_id: "", role: "", gender: "other", phone: "", email: "", dob: "", joined_date: today(), status: "active", salary: 0, target_amount: 0 };
  const [form, setForm] = useState(blank);

  const openAdd  = () => { setForm(blank); setApiErr(""); setModal("add"); };
  const openEdit = (e) => { setForm({ ...e }); setApiErr(""); setModal({ edit: e }); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setApiErr("");
    const payload = { emp_id: form.emp_id || null, name: form.name, role: form.role, gender: form.gender, phone: form.phone, email: form.email, dob: form.dob || null, joined_date: form.joined_date, status: form.status, salary: Number(form.salary || 0), target_amount: Number(form.target_amount || 0) };
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
  const genderOf = (value) => String(value || "other").toLowerCase();
  const maleCount = employees.filter(e => genderOf(e.gender) === "male").length;
  const femaleCount = employees.filter(e => genderOf(e.gender) === "female").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, width: 200 }} />
          {isAdmin && <Btn onClick={openAdd}><Icon d={I.add} size={15} /> Add</Btn>}
        </div>
      </div>
      {!isAdmin && <RoleBanner msg="Staff can view but only the owner can add, edit, or delete employees." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        <StatCard label="Employees" value={employees.length} sub="total team members" accent="#a78bfa" icon={I.emp} />
        <StatCard label="Male" value={maleCount} sub="employees" accent="#60a5fa" icon={I.cust} />
        <StatCard label="Female" value={femaleCount} sub="employees" accent="#f472b6" icon={I.cust} />
      </div>

      <div style={{ overflowX: "auto", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14 }}>
        <table style={{ width: "100%", minWidth: 980, borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ background: "rgba(148,163,184,.08)" }}>
            <tr>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.dash} size={14} />#</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.emp} size={14} />Emp ID</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.cust} size={14} />First Name</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.serv} size={14} />Specialisation</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.appt} size={14} />Mobile</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.emp} size={14} />Gender</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.calendar} size={14} />DOB</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.calendar} size={14} />DOJ</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "left", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon d={I.shield} size={14} />Status</span>
              </th>
              <th style={{ padding: "12px 10px", textAlign: "right", fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}><Icon d={I.menu} size={14} />Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "1.5rem", textAlign: "center", color: "var(--muted)" }}>No employees found.</td>
              </tr>
            ) : filtered.map((emp, index) => (
              <tr key={emp.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>{index + 1}</td>
                <td style={{ padding: "12px 10px", color: "var(--text)", whiteSpace: "nowrap" }}>{emp.emp_id || "-"}</td>
                <td style={{ padding: "12px 10px", color: "var(--text)" }}>{emp.name}</td>
                <td style={{ padding: "12px 10px", color: "var(--muted)" }}>{emp.role || "-"}</td>
                <td style={{ padding: "12px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>{emp.phone || "-"}</td>
                <td style={{ padding: "12px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>{String(emp.gender || "").charAt(0).toUpperCase() || "-"}</td>
                <td style={{ padding: "12px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>{emp.dob || "-"}</td>
                <td style={{ padding: "12px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>{emp.joined_date || "-"}</td>
                <td style={{ padding: "12px 10px", color: emp.status === "active" ? "#16a34a" : "#6b7280", whiteSpace: "nowrap" }}>{emp.status}</td>
                <td style={{ padding: "12px 10px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button onClick={() => openEdit(emp)} disabled={!isAdmin} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", cursor: isAdmin ? "pointer" : "not-allowed", color: "var(--muted)", opacity: isAdmin ? 1 : .4, display: "flex" }}><Icon d={I.edit} size={13} /></button>
                  <button onClick={() => isAdmin && setConfirmId(emp.id)} disabled={!isAdmin} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", cursor: isAdmin ? "pointer" : "not-allowed", color: "#e53e3e", opacity: isAdmin ? 1 : .4, display: "flex" }}><Icon d={I.del} size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal?.edit) && isAdmin && (
        <Modal title={modal === "add" ? "Add Employee" : "Edit Employee"} onClose={() => setModal(null)}>
          <Field label="Full Name"><input style={IS} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></Field>
          <Field label="Role"><input style={IS} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior Stylist" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Employee ID"><input style={IS} value={form.emp_id} onChange={e => setForm({ ...form, emp_id: e.target.value })} placeholder="Employee ID" /></Field>
            <Field label="Date of Birth"><input type="date" style={IS} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} onMouseEnter={e => e.target.showPicker?.()} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Gender">
              <select style={IS} value={form.gender || "other"} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Joined Date"><input type="date" style={IS} value={form.joined_date} onChange={e => setForm({ ...form, joined_date: e.target.value })} onMouseEnter={e => e.target.showPicker?.()} /></Field>
          </div>
          <Field label="Phone"><input style={IS} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input style={IS} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Monthly Salary (₹)">
              <input type="number" style={IS} value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Monthly Target (₹)">
              <input type="number" style={IS} value={form.target_amount || 0} onChange={e => setForm({ ...form, target_amount: e.target.value })} placeholder="0" />
            </Field>
          </div>
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
// CUSTOMERS
// ─────────────────────────────────────────────────────────────
function Customers({ customers, bills, reload, isAdmin }) {
  const [modal, setModal]         = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [apiErr, setApiErr]       = useState("");

  const blank = { name: "", dob: "", gender: "other", phone: "", email: "", last_visit: today(), has_membership: false, membership_card_no: "", membership_start: "", membership_end: "", notes: "" };
  const [form, setForm] = useState(blank);

  const openAdd  = () => { setForm(blank); setApiErr(""); setModal("add"); };
  const openEdit = (c) => { setForm({ ...c }); setApiErr(""); setModal({ edit: c }); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setApiErr("");
    const payload = { name: form.name, dob: form.dob || null, gender: form.gender, phone: form.phone, email: form.email, last_visit: form.last_visit, has_membership: !!form.has_membership, membership_card_no: form.membership_card_no, membership_start: form.membership_start || null, membership_end: form.membership_end || null, notes: form.notes };
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
  const visitsByCustomer = bills.reduce((acc, bill) => {
    if (!bill.customer_id) return acc;
    acc[bill.customer_id] = (acc[bill.customer_id] || 0) + 1;
    return acc;
  }, {});
  const customerBills = viewCustomer ? bills.filter(b => b.customer_id === viewCustomer.id).sort((a, b) => `${b.bill_date}${b.bill_time}`.localeCompare(`${a.bill_date}${a.bill_time}`)) : [];
  const customerTotal = customerBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const genderOf = (value) => String(value || "other").toLowerCase();
  const maleCount = customers.filter(c => genderOf(c.gender) === "male").length;
  const femaleCount = customers.filter(c => genderOf(c.gender) === "female").length;
  const repeatCount = customers.filter(c => (visitsByCustomer[c.id] || 0) > 1).length;
  const nonRepeatCount = customers.filter(c => (visitsByCustomer[c.id] || 0) <= 1).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search name / phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, width: 210 }} />
          <Btn onClick={openAdd}><Icon d={I.add} size={15} /> Add</Btn>
        </div>
      </div>
      {!isAdmin && <RoleBanner msg="Staff can view and add customers, but only the owner can delete them." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        <StatCard label="Customers" value={customers.length} sub="total clients" accent="#a78bfa" icon={I.cust} />
        <StatCard label="Male" value={maleCount} sub="customers" accent="#60a5fa" icon={I.cust} />
        <StatCard label="Female" value={femaleCount} sub="customers" accent="#f472b6" icon={I.cust} />
        <StatCard label="Repeat" value={repeatCount} sub="more than 1 visit" accent="#34d399" icon={I.star} />
        <StatCard label="New" value={nonRepeatCount} sub="single visit" accent="#f59e0b" icon={I.target} />
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["Customer", "Contact", "DOB", "Notes", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 14px", color: "var(--muted)", fontWeight: 600, fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No customers found.</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {c.name}
                    {c.has_membership && <span title="Membership customer" style={{ color: "#f59e0b", display: "inline-flex" }}><Icon d={I.gift} size={14} /></span>}
                  </div>
                  <div style={{ fontSize: ".74rem", color: "var(--muted)", fontWeight: 600 }}>{c.gender || "other"}</div>
                </td>
                <td style={{ padding: "12px 14px", color: "var(--muted)" }}><div>{c.phone}</div><div style={{ fontSize: ".78rem" }}>{c.email}</div></td>
                <td style={{ padding: "12px 14px", color: "var(--muted)", whiteSpace: "nowrap" }}>{c.dob || "-"}</td>
                
                <td style={{ padding: "12px 14px", color: "var(--muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.notes || "—"}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setViewCustomer(c)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "var(--muted)", display: "flex" }}><Icon d={I.eye} size={13} /></button>
                    <button onClick={() => openEdit(c)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "var(--muted)", display: "flex" }}><Icon d={I.edit} size={13} /></button>
                    <button onClick={() => isAdmin && setConfirmId(c.id)} disabled={!isAdmin} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: isAdmin ? "pointer" : "not-allowed", color: "#e53e3e", opacity: isAdmin ? 1 : .4, display: "flex" }}><Icon d={I.del} size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewCustomer && (
        <Modal title={`Visits for ${viewCustomer.name}`} onClose={() => setViewCustomer(null)} wide>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ color: "var(--muted)", fontSize: ".95rem" }}>Total visits: <strong style={{ color: "var(--text)" }}>{customerBills.length}</strong></div>
            <div style={{ color: "var(--muted)", fontSize: ".95rem" }}>Total billed: <strong style={{ color: "var(--text)" }}>{fmt(customerTotal)}</strong></div>
          </div>
          {customerBills.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: ".9rem" }}>No visits recorded for this customer yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    {['Date', 'Time', 'Services', 'Amount', 'Payment', 'Notes'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 14px', color: 'var(--muted)', fontWeight: 600, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customerBills.map(bill => (
                    <tr key={bill.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 700 }}>{bill.bill_date || '-'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{bill.bill_time || '-'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{bill.service_name || bill.line_items?.map(item => item.service_name).join(', ') || '-'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 700 }}>{fmt(bill.total_amount || 0)}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{bill.payment_mode || '-'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {(modal === "add" || modal?.edit) && (
        <Modal title={modal === "add" ? "Add Customer" : "Edit Customer"} onClose={() => setModal(null)}>
          <Field label="Full Name"><input style={IS} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Gender">
              <select style={IS} value={form.gender || "other"} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <Field label="Phone"><input style={IS} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input style={IS} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="DOB"><input type="date" style={IS} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} onMouseEnter={e => e.target.showPicker?.()} /></Field>
          <Field label="Last Visit"><input type="date" style={IS} value={form.last_visit} onChange={e => setForm({ ...form, last_visit: e.target.value })} onMouseEnter={e => e.target.showPicker?.()} /></Field>
          <Field label="Membership">
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text)", fontSize: ".88rem", fontWeight: 700 }}>
              <input type="checkbox" checked={!!form.has_membership} onChange={e => setForm({ ...form, has_membership: e.target.checked })} />
              Customer has membership
            </label>
          </Field>
          {form.has_membership && (
            <>
              <Field label="Membership Card No."><input style={IS} value={form.membership_card_no || ""} onChange={e => setForm({ ...form, membership_card_no: e.target.value })} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Membership Start"><input type="date" style={IS} value={form.membership_start || ""} onChange={e => setForm({ ...form, membership_start: e.target.value })} onMouseEnter={e => e.target.showPicker?.()} /></Field>
                <Field label="Membership End"><input type="date" style={IS} value={form.membership_end || ""} onChange={e => setForm({ ...form, membership_end: e.target.value })} onMouseEnter={e => e.target.showPicker?.()} /></Field>
              </div>
            </>
          )}
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
// SERVICES
// ─────────────────────────────────────────────────────────────
function Services({ services, reload, isAdmin }) {
  const [modal, setModal]         = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [apiErr, setApiErr]       = useState("");

  const blank = { name: "", category: "Hair", duration_min: 60, general_price: 0, membership_price: 0, is_active: true };
  const [form, setForm] = useState(blank);

  const cats = ["All", ...new Set(services.map(s => s.category))];
  const openAdd  = () => { setForm(blank); setApiErr(""); setModal("add"); };
  const openEdit = (s) => { setForm({ ...s }); setApiErr(""); setModal({ edit: s }); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setApiErr("");
    const generalPrice = Number(form.general_price ?? form.price ?? 0);
    const membershipPrice = Number(form.membership_price ?? generalPrice);
    const payload = { name: form.name, category: form.category, duration_min: Number(form.duration_min), price: generalPrice, general_price: generalPrice, membership_price: membershipPrice, is_active: form.is_active };
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
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: col, fontFamily: "'Playfair Display',serif" }}>General {fmt(s.general_price ?? s.price)}</div>
                  <div style={{ fontSize: ".82rem", color: "var(--muted)", fontWeight: 700 }}>Member {fmt(s.membership_price ?? s.price)}</div>
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
            <Field label="General Price (₹)"><input type="number" style={IS} value={form.general_price ?? form.price ?? 0} onChange={e => setForm({ ...form, general_price: e.target.value })} /></Field>
            <Field label="Membership Price (₹)"><input type="number" style={IS} value={form.membership_price ?? form.price ?? 0} onChange={e => setForm({ ...form, membership_price: e.target.value })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
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

// (appointments feature removed — billing-only flows used)

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
function Billing({ bills, reload, employees, customers, services, isAdmin, setTab }) {
  const [modal, setModal]         = useState(null); // "add" | "edit" | null
  const [editBill, setEditBill]   = useState(null);
  const [viewBill, setViewBill]   = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [dateRange, setDateRange] = useState({ start: today(), end: today() });
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [search, setSearch]       = useState("");
  const [serviceSearch, setServiceSearch] = useState([""]);
  const [serviceOpen, setServiceOpen] = useState([]);
  const [saving, setSaving]       = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerErr, setCustomerErr] = useState("");
  const [deleting, setDeleting]   = useState(false);
  const [apiErr, setApiErr]       = useState("");
  const [dashboardPopup, setDashboardPopup] = useState(false);

  const blankForm = {
    customer_id: "", employee_id: "", bill_date: today(), bill_time: "10:00",
    pricing_type: "general", manual_discount: 0, payment_mode: "Cash", notes: "",
  };
  const blankCustomer = {
    name: "", gender: "other", phone: "", email: "", last_visit: today(),
    has_membership: false, membership_card_no: "", membership_start: "", membership_end: "", notes: "",
  };
  const [form, setForm] = useState(blankForm);
  const [items, setItems] = useState([{ service_id: "" }]);
  const [customerForm, setCustomerForm] = useState(blankCustomer);

  // ── helpers ────────────────────────────────────────────────────────────────
  const money     = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const getName   = (list, id, fallback = "-") => list.find(x => x.id === id)?.name || fallback;
  const priceFor  = (service, type = form.pricing_type) =>
    Number(type === "membership" ? (service?.membership_price ?? service?.price ?? 0) : (service?.general_price ?? service?.price ?? 0));
  const generalFor = (service) => Number(service?.general_price ?? service?.price ?? 0);
  const billNo     = (b) => String(b.invoice_no || "").padStart(5, "0");
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const prevMonth = () => setCalMonth(p => {
    const m = p.month === 0 ? 11 : p.month - 1;
    const y = p.month === 0 ? p.year - 1 : p.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setCalMonth(p => {
    const m = p.month === 11 ? 0 : p.month + 1;
    const y = p.month === 11 ? p.year + 1 : p.year;
    return { year: y, month: m };
  });

  // ── live totals for the form ────────────────────────────────────────────────
  const billItems = items
    .map(item => services.find(s => s.id === item.service_id))
    .filter(Boolean)
    .map(service => ({ service, general: generalFor(service), rate: priceFor(service) }));

  const originalSubtotal  = billItems.reduce((sum, item) => sum + item.general, 0);
  const selectedSubtotal  = billItems.reduce((sum, item) => sum + item.rate, 0);
  const automaticDiscount = billItems.reduce((sum, item) => sum + Math.max(item.general - item.rate, 0), 0);
  const manualDiscount    = Math.min(Math.max(Number(form.manual_discount || 0), 0), selectedSubtotal);
  const discountAmount    = automaticDiscount + manualDiscount;
  const taxableSubtotal   = Math.max(selectedSubtotal - manualDiscount, 0);
  const gstAmount         = +(taxableSubtotal * 0.05).toFixed(2);
  const total             = +(taxableSubtotal + gstAmount).toFixed(2);

  const canSaveBill = !!form.customer_id && !!form.employee_id && items.some(item => item.service_id);
  const canSaveCustomer = customerForm.name.trim().length > 0;

  const syncCustomerTotals = async (customerId) => {
    if (!customerId) return;
    const { data: billRows, error: billErr } = await supabase.from("bills")
      .select("bill_date")
      .eq("customer_id", customerId)
      .order("bill_date", { ascending: false })
      .limit(1);
    if (billErr) {
      console.error("Failed to sync customer stats:", billErr.message);
      return;
    }
    const last_visit = billRows?.[0]?.bill_date || null;
    const { error: err } = await supabase.from("customers").update({ last_visit }).eq("id", customerId);
    if (err) {
      console.error("Failed to update customer last visit:", err.message);
    }
  };

  // ── open modals ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...blankForm, bill_date: dateRange.start || today() });
    setItems([{ service_id: "" }]);
    setServiceSearch([""]);
    setServiceOpen([false]);
    setApiErr("");
    setEditBill(null);
    setModal("add");
  };

  const openEdit = (bill) => {
    const lineItems = Array.isArray(bill.line_items) && bill.line_items.length
      ? bill.line_items.map(row => ({ service_id: row.service_id }))
      : [{ service_id: bill.service_id || "" }];

    setForm({
      customer_id:     bill.customer_id    || "",
      employee_id:     bill.employee_id    || "",
      bill_date:       bill.bill_date      || today(),
      bill_time:       bill.bill_time      || "10:00",
      pricing_type:    bill.pricing_type   || "general",
      manual_discount: bill.manual_discount ?? 0,
      payment_mode:    bill.payment_mode   || "Cash",
      notes:           bill.notes          || "",
    });
    setItems(lineItems);
    setServiceSearch(lineItems.map(() => ""));
    setServiceOpen(lineItems.map(() => false));
    setApiErr("");
    setEditBill(bill);
    setModal("edit");
  };

  const openCustomerModal = () => {
    setCustomerForm(blankCustomer);
    setCustomerErr("");
    setCustomerModal(true);
  };

  // ── item helpers ────────────────────────────────────────────────────────────
  const addItem    = () => { setItems([...items, { service_id: "" }]); setServiceSearch([...serviceSearch, ""]); setServiceOpen([...serviceOpen, false]); };
  const removeItem = (index) => { setItems(items.filter((_, i) => i !== index)); setServiceSearch(serviceSearch.filter((_, i) => i !== index)); setServiceOpen(serviceOpen.filter((_, i) => i !== index)); };
  const updateItem = (index, service_id) => setItems(items.map((item, i) => i === index ? { ...item, service_id } : item));
  const updateCustomer = (customer_id) => {
    const customer = customers.find(c => c.id === customer_id);
    setForm({ ...form, customer_id, pricing_type: customer?.has_membership ? "membership" : "general" });
  };

  const saveCustomerFromBilling = async () => {
    if (!customerForm.name.trim()) {
      setCustomerErr("Customer name is required.");
      return;
    }
    setCustomerSaving(true);
    setCustomerErr("");
    const payload = {
      name: customerForm.name,
      gender: customerForm.gender,
      phone: customerForm.phone,
      email: customerForm.email,
      last_visit: customerForm.last_visit || today(),
      has_membership: !!customerForm.has_membership,
      membership_card_no: customerForm.membership_card_no,
      membership_start: customerForm.membership_start || null,
      membership_end: customerForm.membership_end || null,
      notes: customerForm.notes,
    };
    const { data, error: err } = await supabase.from("customers").insert([payload]).select("*").single();
    setCustomerSaving(false);
    if (err) {
      setCustomerErr(err.message);
      return;
    }
    if (data?.id) {
      setForm(prev => ({ ...prev, customer_id: data.id, pricing_type: data.has_membership ? "membership" : "general" }));
    }
    await reload();
    setCustomerModal(false);
  };

  // ── build payload (shared by save & update) ─────────────────────────────────
  const buildPayload = () => {
    const selected = items.map(item => services.find(s => s.id === item.service_id)).filter(Boolean);
    if (!form.customer_id || !form.employee_id || selected.length === 0 || !form.bill_date) return null;
    const customer = customers.find(c => c.id === form.customer_id);
    const employee = employees.find(e => e.id === form.employee_id);
    if (!customer || !employee) return null;

    const rows = selected.map(service => {
      const general = generalFor(service);
      const rate    = priceFor(service, form.pricing_type);
      return {
        service_id:    service.id,
        service_name:  service.name,
        qty:           1,
        general_price: general,
        rate,
        amount:        rate,
        discount:      Math.max(general - rate, 0),
      };
    });

    const original      = rows.reduce((sum, row) => sum + row.general_price, 0);
    const base          = rows.reduce((sum, row) => sum + row.amount, 0);        // after membership discount
    const autoDiscount  = rows.reduce((sum, row) => sum + row.discount, 0);
    const manualDisc    = Math.min(Math.max(Number(form.manual_discount || 0), 0), base);
    const taxable       = Math.max(base - manualDisc, 0);
    const gst           = +(taxable * 0.05).toFixed(2);
    const grandTotal    = +(taxable + gst).toFixed(2);

    return {
      customer_id:      customer.id,
      employee_id:      employee.id,
      service_id:       rows[0]?.service_id || null,
      customer_name:    customer.name,
      employee_name:    employee.name,
      service_name:     rows.map(row => row.service_name).join(", "),
      service_price:    original,
      subtotal:         original,
      gst_rate:         5,
      gst_amount:       gst,
      total_amount:     grandTotal,
      pricing_type:     form.pricing_type,
      discount_amount:  autoDiscount + manualDisc,   // ← total discount (auto + manual)
      manual_discount:  manualDisc,                  // ← stored separately for invoice display
      line_items:       rows,
      bill_date:        form.bill_date,
      bill_time:        form.bill_time,
      payment_mode:     form.payment_mode,
      notes:            form.notes,
    };
  };

  // ── save (insert) ───────────────────────────────────────────────────────────
  const save = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true); setApiErr("");
    const { error: err } = await supabase.from("bills").insert([payload]);
    setSaving(false);
    if (err) { setApiErr(err.message); return; }
    await syncCustomerTotals(payload.customer_id);
    await reload();
    setModal(null);
  };

  const saveAndPrint = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true); setApiErr("");
    const { data, error: err } = await supabase.from("bills").insert([payload]).select().single();
    setSaving(false);
    if (err) { setApiErr(err.message); return; }
    await syncCustomerTotals(data?.customer_id || payload.customer_id);
    await reload();
    setModal(null);
    if (data) printBill(data);
  };

  // ── update (edit) ───────────────────────────────────────────────────────────
  const update = async () => {
    const payload = buildPayload();
    if (!payload || !editBill) return;
    setSaving(true); setApiErr("");
    const { error: err } = await supabase.from("bills").update(payload).eq("id", editBill.id);
    setSaving(false);
    if (err) { setApiErr(err.message); return; }
    if (editBill.customer_id && editBill.customer_id !== payload.customer_id) {
      await syncCustomerTotals(editBill.customer_id);
    }
    await syncCustomerTotals(payload.customer_id);
    await reload();
    setModal(null);
    setEditBill(null);
  };

  const updateAndPrint = async () => {
    const payload = buildPayload();
    if (!payload || !editBill) return;
    setSaving(true); setApiErr("");
    const { data, error: err } = await supabase.from("bills").update(payload).eq("id", editBill.id).select().single();
    setSaving(false);
    if (err) { setApiErr(err.message); return; }
    if (editBill.customer_id && editBill.customer_id !== payload.customer_id) {
      await syncCustomerTotals(editBill.customer_id);
    }
    await syncCustomerTotals(payload.customer_id);
    await reload();
    setModal(null);
    setEditBill(null);
    if (data) printBill(data);
  };

  // ── delete ──────────────────────────────────────────────────────────────────
  const del = async (id) => {
    setDeleting(true);
    const bill = bills.find(b => b.id === id);
    const customerId = bill?.customer_id;
    const { error: err } = await supabase.from("bills").delete().eq("id", id);
    setDeleting(false);
    if (err) { alert(err.message); return; }
    await syncCustomerTotals(customerId);
    await reload();
    setConfirmId(null);
  };

  const printBill = (bill) => {
    setViewBill(bill);
    setTimeout(() => window.print(), 80);
  };

  // ── filtered list ───────────────────────────────────────────────────────────
  const filtered = bills
    .filter(b => !dateRange.start || !dateRange.end || (b.bill_date >= dateRange.start && b.bill_date <= dateRange.end))
    .filter(b => {
      const q = search.toLowerCase();
      return [b.customer_name, b.employee_name, b.service_name, billNo(b)].some(v => String(v || "").toLowerCase().includes(q));
    })
    .sort((a, b) => `${a.bill_date}${a.bill_time}` < `${b.bill_date}${b.bill_time}` ? 1 : -1);

  const billsByDate = {};
  bills.forEach(b => {
    if (!b.bill_date) return;
    billsByDate[b.bill_date] = (billsByDate[b.bill_date] || 0) + 1;
  });

  const selectedBills = bills.filter(b => b.bill_date >= dateRange.start && b.bill_date <= dateRange.end);
  const selectedTotal = selectedBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const selectedDiscount = selectedBills.reduce((sum, b) => sum + Number(b.discount_amount || b.manual_discount || 0), 0);
  const selectedGst = selectedBills.reduce((sum, b) => sum + Number(b.gst_amount || 0), 0);
  const selectedNet = selectedTotal - selectedGst;
  const selectedAdvance = selectedBills.reduce((sum, b) => sum + Number(b.advance_amount || b.advance || 0), 0);
  const selectedCash = selectedBills.filter(b => String(b.payment_mode || "").toLowerCase() === "cash").reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const selectedUpi = selectedBills.filter(b => String(b.payment_mode || "").toLowerCase() === "upi").reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const selectedCard = selectedBills.filter(b => String(b.payment_mode || "").toLowerCase() === "card").reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const monthStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}`;
  const monthTotal = bills
    .filter(b => String(b.bill_date || "").startsWith(monthStr))
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const monthBills = bills
    .filter(b => String(b.bill_date || "").startsWith(monthStr))
    .sort((a, b) => `${a.bill_date}${a.bill_time}` > `${b.bill_date}${b.bill_time}` ? 1 : -1);
  const monthCustomerCount = new Set(monthBills.map(b => b.customer_id || b.customer_name).filter(Boolean)).size;
  const employeeTotals = employees
    .map(emp => ({
      name: emp.name,
      bills: monthBills.filter(b => b.employee_id === emp.id),
    }))
    .map(row => ({
      name: row.name,
      count: row.bills.length,
      total: row.bills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
    }))
    .filter(row => row.count > 0 || row.total > 0)
    .sort((a, b) => b.total - a.total);

  const downloadMonthlyBillsPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const monthLabel = `${monthNames[calMonth.month]} ${calMonth.year}`;
    const generatedOn = new Date().toLocaleString("en-IN");

    const serviceCategories = {};
    const paymentSummary = { Cash: 0, Card: 0, UPI: 0 };
    const invoiceNumbers = [];
    let totalNetSales = 0;

    monthBills.forEach(b => {
      const service = services.find(s => s.id === b.service_id) || {};
      const category = service.category || "Other";
      const gross = Number(b.total_amount || 0);
      const gst = Number(b.gst_amount || 0);
      const discount = Number(b.discount_amount || 0);
      const net = gross - gst + discount;
      totalNetSales += net;
      serviceCategories[category] = serviceCategories[category] || { count: 0, gross: 0, gst: 0, discount: 0, net: 0 };
      serviceCategories[category].count += 1;
      serviceCategories[category].gross += gross;
      serviceCategories[category].gst += gst;
      serviceCategories[category].discount += discount;
      serviceCategories[category].net += net;

      const paymentMode = String(b.payment_mode || "Cash");
      if (paymentMode in paymentSummary) paymentSummary[paymentMode] += net;
      invoiceNumbers.push(b.invoice_no ? String(b.invoice_no).padStart(5, "0") : billNo(b));
    });

    const categoryRows = Object.entries(serviceCategories).map(([category, data]) => [
      category,
      data.count,
      money(data.gross),
      money(data.gst),
      money(data.discount),
      money(data.net),
    ]);
    const categoryTotals = Object.values(serviceCategories).reduce((acc, row) => ({
      count: acc.count + row.count,
      gross: acc.gross + row.gross,
      gst: acc.gst + row.gst,
      discount: acc.discount + row.discount,
      net: acc.net + row.net,
    }), { count: 0, gross: 0, gst: 0, discount: 0, net: 0 });

    const paymentRow = [[
      money(Math.round(totalNetSales)),
      money(paymentSummary.Cash),
      money(paymentSummary.Card),
      money(paymentSummary.UPI),
    ]];

    const sortedInvoiceNumbers = invoiceNumbers.filter(Boolean).sort();
    const openingBillNo = sortedInvoiceNumbers[0] || "-";
    const closingBillNo = sortedInvoiceNumbers[sortedInvoiceNumbers.length - 1] || "-";

    const employeeRows = employeeTotals.map(row => [row.name, row.count, money(row.total)]);
    const employeeTotalValue = employeeTotals.reduce((sum, row) => sum + row.total, 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Monthly Bills Summary", 40, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Naturals Narasannpeta | ${monthLabel}`, 40, 60);
    doc.text(`Generated: ${generatedOn}`, 40, 76);

    autoTable(doc, {
      startY: 96,
      head: [["Month", "Bills", "Customers Visited", "Total Amount"]],
      body: [[monthLabel, monthBills.length, monthCustomerCount, money(monthTotal)]],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [192, 132, 252], textColor: [13, 11, 20] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [["Category", "No. of Services", "Gross Sales (with tax)", "GST", "Discount", "Net Sales (without tax and discount)"]],
      body: categoryRows.length
        ? [...categoryRows, ["Total", categoryTotals.count, money(categoryTotals.gross), money(categoryTotals.gst), money(categoryTotals.discount), money(categoryTotals.net)]]
        : [["No category data", 0, money(0), money(0), money(0), money(0)]],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [42, 37, 64] },
      columnStyles: { 0: { cellWidth: 110 }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [["Rounded Net Sales", "Cash", "Card", "UPI"]],
      body: paymentRow,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [96, 165, 250] },
      columnStyles: { 0: { halign: "right" }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [["Opening Bill No", "Closing Bill No", "Total Bills"]],
      body: [[openingBillNo, closingBillNo, monthBills.length]],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [["Employee", "No. of Services", "Service Value"]],
      body: employeeRows.length
        ? [...employeeRows, ["Total", "", money(employeeTotalValue)]]
        : [["No employees found", 0, money(0)]],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [249, 115, 22] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [["Bill No", "Date", "Customer", "Staff", "Services", "GST", "Total"]],
      body: monthBills.length
        ? monthBills.map(b => [
            `#${billNo(b)}`,
            `${b.bill_date || "-"} ${String(b.bill_time || "").slice(0, 5)}`,
            b.customer_name || getName(customers, b.customer_id),
            b.employee_name || getName(employees, b.employee_id),
            b.service_name || getName(services, b.service_id),
            money(b.gst_amount),
            money(b.total_amount),
          ])
        : [["No bills found", "-", "-", "-", "-", money(0), money(0)]],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
      headStyles: { fillColor: [22, 19, 31] },
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 82 },
        4: { cellWidth: 220 },
        5: { halign: "right" },
        6: { halign: "right" },
      },
    });

    doc.save(`monthly-bills-${monthStr}.pdf`);
  };

  // ── Invoice component ───────────────────────────────────────────────────────
  const Invoice = ({ bill, printMode = false }) => {
    if (!bill) return null;
    const customer = bill.customer_name || getName(customers, bill.customer_id);
    const employee = bill.employee_name || getName(employees, bill.employee_id);

    const rows = Array.isArray(bill.line_items) && bill.line_items.length
      ? bill.line_items
      : [{
          service_name:  bill.service_name || getName(services, bill.service_id),
          qty:           1,
          general_price: bill.service_price ?? bill.subtotal ?? 0,
          rate:          bill.subtotal ?? bill.service_price ?? 0,
          amount:        bill.subtotal ?? bill.service_price ?? 0,
        }];

    // Use stored values when available; fall back to calculation
    const base         = rows.reduce((sum, row) => sum + Number(row.general_price ?? row.rate ?? row.amount ?? 0), 0)
                         || Number(bill.subtotal ?? bill.service_price ?? 0);
    const autoDiscount = rows.reduce((sum, row) => sum + Number(row.discount ?? 0), 0);
    const manualDisc   = Number(bill.manual_discount ?? 0);                       // ← restored from DB
    const discount     = Number(bill.discount_amount ?? autoDiscount + manualDisc);
    const taxable      = rows.reduce((sum, row) => sum + Number(row.amount ?? row.rate ?? 0), 0) - manualDisc
                         || Math.max(base - discount, 0);
    const gst          = Number(bill.gst_amount ?? taxable * 0.05);
    const grandTotal   = Number(bill.total_amount ?? taxable + gst);

    const text  = printMode ? "#000"  : "var(--text)";
    const muted = printMode ? "#333"  : "var(--muted)";
    const line  = printMode ? "#111"  : "var(--border)";

    return (
      <div style={{ color: text, background: printMode ? "#fff" : "var(--card)", width: "100%", maxWidth: printMode ? "none" : 420, margin: "0 auto", fontSize: printMode ? 10 : ".82rem", lineHeight: 1.35 }}>
        {/* Header */}
        <div style={{ textAlign: "center", borderBottom: `1px solid ${line}`, paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ fontFamily: printMode ? "Arial,sans-serif" : "'Playfair Display',serif", fontSize: printMode ? 28 : "1.8rem", fontWeight: 800, color: printMode ? "#8b45a0" : "var(--accent)" }}>naturals</div>
          <div style={{ fontWeight: 800, fontSize: printMode ? 11 : ".75rem" }}>Tax Invoice</div>
          <div style={{ fontWeight: 800, marginTop: 3 }}>M/S SRI LALITHA BEAUTY ENCLAVE</div>
          <div style={{ color: muted, fontSize: printMode ? 9 : ".72rem", marginTop: 4 }}>1ST FLOOR, SHOP NO.25, D.NO:22-38, SRI DEVI FUNCTION HALL, BESIDE ANAND RAO COMPLEX, MAIN ROAD, NANDHRA PRADESH 532421</div>
          <div style={{ fontWeight: 700, marginTop: 5 }}>GST No: 37DLGPK2785A1Z4</div>
        </div>

        {/* Bill details */}
        <div style={{ borderBottom: `1px solid ${line}`, paddingBottom: 8, marginBottom: 8 }}>
          <div><b>Customer Name</b> : {customer}</div>
          <div><b>Client Phone</b> : {customers.find(c => c.id === bill.customer_id)?.phone || "-"}</div>
          <div><b>Bill Date</b> : {bill.bill_date} {String(bill.bill_time || "").slice(0, 5)}</div>
          <div><b>Invoice No.</b> : {billNo(bill)}</div>
          <div><b>Served By</b> : {employee}</div>
        </div>

        {/* Line items */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${line}` }}>
              {["Particulars", "Qty", "Rate", "Amount"].map(h => (
                <th key={h} style={{ textAlign: h === "Particulars" ? "left" : "right", padding: "4px 0", fontSize: printMode ? 9 : ".72rem", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.service_id || row.service_name}-${index}`}>
                <td style={{ padding: "5px 0", fontWeight: 700 }}>{row.service_name}</td>
                <td style={{ padding: "5px 0", textAlign: "right" }}>{row.qty || 1}</td>
                <td style={{ padding: "5px 0", textAlign: "right" }}>{money(row.general_price ?? row.rate ?? row.amount)}</td>
                <td style={{ padding: "5px 0", textAlign: "right" }}>{money(row.general_price ?? row.amount ?? row.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ borderTop: `1px solid ${line}`, paddingTop: 8 }}>
          {[
            ["Basic Sales",    base],
            ["Discount",       discount],       // ← now shows auto + manual discount
            ["Taxable Amount", taxable],
            ["GST Amount (5%)", gst],
            ["Round Off",      0],
            ["Bill Amount",    grandTotal],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontWeight: label === "Bill Amount" ? 800 : 600, marginBottom: 4, fontSize: label === "Bill Amount" && !printMode ? ".95rem" : undefined }}>
              <span>{label}</span><span>{money(value)}</span>
            </div>
          ))}
        </div>

        {/* Payment & GST summary */}
        <div style={{ marginTop: 12, borderTop: `1px solid ${line}`, paddingTop: 8, fontSize: printMode ? 9 : ".72rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b>Payment Mode</b><span>{bill.payment_mode || "Cash"}</span></div>
          <div style={{ marginTop: 8, fontWeight: 800 }}>GST Tax Summary:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "right", gap: 4, marginTop: 4 }}>
            <b style={{ textAlign: "left" }}>GST</b><b>CGST</b><b>SGST</b><b>Total</b>
            <span style={{ textAlign: "left" }}>5%</span>
            <span>{money(gst / 2)}</span>
            <span>{money(gst / 2)}</span>
            <span>{money(gst)}</span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, borderTop: `1px solid ${line}`, paddingTop: 8, fontWeight: 800, fontSize: printMode ? 9 : ".7rem" }}>
          THANK YOU. HAVE A NICE DAY.<br />THIS IS COMPUTERIZED INVOICE, HENCE NO SIGNATURE REQUIRED.
        </div>
      </div>
    );
  };

  // ── shared form body (used by both add & edit modals) ───────────────────────
  const BillForm = () => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Customer">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <select style={IS} value={form.customer_id} onChange={e => updateCustomer(e.target.value)}>
              <option value="">- select -</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.has_membership ? " (Member)" : ""}</option>)}
            </select>
            <Btn small ghost onClick={openCustomerModal}><Icon d={I.add} size={13} /> Add</Btn>
          </div>
        </Field>
        <Field label="Staff">
          <select style={IS} value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
            <option value="">- select -</option>
            {employees.filter(e => e.status === "active").map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Price Type">
        <select style={IS} value={form.pricing_type} disabled>
          <option value="general">General / Non membership</option>
          <option value="membership">Membership</option>
        </select>
      </Field>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Services</label>
          <Btn small ghost onClick={addItem}><Icon d={I.add} size={13} /> Add Service</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item, index) => {
            const q        = (serviceSearch[index] || "").toLowerCase();
            const selected = services.find(s => s.id === item.service_id);
            const choices  = services.filter(s => s.is_active && (!q || s.name.toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q)));
            return (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center", position: "relative" }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <button onClick={() => setServiceOpen(serviceOpen.map((v, i) => i === index ? !v : v))} style={{ ...IS, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{selected ? `${selected.name} - ${money(priceFor(selected))}` : "- select -"}</span>
                    <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>▾</span>
                  </button>
                  {serviceOpen[index] && (
                    <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 8, zIndex: 80 }}>
                      <input key={`service-search-${index}`} placeholder="Search services..." style={{ ...IS, marginBottom: 8 }} value={serviceSearch[index] || ""} onChange={e => setServiceSearch(serviceSearch.map((v, i) => i === index ? e.target.value : v))} />
                      <div style={{ maxHeight: 220, overflow: "auto" }}>
                        {choices.length === 0 && <div style={{ color: "var(--muted)", padding: 8 }}>No services found.</div>}
                        {choices.map(s => (
                          <div key={s.id} onClick={() => { updateItem(index, s.id); setServiceOpen(serviceOpen.map((v, i) => i === index ? false : v)); }} style={{ padding: "8px", cursor: "pointer", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div style={{ fontWeight: 700 }}>{s.name}</div>
                            <div style={{ color: "var(--muted)" }}>{money(priceFor(s))}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => items.length > 1 && removeItem(index)}
                  disabled={items.length === 1}
                  style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 10px", cursor: items.length > 1 ? "pointer" : "not-allowed", color: items.length > 1 ? "#e53e3e" : "var(--border)", display: "flex" }}
                >
                  <Icon d={I.del} size={14} />
                </button>
                {selected && (
                  <div style={{ gridColumn: "1 / -1", fontSize: ".76rem", color: "var(--muted)" }}>
                    General {money(generalFor(selected))} · Selected {money(priceFor(selected))} · Discount {money(Math.max(generalFor(selected) - priceFor(selected), 0))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Date"><input type="date" style={IS} value={form.bill_date} onChange={e => setForm({ ...form, bill_date: e.target.value })} onMouseEnter={e => e.target.showPicker?.()} /></Field>
        <Field label="Time"><input type="time" style={IS} value={form.bill_time} onChange={e => setForm({ ...form, bill_time: e.target.value })} /></Field>
        <Field label="Payment">
          <select style={IS} value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
            {["Cash", "UPI", "Card"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Additional Discount">
          <input
            placeholder="Manual Discount"
            style={IS}
            value={form.manual_discount}
            onChange={e => setForm({ ...form, manual_discount: e.target.value })}
          />
        </Field>
      </div>

      {/* Live totals preview */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--muted)" }}><span>Basic Sales</span><b>{money(originalSubtotal)}</b></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--muted)" }}><span>Discount</span><b>{money(discountAmount)}</b></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--muted)" }}><span>Taxable Amount</span><b>{money(taxableSubtotal)}</b></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--muted)" }}><span>GST 5%</span><b>{money(gstAmount)}</b></div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--border)", color: "var(--text)", fontWeight: 800 }}><span>Bill Amount</span><span>{money(total)}</span></div>
      </div>

      <Field label="Notes">
        <textarea style={{ ...IS, minHeight: 68, resize: "vertical" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
      </Field>

      {apiErr && <ErrBox msg={apiErr} />}
    </>
  );

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
        {[
          { label: "Total Net", value: selectedNet, accent: [24, 163, 101] },
          { label: "Total Gross", value: selectedTotal, accent: [37, 99, 235] },
          { label: "Total Advance", value: selectedAdvance, accent: [234, 179, 8] },
          { label: "Total Discount", value: selectedDiscount, accent: [236, 72, 153] },
        ].map(card => (
          <div key={card.label} style={{ borderRadius: 18, padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: `linear-gradient(135deg, rgba(${card.accent.join(",")},.15), rgba(255,255,255,.7))`, border: `1px solid rgba(${card.accent.join(",")}, .18)` }}>
            <div>
              <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)" }}>{money(card.value)}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Calendar */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1rem", alignItems: "start", marginBottom: "1rem" }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}>
              <Icon d="M15 18l-6-6 6-6" size={16} />
            </button>
            <h4 style={{ margin: 0, fontSize: ".88rem", fontWeight: 700, color: "var(--text)" }}>
              {monthNames[calMonth.month]} {calMonth.year}
            </h4>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}>
              <Icon d="M9 18l6-6-6-6" size={16} />
            </button>
          </div>
          <div style={{ padding: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: ".68rem", fontWeight: 700, color: "var(--muted)", padding: "2px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {Array(firstDayOfMonth(calMonth.year, calMonth.month)).fill(null).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array(daysInMonth(calMonth.year, calMonth.month)).fill(null).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = dateStr >= dateRange.start && dateStr <= dateRange.end;
                const isToday = dateStr === today();
                const hasBills = billsByDate[dateStr] > 0;
                return (
                  <button key={day} onClick={() => {
                    if (dateRange.start !== dateRange.end) {
                      setDateRange({ start: dateStr, end: dateStr });
                    } else if (dateStr >= dateRange.start) {
                      setDateRange({ start: dateRange.start, end: dateStr });
                    } else {
                      setDateRange({ start: dateStr, end: dateRange.start });
                    }
                  }}
                    style={{
                      position: "relative", width: "100%", aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      borderRadius: 8, border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
                      background: isSelected ? "var(--accent)" : "none",
                      color: isSelected ? "var(--bg)" : isToday ? "var(--accent)" : "var(--text)",
                      cursor: "pointer", fontWeight: isToday || isSelected ? 700 : 500, fontSize: ".82rem",
                    }}>
                    {day}
                    {hasBills && !isSelected && (
                      <div style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border)", paddingTop: "0.875rem", marginTop: "-1px" }}>
            <div style={{ fontSize: ".75rem", color: "var(--muted)", marginBottom: 4 }}>
              Selected: <strong style={{ color: "var(--text)" }}>{dateRange.start === dateRange.end ? dateRange.start : `${dateRange.start} – ${dateRange.end}`}</strong>
            </div>
            <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>Bills: <strong style={{ color: "var(--accent)" }}>{filtered.length}</strong></div>
            <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 2 }}>Day total: <strong style={{ color: "#34d399" }}>{money(selectedTotal)}</strong></div>
            <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 2 }}>Month total: <strong style={{ color: "#60a5fa" }}>{money(monthTotal)}</strong></div>
          </div>
        </div>

        <div>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isAdmin && <Btn ghost onClick={() => setDashboardPopup(true)}><Icon d={I.dash} size={15} /> DASHBOARD</Btn>}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Search bill / customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, width: 220 }} />
          {isAdmin && <Btn ghost onClick={downloadMonthlyBillsPdf}><Icon d={I.print} size={15} /> Monthly Bills</Btn>}
          <Btn onClick={openAdd}><Icon d={I.add} size={15} /> NEW</Btn>
        </div>
      </div>

      {/* Bills table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["InvoiceID", "Date", "Customer", "Desc", "Gross", "Discount", "Referral", "View"].map(h => (
                <th key={h} style={{ textAlign: h === "Gross" || h === "Discount" ? "right" : "left", padding: "11px 14px", color: "var(--muted)", fontWeight: 600, fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>No bills found.</td></tr>
            )}
            {filtered.map(b => {
              const rowCustomer = customers.find(c => c.id === b.customer_id);
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 800, color: "var(--text)" }}>#{billNo(b)}</td>
                  <td style={{ padding: "12px 14px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {b.bill_date} <span style={{ color: "var(--accent)", fontWeight: 600 }}>{String(b.bill_time || "").slice(0, 5)}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--text)" }}>
                    {b.customer_name || rowCustomer?.name || "-"}
                    {rowCustomer?.has_membership && <span style={{ marginLeft: 6 }}>👑</span>}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--muted)" }}>{b.service_name || getName(services, b.service_id)}</td>
                  <td style={{ padding: "12px 14px", color: "var(--muted)", textAlign: "right" }}>{money(b.total_amount || 0)}</td>
                  <td style={{ padding: "12px 14px", color: "var(--muted)", textAlign: "right" }}>{money(Number(b.discount_amount || 0))}</td>
                  <td style={{ padding: "12px 14px", color: "var(--muted)" }}>{b.referral || "-"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button title="View bill" onClick={() => setViewBill(b)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
                      <Icon d={I.eye} size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </div>
      </div>

      {dashboardPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,6,18,.45)", zIndex: 1100, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 420, maxWidth: "100%", height: "100%", background: "var(--card)", borderLeft: "1px solid var(--border)", boxShadow: "-24px 0 48px rgba(0,0,0,.35)", overflowY: "auto", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)" }}>Dashboard</div>
                <div style={{ color: "var(--muted)", fontSize: ".88rem", marginTop: 4 }}>Quick billing insights</div>
              </div>
              <button onClick={() => setDashboardPopup(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}>
                <Icon d={I.close} size={18} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              {[
                { label: "Bills", value: filtered.length, color: "#60a5fa" },
                { label: "Day Total", value: selectedTotal, color: "#22c55e", money: true },
                { label: "Discount", value: selectedDiscount, color: "#ec4899", money: true },
                { label: "Advance", value: selectedAdvance, color: "#f59e0b", money: true },
                { label: "Cash", value: selectedCash, color: "#22c55e", money: true },
                { label: "UPI", value: selectedUpi, color: "#2563eb", money: true },
                { label: "Card", value: selectedCard, color: "#8b5cf6", money: true },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", borderRadius: 16, padding: "1rem" }}>
                  <div style={{ color: "var(--muted)", fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".5rem" }}>{item.label}</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: item.color }}>{item.money ? money(item.value) : item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "1rem", background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", borderRadius: 16 }}>
              <div style={{ marginBottom: ".75rem", fontSize: ".92rem", fontWeight: 700, color: "var(--text)" }}>Month overview</div>
              <div style={{ display: "grid", gap: ".75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Total bills</span><strong style={{ color: "var(--text)" }}>{monthBills.length}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Month total</span><strong style={{ color: "var(--text)" }}>{money(monthTotal)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Customer visits</span><strong style={{ color: "var(--text)" }}>{monthCustomerCount}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add modal */}
      {modal === "add" && (
        <Modal title="New Bill" onClose={() => setModal(null)} wide>
          <BillForm />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn ghost onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving || !canSaveBill}>{saving ? "Saving..." : "Save Bill"}</Btn>
            <Btn onClick={saveAndPrint} disabled={saving || !canSaveBill}><Icon d={I.print} size={13} /> {saving ? "Saving..." : "Save & Print"}</Btn>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {modal === "edit" && (
        <Modal title={`Edit Bill #${billNo(editBill)}`} onClose={() => { setModal(null); setEditBill(null); }} wide>
          <BillForm />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn ghost onClick={() => { setModal(null); setEditBill(null); }}>Cancel</Btn>
            <Btn onClick={update} disabled={saving || !canSaveBill}>{saving ? "Saving..." : "Update Bill"}</Btn>
            <Btn onClick={updateAndPrint} disabled={saving || !canSaveBill}><Icon d={I.print} size={13} /> {saving ? "Saving..." : "Update & Print"}</Btn>
          </div>
        </Modal>
      )}

      {customerModal && (
        <Modal title="Add Customer" onClose={() => setCustomerModal(false)}>
          <Field label="Full Name">
            <input style={IS} value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Customer name" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Gender">
              <select style={IS} value={customerForm.gender} onChange={e => setCustomerForm({ ...customerForm, gender: e.target.value })}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Last Visit">
              <input type="date" style={IS} value={customerForm.last_visit} onChange={e => setCustomerForm({ ...customerForm, last_visit: e.target.value })} onMouseEnter={e => e.target.showPicker?.()} />
            </Field>
          </div>
          <Field label="Phone">
            <input style={IS} value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="Phone number" />
          </Field>
          <Field label="Email">
            <input style={IS} value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="Email address" />
          </Field>
          <Field label="Membership">
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text)", fontSize: ".88rem", fontWeight: 700 }}>
              <input type="checkbox" checked={!!customerForm.has_membership} onChange={e => setCustomerForm({ ...customerForm, has_membership: e.target.checked })} />
              Customer has membership
            </label>
          </Field>
          <>
            <Field label="Membership Card No.">
              <input style={IS} value={customerForm.membership_card_no} onChange={e => setCustomerForm({ ...customerForm, membership_card_no: e.target.value, has_membership: !!e.target.value })} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Membership Start">
                <input type="date" style={IS} value={customerForm.membership_start} onChange={e => setCustomerForm({ ...customerForm, membership_start: e.target.value, has_membership: !!e.target.value })} onMouseEnter={e => e.target.showPicker?.()} />
              </Field>
              <Field label="Membership End">
                <input type="date" style={IS} value={customerForm.membership_end} onChange={e => setCustomerForm({ ...customerForm, membership_end: e.target.value, has_membership: !!e.target.value })} onMouseEnter={e => e.target.showPicker?.()} />
              </Field>
            </div>
          </>
          <Field label="Notes">
            <textarea style={{ ...IS, minHeight: 68, resize: "vertical" }} value={customerForm.notes} onChange={e => setCustomerForm({ ...customerForm, notes: e.target.value })} placeholder="Optional notes..." />
          </Field>
          {customerErr && <ErrBox msg={customerErr} />}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn ghost onClick={() => setCustomerModal(false)}>Cancel</Btn>
            <Btn onClick={saveCustomerFromBilling} disabled={customerSaving || !canSaveCustomer}>{customerSaving ? "Saving..." : "Save Customer"}</Btn>
          </div>
        </Modal>
      )}

      {/* View modal */}
      {viewBill && (
        <Modal title={`Bill #${billNo(viewBill)}`} onClose={() => setViewBill(null)} wide>
          <Invoice bill={viewBill} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1rem" }}>
            <Btn ghost onClick={() => setViewBill(null)}>Close</Btn>
            <Btn onClick={() => printBill(viewBill)}><Icon d={I.print} size={15} /> Print</Btn>
          </div>
        </Modal>
      )}

      {/* Print-only invoice */}
      {viewBill && <div className="print-only"><Invoice bill={viewBill} printMode /></div>}

      {/* Delete confirm */}
      {confirmId && <Confirm msg="Delete this bill?" loading={deleting} onOk={() => del(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
}

export default function App() {
  const [authPage, setAuthPage]       = useState("login");
  const [session, setSession]         = useState(undefined);
  const [profile, setProfile]         = useState(null);
  const [tab, setTab]                 = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme]             = useState("dark");
  const [dataLoading, setDataLoading] = useState(false);

  const [employees,    setEmployees]    = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [services,     setServices]     = useState([]);
  const [bills,        setBills]        = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setProfile(null); return; }
    supabase.from("user_profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => {
        setProfile(data || { id: session.user.id, name: session.user.email, role: "Staff", is_admin: false });
      });
  }, [session]);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    const [er, cr, sr, br] = await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("customers").select("*").order("name"),
      supabase.from("services").select("*").order("name"),
      supabase.from("bills").select("*").order("bill_date", { ascending: false }).range(0, 9999),
    ]);
    setEmployees(er.data || []);
    setCustomers(cr.data || []);
    setServices(sr.data || []);
    setBills(br.data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => { if (session) loadData(); }, [session, loadData]);

  const isAdmin  = profile?.is_admin ?? false;

  useEffect(() => {
    if (!isAdmin) {
      setTheme("light");
    }
  }, [isAdmin]);
  const userName = profile?.name || session?.user?.email || "User";
  const userRole = profile?.role || "Staff";
  const todayCount = bills.filter(b => b.bill_date === today()).length;

  // Nav items — owner gets dashboard, staff sees only operational screens
  const nav = [
    ...(isAdmin ? [{ id: "dashboard", label: "Owner Dashboard", icon: I.dash }] : []),
    { id: "billing",      label: "Billing",       icon: I.bill },
    { id: "employees",    label: "Employees",     icon: I.emp  },
    { id: "customers",    label: "Customers",     icon: I.cust },
    { id: "services",     label: "Services",      icon: I.serv },
  ];

  useEffect(() => {
    if (!isAdmin && tab === "dashboard") {
      setTab("billing");
    }
  }, [isAdmin, tab]);

  if (session === undefined) {
    return (<><style>{CSS}</style><Loading msg="Initialising…" /></>);
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
      <div data-theme={theme} style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)", color: "var(--text)" }}>

        {/* Sidebar */}
        <aside style={{ width: sidebarOpen ? 224 : 0, minWidth: sidebarOpen ? 224 : 0, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", transition: "all .25s", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              
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
                </button>
              );
            })}
          </nav>

          <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: isAdmin ? "var(--accent)" : "rgba(192,132,252,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: ".9rem", color: "var(--bg)", flexShrink: 0 }}>
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

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--card)", flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}><Icon d={I.menu} size={20} /></button>
            <div style={{ flex: 1, fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--text)" }}>
              {nav.find(n => n.id === tab)?.label || tab}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {dataLoading && <div className="spin" style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)" }} />}
              {isAdmin
                ? <span style={{ background: "rgba(192,132,252,.12)", color: "var(--accent)", padding: "4px 12px", borderRadius: 99, fontWeight: 700, fontSize: ".78rem", display: "flex", alignItems: "center", gap: 5 }}><Icon d={I.shield} size={12} /> Owner</span>
                : <span style={{ background: "rgba(52,211,153,.08)", color: "#34d399", padding: "4px 12px", borderRadius: 99, fontWeight: 700, fontSize: ".78rem", display: "flex", alignItems: "center", gap: 5 }}><Icon d={I.emp} size={12} /> Staff</span>
              }
              {isAdmin && (
                <button
                  onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                  style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: ".78rem", fontFamily: "inherit" }}
                >
                  {theme === "dark" ? "Light" : "Dark"}
                </button>
              )}
              <span style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)", padding: "4px 12px", borderRadius: 99, fontSize: ".78rem" }}>{employees.length} staff · {customers.length} clients</span>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            {tab === "dashboard" && isAdmin && (
              <OwnerDashboard employees={employees} customers={customers} services={services} bills={bills} />
            )}
            {tab === "billing"      && <Billing      bills={bills} reload={loadData} employees={employees} customers={customers} services={services} isAdmin={isAdmin} setTab={setTab} />}
            {tab === "employees"    && <Employees    employees={employees}    reload={loadData} isAdmin={isAdmin} />}
            {tab === "customers"    && <Customers    customers={customers}    bills={bills} reload={loadData} isAdmin={isAdmin} />}
            {tab === "services"     && <Services     services={services}      reload={loadData} isAdmin={isAdmin} />}
          </main>
        </div>
      </div>
    </>
  );
}
