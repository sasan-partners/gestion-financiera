import { useState, useEffect, useCallback, createContext, useContext, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ============================================================
// SUPABASE CLIENT
// ============================================================
const SUPABASE_URL = "https://pksohfzhrimzeecxhhqa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrc29oZnpocmltemVlY3hoaHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODcxNzIsImV4cCI6MjA4MDI2MzE3Mn0.CBYf8TyHlUc9cPlnktgyWjWEBjiqlaDf_SQmSzBM5Ak";

const supabaseHeaders = (token) => ({
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${token || SUPABASE_KEY}`,
});

async function supabaseRest(path, options = {}, token) {
  const { headers: extraHeaders, ...restOptions } = options;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...restOptions,
    headers: { ...supabaseHeaders(token), ...extraHeaders },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function supabaseAuth(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || "Auth error");
  return data;
}

// ============================================================
// AUTH CONTEXT
// ============================================================
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email, password) => {
    const data = await supabaseAuth("token?grant_type=password", { email, password });
    const s = { access_token: data.access_token, user: data.user };
    setSession(s);
    return s;
  };

  const signOut = () => {
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() { return useContext(AuthContext); }

// ============================================================
// DATA HOOKS
// ============================================================
function useSupabaseQuery(table, select = "*", filters = "", deps = []) {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const path = `${table}?select=${encodeURIComponent(select)}${filters}&order=created_at.desc`;
      const result = await supabaseRest(path, {}, session?.access_token);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [table, select, filters, session?.access_token, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ============================================================
// ICONS (SVG inline)
// ============================================================
const Icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  reports: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  trendUp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  trendDown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  wallet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  pie: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  calculator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="8" y2="10" /><line x1="12" y1="10" x2="12" y2="10" /><line x1="16" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="8" y2="14" /><line x1="12" y1="14" x2="12" y2="14" /><line x1="16" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="8" y2="18" /><line x1="12" y1="18" x2="12" y2="18" /><line x1="16" y1="18" x2="16" y2="18" />
    </svg>
  ),
  folder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
    </svg>
  ),
  filter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  building: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  ),
  tag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" />
    </svg>
  ),
  card: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  dollar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

// ============================================================
// STYLES
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #0f1117;
    --bg-card: #1a1d27;
    --bg-sidebar: #141720;
    --bg-hover: #232736;
    --bg-active: #2563eb;
    --border: #2a2d3a;
    --text: #e4e4e7;
    --text-muted: #71717a;
    --text-heading: #fafafa;
    --primary: #3b82f6;
    --primary-hover: #2563eb;
    --success: #22c55e;
    --success-bg: rgba(34,197,94,0.1);
    --danger: #ef4444;
    --danger-bg: rgba(239,68,68,0.1);
    --warning: #f59e0b;
    --font: 'DM Sans', system-ui, sans-serif;
  }

  body, #root { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; }

  .app-layout { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: 260px; min-height: 100vh; background: var(--bg-sidebar);
    border-right: 1px solid var(--border); display: flex; flex-direction: column;
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;
  }
  .sidebar-logo {
    padding: 20px 24px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 12px;
  }
  .sidebar-logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    display: flex; align-items: center; justify-content: center; color: white;
  }
  .sidebar-logo h1 { font-size: 16px; font-weight: 600; color: var(--text-heading); }
  .sidebar-logo p { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
  .sidebar-nav { flex: 1; overflow-y: auto; padding: 16px 12px; }
  .sidebar-section { margin-bottom: 8px; }
  .sidebar-section-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1.2px; color: var(--text-muted); padding: 8px 12px 4px;
  }
  .sidebar-item {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 9px 12px; border-radius: 8px; border: none; background: none;
    color: var(--text-muted); font-size: 13.5px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; font-family: var(--font); text-align: left;
  }
  .sidebar-item:hover { background: var(--bg-hover); color: var(--text); }
  .sidebar-item.active { background: var(--bg-active); color: white; }
  .sidebar-divider { height: 1px; background: var(--border); margin: 12px 0; }
  .sidebar-footer {
    border-top: 1px solid var(--border); padding: 12px;
  }
  .sidebar-user { padding: 8px 12px; }
  .sidebar-user-label { font-size: 11px; color: var(--text-muted); }
  .sidebar-user-email { font-size: 13px; font-weight: 500; color: var(--text); word-break: break-all; }

  /* MAIN */
  .main { margin-left: 260px; flex: 1; padding: 32px; min-height: 100vh; }

  /* HEADER */
  .page-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
  }
  .page-header h2 { font-size: 24px; font-weight: 700; color: var(--text-heading); }
  .page-header-period { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
  .header-actions { display: flex; gap: 8px; align-items: center; }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg-card); color: var(--text); font-size: 13px;
    font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: var(--font);
    white-space: nowrap;
  }
  .btn:hover { background: var(--bg-hover); border-color: #3a3d4a; }
  .btn-primary { background: var(--primary); border-color: var(--primary); color: white; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-danger { background: var(--danger); border-color: var(--danger); color: white; }
  .btn-sm { padding: 5px 10px; font-size: 12px; }
  .btn-icon { padding: 6px; width: 32px; height: 32px; justify-content: center; }
  .btn-ghost { border: none; background: none; }
  .btn-ghost:hover { background: var(--bg-hover); }

  /* CARDS */
  .card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden;
  }
  .card-header { padding: 16px 20px; border-bottom: 1px solid var(--border); }
  .card-title { font-size: 15px; font-weight: 600; color: var(--text-heading); }
  .card-body { padding: 20px; }

  /* KPI CARDS */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .kpi-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px;
  }
  .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .kpi-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
  .kpi-icon { color: var(--primary); }
  .kpi-value { font-size: 28px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px; font-variant-numeric: tabular-nums; }
  .kpi-plan { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
  .kpi-variance { font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; }
  .kpi-variance.positive { color: var(--success); background: var(--success-bg); }
  .kpi-variance.negative { color: var(--danger); background: var(--danger-bg); }

  /* TABLE */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    padding: 10px 16px; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);
    border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap;
  }
  thead th.right { text-align: right; }
  thead th.center { text-align: center; }
  tbody td {
    padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--border);
    font-variant-numeric: tabular-nums;
  }
  tbody td.right { text-align: right; }
  tbody td.center { text-align: center; }
  tbody tr:hover { background: var(--bg-hover); }
  tbody tr.subtotal { background: rgba(59,130,246,0.05); font-weight: 600; }
  tbody tr.grand-total { background: rgba(59,130,246,0.1); font-weight: 700; border-top: 2px solid var(--border); }
  .text-success { color: var(--success); }
  .text-danger { color: var(--danger); }
  .text-muted { color: var(--text-muted); }
  .text-bold { font-weight: 700; }

  /* FORMS */
  .form-group { margin-bottom: 14px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
  .form-input, .form-select {
    width: 100%; padding: 8px 12px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--bg);
    color: var(--text); font-size: 13px; font-family: var(--font);
    outline: none; transition: border-color 0.15s;
  }
  .form-input:focus, .form-select:focus { border-color: var(--primary); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* MODAL */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); z-index: 100; display: flex;
    align-items: center; justify-content: center; padding: 20px;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 16px; width: 100%; max-width: 520px; max-height: 85vh;
    overflow-y: auto; padding: 24px;
  }
  .modal h3 { font-size: 18px; font-weight: 700; color: var(--text-heading); margin-bottom: 20px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }

  /* FILTERS */
  .filters-panel {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 20px;
  }
  .filters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
  .filters-actions { display: flex; gap: 8px; margin-top: 12px; }
  .filter-badge {
    background: var(--primary); color: white; border-radius: 50%;
    width: 18px; height: 18px; font-size: 10px; font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center; margin-left: 4px;
  }

  /* CHARTS */
  .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .chart-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .chart-title { font-size: 14px; font-weight: 600; color: var(--text-heading); margin-bottom: 16px; }

  /* SECTION TITLE */
  .section-title { font-size: 16px; font-weight: 600; color: var(--text-heading); margin: 24px 0 16px; }

  /* LOGIN */
  .login-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg); padding: 20px;
  }
  .login-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 16px; padding: 40px; width: 100%; max-width: 400px;
  }
  .login-card h2 { text-align: center; font-size: 22px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px; }
  .login-card p { text-align: center; font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
  .login-error { background: var(--danger-bg); color: var(--danger); padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; }

  /* SPINNER */
  .spinner { display: flex; align-items: center; justify-content: center; padding: 60px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin-icon { animation: spin 1s linear infinite; color: var(--primary); }

  /* TABS */
  .tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--bg-card); padding: 4px; border-radius: 10px; border: 1px solid var(--border); width: fit-content; }
  .tab {
    padding: 7px 16px; border-radius: 7px; border: none; background: none;
    color: var(--text-muted); font-size: 13px; font-weight: 500; cursor: pointer;
    font-family: var(--font); transition: all 0.15s;
  }
  .tab:hover { color: var(--text); }
  .tab.active { background: var(--primary); color: white; }

  /* SEARCH */
  .search-bar {
    position: relative; margin-bottom: 16px; max-width: 320px;
  }
  .search-bar input { padding-left: 36px; }
  .search-bar svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }

  /* BADGE */
  .badge {
    display: inline-block; padding: 2px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
  }
  .badge-success { background: var(--success-bg); color: var(--success); }
  .badge-danger { background: var(--danger-bg); color: var(--danger); }
  .badge-warning { background: rgba(245,158,11,0.1); color: var(--warning); }
  .badge-primary { background: rgba(59,130,246,0.1); color: var(--primary); }

  /* TOAST */
  .toast {
    position: fixed; bottom: 20px; right: 20px; z-index: 200;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 10px; padding: 14px 20px; min-width: 280px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4); animation: slideUp 0.3s ease;
  }
  .toast-title { font-size: 14px; font-weight: 600; color: var(--text-heading); }
  .toast-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .empty-state { text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { margin-left: 0; padding: 16px; }
    .kpi-grid { grid-template-columns: 1fr 1fr; }
    .charts-grid { grid-template-columns: 1fr; }
    .form-row { grid-template-columns: 1fr; }
  }
`;

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (v, currency = "US$") =>
  `${currency} ${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0)}`;

const formatPct = (v) => `${(v || 0).toFixed(1)}%`;

const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const monthNamesFull = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ============================================================
// TOAST
// ============================================================
let toastTimer = null;
function showToast(setToast, title, desc) {
  setToast({ title, desc });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setToast(null), 3000);
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err) {
      setError("Error: " + (err.message || "No se pudo conectar con el servidor"));
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div className="sidebar-logo-icon" style={{ width: 48, height: 48 }}>{Icons.reports}</div>
        </div>
        <h2>+Partners</h2>
        <p>Gestión Financiera</p>
        {error && <div className="login-error">{error}</div>}
        <div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 8, padding: "10px 16px" }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================
function KPICard({ title, value, plan, variance, icon }) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{title}</span>
        <span className="kpi-icon">{icon}</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-plan">Plan: {plan}</div>
      {variance !== undefined && variance !== null && (
        <span className={`kpi-variance ${variance >= 0 ? "positive" : "negative"}`}>
          {variance >= 0 ? "↗" : "↘"} {Math.abs(variance).toFixed(1)}% vs plan
        </span>
      )}
    </div>
  );
}

// ============================================================
// PLAN VS REAL CHART
// ============================================================
function PlanVsRealChart({ data, title }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
          <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#2a2d3a" }} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={{ stroke: "#2a2d3a" }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 8, fontSize: 12 }} formatter={(v) => formatCurrency(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="plan" name="Plan" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="real" name="Real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
const mainMenu = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { id: "reports", label: "Reportes Actuales", icon: Icons.reports },
  { id: "projected-reports", label: "Reportes Proyectados", icon: Icons.reports },
  { id: "project-management", label: "Gestión de Proyectos", icon: Icons.folder },
  { id: "budget", label: "Presupuesto", icon: Icons.calculator },
  { id: "income", label: "Ingresos", icon: Icons.trendUp },
  { id: "expenses", label: "Gastos", icon: Icons.trendDown },
];

const adminMenu = [
  { id: "business-units", label: "Unidades de Negocio", icon: Icons.building },
  { id: "products", label: "Productos", icon: Icons.tag },
  { id: "clients", label: "Clientes", icon: Icons.users },
  { id: "projects", label: "Proyectos", icon: Icons.folder },
  { id: "categories", label: "Categorías", icon: Icons.tag },
  { id: "partners", label: "Socios", icon: Icons.users },
  { id: "suppliers", label: "Proveedores", icon: Icons.users },
  { id: "payment-methods", label: "Formas de Pago", icon: Icons.card },
  { id: "currencies", label: "Monedas", icon: Icons.dollar },
  { id: "exchange-rates", label: "Tipos de Cambio", icon: Icons.wallet },
];

function Sidebar({ active, onNavigate }) {
  const { signOut, session } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">{Icons.reports}</div>
        <div>
          <h1>+Partners</h1>
          <p>Gestión Financiera</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {mainMenu.map(item => (
            <button key={item.id} className={`sidebar-item ${active === item.id ? "active" : ""}`} onClick={() => onNavigate(item.id)}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-section-label">Administración</div>
        <div className="sidebar-section">
          {adminMenu.map(item => (
            <button key={item.id} className={`sidebar-item ${active === item.id ? "active" : ""}`} onClick={() => onNavigate(item.id)}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-label">Conectado como</div>
          <div className="sidebar-user-email">{session?.user?.email}</div>
        </div>
        <button className="sidebar-item" onClick={() => onNavigate("settings")}>{Icons.settings}Configuración</button>
        <button className="sidebar-item" onClick={signOut}>{Icons.logout}Cerrar Sesión</button>
      </div>
    </aside>
  );
}

// ============================================================
// FILTERS
// ============================================================
const emptyFilters = { dateFrom: "", dateTo: "", businessUnitId: "all", productId: "all", clientId: "all", projectId: "all", partnerId: "all", currencyId: "all" };

function FiltersPanel({ filters, onChange, businessUnits, projects, clients, partners, currencies }) {
  const [open, setOpen] = useState(false);
  const count = Object.entries(filters).filter(([k, v]) => k === "dateFrom" || k === "dateTo" ? v !== "" : v !== "all").length;

  return (
    <>
      <button className="btn" onClick={() => setOpen(!open)}>
        {Icons.filter} Filtros {count > 0 && <span className="filter-badge">{count}</span>}
      </button>
      {open && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="form-group">
              <label className="form-label">Desde</label>
              <input className="form-input" type="date" value={filters.dateFrom} onChange={e => onChange({ ...filters, dateFrom: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Hasta</label>
              <input className="form-input" type="date" value={filters.dateTo} onChange={e => onChange({ ...filters, dateTo: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Unidad de Negocio</label>
              <select className="form-select" value={filters.businessUnitId} onChange={e => onChange({ ...filters, businessUnitId: e.target.value })}>
                <option value="all">Todas</option>
                {businessUnits?.map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Proyecto</label>
              <select className="form-select" value={filters.projectId} onChange={e => onChange({ ...filters, projectId: e.target.value })}>
                <option value="all">Todos</option>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <select className="form-select" value={filters.clientId} onChange={e => onChange({ ...filters, clientId: e.target.value })}>
                <option value="all">Todos</option>
                {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Socio</label>
              <select className="form-select" value={filters.partnerId} onChange={e => onChange({ ...filters, partnerId: e.target.value })}>
                <option value="all">Todos</option>
                {partners?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Moneda</label>
              <select className="form-select" value={filters.currencyId} onChange={e => onChange({ ...filters, currencyId: e.target.value })}>
                <option value="all">Todas</option>
                {currencies?.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>
          </div>
          <div className="filters-actions">
            <button className="btn btn-sm" onClick={() => { onChange(emptyFilters); }}>{Icons.x} Limpiar filtros</button>
            <button className="btn btn-sm" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// CRUD TABLE (generic for admin views)
// ============================================================
function CrudView({ title, table, columns, formFields, select = "*", toast: setToast }) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const { data, loading, refetch } = useSupabaseQuery(table, select, "&is_active=eq.true&order=name.asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const openNew = () => { setForm({}); setEditId(null); setModalOpen(true); };
  const openEdit = (row) => { setForm({ ...row }); setEditId(row.id); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const body = {};
      formFields.forEach(f => { if (form[f.key] !== undefined) body[f.key] = form[f.key]; });
      if (!editId) body.user_id = userId;
      if (editId) {
        await supabaseRest(`${table}?id=eq.${editId}`, { method: "PATCH", body: JSON.stringify(body) }, token);
        showToast(setToast, "Actualizado", `Registro actualizado correctamente.`);
      } else {
        await supabaseRest(table, { method: "POST", body: JSON.stringify(body), headers: { ...supabaseHeaders(token), "Prefer": "return=minimal" } }, token);
        showToast(setToast, "Creado", `Registro creado correctamente.`);
      }
      setModalOpen(false);
      refetch();
    } catch (e) {
      showToast(setToast, "Error", e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await supabaseRest(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ is_active: false }) }, token);
      showToast(setToast, "Eliminado", "Registro eliminado.");
      refetch();
    } catch (e) {
      showToast(setToast, "Error", e.message);
    }
  };

  if (loading) return <div className="spinner"><div className="spin-icon">{Icons.refresh}</div></div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openNew}>{Icons.plus} Nuevo</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map(c => <th key={c.key} className={c.align || ""}>{c.label}</th>)}
                <th className="center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) ? (
                <tr><td colSpan={columns.length + 1} className="empty-state">No hay registros</td></tr>
              ) : data.map(row => (
                <tr key={row.id}>
                  {columns.map(c => (
                    <td key={c.key} className={c.align || ""}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                  <td className="center">
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(row)}>{Icons.edit}</button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(row.id)}>{Icons.trash}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? "Editar" : "Nuevo"} {title}</h3>
            {formFields.map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                {f.type === "select" ? (
                  <select className="form-select" value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input className="form-input" type={f.type || "text"} value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
                )}
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// TRANSACTIONS VIEW
// ============================================================
function TransactionsView({ type, setToast, session: parentSession }) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const typeLabel = type === "ingreso" ? "Ingreso" : "Gasto";
  const selectQ = "*,projects(name),categories(name,type),partners(name),suppliers(name),payment_methods(name),currencies(code,symbol),business_units(name)";
  const { data: transactions, loading, refetch } = useSupabaseQuery("transactions", selectQ, `&type=eq.${type}&order=transaction_date.desc`);
  const { data: projects } = useSupabaseQuery("projects", "*", "&is_active=eq.true&order=name.asc");
  const { data: categories } = useSupabaseQuery("categories", "*", `&is_active=eq.true&type=eq.${type}&order=name.asc`);
  const { data: currencies } = useSupabaseQuery("currencies", "*", "&is_active=eq.true&order=code.asc");
  const { data: partners } = useSupabaseQuery("partners", "*", "&is_active=eq.true&order=name.asc");
  const { data: paymentMethods } = useSupabaseQuery("payment_methods", "*", "&is_active=eq.true&order=name.asc");

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ transaction_date: new Date().toISOString().split("T")[0], amount: "", description: "", category_id: "", project_id: "", currency_id: "", partner_id: "", payment_method_id: "" });

  const filtered = transactions?.filter(t =>
    (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.categories?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered?.reduce((s, t) => s + Number(t.amount), 0) || 0;

  const openNew = () => { setForm({ transaction_date: new Date().toISOString().split("T")[0], amount: "", description: "", category_id: "", project_id: "", currency_id: "", partner_id: "", payment_method_id: "" }); setEditId(null); setModalOpen(true); };
  const openEdit = (row) => { setForm({ ...row }); setEditId(row.id); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const body = { type, transaction_date: form.transaction_date, amount: Number(form.amount), description: form.description || null, category_id: form.category_id || null, project_id: form.project_id || null, currency_id: form.currency_id || null, partner_id: form.partner_id || null, payment_method_id: form.payment_method_id || null, user_id: session?.user?.id };
      if (editId) {
        await supabaseRest(`transactions?id=eq.${editId}`, { method: "PATCH", body: JSON.stringify(body) }, token);
      } else {
        await supabaseRest("transactions", { method: "POST", body: JSON.stringify(body), headers: { ...supabaseHeaders(token), "Prefer": "return=minimal" } }, token);
      }
      showToast(setToast, editId ? "Actualizado" : "Creado", `${typeLabel} guardado correctamente.`);
      setModalOpen(false);
      refetch();
    } catch (e) { showToast(setToast, "Error", e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await supabaseRest(`transactions?id=eq.${id}`, { method: "DELETE" }, token);
      showToast(setToast, "Eliminado", `${typeLabel} eliminado.`);
      refetch();
    } catch (e) { showToast(setToast, "Error", e.message); }
  };

  if (loading) return <div className="spinner"><div className="spin-icon">{Icons.refresh}</div></div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div className="search-bar">
          {Icons.search}
          <input className="form-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: type === "ingreso" ? "var(--success)" : "var(--danger)" }}>Total: {formatCurrency(total)}</span>
          <button className="btn btn-primary" onClick={openNew}>{Icons.plus} Nuevo {typeLabel}</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Proyecto</th><th className="right">Monto</th><th>Moneda</th><th className="center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(!filtered || filtered.length === 0) ? (
                <tr><td colSpan={7} className="empty-state">No hay {type === "ingreso" ? "ingresos" : "gastos"}</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id}>
                  <td>{t.transaction_date}</td>
                  <td>{t.description || "—"}</td>
                  <td>{t.categories?.name || "—"}</td>
                  <td>{t.projects?.name || "—"}</td>
                  <td className="right" style={{ fontWeight: 600, color: type === "ingreso" ? "var(--success)" : "var(--danger)" }}>{formatCurrency(t.amount)}</td>
                  <td>{t.currencies?.code || "—"}</td>
                  <td className="center">
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(t)}>{Icons.edit}</button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(t.id)}>{Icons.trash}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? "Editar" : "Nuevo"} {typeLabel}</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input className="form-input" type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input className="form-input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción opcional" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.category_id || ""} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Proyecto</label>
                <select className="form-select" value={form.project_id || ""} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                  <option value="">Sin proyecto</option>
                  {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-select" value={form.currency_id || ""} onChange={e => setForm({ ...form, currency_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {currencies?.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Forma de Pago</label>
                <select className="form-select" value={form.payment_method_id || ""} onChange={e => setForm({ ...form, payment_method_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {paymentMethods?.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// BUDGET VIEW
// ============================================================
function BudgetView({ setToast }) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const { data: budgets, loading, refetch } = useSupabaseQuery("budgets", "*,projects(name),categories(name,type),currencies(code,symbol)", "&order=year.desc,month.asc");
  const { data: projects } = useSupabaseQuery("projects", "*", "&is_active=eq.true&order=name.asc");
  const { data: categories } = useSupabaseQuery("categories", "*", "&is_active=eq.true&order=name.asc");
  const { data: currencies } = useSupabaseQuery("currencies", "*", "&is_active=eq.true&order=code.asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ project_id: "", category_id: "", currency_id: "", amount: "", month: "", year: new Date().getFullYear().toString() });

  const openNew = () => { setForm({ project_id: "", category_id: "", currency_id: "", amount: "", month: "", year: new Date().getFullYear().toString() }); setEditId(null); setModalOpen(true); };
  const openEdit = (row) => { setForm({ ...row, year: String(row.year), month: String(row.month || ""), amount: String(row.amount) }); setEditId(row.id); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const body = { project_id: form.project_id || null, category_id: form.category_id, currency_id: form.currency_id, amount: Number(form.amount), month: form.month ? Number(form.month) : null, year: Number(form.year), user_id: userId };
      if (editId) {
        await supabaseRest(`budgets?id=eq.${editId}`, { method: "PATCH", body: JSON.stringify(body) }, token);
      } else {
        await supabaseRest("budgets", { method: "POST", body: JSON.stringify(body), headers: { ...supabaseHeaders(token), "Prefer": "return=minimal" } }, token);
      }
      showToast(setToast, editId ? "Actualizado" : "Creado", "Presupuesto guardado.");
      setModalOpen(false);
      refetch();
    } catch (e) { showToast(setToast, "Error", e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    try {
      await supabaseRest(`budgets?id=eq.${id}`, { method: "DELETE" }, token);
      showToast(setToast, "Eliminado", "Presupuesto eliminado.");
      refetch();
    } catch (e) { showToast(setToast, "Error", e.message); }
  };

  if (loading) return <div className="spinner"><div className="spin-icon">{Icons.refresh}</div></div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openNew}>{Icons.plus} Nuevo Presupuesto</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Año</th><th>Mes</th><th>Tipo</th><th>Categoría</th><th>Proyecto</th><th className="right">Monto</th><th>Moneda</th><th className="center">Acciones</th></tr>
            </thead>
            <tbody>
              {(!budgets || budgets.length === 0) ? (
                <tr><td colSpan={8} className="empty-state">No hay presupuestos</td></tr>
              ) : budgets.map(b => (
                <tr key={b.id}>
                  <td>{b.year}</td>
                  <td>{b.month ? monthNamesFull[b.month - 1] : "Anual"}</td>
                  <td><span className={`badge ${b.categories?.type === "ingreso" ? "badge-success" : "badge-danger"}`}>{b.categories?.type === "ingreso" ? "Ingreso" : "Gasto"}</span></td>
                  <td>{b.categories?.name || "—"}</td>
                  <td>{b.projects?.name || "General"}</td>
                  <td className="right" style={{ fontWeight: 600 }}>{formatCurrency(b.amount, b.currencies?.symbol || "$")}</td>
                  <td>{b.currencies?.code || "—"}</td>
                  <td className="center">
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(b)}>{Icons.edit}</button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(b.id)}>{Icons.trash}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? "Editar" : "Nuevo"} Presupuesto</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Año</label>
                <input className="form-input" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mes</label>
                <select className="form-select" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
                  <option value="">Anual</option>
                  {monthNamesFull.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Proyecto</label>
                <select className="form-select" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                  <option value="">General</option>
                  {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input className="form-input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-select" value={form.currency_id} onChange={e => setForm({ ...form, currency_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {currencies?.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// REPORTS VIEW
// ============================================================
function ReportsView({ filters }) {
  const { data: transactions, loading: tLoading } = useSupabaseQuery("transactions", "*,projects(name),categories(name,type),business_units(name)", "&order=transaction_date.desc");
  const { data: budgets, loading: bLoading } = useSupabaseQuery("budgets", "*,projects(name),categories(name,type)", "&order=year.desc,month.asc");
  const { data: projects } = useSupabaseQuery("projects", "*,business_units(name)", "&is_active=eq.true");
  const { data: businessUnits } = useSupabaseQuery("business_units", "*", "&is_active=eq.true&order=name.asc");

  if (tLoading || bLoading) return <div className="spinner"><div className="spin-icon">{Icons.refresh}</div></div>;

  const filtered = transactions?.filter(t => {
    const d = new Date(t.transaction_date);
    if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && d > new Date(filters.dateTo)) return false;
    if (filters.businessUnitId !== "all" && t.business_unit_id !== filters.businessUnitId) return false;
    if (filters.projectId !== "all" && t.project_id !== filters.projectId) return false;
    if (filters.clientId !== "all" && t.client_id !== filters.clientId) return false;
    if (filters.partnerId !== "all" && t.partner_id !== filters.partnerId) return false;
    if (filters.currencyId !== "all" && t.currency_id !== filters.currencyId) return false;
    return true;
  }) || [];

  const totalIncome = filtered.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = filtered.filter(t => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
  const netResult = totalIncome - totalExpenses;

  const year = filters.dateFrom ? new Date(filters.dateFrom).getFullYear() : new Date().getFullYear();
  const filteredBudgets = budgets?.filter(b => {
    if (b.year !== year) return false;
    if (filters.projectId !== "all" && b.project_id !== filters.projectId) return false;
    return true;
  }) || [];

  const plannedIncome = filteredBudgets.filter(b => b.categories?.type === "ingreso").reduce((s, b) => s + Number(b.amount), 0);
  const plannedExpenses = filteredBudgets.filter(b => b.categories?.type === "gasto").reduce((s, b) => s + Number(b.amount), 0);

  return (
    <>
      <div className="kpi-grid">
        <KPICard title="Ingresos" value={formatCurrency(totalIncome)} plan={formatCurrency(plannedIncome)} variance={plannedIncome > 0 ? ((totalIncome - plannedIncome) / plannedIncome) * 100 : 0} icon={Icons.trendUp} />
        <KPICard title="Gastos" value={formatCurrency(totalExpenses)} plan={formatCurrency(plannedExpenses)} variance={plannedExpenses > 0 ? ((plannedExpenses - totalExpenses) / plannedExpenses) * 100 : 0} icon={Icons.trendDown} />
        <KPICard title="Resultado Neto" value={formatCurrency(netResult)} plan={formatCurrency(plannedIncome - plannedExpenses)} icon={Icons.wallet} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Resultado por Proyecto</div></div>
        <div className="card-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th className="right">Plan Ingresos</th><th className="right">Plan Gastos</th><th className="right">Plan Resultado</th>
                  <th className="right">Real Ingresos</th><th className="right">Real Gastos</th><th className="right">Real Resultado</th>
                  <th className="right">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let tBI = 0, tBE = 0, tRI = 0, tRE = 0;
                  const rows = projects?.filter(p => p.is_active).map(project => {
                    const pTrans = filtered.filter(t => t.project_id === project.id);
                    const rI = pTrans.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
                    const rE = pTrans.filter(t => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
                    const pBudgets = filteredBudgets.filter(b => b.project_id === project.id);
                    const bI = pBudgets.filter(b => b.categories?.type === "ingreso").reduce((s, b) => s + Number(b.amount), 0);
                    const bE = pBudgets.filter(b => b.categories?.type === "gasto").reduce((s, b) => s + Number(b.amount), 0);
                    tBI += bI; tBE += bE; tRI += rI; tRE += rE;
                    const diff = (bI - bE) - (rI - rE);
                    return (
                      <tr key={project.id}>
                        <td style={{ fontWeight: 500 }}>{project.name}</td>
                        <td className="right text-success">{formatCurrency(bI)}</td>
                        <td className="right text-danger">{formatCurrency(bE)}</td>
                        <td className={`right text-bold ${bI - bE >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(bI - bE)}</td>
                        <td className="right text-success">{formatCurrency(rI)}</td>
                        <td className="right text-danger">{formatCurrency(rE)}</td>
                        <td className={`right text-bold ${rI - rE >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(rI - rE)}</td>
                        <td className={`right text-bold ${diff >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(diff)}</td>
                      </tr>
                    );
                  });
                  const tDiff = (tBI - tBE) - (tRI - tRE);
                  return (
                    <>
                      {rows}
                      <tr className="grand-total">
                        <td>Total</td>
                        <td className="right text-success">{formatCurrency(tBI)}</td>
                        <td className="right text-danger">{formatCurrency(tBE)}</td>
                        <td className={`right ${tBI - tBE >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(tBI - tBE)}</td>
                        <td className="right text-success">{formatCurrency(tRI)}</td>
                        <td className="right text-danger">{formatCurrency(tRE)}</td>
                        <td className={`right ${tRI - tRE >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(tRI - tRE)}</td>
                        <td className={`right ${tDiff >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(tDiff)}</td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// SETTINGS VIEW
// ============================================================
function SettingsView() {
  const { session } = useAuth();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
      <div className="card">
        <div className="card-header"><div className="card-title">Información de Usuario</div></div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">Email</label><p>{session?.user?.email}</p></div>
          <div className="form-group"><label className="form-label">ID</label><p style={{ fontSize: 12, fontFamily: "monospace" }}>{session?.user?.id}</p></div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Información del Sistema</div></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label className="form-label">Versión</label><p>2.0.0 (Claude)</p></div>
            <div><label className="form-label">Base de datos</label><p>Supabase/PostgreSQL</p></div>
            <div><label className="form-label">Frontend</label><p>React Artifact</p></div>
            <div><label className="form-label">Ambiente</label><p>Producción</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView({ filters, businessUnits, projects, clients, partners, currencies }) {
  const { data: transactions, loading: tLoading } = useSupabaseQuery("transactions", "*,projects(name),categories(name,type),business_units(name),currencies(code,symbol)", "&order=transaction_date.desc");
  const { data: budgets, loading: bLoading } = useSupabaseQuery("budgets", "*,projects(name),categories(name,type),currencies(code,symbol)", "&order=year.desc,month.asc");

  if (tLoading || bLoading) return <div className="spinner"><div className="spin-icon">{Icons.refresh}</div></div>;

  const filtered = transactions?.filter(t => {
    const d = new Date(t.transaction_date);
    if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && d > new Date(filters.dateTo)) return false;
    if (filters.businessUnitId !== "all" && t.business_unit_id !== filters.businessUnitId) return false;
    if (filters.projectId !== "all" && t.project_id !== filters.projectId) return false;
    if (filters.partnerId !== "all" && t.partner_id !== filters.partnerId) return false;
    if (filters.currencyId !== "all" && t.currency_id !== filters.currencyId) return false;
    return true;
  }) || [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current month transactions
  const currentTrans = filtered.filter(t => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const income = currentTrans.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = currentTrans.filter(t => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expenses;
  const margin = income > 0 ? ((income - expenses) / income) * 100 : 0;

  // Current month budgets
  const currentBudgets = budgets?.filter(b => b.year === currentYear && b.month === currentMonth + 1) || [];
  const planIncome = currentBudgets.filter(b => b.categories?.type === "ingreso").reduce((s, b) => s + Number(b.amount), 0);
  const planExpenses = currentBudgets.filter(b => b.categories?.type === "gasto").reduce((s, b) => s + Number(b.amount), 0);
  const planNet = planIncome - planExpenses;
  const planMargin = planIncome > 0 ? ((planIncome - planExpenses) / planIncome) * 100 : 0;

  const incomeVar = planIncome > 0 ? ((income - planIncome) / planIncome) * 100 : 0;
  const expenseVar = planExpenses > 0 ? ((planExpenses - expenses) / planExpenses) * 100 : 0;
  const netVar = planNet !== 0 ? ((net - planNet) / Math.abs(planNet)) * 100 : 0;

  // Chart data — all periods
  const incomeTransactions = filtered.filter(t => t.type === "ingreso");
  const expenseTransactions = filtered.filter(t => t.type === "gasto");

  const getPeriodsFromData = () => {
    const periods = new Set();
    filtered.forEach(t => {
      const d = new Date(t.transaction_date);
      periods.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    budgets?.forEach(b => { if (b.month) periods.add(`${b.year}-${b.month - 1}`); });
    return Array.from(periods).map(p => { const [y, m] = p.split("-").map(Number); return { year: y, month: m }; }).sort((a, b) => a.year - b.year || a.month - b.month);
  };

  const periods = getPeriodsFromData();

  const prepareChart = (type) => periods.map(({ year, month }) => {
    const mTrans = filtered.filter(t => { const d = new Date(t.transaction_date); return d.getMonth() === month && d.getFullYear() === year && t.type === type; });
    const real = mTrans.reduce((s, t) => s + Number(t.amount), 0);
    const plan = budgets?.filter(b => b.categories?.type === type && b.month === month + 1 && b.year === year).reduce((s, b) => s + Number(b.amount), 0) || 0;
    return { month: `${monthNames[month]} ${String(year).slice(-2)}`, plan, real };
  });

  const prepareResultsChart = () => periods.map(({ year, month }) => {
    const mI = filtered.filter(t => { const d = new Date(t.transaction_date); return d.getMonth() === month && d.getFullYear() === year && t.type === "ingreso"; }).reduce((s, t) => s + Number(t.amount), 0);
    const mE = filtered.filter(t => { const d = new Date(t.transaction_date); return d.getMonth() === month && d.getFullYear() === year && t.type === "gasto"; }).reduce((s, t) => s + Number(t.amount), 0);
    const pI = budgets?.filter(b => b.categories?.type === "ingreso" && b.month === month + 1 && b.year === year).reduce((s, b) => s + Number(b.amount), 0) || 0;
    const pE = budgets?.filter(b => b.categories?.type === "gasto" && b.month === month + 1 && b.year === year).reduce((s, b) => s + Number(b.amount), 0) || 0;
    return { month: `${monthNames[month]} ${String(year).slice(-2)}`, plan: pI - pE, real: mI - mE };
  });

  const periodLabel = filters.dateFrom || filters.dateTo
    ? `${filters.dateFrom || "..."} — ${filters.dateTo || "..."}`
    : new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <>
      <p className="page-header-period">Período: {periodLabel}</p>

      <div className="section-title">Período Actual</div>
      <div className="kpi-grid">
        <KPICard title="Ingresos Totales" value={formatCurrency(income)} plan={formatCurrency(planIncome)} variance={incomeVar} icon={Icons.trendUp} />
        <KPICard title="Gastos Totales" value={formatCurrency(expenses)} plan={formatCurrency(planExpenses)} variance={expenseVar} icon={Icons.trendDown} />
        <KPICard title="Resultado Neto" value={formatCurrency(net)} plan={formatCurrency(planNet)} variance={netVar} icon={Icons.wallet} />
        <KPICard title="Margen %" value={formatPct(margin)} plan={formatPct(planMargin)} icon={Icons.pie} />
      </div>

      <div className="section-title">Gráficos (Todos los períodos)</div>
      <div className="charts-grid">
        <PlanVsRealChart data={prepareChart("ingreso")} title="Ingresos: Plan vs Real" />
        <PlanVsRealChart data={prepareChart("gasto")} title="Gastos: Plan vs Real" />
      </div>
      <PlanVsRealChart data={prepareResultsChart()} title="Resultados: Plan vs Real" />
    </>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function MainApp() {
  const [activeView, setActiveView] = useState("dashboard");
  const [filters, setFilters] = useState(emptyFilters);
  const [toast, setToast] = useState(null);

  // Load reference data
  const { data: businessUnits } = useSupabaseQuery("business_units", "*", "&is_active=eq.true&order=name.asc");
  const { data: projects } = useSupabaseQuery("projects", "*,business_units(name),clients(name)", "&is_active=eq.true&order=name.asc");
  const { data: clients } = useSupabaseQuery("clients", "*", "&is_active=eq.true&order=name.asc");
  const { data: partners } = useSupabaseQuery("partners", "*", "&is_active=eq.true&order=name.asc");
  const { data: currencies } = useSupabaseQuery("currencies", "*", "&is_active=eq.true&order=code.asc");
  const { data: categories } = useSupabaseQuery("categories", "*", "&is_active=eq.true&order=name.asc");

  const titles = {
    dashboard: "Dashboard Financiero", reports: "Reportes Actuales", "projected-reports": "Reportes Proyectados",
    "project-management": "Gestión de Proyectos", budget: "Presupuesto", income: "Ingresos", expenses: "Gastos",
    "business-units": "Unidades de Negocio", products: "Productos", clients: "Clientes", projects: "Proyectos",
    categories: "Categorías", partners: "Socios", suppliers: "Proveedores", "payment-methods": "Formas de Pago",
    currencies: "Monedas", "exchange-rates": "Tipos de Cambio", settings: "Configuración",
  };

  const showFilters = ["dashboard", "reports", "projected-reports", "project-management"].includes(activeView);

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView filters={filters} businessUnits={businessUnits} projects={projects} clients={clients} partners={partners} currencies={currencies} />;
      case "reports":
      case "projected-reports":
        return <ReportsView filters={filters} />;
      case "income":
        return <TransactionsView type="ingreso" setToast={setToast} />;
      case "expenses":
        return <TransactionsView type="gasto" setToast={setToast} />;
      case "budget":
        return <BudgetView setToast={setToast} />;
      case "settings":
        return <SettingsView />;
      // Admin CRUDs
      case "business-units":
        return <CrudView title="Unidad de Negocio" table="business_units" toast={setToast}
          columns={[{ key: "name", label: "Nombre" }, { key: "description", label: "Descripción" }]}
          formFields={[{ key: "name", label: "Nombre" }, { key: "description", label: "Descripción" }]}
        />;
      case "products":
        return <CrudView title="Producto" table="products" select="*,business_units(name)" toast={setToast}
          columns={[{ key: "name", label: "Nombre" }, { key: "business_units", label: "Unidad de Negocio", render: r => r.business_units?.name || "—" }]}
          formFields={[{ key: "name", label: "Nombre" }, { key: "business_unit_id", label: "Unidad de Negocio", type: "select", options: businessUnits?.map(bu => ({ value: bu.id, label: bu.name })) || [] }, { key: "description", label: "Descripción" }]}
        />;
      case "clients":
        return <CrudView title="Cliente" table="clients" toast={setToast}
          columns={[{ key: "name", label: "Nombre" }, { key: "company", label: "Empresa" }, { key: "email", label: "Email" }]}
          formFields={[{ key: "name", label: "Nombre" }, { key: "company", label: "Empresa" }, { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Teléfono" }]}
        />;
      case "projects":
        return <CrudView title="Proyecto" table="projects" select="*,business_units(name),clients(name)" toast={setToast}
          columns={[{ key: "name", label: "Nombre" }, { key: "business_units", label: "UN", render: r => r.business_units?.name || "—" }, { key: "clients", label: "Cliente", render: r => r.clients?.name || "—" }, { key: "status", label: "Estado", render: r => <span className={`badge ${r.status === "ejecucion" ? "badge-success" : r.status === "cerrado" ? "badge-danger" : "badge-warning"}`}>{r.status}</span> }]}
          formFields={[{ key: "name", label: "Nombre" }, { key: "business_unit_id", label: "Unidad de Negocio", type: "select", options: businessUnits?.map(bu => ({ value: bu.id, label: bu.name })) || [] }, { key: "client_id", label: "Cliente", type: "select", options: clients?.map(c => ({ value: c.id, label: c.name })) || [] }, { key: "status", label: "Estado", type: "select", options: [{ value: "planificacion", label: "Planificación" }, { value: "ejecucion", label: "Ejecución" }, { value: "cerrado", label: "Cerrado" }] }, { key: "start_date", label: "Fecha Inicio", type: "date" }, { key: "end_date", label: "Fecha Fin", type: "date" }]}
        />;
      case "categories":
        return <CrudView title="Categoría" table="categories" toast={setToast}
          columns={[{ key: "name", label: "Nombre" }, { key: "type", label: "Tipo", render: r => <span className={`badge ${r.type === "ingreso" ? "badge-success" : "badge-danger"}`}>{r.type}</span> }, { key: "description", label: "Descripción" }]}
          formFields={[{ key: "name", label: "Nombre" }, { key: "type", label: "Tipo", type: "select", options: [{ value: "ingreso", label: "Ingreso" }, { value: "gasto", label: "Gasto" }] }, { key: "description", label: "Descripción" }]}
        />;
      case "partners":
        return <CrudView title="Socio" table="partners" toast={setToast}
          columns={[{ key: "name", label: "Nombre" }, { key: "email", label: "Email" }]}
          formFields={[{ key: "name", label: "Nombre" }, { key: "email", label: "Email", type: "email" }]}
        />;
      case "suppliers":
        return <CrudView title="Proveedor" table="suppliers" toast={setToast}
          columns={[{ key: "name", label: "Nombre" }, { key: "email", label: "Email" }]}
          formFields={[{ key: "name", label: "Nombre" }, { key: "email", label: "Email", type: "email" }]}
        />;
      case "payment-methods":
        return <CrudView title="Forma de Pago" table="payment_methods" toast={setToast}
          columns={[{ key: "name", label: "Nombre" }, { key: "description", label: "Descripción" }]}
          formFields={[{ key: "name", label: "Nombre" }, { key: "description", label: "Descripción" }]}
        />;
      case "currencies":
        return <CrudView title="Moneda" table="currencies" toast={setToast}
          columns={[{ key: "code", label: "Código" }, { key: "name", label: "Nombre" }, { key: "symbol", label: "Símbolo" }]}
          formFields={[{ key: "code", label: "Código" }, { key: "name", label: "Nombre" }, { key: "symbol", label: "Símbolo" }]}
        />;
      case "exchange-rates":
        return <CrudView title="Tipo de Cambio" table="exchange_rates" select="*,currencies(code,name)" toast={setToast}
          columns={[{ key: "currencies", label: "Moneda", render: r => r.currencies?.code || "—" }, { key: "rate", label: "Tasa", align: "right" }, { key: "effective_date", label: "Fecha" }]}
          formFields={[{ key: "currency_id", label: "Moneda", type: "select", options: currencies?.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` })) || [] }, { key: "rate", label: "Tasa", type: "number" }, { key: "effective_date", label: "Fecha", type: "date" }]}
        />;
      default:
        return <div className="empty-state">Vista no encontrada</div>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar active={activeView} onNavigate={setActiveView} />
      <main className="main">
        <div className="page-header">
          <h2>{titles[activeView] || "Dashboard"}</h2>
          <div className="header-actions">
            {showFilters && (
              <FiltersPanel filters={filters} onChange={setFilters} businessUnits={businessUnits} projects={projects} clients={clients} partners={partners} currencies={currencies} />
            )}
            <button className="btn" onClick={() => window.location.reload()}>{Icons.refresh} Actualizar</button>
          </div>
        </div>
        {renderView()}
      </main>
      {toast && (
        <div className="toast">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-desc">{toast.desc}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ROOT
// ============================================================
export default function App() {
  return (
    <AuthProvider>
      <style>{styles}</style>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) return <div className="spinner"><div className="spin-icon">{Icons.refresh}</div></div>;
  if (!session) return <LoginPage />;
  return <MainApp />;
}
