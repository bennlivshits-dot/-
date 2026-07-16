import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Home, MessageSquare, BookOpen, User, Shield, Users, ClipboardCheck,
  TrendingUp, Check, X, Plus, Trash2, Send, Clock, Target, Dumbbell, Award,
  MapPin, ChevronDown, Gauge as GaugeIcon, Zap, BarChart3, Newspaper,
  HeartPulse, Timer, Loader2, ShieldAlert, Siren, CalendarDays, ChevronRight,
  ChevronLeft, CheckCircle2, Lock, LogOut, Heart, Bot, Sparkles, Star, Sun, Moon,
} from "lucide-react";
import {
  SUPABASE_URL as CFG_SUPABASE_URL,
  SUPABASE_ANON_KEY as CFG_SUPABASE_ANON_KEY,
  GEMINI_API_KEY as CFG_GEMINI_API_KEY,
  NETWORK_CODE as CFG_NETWORK_CODE,
} from "./config.js";

// Reads a Vite env var if present (Netlify-style deployment). Returns "" if unset
// or unavailable, so the app degrades to local-storage demo mode instead of
// crashing rather than a blank white screen.
function envVar(name) {
  try {
    return (import.meta.env && import.meta.env[name]) || "";
  } catch (e) {
    return "";
  }
}

// A config.js value counts as "set" only once the placeholder text has actually
// been replaced - this is what makes the app cleanly fall back to local mode
// automatically until real keys are pasted in, instead of trying (and failing)
// to fetch from a URL that's literally the Hebrew placeholder string.
function resolveConfig(envValue, hardcodedValue) {
  if (envValue) return envValue;
  if (hardcodedValue && !hardcodedValue.includes("הדבק_כאן")) return hardcodedValue;
  return "";
}

/**
 * ⚙️ CONFIG — reads from src/config.js (paste your real keys there - the intended
 * setup for GitHub Pages, since Pages serves static files with no env var system).
 * Real environment variables (VITE_*, e.g. on Netlify) take priority if present,
 * so the same code works on either host without edits.
 *
 * ADMIN_INVITE_CODE is intentionally NOT here anymore — see README.md: admin
 * self-signup via a client-side code was a real security gap (anyone reading the
 * bundle could find the code and self-promote). The first admin is now set once,
 * directly in Supabase's SQL editor; every other admin is promoted from inside
 * the app by an existing admin, enforced by RLS — not by a string in the JS bundle.
 */
const CONFIG = {
  GEMINI_API_KEY: resolveConfig(envVar("VITE_GEMINI_API_KEY"), CFG_GEMINI_API_KEY),
  NETWORK_CODE: resolveConfig(envVar("VITE_NETWORK_CODE"), CFG_NETWORK_CODE),
  SUPABASE_URL: resolveConfig(envVar("VITE_SUPABASE_URL"), CFG_SUPABASE_URL),
  SUPABASE_ANON_KEY: resolveConfig(envVar("VITE_SUPABASE_ANON_KEY"), CFG_SUPABASE_ANON_KEY),
};

/* ============================== MOCK / STATIC DATA ============================== */

const UNITS = [
  { id: "sayeret", name: "סיירת מטכ״ל", tagline: "מצוינות וחשיבה מחוץ לקופסה", text: "text-yellow-500", border: "border-yellow-600", hex: "#eab308", req: "ריצת 2 ק״מ מתחת ל-9 דק׳, מבחני מיון פיזיים ומנטליים קשוחים" },
  { id: "duvdevan", name: "דובדבן / ימ״ס", tagline: "אגרסיביות וראבק", text: "text-red-400", border: "border-red-800", hex: "#f87171", req: "לוחמה בשטח בנוי, שליטה עצמית תחת לחץ" },
  { id: "shayetet", name: "שייטת 13", tagline: "עבודה תחת קור קיצוני וסוסיות", text: "text-cyan-400", border: "border-cyan-500", hex: "#22d3ee", req: "שחייה ארוכה, צלילה חופשית, עומס נפשי גבוה" },
  { id: "shaldag", name: "שלדג", tagline: "קשיחות ושאיפה לטוב ביותר", text: "text-blue-400", border: "border-blue-500", hex: "#60a5fa", req: "ניווט שטח, קפיצות צניחה, כושר גופני עילי" },
  { id: "669", name: "יחידה 669", tagline: "עבודה תחת לחץ", text: "text-emerald-400", border: "border-orange-500", hex: "#fb923c", req: "חילוץ הרים, עזרה ראשונה קרבית, סיבולת גבוהה" },
  { id: "hir", name: "חי״ר", tagline: "דור הניצחון ואחוות לוחמים", text: "text-lime-500", border: "border-lime-600", hex: "#a3e635", req: "מסעות רגליים, נשיאת ציוד, עבודת צוות" },
  { id: "chovlim", name: "חובלים", tagline: "אתגר אינטלקטואלי ופיזי", text: "text-slate-100", border: "border-slate-300", hex: "#e2e8f0", req: "לימודי פיקוד, ניווט ימי, משמעת גבוהה" },
  { id: "tayas", name: "טייס", tagline: "אחריות וזיכרון למופת", text: "text-sky-300", border: "border-sky-400", hex: "#38bdf8", req: "מבדקים פסיכוטכניים, ריכוז גבוה, כושר גופני מלא" },
];

const TIERS = ["מתחילים", "מתקדם", "לפני גיבוש", "לפני גיוס"];

const GIBUSH_TYPES = [
  "גיבוש מטכ\"ל", "גיבוש שייטת", "גיבוש חובלים", "גיבוש טיס",
  "גיבוש יחטיות", "גיבוש ימ\"ס", "יום סיירות", "גיבושון 669",
];

// Per-type color: hex is the primary accent, hex2 (when present) is the secondary
// tone for a two-color glow, matching the exact pairs given.
const GIBUSH_TYPE_COLORS = {
  "גיבוש מטכ\"ל": { hex: "#eab308" },                    // זהב
  "גיבוש שייטת": { hex: "#38bdf8", hex2: "#ffffff" },     // כחול לבן
  "גיבוש חובלים": { hex: "#22d3ee" },                     // תכלת
  "גיבוש טיס": { hex: "#e2e8f0", hex2: "#94a3b8" },       // לבן כסף
  "גיבוש יחטיות": { hex: "#92400e", hex2: "#eab308" },    // חום כהה זהב
  "גיבוש ימ\"ס": { hex: "#c0c8d1" },                       // כסף
  "יום סיירות": { hex: "#9ca3af" },                        // אפור
  "גיבושון 669": { hex: "#fb923c", hex2: "#34d399" },     // כתום ירוק
};

const HEALTH_OPTIONS = ["ברכיים", "גב תחתון", "קרסוליים", "אסטמה / נשימה", "בעיות לב", "אחר"];

// Starts empty on purpose — real articles/training content will be managed via Supabase later.
const INITIAL_ARTICLES = [];

const TRAINING_BANK = [
  { id: "פלג גוף עליון חדר כושר", title: "פלג גוף עליון - חדר כושר", icon: Dumbbell, color: "text-emerald-400", items: [] },
  { id: "פלג גוף עליון קליסטניקס", title: "פלג גוף עליון - קליסטניקס", icon: Zap, color: "text-sky-400", items: [] },
  { id: "רגליים", title: "רגליים", icon: GaugeIcon, color: "text-amber-400", items: [] },
  { id: "עבודה על יסודות לאקטים של הכושר קרבי", title: "עבודה על יסודות לאקטים של הכושר קרבי", icon: Target, color: "text-red-400", items: [] },
  { id: "כושר קרבי ריצות", title: "כושר קרבי - ריצות", icon: Timer, color: "text-lime-400", items: [] },
  { id: "ספציפי מטכ\"ל יום סיירות יחטיות", title: "ספציפי מטכ״ל / יום סיירות / יחטיות", icon: Shield, color: "text-yellow-400", items: [] },
  { id: "ספציפי שייטת", title: "ספציפי שייטת", icon: Award, color: "text-cyan-400", items: [] },
];

const GIBUSHIM_LIST = [
  "יום סיירות", "גיבוש מטכ\"ל", "גיבוש שייטת", "גיבוש חובלים", "גיבוש טיס",
  "גיבוש ימ\"ס", "גיבושון 669", "יחטיות צנחנים", "גיבוש צנחנים", "גיבוש צוללות",
];

const TEAM_LIST = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  label: `צוות ${i + 1}`,
}));

// Each team's verification code — a trainee must enter the correct code to lock in that team at signup.
const TEAM_CODES_MAP = {
  "1": "12121212",
  "2": "23412345",
  "3": "12351235",
  "4": "99899989",
  "5": "05405454",
  "6": "67676767",
  "7": "57473727",
  "8": "11188818",
  "9": "45945945",
  "10": "34873487",
  "11": "52135213",
  "12": "12131412",
};

// Placeholder values for the "מילה טובה" peer-recognition tag — rename these to match
// the organization's real stated values whenever you're ready.
const CORE_VALUES = ["נחישות", "עבודת צוות", "מנהיגות", "משמעת", "חוסן מנטלי", "עזרה לזולת"];

const WAR_WEEKS = [
  { week: 1, title: "שבוע 1 - ביסוס", focus: ["ריצה יומית 3-5 ק״מ", "מעגלי כוח משקל גוף", "שגרת שינה קבועה"] },
  { week: 2, title: "שבוע 2 - העלאת נפח", focus: ["אינטרוולים 2 פעמים בשבוע", "עבודת כוח עליון-תחתון מפוצלת", "מסעות הליכה עם משקל"] },
  { week: 3, title: "שבוע 3 - סיבולת", focus: ["ריצה ארוכה סופ״ש", "מתח ושכיבות סמיכה מתקדם", "תרגילי ליבה יומיים"] },
  { week: 4, title: "שבוע 4 - עומס שיא", focus: ["שני אימוני שטח בשבוע", "סימולציית דיונות קלה", "מעקב דופק ותזונה"] },
  { week: 5, title: "שבוע 5 - חידוד", focus: ["שילוב אלמנטים טכניים", "עבודה מנטלית וויזואליזציה", "שינה של 8 שעות לפחות"] },
  { week: 6, title: "שבוע 6 - טאפר לקראת המבחן", focus: ["הפחתת נפח, שמירת עצימות", "מנוחה פעילה", "בדיקת ציוד והיערכות מנטלית"] },
];

const WEEKDAYS_HE = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

/* ============================== HELPERS ============================== */

function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatCountdown(ms) {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return { d, h, m, s };
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_HEIGHT = 56; // px per hour row in the calendar grid

function getWeekStart(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}
function timeToMinutes(t) {
  if (!t) return 360;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function minutesToTime(mins) {
  const clamped = Math.max(0, Math.min(23 * 60 + 55, mins));
  const snapped = Math.round(clamped / 15) * 15;
  const h = Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// A training's feedback form opens the moment it ends and stays open for 3 hours.
// If no explicit endTime was set by the admin, we assume a 2-hour session.
function getOpenFeedbackEvent(events) {
  const now = new Date();
  for (const e of events) {
    if (!e.date) continue;
    const start = new Date(`${e.date}T${e.time || "00:00"}:00`);
    const end = e.endTime ? new Date(`${e.date}T${e.endTime}:00`) : new Date(start.getTime() + 2 * 3600 * 1000);
    const windowEnd = new Date(end.getTime() + 3 * 3600 * 1000);
    if (now >= end && now <= windowEnd) return e;
  }
  return null;
}

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// A pulsing, clear-water-like colored glow that surrounds a solid black button —
// the button interior stays black; the light lives in the box-shadow halo around it.
// hex2, when given, tints the outer/soft ring for a two-tone glow.
function glowVars(hex, hex2) {
  return {
    "--glow-strong": hexToRgba(hex, 0.75),
    "--glow-soft": hexToRgba(hex2 || hex, 0.4),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Real Supabase Auth (GoTrue) over plain REST — no SDK needed. Used only when
// CONFIG.SUPABASE_URL / SUPABASE_ANON_KEY are filled in. Supabase sends the actual
// confirmation email and refuses to log in an unconfirmed account — this is the real
// verification client-side code alone cannot do.
async function supabaseSignUp(email, password, meta) {
  let res;
  try {
    res = await fetch(`${CONFIG.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: CONFIG.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, data: meta }),
    });
  } catch (e) {
    throw new Error(`לא ניתן להתחבר לשרת [${e?.name || "?"}: ${e?.message || "unknown"}] - בדקו כתובת/פרויקט מושהה`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data?.msg || data?.error_description || data?.error || "שגיאה בהרשמה");
  return data;
}

async function supabaseLogin(email, password) {
  let res;
  try {
    res = await fetch(`${CONFIG.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: CONFIG.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (e) {
    throw new Error(`לא ניתן להתחבר לשרת [${e?.name || "?"}: ${e?.message || "unknown"}] - בדקו כתובת/פרויקט מושהה`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data?.msg || data?.error_description || "אימייל או סיסמה שגויים, או שהמייל טרם אומת");
  return data;
}

/* ============================== DATA LAYER ==============================
 * Every domain function below works against real Supabase tables when
 * CONFIG.SUPABASE_URL / SUPABASE_ANON_KEY are filled in, and transparently
 * falls back to Claude's local demo storage otherwise. Nothing else in the
 * app needs to know or care which mode is active.
 */

// Holds the real Supabase access token after login — required so Postgres'
// auth.uid() resolves correctly inside Row Level Security policies.
const session = { accessToken: null };

function useSupabase() {
  return Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
}

async function sbRequest(method, table, { query = "", body } = {}) {
  const res = await fetch(`${CONFIG.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.accessToken || CONFIG.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(method !== "GET" ? { Prefer: "return=representation" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "שגיאת שרת");
  }
  if (res.status === 204) return [];
  return res.json();
}

async function sbRpc(fn, args) {
  const res = await fetch(`${CONFIG.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.accessToken || CONFIG.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "שגיאת שרת");
  }
  return res.json();
}

// If you paste a key directly into CONFIG.GEMINI_API_KEY below, that's used straight
// away — simplest option, works immediately. If you leave it empty and later deploy
// the gemini-chat Edge Function, the app automatically switches to that instead (the
// key then never reaches the browser at all). Either way nothing else needs to change.
async function aiChat(systemPrompt, userText) {
  if (CONFIG.GEMINI_API_KEY) return callGemini(CONFIG.GEMINI_API_KEY, systemPrompt, userText);
  if (useSupabase()) {
    const res = await fetch(`${CONFIG.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/gemini-chat`, {
      method: "POST",
      headers: {
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.accessToken || CONFIG.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ systemPrompt, userText }),
    });
    if (!res.ok) throw new Error("AI request failed");
    const data = await res.json();
    return data.text || "לא התקבלה תשובה מהמאמן.";
  }
  throw new Error("no AI configured");
}

// health_issues is stored as one text column, not an array — these convert between
// that and the chip-based multi-select UI. The round-trip is a best-effort parse
// based on matching known HEALTH_OPTIONS substrings, not a lossless format.
function healthIssuesToText(issues, otherNote) {
  const parts = (issues || []).filter((i) => i !== "אחר");
  if ((issues || []).includes("אחר")) parts.push(otherNote?.trim() ? `אחר: ${otherNote.trim()}` : "אחר");
  return parts.join(", ");
}
function healthIssuesFromText(text) {
  if (!text) return { issues: [], otherNote: "" };
  const issues = HEALTH_OPTIONS.filter((opt) => opt !== "אחר" && text.includes(opt));
  const otherMatch = text.match(/אחר:\s*(.*)$/);
  if (otherMatch || text.includes("אחר")) issues.push("אחר");
  return { issues, otherNote: otherMatch ? otherMatch[1].trim() : "" };
}

// Maps between the app's internal nested `profile` object (used throughout the UI)
// and the real flat columns on the `profiles` table.
// Note: needs these columns added once Supabase is reconnected (not in the original schema):
// alter table profiles add column if not exists gibush_date date;
// alter table profiles add column if not exists gibush_type text;
// alter table profiles add column if not exists war_mode boolean default false;
// alter table profiles add column if not exists light_mode boolean default false;
function profileToDb(user) {
  const p = user.profile || {};
  return {
    full_name: p.fullName || null,
    role: user.role,
    team_id: p.teamCode ? Number(p.teamCode) : null,
    age: p.age ?? null,
    height: p.height ?? null,
    weight: p.weight ?? null,
    is_healthy: p.healthy ?? true,
    health_issues: healthIssuesToText(p.healthIssues || [], p.healthOtherNote || ""),
    target_unit: p.targetUnit || null,
    fitness_level: p.level || null,
    onboarded: user.onboarded,
    network: user.network || null,
    gibush_date: p.gibushDate || null,
    gibush_type: p.gibushType || null,
    war_mode: Boolean(p.warMode),
    light_mode: Boolean(p.lightMode),
  };
}
function profileFromDb(r) {
  const unitObj = UNITS.find((u) => u.id === r.target_unit);
  const { issues, otherNote } = healthIssuesFromText(r.health_issues);
  const hasProfile = r.age != null || r.fitness_level || r.target_unit;
  const profile = hasProfile
    ? {
        fullName: r.full_name || "",
        age: r.age, height: r.height, weight: r.weight,
        healthy: r.is_healthy,
        healthIssues: issues, healthOtherNote: otherNote,
        level: r.fitness_level || "",
        targetUnit: r.target_unit || "",
        targetUnitName: unitObj ? unitObj.name : "",
        teamCode: r.team_id != null ? String(r.team_id) : "",
        gibushDate: r.gibush_date || "",
        gibushType: r.gibush_type || "",
        warMode: Boolean(r.war_mode),
        lightMode: Boolean(r.light_mode),
      }
    : null;
  return { id: r.id, email: r.email, role: r.role, network: r.network, onboarded: Boolean(r.onboarded), profile };
}

async function fetchOwnProfile(uid) {
  const rows = await sbRequest("GET", "profiles", { query: `?id=eq.${uid}&select=*` });
  const r = rows[0];
  if (!r) return null;
  return profileFromDb(r);
}

// Verifies a team's code without ever exposing the code list to the client
// (Supabase mode calls the verify_team_code RPC; local demo mode checks the
// hardcoded map so testing still works without a live project).
async function verifyTeamCode(teamId, code) {
  if (useSupabase()) return sbRpc("verify_team_code", { p_team_id: Number(teamId), p_code: code });
  return TEAM_CODES_MAP[teamId] === code;
}

// Network code is verified via Supabase only (see the verify_network_code RPC —
// the code itself is never sent to or checked in client-side code in real mode).
// Returns the network's id on success (stored on the profile instead of the code
// itself) or null on failure. CONFIG.NETWORK_CODE remains only as a local-demo-mode
// fallback for testing without a live project.
async function verifyNetworkCode(code) {
  if (useSupabase()) {
    const id = await sbRpc("verify_network_code", { p_code: code });
    return id || null;
  }
  return code === CONFIG.NETWORK_CODE ? "local-network" : null;
}

// ---- Users / profiles ----
async function loadUsers() {
  if (useSupabase()) {
    const rows = await sbRequest("GET", "profiles", { query: "?select=*" });
    return rows.map(profileFromDb);
  }
  return storageGetList("app_users");
}

async function saveUserProfile(user) {
  if (useSupabase()) {
    await sbRequest("PATCH", "profiles", { query: `?id=eq.${user.id}`, body: profileToDb(user) });
    return;
  }
  const users = await storageGetList("app_users");
  await storageSetList("app_users", users.map((u) => (u.id === user.id ? user : u)));
}

// ---- Official events (training calendar) ----
function eventFromDb(r) {
  return { id: r.id, date: r.date, title: r.title, time: r.time, endTime: r.end_time, location: r.location };
}
async function loadOfficialEvents() {
  if (useSupabase()) {
    const rows = await sbRequest("GET", "official_events", { query: "?select=*&order=date.asc" });
    return rows.map(eventFromDb);
  }
  return storageGetList("official_events");
}
async function addOfficialEventRemote(entry) {
  if (useSupabase()) {
    const rows = await sbRequest("POST", "official_events", {
      body: { date: entry.date, title: entry.title, time: entry.time, end_time: entry.endTime, location: entry.location },
    });
    return eventFromDb(rows[0]);
  }
  const events = await storageGetList("official_events");
  await storageSetList("official_events", [entry, ...events]);
  return entry;
}

// ---- Articles (עיתון טיפים) — stored in app_content as category='tip_article' ----
// Note: image_url needs `alter table app_content add column if not exists image_url text;`
// added to the schema for this to persist once Supabase is connected.
async function loadArticlesRemote() {
  if (useSupabase()) {
    const rows = await sbRequest("GET", "app_content", { query: "?select=*&category=eq.tip_article&order=created_at.desc" });
    return rows.map((r) => ({ id: r.id, title: r.title, excerpt: r.body, unit: r.subcategory || "כללי", author: "", imageUrl: r.image_url || "" }));
  }
  return storageGetList("articles");
}
async function addArticleRemote(entry) {
  if (useSupabase()) {
    const rows = await sbRequest("POST", "app_content", { body: { category: "tip_article", title: entry.title, body: entry.excerpt, subcategory: entry.unit, image_url: entry.imageUrl || null } });
    const r = rows[0];
    return { id: r.id, title: r.title, excerpt: r.body, unit: r.subcategory || "כללי", author: "", imageUrl: r.image_url || "" };
  }
  const arts = await storageGetList("articles");
  await storageSetList("articles", [entry, ...arts]);
  return entry;
}

// ---- Training bank & Hub units/gibushim content — app_content in real Supabase mode,
// a local storage key in local mode. Starts empty either way, populated only by an
// admin (via Management tab) or, once reconnected, via Supabase directly.
// Convention: category='training_pool' with subcategory one of the 7 TRAINING_BANK ids;
// category='unit_info' with subcategory in ('יחידות','גיבושים','ערכים').
// dateLabel is only meaningful for גיבושים content (the מועד shown on tap) - needs
// `alter table app_content add column if not exists date_label text;` in Supabase.
async function loadContentRemote(category, subcategory) {
  if (useSupabase()) {
    let query = `?select=*&category=eq.${category}&order=created_at.desc`;
    if (subcategory) query += `&subcategory=eq.${encodeURIComponent(subcategory)}`;
    const rows = await sbRequest("GET", "app_content", { query });
    return rows.map((r) => ({ id: r.id, title: r.title, body: r.body, subcategory: r.subcategory, dateLabel: r.date_label || "" }));
  }
  const all = await storageGetList("app_content_local");
  return all.filter((c) => c.category === category && (!subcategory || c.subcategory === subcategory));
}

async function addContentRemote(entry) {
  if (useSupabase()) {
    const rows = await sbRequest("POST", "app_content", { body: { category: entry.category, subcategory: entry.subcategory, title: entry.title, body: entry.body, date_label: entry.dateLabel || null } });
    const r = rows[0];
    return { id: r.id, title: r.title, body: r.body, subcategory: r.subcategory, category: r.category, dateLabel: r.date_label || "" };
  }
  const all = await storageGetList("app_content_local");
  const saved = { id: `local_${Date.now()}`, ...entry };
  await storageSetList("app_content_local", [saved, ...all]);
  return saved;
}

// ---- Personal training logs (per-user calendar entries) ----
function logFromDb(r) {
  return { id: r.id, date: r.date, time: r.time, title: r.title, detail: r.detail };
}
async function loadPersonalLogsRemote(userId) {
  if (useSupabase()) {
    const rows = await sbRequest("GET", "personal_logs", { query: `?select=*&user_id=eq.${userId}&order=date.desc` });
    return rows.map(logFromDb);
  }
  return storageGetList(`logs:${userId}`);
}
async function addPersonalLogRemote(userId, entry) {
  if (useSupabase()) {
    // Note: requires a `time text` column on personal_logs (not in the original schema) —
    // add it with `alter table personal_logs add column if not exists time text;` once reconnected.
    const rows = await sbRequest("POST", "personal_logs", { body: { user_id: userId, date: entry.date, time: entry.time, title: entry.title, detail: entry.detail } });
    return logFromDb(rows[0]);
  }
  const logs = await storageGetList(`logs:${userId}`);
  await storageSetList(`logs:${userId}`, [entry, ...logs]);
  return entry;
}
async function updatePersonalLogRemote(userId, id, patch) {
  if (useSupabase()) {
    await sbRequest("PATCH", "personal_logs", { query: `?id=eq.${id}`, body: patch });
    return;
  }
  const logs = await storageGetList(`logs:${userId}`);
  await storageSetList(`logs:${userId}`, logs.map((l) => (l.id === id ? { ...l, ...patch } : l)));
}
async function removePersonalLogRemote(userId, id) {
  if (useSupabase()) {
    await sbRequest("DELETE", "personal_logs", { query: `?id=eq.${id}` });
    return;
  }
  const logs = await storageGetList(`logs:${userId}`);
  await storageSetList(`logs:${userId}`, logs.filter((l) => l.id !== id));
}

// ---- Attendance reports ----
// Note: entry.eventId ties the report to the specific training it was taken for.
// The Supabase schema built earlier doesn't have an event_id column on
// attendance_reports yet — add `alter table attendance_reports add column if not
// exists event_id uuid references official_events(id);` there to carry it through too.
async function loadAttendanceReportsRemote() {
  if (useSupabase()) {
    const rows = await sbRequest("GET", "attendance_reports", { query: "?select=*&order=date.desc" });
    return rows.map((r) => ({ teamId: r.team_id != null ? String(r.team_id) : "", eventId: r.event_id, date: r.date, percentage: r.attendance_percentage }));
  }
  return storageGetList("attendance_reports");
}
async function submitAttendanceRemote(entry) {
  if (useSupabase()) {
    await sbRequest("POST", "attendance_reports", { body: { team_id: entry.teamId ? Number(entry.teamId) : null, date: entry.date, attendance_percentage: entry.percentage } });
    return;
  }
  const reports = await storageGetList("attendance_reports");
  await storageSetList("attendance_reports", [entry, ...reports]);
}

// ---- Individual per-trainee attendance (who specifically attended, not just the
// team percentage) - powers the coach's monthly "most attendances" leaderboard.
// Note: needs a new `individual_attendance` table if/when moved to Supabase:
// create table individual_attendance (id uuid default gen_random_uuid() primary key,
//   event_id text, date date, team_id int, user_id uuid references profiles(id),
//   present boolean, created_at timestamptz default now());
async function loadAllIndividualAttendance() {
  if (useSupabase()) {
    const rows = await sbRequest("GET", "individual_attendance", { query: "?select=*" });
    return rows.map((r) => ({ id: r.id, eventId: r.event_id, date: r.date, teamId: String(r.team_id), userId: r.user_id, present: r.present }));
  }
  return storageGetList("individual_attendance");
}
async function submitIndividualAttendanceRemote(records) {
  if (useSupabase()) {
    await sbRequest("POST", "individual_attendance", { body: records.map((r) => ({ event_id: r.eventId, date: r.date, team_id: Number(r.teamId), user_id: r.userId, present: r.present })) });
    return;
  }
  const all = await storageGetList("individual_attendance");
  await storageSetList("individual_attendance", [...records, ...all]);
}

// ---- Per-event RSVP (trainee marks if they're coming to a specific official training;
// admin sees exactly who's coming and who isn't, by name) ----
async function loadAllEventAttendance() {
  if (useSupabase()) {
    const rows = await sbRequest("GET", "event_attendance", { query: "?select=*" });
    return rows.map((r) => ({ id: r.id, eventId: r.event_id, userId: r.user_id, status: r.status }));
  }
  return storageGetList("event_attendance");
}
async function setEventAttendanceRemote(eventId, userId, status) {
  if (useSupabase()) {
    await sbRequest("DELETE", "event_attendance", { query: `?event_id=eq.${eventId}&user_id=eq.${userId}` }).catch(() => {});
    await sbRequest("POST", "event_attendance", { body: { event_id: eventId, user_id: userId, status } });
    return;
  }
  const all = await storageGetList("event_attendance");
  const filtered = all.filter((r) => !(r.eventId === eventId && r.userId === userId));
  await storageSetList("event_attendance", [...filtered, { id: `${eventId}_${userId}`, eventId, userId, status }]);
}

// ---- Training feedback ----
function feedbackFromDb(r) {
  return {
    id: r.id, userId: r.user_id, eventId: r.event_id, eventTitle: r.event_title,
    submittedAt: r.submitted_at, status: r.status, firstName: r.first_name,
    teamCode: r.team_id != null ? String(r.team_id) : "",
    coach: r.coach, valueRating: r.value_rating, recommendRating: r.recommend_rating,
    opinion: r.opinion,
    kindWord: r.kind_word_text ? { team: r.kind_word_team != null ? String(r.kind_word_team) : "", value: r.kind_word_value, text: r.kind_word_text } : null,
    howAreYou: r.how_are_you, messageToYuval: r.message_to_yuval,
  };
}
async function loadFeedbackRemote() {
  if (useSupabase()) {
    const rows = await sbRequest("GET", "training_feedback", { query: "?select=*&order=submitted_at.desc" });
    return rows.map(feedbackFromDb);
  }
  return storageGetList("training_feedback");
}
async function submitFeedbackRemote(entry) {
  if (useSupabase()) {
    await sbRequest("POST", "training_feedback", {
      body: {
        user_id: entry.userId, event_id: entry.eventId, event_title: entry.eventTitle,
        first_name: entry.firstName, team_id: entry.teamCode ? Number(entry.teamCode) : null, coach: entry.coach,
        value_rating: entry.valueRating, recommend_rating: entry.recommendRating,
        opinion: entry.opinion,
        kind_word_team: entry.kindWord?.team ? Number(entry.kindWord.team) : null,
        kind_word_value: entry.kindWord?.value || null,
        kind_word_text: entry.kindWord?.text || null,
        how_are_you: entry.howAreYou, message_to_yuval: entry.messageToYuval, status: "pending",
      },
    });
    return;
  }
  const list = await storageGetList("training_feedback");
  await storageSetList("training_feedback", [entry, ...list]);
}
async function approveFeedbackRemote(id) {
  if (useSupabase()) {
    await sbRequest("PATCH", "training_feedback", { query: `?id=eq.${id}`, body: { status: "approved" } });
    return;
  }
}
async function checkFeedbackSubmitted(userId, eventId) {
  const list = await loadFeedbackRemote();
  return list.some((f) => f.userId === userId && f.eventId === eventId);
}

async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await window.crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function storageGetList(key) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const res = await window.storage.get(key, true);
      return res && res.value ? JSON.parse(res.value) : [];
    }
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function storageSetList(key, list) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(key, JSON.stringify(list), true);
      return;
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error("storage set failed", key, e);
  }
}

async function callGemini(apiKey, systemPrompt, userText) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
      }),
    }
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.message || `Gemini request failed (${res.status})`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "לא התקבלה תשובה מהמאמן.";
}

function localCoachReply(text) {
  const t = text.toLowerCase();
  if (t.includes("שינה")) return "שאפו ל-7-9 שעות שינה בלילה. שינה היא חלק מהאימון עצמו - היא הזמן שבו הגוף בונה כוח ומתאושש.";
  if (t.includes("תזונה") || t.includes("אוכל")) return "לפני אימון קשה - פחמימות קלות לעיכול ומעט חלבון. אחרי אימון - חלבון + פחמימה תוך 60 דקות לשיקום מהיר.";
  if (t.includes("שין ספלינט") || t.includes("שוקיים")) return "כאב בשוקיים דורש הפחתת עומס ריצה מיידית ומעבר לאימון קרוס (שחייה/אופניים) לכמה ימים. אם הכאב נמשך, פנו לפיזיותרפיסט.";
  if (t.includes("פציעה") || t.includes("כואב")) return "אל תתאמנו דרך כאב חד. מנוחה יחסית, קרח ב-48 השעות הראשונות, ופנייה לאיש מקצוע אם אין שיפור תוך 3-4 ימים.";
  return "שאלה טובה. בגדול - התמידו, בנו עומס בהדרגה, ותנו לגוף להתאושש.";
}

function generateMockProgram(goal, unitName, level) {
  return WAR_WEEKS.slice(0, 4).map((w, i) => ({
    week: i + 1,
    title: `שבוע ${i + 1} - ${level || "כללי"}`,
    items: [
      `ריצה מותאמת ל${goal || "המטרה שלך"}`,
      i % 2 === 0 ? "אימון כוח משקל גוף מלא" : "אימון כוח מפוצל + ליבה",
      unitName ? `תרגול ספציפי לדרישות ${unitName}` : "עבודת סיבולת שטח",
    ],
  }));
}

/* ============================== SMALL UI ATOMS ============================== */

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-zinc-800/60 shadow-2xl shadow-black/50 ring-1 ring-white/[0.03] transition-all duration-300 ease-out hover:border-emerald-500/40 hover:shadow-emerald-500/10 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children, tone = "emerald" }) {
  const toneMap = {
    emerald: { text: "text-emerald-400", hex: "#10b981" },
    amber: { text: "text-amber-400", hex: "#f59e0b" },
    red: { text: "text-red-400", hex: "#ef4444" },
  };
  const t = toneMap[tone];
  return (
    <div className="flex items-center gap-2.5 mb-3">
      {Icon && (
        <div className="w-7 h-7 rounded-lg bg-black/40 border flex items-center justify-center shrink-0" style={{ borderColor: `${t.hex}40`, boxShadow: `0 0 10px ${t.hex}25` }}>
          <Icon size={14} className={t.text} />
        </div>
      )}
      <h3 className="text-sm font-bold tracking-wide text-zinc-100">{children}</h3>
    </div>
  );
}

function BrandEmblem({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="emblemFill" x1="50" y1="2" x2="50" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
        <filter id="emblemGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M50 3 L93 22 V48 C93 74 75 93 50 97 C25 93 7 74 7 48 V22 Z" fill="url(#emblemFill)" stroke="#34d399" strokeWidth="2" filter="url(#emblemGlow)" />
      <g filter="url(#emblemGlow)">
        <path d="M50 24 L56 40 L50 36.5 L44 40 Z" fill="#34d399" />
        <circle cx="50" cy="30" r="2" fill="#d1fae5" />
      </g>
      <path d="M20 58 C32 50 42 54 50 62 C58 54 68 50 80 58" stroke="#34d399" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M22 66 C34 59 43 62 50 69 C57 62 66 59 78 66" stroke="#10b981" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

function Pill({ children, tone = "zinc" }) {
  const toneMap = {
    zinc: "bg-zinc-800 text-zinc-300 border-zinc-700",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${toneMap[tone]}`}>{children}</span>;
}

function GlowButton({ children, onClick, tone = "emerald", icon: Icon, className = "", disabled }) {
  const toneMap = {
    emerald: "bg-gradient-to-l from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-black font-black shadow-emerald-500/40 hover:shadow-emerald-400/60 hover:shadow-xl hover:scale-[1.02]",
    amber: "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30 hover:shadow-amber-400/50 hover:shadow-xl hover:scale-[1.02]",
    red: "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 hover:shadow-red-500/50 hover:shadow-xl hover:scale-[1.02]",
    ghost: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-none border border-zinc-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg transition-all duration-300 ease-out active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:hover:shadow-lg disabled:hover:scale-100 ${toneMap[tone]} ${className}`}
    >
      {Icon && <Icon size={16} className={Icon === Loader2 ? "animate-spin" : ""} />}
      {children}
    </button>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const toneMap = {
    success: "bg-emerald-500 text-black",
    error: "bg-red-600 text-white",
    info: "bg-zinc-800 text-zinc-100 border border-zinc-700",
  };
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-[85%] px-1 py-1 rounded-xl text-sm font-bold">
      <div className={`px-4 py-2.5 rounded-xl shadow-2xl ${toneMap[toast.tone]}`}>{toast.msg}</div>
    </div>
  );
}

/* ============================== RATING BUTTONS (1-5) ============================== */

function RatingButtons({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex-1 rounded-lg py-2 text-sm font-black border transition ${
            value === n ? "bg-emerald-500 border-emerald-500 text-black" : "bg-zinc-900 border-zinc-800 text-zinc-400"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

/* ============================== INTRO CAROUSEL ============================== */

function AiIntroVisual() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-2xl font-black text-zinc-50 mb-3 tracking-tight">ה-AI הטקטי שלך</div>
      <p className="text-base text-zinc-200 leading-loose px-1 mb-8">
        ה-AI הטקטי לכושר קרבי מגיע לכל רשתות האימון בארץ ומלווה את המלש"בים 24/7 מהנייד. המערכת מייצרת תוכניות אישיות לגיבושים, מענה לתזונה ו"מצב מלחמה" לשמירה על כושר שיא בכל תנאי. זהו הכלי שמשדרג את אחוזי ההצלחה של הצוותים בדרך ליחידות העילית.
      </p>
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center glow-pulse" style={glowVars("#10b981")}>
          <Bot size={44} className="text-emerald-400" />
        </div>
        <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
          <Sparkles size={14} className="text-black" />
        </div>
      </div>
      <div className="w-full max-w-[280px] space-y-2.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-br-sm px-4 py-3 text-sm text-zinc-200 max-w-[85%] mr-auto">
          איך הרגיש האימון היום?
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-emerald-100 max-w-[85%] ml-auto">
          בנה לי תוכנית לגיבוש שייטת 13 💪
        </div>
      </div>
    </div>
  );
}

function FeaturesIntroVisual() {
  const items = [
    { icon: CalendarDays, label: "יומן אימונים", hex: "#34d399" },
    { icon: MessageSquare, label: "צ'אט AI", hex: "#38bdf8" },
    { icon: BookOpen, label: "מאגר מידע", hex: "#fbbf24" },
    { icon: ClipboardCheck, label: "מעקב נוכחות", hex: "#f87171" },
  ];
  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-2xl font-black text-zinc-50 mb-3 tracking-tight">המעטפת המלאה שלך</div>
      <p className="text-base text-zinc-200 leading-loose px-1 mb-8">
        האפליקציה מעניקה למתאמנים מעטפת מקצועית מלאה בדרך ליחידות העילית של צה"ל, כולל מעקב נוכחות, יומן אימונים ומאגרי מידע על כל הגיבושים. בעזרת צ'אט ה-AI המותאם אישית לתזונה ולתוכניות כושר, לצד טיפים מעשיים מבוגרים שעברו את המיונים, המלש"בים מקבלים את הכלים המדויקים ביותר להצלחה בגיבוש.
      </p>
      <div className="relative mx-auto w-full max-w-[280px]">
        <div className="rounded-[2rem] border-2 border-emerald-500/40 bg-zinc-950 p-4 glow-pulse" style={glowVars("#10b981")}>
          <div className="flex items-center justify-center gap-1 mb-3">
            <div className="w-10 h-1 rounded-full bg-zinc-800" />
          </div>
          <div className="space-y-2.5">
            {items.map((it) => (
              <div key={it.label} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-3.5 py-3" style={{ border: `1px solid ${it.hex}35` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${it.hex}22` }}>
                  <it.icon size={20} style={{ color: it.hex }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-100 mb-1.5">{it.label}</div>
                  <div className="h-1 w-2/3 rounded-full" style={{ backgroundColor: `${it.hex}30` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsIntroVisual() {
  const items = [
    { name: "נ׳", unit: "שלדג", hex: "#60a5fa", quote: "האפליקציה ליוותה אותי באופן מקצועי וממש נתנה לי את המעטפת המלאה לאימונים של הקבוצה ובכך הרגשתי שאני לא מבזבז רגע מיותר ומכוון להוציא בגיבוש את הטוב ביותר" },
    { name: "י׳", unit: "קורס חובלים", hex: "#e2e8f0", quote: "האפליקציה ליוותה אותי לאורך כל תהליך ההכנה לגיבוש חובלים. בתחילת השנה הגעתי כמעט ללא כושר, ובעזרת תוכנית אימונים מסודרת הצלחתי להשתפר בצורה משמעותית. היא שילבה עבורי אימוני כוח, ריצה ושחייה, סייעה לי להתמיד ולעקוב אחר ההתקדמות שלי, ובזכותה הגעתי לגיבוש מוכן יותר ובכושר גבוה." },
    { name: "ב׳", unit: "669", hex: "#fb923c", quote: "תרמה משמעותית ודחפה אותי קדימה בכל החצי שנה שקדמה לגיבוש שלי וגם כמובן אחריו ונתנה לי את המפתחות שהעבירו אותי את הגיבוש בתיאום עם קבוצת הכושר קרבי שלי." },
    { name: "ל׳", unit: "סיירת מטכ״ל", hex: "#eab308", quote: "סיפקה מענה מדויק לכל המגרעות שהיו לי לפני הגיבוש ונתנה את האופציה להשתפר ולהוכיח לעצמי בכל יום שזה אפשרי, בדחיפה בלתי פוסקת קדימה" },
    { name: "ו׳", unit: "שייטת 7", hex: "#0ea5e9", quote: "מעבר לדברים שקיבלתי בקבוצתי, האפליקציה הייתה כמעין שגרה קבועה שנתנה לי את הדרך לעבוד נכון ולהתמקד בתוצאות שלי ובשיפור שלי מאימון לאימון ומיום ליום, ממליץ בחום!!!!!" },
  ];
  return (
    <div className="w-full">
      <div className="text-lg font-black text-zinc-50 mb-4 text-center">מה אומרים עלינו</div>
      <div className="space-y-3">
        {items.map((t) => (
          <Card key={t.name} className="p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0" style={{ backgroundColor: `${t.hex}22`, color: t.hex, border: `1px solid ${t.hex}55` }}>
                {t.name}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200">{t.name}</div>
                <div className="text-[10px] text-zinc-500">{t.unit}</div>
              </div>
              <div className="flex gap-0.5 mr-auto">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={11} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{t.quote}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 text-center text-sm font-bold text-emerald-400 leading-relaxed px-2">
        רוצים לעבוד בצורה הטובה ביותר ולמקסם את הפוטנציאל שלכם, האפליקציה הזו בדיוק בשבילכם!
      </div>
    </div>
  );
}

function IntroCarousel({ onDone }) {
  const [step, setStep] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const isLast = step === 2;

  useEffect(() => {
    setCanAdvance(false);
    const t = setTimeout(() => setCanAdvance(true), 3000);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="flex-1 flex flex-col p-5 overflow-y-auto">
      <div className="flex items-center gap-1.5 mb-6 mt-2 justify-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-emerald-500" : "w-1.5 bg-zinc-800"}`} />
        ))}
      </div>

      <div key={step} className="flex-1 flex flex-col items-center text-center intro-fade">
        {step === 0 && <AiIntroVisual />}
        {step === 1 && <FeaturesIntroVisual />}
        {step === 2 && <TestimonialsIntroVisual />}
      </div>

      <div className="pt-6 pb-2 min-h-[52px] flex items-center">
        {canAdvance ? (
          <GlowButton
            tone="emerald"
            className="w-full intro-fade"
            icon={isLast ? Check : ChevronLeft}
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
          >
            {isLast ? "בואו נתחיל" : "הבא"}
          </GlowButton>
        ) : (
          <div className="w-full flex justify-center">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== AUTH SCREEN ============================== */

function AuthScreen({ onAuthed, showToast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [networkCode, setNetworkCode] = useState("");
  const [coachCode, setCoachCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const useRealAuth = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

  async function submit() {
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) { setError("נא למלא אימייל וסיסמה"); return; }
    if (!EMAIL_RE.test(cleanEmail)) { setError("כתובת האימייל לא תקינה"); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 6) throw new Error("הסיסמה חייבת להכיל לפחות 6 תווים");
        if (password !== confirm) throw new Error("הסיסמאות אינן תואמות");
        const networkId = await verifyNetworkCode(networkCode.trim());
        if (!networkId) throw new Error("קוד רשת שגוי");
        const wantsCoach = coachCode.trim() === "12345123";

        if (useRealAuth) {
          // The server trigger checks coach_code itself and assigns the role -
          // the client's claim alone is never trusted, even here.
          const authData = await supabaseSignUp(cleanEmail, password, { role: "trainee", network: networkId, coach_code: coachCode.trim() });
          if (authData.access_token) {
            // Email confirmations are off on this project — a session starts immediately.
            session.accessToken = authData.access_token;
            const appUser = await fetchOwnProfile(authData.user?.id);
            if (!appUser) throw new Error("נרשמת אך הפרופיל טרם נוצר, נסה/י להתחבר בעוד רגע");
            showToast("נרשמת בהצלחה!", "success");
            onAuthed(appUser);
          } else {
            showToast("נשלח מייל אימות לכתובת שלך - יש ללחוץ על הקישור ואז להתחבר", "info");
            setMode("login"); setPassword(""); setConfirm("");
          }
        } else {
          const users = await storageGetList("app_users");
          if (users.some((u) => u.email.toLowerCase() === cleanEmail.toLowerCase())) throw new Error("כבר קיים משתמש עם אימייל זה");
          const passwordHash = await hashPassword(password);
          const newUser = {
            id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            email: cleanEmail, passwordHash, network: networkId,
            role: wantsCoach ? "admin" : "trainee",
            createdAt: new Date().toISOString(),
            onboarded: wantsCoach, profile: null,
          };
          await storageSetList("app_users", [...users, newUser]);
          showToast("נרשמת בהצלחה!", "success");
          onAuthed(newUser);
        }
      } else {
        if (useRealAuth) {
          const authData = await supabaseLogin(cleanEmail, password);
          session.accessToken = authData.access_token;
          const appUser = await fetchOwnProfile(authData.user?.id);
          if (!appUser) throw new Error("משתמש לא נמצא במערכת");
          showToast(`ברוך שובך, ${appUser.email.split("@")[0]}`, "success");
          onAuthed(appUser);
        } else {
          const users = await storageGetList("app_users");
          const user = users.find((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());
          if (!user) throw new Error("משתמש לא נמצא");
          const hash = await hashPassword(password);
          if (hash !== user.passwordHash) throw new Error("סיסמה שגויה");
          showToast(`ברוך שובך, ${user.email.split("@")[0]}`, "success");
          onAuthed(user);
        }
      }
    } catch (e) {
      setError(e.message || "שגיאה, נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5 relative">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
            <BrandEmblem size={34} />
          </div>
          <div className="text-2xl font-black text-zinc-50 tracking-wide">SayertTracking</div>
          <div className="w-8 h-px bg-emerald-500/40 my-1.5" />
          <div className="text-xs text-zinc-500 tracking-wide">המעטפת לסיירת</div>
        </div>

        <Card className="p-5">
          <div className="flex gap-2 mb-4">
            <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 rounded-lg py-2 text-sm font-bold border ${mode === "login" ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
              התחברות
            </button>
            <button onClick={() => { setMode("signup"); setError(""); }} className={`flex-1 rounded-lg py-2 text-sm font-bold border ${mode === "signup" ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
              הרשמה
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-zinc-500 font-semibold">אימייל</label>
              <input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 font-semibold">סיסמה</label>
              <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label className="text-[11px] text-zinc-500 font-semibold">אימות סיסמה</label>
                  <input dir="ltr" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-semibold">קוד רשת</label>
                  <input dir="ltr" value={networkCode} onChange={(e) => setNetworkCode(e.target.value)} placeholder="קוד הרשת שקיבלת" className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-semibold">קוד מאמן (רק למאמנים - השאירו ריק אם אתם חניכים)</label>
                  <input dir="ltr" type="password" value={coachCode} onChange={(e) => setCoachCode(e.target.value)} placeholder="אופציונלי" className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all duration-300" />
                </div>
              </>
            )}

            {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

            <GlowButton tone="emerald" icon={loading ? Loader2 : mode === "login" ? ChevronLeft : Check} className="w-full" disabled={loading} onClick={submit}>
              {loading ? "רגע..." : mode === "login" ? "התחבר" : "הרשם"}
            </GlowButton>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== ONBOARDING FLOW ============================== */

function OnboardingFlow({ user, onDone, showToast }) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState(17);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(68);
  const [healthy, setHealthy] = useState(true);
  const [issues, setIssues] = useState([]);
  const [otherNote, setOtherNote] = useState("");
  const [level, setLevel] = useState("");
  const [unit, setUnit] = useState(null);
  const [teamCode, setTeamCode] = useState("");
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [teamCodeError, setTeamCodeError] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleIssue(opt) {
    setIssues((list) => (list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt]));
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    setCheckingCode(true);
    const valid = await verifyTeamCode(teamCode, teamCodeInput.trim());
    setCheckingCode(false);
    if (!valid) {
      setTeamCodeError("קוד האימות שגוי - בדוק/י את הקוד שקיבלת עבור הצוות");
      return;
    }
    setSaving(true);
    try {
      const profile = {
        fullName, age, height, weight, healthy,
        healthIssues: healthy ? [] : issues,
        healthOtherNote: healthy ? "" : otherNote,
        level, targetUnit: unit.id, targetUnitName: unit.name,
        teamCode,
      };
      const updatedUser = { ...user, onboarded: true, profile };
      await saveUserProfile(updatedUser);
      showToast("הפרופיל נשמר בהצלחה", "success");
      onDone(updatedUser);
    } catch (e) {
      showToast("שגיאה בשמירה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  const stepsMeta = ["פרטים אישיים", "רמת כושר", "יעד קרבי", "צוות"];

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      <div className="flex items-center gap-1.5 mb-1 mt-2">
        {stepsMeta.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-emerald-500" : "bg-zinc-800"}`} />
        ))}
      </div>
      <div className="text-[11px] text-zinc-600 font-semibold mb-4">שלב {step + 1} מתוך {stepsMeta.length} - {stepsMeta[step]}</div>

      <div className="flex-1">
        {step === 0 && (
          <div className="space-y-4">
            <SectionTitle icon={User}>ספר/י לנו קצת עליך</SectionTitle>
            <div>
              <label className="text-[11px] text-zinc-500 font-semibold">שם מלא</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["גיל", age, setAge, 12, 25], ["גובה (ס״מ)", height, setHeight, 130, 210], ["משקל (ק״ג)", weight, setWeight, 30, 150]].map(([label, val, setter, min, max]) => (
                <div key={label}>
                  <label className="text-[10px] text-zinc-500 font-semibold">{label}</label>
                  <input type="number" min={min} max={max} value={val} onChange={(e) => setter(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-zinc-100 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
                </div>
              ))}
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 font-semibold mb-1.5 block">האם את/ה נוטה להיות בריא/ה?</label>
              <div className="flex gap-2">
                <button onClick={() => setHealthy(true)} className={`flex-1 rounded-xl py-2.5 text-sm font-bold border ${healthy ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>כן</button>
                <button onClick={() => setHealthy(false)} className={`flex-1 rounded-xl py-2.5 text-sm font-bold border ${!healthy ? "bg-red-500/15 border-red-500 text-red-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>לא</button>
              </div>
            </div>

            {!healthy && (
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold mb-1.5 block">מה הבעיה? (ניתן לבחור כמה)</label>
                <div className="flex flex-wrap gap-1.5">
                  {HEALTH_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => toggleIssue(opt)} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${issues.includes(opt) ? "bg-red-500/15 border-red-500 text-red-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                {issues.includes("אחר") && (
                  <textarea value={otherNote} onChange={(e) => setOtherNote(e.target.value)} placeholder="פרט/י..." rows={2} className="w-full mt-2 bg-zinc-950 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none" />
                )}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <SectionTitle icon={GaugeIcon} tone="amber">מה רמת הכושר הנוכחית שלך?</SectionTitle>
            {TIERS.map((t) => (
              <button key={t} onClick={() => setLevel(t)} className={`w-full text-right rounded-xl px-4 py-3.5 text-sm font-bold border transition ${level === t ? "bg-amber-500/15 border-amber-500 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-300"}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <SectionTitle icon={Target}>לאיזו יחידה את/ה שואף/ת?</SectionTitle>
            <div className="text-[11px] text-zinc-600 mb-3">שימו לב - לאחר האישור לא ניתן יהיה לשנות את היעד</div>
            <div className="grid grid-cols-2 gap-2.5">
              {UNITS.map((u) => {
                const selected = unit?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setUnit(u)}
                    style={selected ? glowVars(u.hex) : undefined}
                    className={`rounded-2xl px-3 py-4 text-center transition active:scale-95 ${selected ? `glow-btn border-2 ${u.border}` : `bg-zinc-950 border-2 ${u.border}`}`}
                  >
                    <div className={`text-sm font-black ${u.text}`}>{u.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{u.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <SectionTitle icon={Users}>לאיזה צוות את/ה משויך/ת?</SectionTitle>
            <div className="text-[11px] text-zinc-600 mb-3">בחר/י את מספר הצוות והזן/י את קוד האימות שקיבלת מהמדריך. לא ניתן לשנות לאחר האישור.</div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {TEAM_LIST.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTeamCode(t.id); setTeamCodeError(""); }}
                  className={`rounded-xl py-3 text-sm font-black border transition ${teamCode === t.id ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-300"}`}
                >
                  {t.id}
                </button>
              ))}
            </div>
            {teamCode && (
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold">קוד אימות לצוות {teamCode}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  dir="ltr"
                  value={teamCodeInput}
                  onChange={(e) => { setTeamCodeInput(e.target.value); setTeamCodeError(""); }}
                  placeholder="הזן/י קוד"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300"
                />
                {teamCodeError && <div className="text-xs text-red-400 mt-1.5">{teamCodeError}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 pb-2">
        {step > 0 && (
          <GlowButton tone="ghost" className="flex-1" onClick={handleBack}>חזור</GlowButton>
        )}
        {step === 0 && (
          <GlowButton tone="emerald" className="flex-1" disabled={!fullName.trim()} onClick={() => setStep(1)}>המשך</GlowButton>
        )}
        {step === 1 && (
          <GlowButton tone="emerald" className="flex-1" disabled={!level} onClick={() => setStep(2)}>המשך</GlowButton>
        )}
        {step === 2 && unit && (
          <GlowButton tone="emerald" className="flex-1" onClick={() => setStep(3)}>אשר וכנס</GlowButton>
        )}
        {step === 3 && (
          <GlowButton tone="emerald" icon={saving || checkingCode ? Loader2 : Check} className="flex-1" disabled={saving || checkingCode || !teamCode || !teamCodeInput.trim()} onClick={finish}>
            {checkingCode ? "בודק קוד..." : saving ? "שומר..." : "סיום ההרשמה"}
          </GlowButton>
        )}
      </div>
    </div>
  );
}

/* ============================== HEADER ============================== */

function AppHeader({ user }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const greeting = hour >= 5 && hour < 12 ? "בוקר טוב" : hour >= 12 && hour < 17 ? "צהריים טובים" : hour >= 17 && hour < 21 ? "ערב טוב" : "לילה טוב";
  const displayName = user.profile?.fullName || user.email.split("@")[0];

  return (
    <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-black/60 backdrop-blur">
      <div className="text-[9px] text-zinc-600 leading-none mb-1">
        {now.toLocaleDateString("he-IL", { day: "numeric", month: "long" })} · {now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="text-sm font-black text-zinc-50 leading-none truncate max-w-[220px]">{greeting}, {displayName}</div>
    </div>
  );
}

/* ============================== BOTTOM NAV ============================== */

function BottomNav({ tabs, active, setActive }) {
  return (
    <div className="border-t border-zinc-800/80 bg-black/80 backdrop-blur-xl flex">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => setActive(t.id)} className="relative flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-transform duration-300 ease-out active:scale-90">
            {isActive && <span className="absolute top-0 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(16,185,129,0.6)]" />}
            <t.icon size={15} className={`transition-all duration-300 ease-out ${isActive ? "text-emerald-400 scale-110" : "text-zinc-600"}`} />
            <span className={`text-[8px] font-bold transition-colors duration-300 ${isActive ? "text-emerald-400" : "text-zinc-600"}`}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================== HOME TAB ============================== */

function HomeTab({ warMode, goToWarChat, officialEvents, goToHub, goToFeedback, goToCalendar, role, trainingContent, profile }) {
  const gibushDate = profile?.gibushDate ? new Date(`${profile.gibushDate}T06:00:00`) : null;
  const [timeLeft, setTimeLeft] = useState(() => (gibushDate ? formatCountdown(gibushDate - new Date()) : null));
  useEffect(() => {
    if (!gibushDate) { setTimeLeft(null); return; }
    setTimeLeft(formatCountdown(gibushDate - new Date()));
    const id = setInterval(() => setTimeLeft(formatCountdown(gibushDate - new Date())), 1000);
    return () => clearInterval(id);
  }, [profile?.gibushDate]);
  const [openWeek, setOpenWeek] = useState(0);
  const [openBank, setOpenBank] = useState(null);
  const todayKey = toKey(new Date());
  const todayEvents = officialEvents.filter((e) => e.date === todayKey);
  const openFeedbackEvent = role !== "admin" ? getOpenFeedbackEvent(officialEvents) : null;

  return (
    <div className="p-4 space-y-4">
      <Card className={`p-4 relative overflow-hidden ${todayEvents.length > 0 ? "border-emerald-500/30" : ""}`}>
        <div className="absolute -left-8 -top-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl" />
        {todayEvents.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500 font-semibold mb-1">האם יש אימון היום?</div>
                <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={20} /> כן, יש אימון
                </div>
              </div>
              {todayEvents[0].time && <Pill tone="emerald">{todayEvents[0].time}</Pill>}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
              <MapPin size={14} className="text-zinc-500" />
              {todayEvents[0].title}{todayEvents[0].location ? ` - ${todayEvents[0].location}` : ""}
            </div>
            <button onClick={goToCalendar} className="mt-3 w-full rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2 active:scale-95 transition">
              פרטים ביומן
            </button>
          </>
        ) : (
          <div>
            <div className="text-xs text-zinc-500 font-semibold mb-1">האם יש אימון היום?</div>
            <div className="text-lg font-black text-zinc-500">אין אימון רשמי מתוכנן היום</div>
          </div>
        )}
      </Card>

      {openFeedbackEvent && (
        <button onClick={goToFeedback} className="w-full rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 p-4 flex items-center justify-between active:scale-[0.98] transition">
          <div className="text-right w-full">
            <div className="text-emerald-400 font-black text-sm flex items-center gap-1.5 justify-end">
              מילוי משוב אימון <ClipboardCheck size={16} />
            </div>
            <div className="text-emerald-200/70 text-[11px] mt-0.5">האימון "{openFeedbackEvent.title}" הסתיים - נשמח לשמוע איך היה</div>
          </div>
        </button>
      )}

      <button onClick={goToHub} className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5 flex items-center justify-between active:scale-[0.98] transition">
        <span className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
          <BookOpen size={16} className="text-zinc-500" /> מאגר מידע ועיתון
        </span>
        <ChevronLeft size={16} className="text-zinc-600" />
      </button>

      <Card className="p-4">
        <SectionTitle icon={Clock} tone="amber">{profile?.gibushType ? `ספירה לאחור ל${profile.gibushType}` : "ספירה לאחור לגיבוש הקרוב"}</SectionTitle>
        {timeLeft ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[["ימים", timeLeft.d], ["שעות", timeLeft.h], ["דק׳", timeLeft.m], ["שנ׳", timeLeft.s]].map(([label, val]) => (
              <div key={label} className="bg-zinc-950 rounded-xl py-2 border-2" style={{ borderColor: `${(GIBUSH_TYPE_COLORS[profile?.gibushType] || {}).hex || "#f59e0b"}33` }}>
                <div className="text-xl font-black tabular-nums" style={{ color: (GIBUSH_TYPE_COLORS[profile?.gibushType] || {}).hex || "#f59e0b" }}>{String(val).padStart(2, "0")}</div>
                <div className="text-[10px] text-zinc-500 font-semibold">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <button onClick={goToCalendar} className="w-full text-center py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition">
            עדיין לא נקבע מועד גיבוש - לחצו כדי לקבוע ביומן
          </button>
        )}
      </Card>

      {warMode && (
        <Card className="p-4 border-2 hover:border-red-500/60" style={{ borderColor: "#dc2626" }}>
          <div className="rounded-xl -m-4 mb-3 p-4 glow-pulse" style={glowVars("#dc2626", "#f59e0b")}>
            <div className="flex items-center gap-2">
              <Siren size={18} className="text-red-400 animate-pulse" />
              <span className="text-sm font-black text-red-400">מצב מלחמה פעיל - תוכנית חירום 6 שבועות</span>
            </div>
          </div>
          <div className="space-y-2">
            {WAR_WEEKS.map((w, i) => (
              <div key={w.week} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenWeek(openWeek === i ? -1 : i)} className="w-full flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm font-bold text-zinc-200">{w.title}</span>
                  <ChevronDown size={16} className={`text-zinc-500 transition ${openWeek === i ? "rotate-180" : ""}`} />
                </button>
                {openWeek === i && (
                  <ul className="px-4 pb-3 space-y-1">
                    {w.focus.map((f, idx) => (
                      <li key={idx} className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-500" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <GlowButton tone="red" icon={ShieldAlert} className="w-full mt-3" onClick={goToWarChat}>פתח צ׳אט AI חירום</GlowButton>
        </Card>
      )}

      <Card className="p-4">
        <SectionTitle icon={BarChart3}>מאגר אימונים</SectionTitle>
        <div className="space-y-2">
          {TRAINING_BANK.map((b) => {
            const items = trainingContent.filter((t) => t.subcategory === b.id);
            return (
              <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenBank(openBank === b.id ? null : b.id)} className="w-full flex items-center justify-between px-3.5 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                    <b.icon size={16} className={b.color} /> {b.title}
                  </span>
                  <ChevronDown size={15} className={`text-zinc-500 transition ${openBank === b.id ? "rotate-180" : ""}`} />
                </button>
                {openBank === b.id && (
                  items.length === 0 ? (
                    <div className="px-4 pb-3 text-[11px] text-zinc-600">אין עדיין תוכן בקטגוריה זו</div>
                  ) : (
                    <ul className="px-4 pb-3 space-y-1.5">
                      {items.map((it) => (
                        <li key={it.id} className="text-xs text-zinc-400">
                          <div className="flex items-center gap-1.5 font-bold text-zinc-300">
                            <span className={`w-1 h-1 rounded-full ${b.color.replace("text-", "bg-")}`} /> {it.title}
                          </div>
                          {it.body && <div className="pr-2.5 mt-0.5 text-zinc-500">{it.body}</div>}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============================== CALENDAR TAB ============================== */

function CalendarTab({ officialEvents, personalLogs, addPersonalLog, removePersonalLog, updatePersonalLog, profile, onSetGibushDate, userId }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [addPopup, setAddPopup] = useState(null); // { time }
  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [gibushOpen, setGibushOpen] = useState(false);
  const [gibushInput, setGibushInput] = useState(profile?.gibushDate || "");
  const [gibushTypeInput, setGibushTypeInput] = useState(profile?.gibushType || "");
  const [drag, setDrag] = useState(null); // { id, startClientY, startMinutes, liveMinutes, moved }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);
  const todayKey = toKey(new Date());
  const selKey = toKey(selectedDay);

  const eventsByDay = useMemo(() => {
    const map = {};
    officialEvents.forEach((e) => { (map[e.date] ||= []).push({ ...e, source: "official" }); });
    personalLogs.forEach((e) => { (map[e.date] ||= []).push({ ...e, source: "personal" }); });
    return map;
  }, [officialEvents, personalLogs]);
  const dayEvents = eventsByDay[selKey] || [];

  function openAdd(hour) {
    setAddPopup({ time: `${String(hour).padStart(2, "0")}:00` });
    setNewTitle(""); setNewDetail("");
  }
  function saveAdd() {
    if (!newTitle.trim() || !addPopup) return;
    addPersonalLog({ id: Date.now(), date: selKey, time: addPopup.time, title: newTitle.trim(), detail: newDetail.trim() });
    setAddPopup(null);
  }

  function onPointerDownEvent(e, ev) {
    if (ev.source !== "personal") return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: ev.id, startClientY: e.clientY, startMinutes: timeToMinutes(ev.time), liveMinutes: timeToMinutes(ev.time), moved: false });
  }
  function onPointerMoveGrid(e) {
    if (!drag) return;
    const deltaY = e.clientY - drag.startClientY;
    const deltaMinutes = (deltaY / ROW_HEIGHT) * 60;
    setDrag((d) => ({ ...d, liveMinutes: d.startMinutes + deltaMinutes, moved: d.moved || Math.abs(deltaY) > 6 }));
  }
  async function onPointerUpGrid() {
    if (!drag) return;
    const newTime = minutesToTime(drag.liveMinutes);
    if (newTime !== minutesToTime(drag.startMinutes)) await updatePersonalLog(drag.id, { time: newTime });
    setDrag(null);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
        <button onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; })} className="text-zinc-400 hover:text-emerald-400 p-1">
          <ChevronRight size={18} />
        </button>
        <div className="text-xs font-bold text-zinc-300">{selectedDay.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}</div>
        <button onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; })} className="text-zinc-400 hover:text-emerald-400 p-1">
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex px-2 py-2 gap-1 border-b border-zinc-800 shrink-0">
        {days.map((d) => {
          const key = toKey(d);
          const isSel = key === selKey;
          const isToday = key === todayKey;
          const hasEvents = (eventsByDay[key] || []).length > 0;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(d)}
              className={`flex-1 rounded-xl py-1.5 flex flex-col items-center gap-0.5 transition ${isSel ? "bg-emerald-500 text-black" : isToday ? "bg-zinc-800 text-emerald-400 ring-1 ring-emerald-500/50" : "text-zinc-400 hover:bg-zinc-900"}`}
            >
              <span className="text-[8px] font-bold">{WEEKDAYS_HE[d.getDay()]}</span>
              <span className="text-xs font-black">{d.getDate()}</span>
              <span className={`w-1 h-1 rounded-full ${hasEvents ? (isSel ? "bg-black" : "bg-amber-400") : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <div className="px-3 pt-2.5 pb-1.5 flex justify-center shrink-0">
        {profile?.gibushDate ? (
          <div
            className="rounded-full border-2 px-3.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 glow-pulse bg-black"
            style={{ ...glowVars((GIBUSH_TYPE_COLORS[profile.gibushType] || {}).hex || "#f59e0b", (GIBUSH_TYPE_COLORS[profile.gibushType] || {}).hex2), borderColor: (GIBUSH_TYPE_COLORS[profile.gibushType] || {}).hex || "#f59e0b", color: (GIBUSH_TYPE_COLORS[profile.gibushType] || {}).hex || "#f59e0b" }}
          >
            <Lock size={11} />
            {profile.gibushType}: {new Date(`${profile.gibushDate}T00:00:00`).toLocaleDateString("he-IL")}
          </div>
        ) : (
          <button
            onClick={() => { setGibushInput(""); setGibushTypeInput(""); setGibushOpen(true); }}
            className="rounded-full bg-amber-500/10 border border-amber-500/40 px-3.5 py-1.5 text-[11px] font-bold text-amber-400 flex items-center gap-1.5 active:scale-95 transition glow-pulse"
            style={glowVars("#f59e0b")}
          >
            <Target size={12} /> קבע/י מועד גיבוש
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" onPointerMove={onPointerMoveGrid} onPointerUp={onPointerUpGrid} onPointerCancel={onPointerUpGrid}>
        <div className="relative mx-3" style={{ height: 24 * ROW_HEIGHT }}>
          {HOURS.map((h) => (
            <button key={h} onClick={() => openAdd(h)} className="absolute inset-x-0 border-t border-zinc-800/60 hover:bg-zinc-900/40 transition-colors" style={{ top: h * ROW_HEIGHT, height: ROW_HEIGHT }}>
              <span className="absolute left-1 top-0.5 text-[10px] text-zinc-600 w-9 text-center">{String(h).padStart(2, "0")}:00</span>
            </button>
          ))}
          {dayEvents.map((ev) => {
            const isDragging = drag && drag.id === ev.id;
            const minutes = isDragging ? drag.liveMinutes : timeToMinutes(ev.time);
            const top = (minutes / 60) * ROW_HEIGHT;
            const isOfficial = ev.source === "official";
            return (
              <div
                key={ev.id}
                onPointerDown={isOfficial ? undefined : (e) => onPointerDownEvent(e, ev)}
                onClick={isOfficial ? (e) => { e.stopPropagation(); setSelectedEvent(ev); } : undefined}
                className={`absolute right-0 left-12 rounded-lg px-3 py-1.5 overflow-hidden select-none transition-shadow ${
                  isOfficial ? "bg-sky-500/15 border border-sky-500/40 text-sky-100 cursor-pointer" : "bg-amber-500/15 border border-amber-500/40 text-amber-100 cursor-grab active:cursor-grabbing"
                } ${isDragging ? "z-20 shadow-lg shadow-black/50 scale-[1.02] opacity-90" : "z-10"}`}
                style={{ top, minHeight: 44 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{ev.title}</div>
                    <div className="text-[10px] opacity-70 flex items-center gap-1">
                      {ev.time}{ev.endTime ? `-${ev.endTime}` : ""}{ev.location ? ` · ${ev.location}` : ""}
                    </div>
                  </div>
                  {!isOfficial && (
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(ev); }}
                      className="shrink-0 w-5 h-5 rounded-full bg-black/30 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {addPopup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setAddPopup(null)}>
          <div className="w-full sm:max-w-xs bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold text-zinc-200 mb-3">אירוע חדש - {addPopup.time}</div>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="לדוגמה: ריצת 3 קילומטר לבד" className="w-full mb-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
            <input value={newDetail} onChange={(e) => setNewDetail(e.target.value)} placeholder="פירוט (אופציונלי)" className="w-full mb-3 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
            <div className="flex gap-2">
              <GlowButton tone="ghost" className="flex-1" onClick={() => setAddPopup(null)}>ביטול</GlowButton>
              <GlowButton tone="amber" icon={Plus} className="flex-1" disabled={!newTitle.trim()} onClick={saveAdd}>הוסף</GlowButton>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setSelectedEvent(null)}>
          <div className="w-full sm:max-w-xs bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-black text-zinc-100 mb-1">{selectedEvent.title}</div>
            {selectedEvent.detail && <div className="text-xs text-zinc-500 mb-2">{selectedEvent.detail}</div>}
            {selectedEvent.location && <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><MapPin size={11} />{selectedEvent.location}</div>}
            <div className="text-xs text-zinc-600 mb-1">{selectedEvent.time}{selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ""}</div>
            <div className="text-[10px] text-zinc-600 text-center py-1">אימון רשמי - נקבע ע״י המאמן</div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full sm:max-w-xs bg-zinc-950 border border-red-600/30 rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-4">
              <Trash2 size={28} className="text-red-400 mb-2" />
              <div className="text-sm font-black text-zinc-100">למחוק את "{deleteConfirm.title}"?</div>
              <div className="text-xs text-zinc-500 mt-1.5">לא ניתן לשחזר לאחר המחיקה</div>
            </div>
            <div className="flex gap-2">
              <GlowButton tone="ghost" className="flex-1" onClick={() => setDeleteConfirm(null)}>לא</GlowButton>
              <GlowButton tone="red" icon={Trash2} className="flex-1" onClick={() => { removePersonalLog(deleteConfirm.id); setDeleteConfirm(null); }}>כן, מחק</GlowButton>
            </div>
          </div>
        </div>
      )}

      {gibushOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setGibushOpen(false)}>
          <div className="w-full sm:max-w-xs bg-zinc-950 border border-amber-500/30 rounded-t-3xl sm:rounded-3xl p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-black text-amber-400 mb-3 flex items-center gap-1.5"><Target size={16} /> מועד הגיבוש שלי</div>
            <label className="text-[11px] text-zinc-500 font-semibold mb-1.5 block">לאיזה גיבוש?</label>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {GIBUSH_TYPES.map((t) => {
                const c = GIBUSH_TYPE_COLORS[t] || {};
                const sel = gibushTypeInput === t;
                return (
                  <button
                    key={t}
                    onClick={() => setGibushTypeInput(t)}
                    className={`rounded-lg py-2 text-[11px] font-bold border-2 transition ${sel ? "bg-black" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
                    style={sel ? { borderColor: c.hex, color: c.hex } : undefined}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <label className="text-[11px] text-zinc-500 font-semibold mb-1.5 block">תאריך</label>
            <input type="date" value={gibushInput} onChange={(e) => setGibushInput(e.target.value)} className="w-full mb-3 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
            <div className="flex gap-2">
              <GlowButton tone="ghost" className="flex-1" onClick={() => setGibushOpen(false)}>ביטול</GlowButton>
              <GlowButton tone="amber" className="flex-1" disabled={!gibushInput || !gibushTypeInput} onClick={() => { onSetGibushDate(gibushInput, gibushTypeInput); setGibushOpen(false); }}>שמור</GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== CHAT TAB ============================== */

function CoachChat({ warMode, showToast }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: warMode ? "כאן מאמן החירום. איך אני יכול לעזור לך בתוכנית ה-6 שבועות?" : "היי! אני המאמן הטקטי שלך. שאל אותי על תזונה, שינה, פציעות או כל דבר אחר." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const aiConfigured = useSupabase() || Boolean(CONFIG.GEMINI_API_KEY);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const sys = warMode
        ? "אתה מאמן כושר קרבי עילי במצב חירום - הכשרתך מבוססת על מחקר פיזיולוגיית שריר ומדעי הספורט המתקדמים ביותר (ברמה של Stanford ו-Harvard), אך אתה מתרגם אותם לשפה תומכת ותכליתית לבני נוער 16-19 בתוכנית אימון ביתית של 6 שבועות לקראת גיבוש. ענה בעברית קצרה, ברורה, מדעית אך נגישה, בלי ייעוץ רפואי מסוכן."
        : "אתה מאמן כושר קרבי עילי, מקצועי ותומך, שמבסס את שיטת האימון שלו על מחקר פיזיולוגיית שריר ומדעי ביצועי ספורט ברמה אקדמית מהמובילות בעולם (Stanford, Harvard) - אך מסביר זאת בפשטות ובגובה העיניים לבני נוער 16-19 המתכוננים לגיבושים צבאיים. ענה בעברית, בקצרה, בלי ייעוץ רפואי מסוכן.";
      const reply = await aiChat(sys, text);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      if (aiConfigured) showToast(`שגיאת AI: ${e.message || "לא ידוע"} - מוצגת תשובה מקומית`, "info");
      await new Promise((r) => setTimeout(r, 300));
      setMessages((m) => [...m, { role: "assistant", text: localCoachReply(text) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-3.5 py-2.5 rounded-xl border-r-[3px] ${
              m.role === "user"
                ? "bg-zinc-900/60 border-zinc-600"
                : warMode
                ? "bg-red-950/30 border-red-500"
                : "bg-emerald-500/[0.06] border-emerald-500"
            }`}
          >
            <div className={`text-[10px] font-bold mb-1 ${m.role === "user" ? "text-zinc-500" : warMode ? "text-red-400" : "text-emerald-400"}`}>
              {m.role === "user" ? "אתה" : warMode ? "מאמן חירום" : "מאמן טקטי"}
            </div>
            <div className="text-sm text-zinc-200 leading-relaxed break-words">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className={`px-3.5 py-2.5 rounded-xl border-r-[3px] ${warMode ? "bg-red-950/30 border-red-500" : "bg-emerald-500/[0.06] border-emerald-500"} flex items-center gap-1.5 text-zinc-500 text-xs`}>
            <Loader2 size={13} className="animate-spin" /> מקליד...
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-zinc-800 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="הקלד הודעה..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300"
        />
        <button onClick={send} disabled={loading || !input.trim()} className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 ${warMode ? "bg-red-600" : "bg-emerald-500"}`}>
          <Send size={16} className={warMode ? "text-white" : "text-black"} />
        </button>
      </div>
    </div>
  );
}

function ProgramWizard({ profile, showToast }) {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const goals = ["הכנה לגיבוש ספציפי", "לפני גיוס", "מתחילים מאפס לקרבי"];

  async function generate() {
    setLoading(true);
    try {
      const sys = "אתה בונה תוכניות אימון קרבי עילי לבני נוער 16-19 לקראת גיבושים, בהתבסס על עקרונות פיזיולוגיית שריר ומדעי ביצועי ספורט ברמה אקדמית מובילה (Stanford, Harvard) - אך מתרגם אותם לתוכנית פשוטה וברורה. החזר תוכנית בת 4 שבועות בעברית, קצרה וברורה, בפורמט רשימה, בלי ייעוץ רפואי.";
      const prompt = `מטרה: ${goal}. יעד: ${profile?.targetUnitName || "כללי"}. רמה: ${profile?.level || "מתקדם"}. בנה תוכנית 4 שבועות.`;
      const text = await aiChat(sys, prompt);
      setResult({ ai: true, text });
    } catch (e) {
      setResult({ ai: false, plan: generateMockProgram(goal, profile?.targetUnitName, profile?.level) });
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="p-4 space-y-3 overflow-y-auto h-full">
        <SectionTitle icon={Award} tone="emerald">התוכנית שלך</SectionTitle>
        {result.ai ? (
          <Card className="p-4 text-sm text-zinc-200 whitespace-pre-line leading-relaxed">{result.text}</Card>
        ) : (
          result.plan.map((w) => (
            <Card key={w.week} className="p-3.5">
              <div className="text-sm font-black text-emerald-400 mb-1.5">{w.title}</div>
              <ul className="space-y-1">
                {w.items.map((it, idx) => (
                  <li key={idx} className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> {it}
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
        <GlowButton tone="ghost" className="w-full" onClick={() => { setResult(null); setGoal(""); }}>בנה תוכנית חדשה</GlowButton>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <SectionTitle icon={Target}>מה המטרה שלך הפעם?</SectionTitle>
      <div className="space-y-2 flex-1">
        {goals.map((g) => (
          <button key={g} onClick={() => setGoal(g)} className={`w-full text-right rounded-xl px-4 py-3 text-sm font-bold border transition ${goal === g ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-300"}`}>
            {g}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-zinc-600 mb-2">התוכנית תותאם ליעד שלך: {profile?.targetUnitName || "—"} ולרמה: {profile?.level || "—"}</div>
      <GlowButton tone="emerald" icon={loading ? Loader2 : Zap} className="w-full" disabled={!goal || loading} onClick={generate}>
        {loading ? "בונה תוכנית..." : "בנה תוכנית"}
      </GlowButton>
    </div>
  );
}

function ChatTab({ warMode, showToast, profile }) {
  const [mode, setMode] = useState("coach");
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex gap-2">
        <button onClick={() => setMode("coach")} className={`flex-1 rounded-xl py-2 text-xs font-bold border ${mode === "coach" ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>מאמן אישי</button>
        <button onClick={() => setMode("wizard")} className={`flex-1 rounded-xl py-2 text-xs font-bold border ${mode === "wizard" ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>בונה תוכנית אימונים</button>
      </div>
      <div className="flex-1 overflow-hidden">
        {mode === "coach" ? <CoachChat warMode={warMode} showToast={showToast} /> : <ProgramWizard profile={profile} showToast={showToast} />}
      </div>
    </div>
  );
}

/* ============================== HUB TAB ============================== */

function HubTab({ articles }) {
  const [view, setView] = useState("main"); // 'main' | 'יחידות' | 'גיבושים' | 'ערכים'
  const [pageContent, setPageContent] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [openArticle, setOpenArticle] = useState(null);
  const [openUnit, setOpenUnit] = useState(null);
  const [openGibush, setOpenGibush] = useState(null);

  async function openView(v) {
    setView(v);
    setLoadingPage(true);
    const content = await loadContentRemote("unit_info", v);
    setPageContent(content);
    setLoadingPage(false);
  }

  if (view === "יחידות") {
    return (
      <div className="p-4">
        <button onClick={() => setView("main")} className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-sm font-bold mb-4">
          <ChevronRight size={16} /> חזרה למאגר
        </button>
        <SectionTitle icon={Shield}>יחידות עילית</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {UNITS.map((u) => (
            <button key={u.id} onClick={() => setOpenUnit(u)} className="flex flex-col items-center gap-2 active:scale-95 transition">
              <div className="w-16 h-16 rounded-full bg-black border-2 flex items-center justify-center glow-pulse" style={{ borderColor: u.hex, ...glowVars(u.hex) }}>
                <Shield size={26} style={{ color: u.hex }} />
              </div>
              <span className="text-[11px] font-bold text-zinc-300 text-center leading-tight">{u.name}</span>
            </button>
          ))}
        </div>

        {openUnit && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setOpenUnit(null)}>
            <div className="w-full sm:max-w-sm bg-zinc-950 border-2 rounded-t-3xl sm:rounded-3xl p-5" style={{ borderColor: openUnit.hex }} onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-black border-2 flex items-center justify-center mb-3 glow-pulse" style={{ borderColor: openUnit.hex, ...glowVars(openUnit.hex) }}>
                  <Shield size={32} style={{ color: openUnit.hex }} />
                </div>
                <div className="text-lg font-black text-zinc-100">{openUnit.name}</div>
                <div className="text-sm font-bold mt-1" style={{ color: openUnit.hex }}>{openUnit.tagline}</div>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl p-3">{openUnit.req}</div>
              <button onClick={() => setOpenUnit(null)} className="w-full mt-4 text-center text-xs text-zinc-500 hover:text-zinc-300">סגור</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === "גיבושים") {
    return (
      <div className="p-4">
        <button onClick={() => setView("main")} className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-sm font-bold mb-4">
          <ChevronRight size={16} /> חזרה למאגר
        </button>
        <SectionTitle icon={Target} tone="amber">פורטל גיבושים</SectionTitle>
        {loadingPage ? (
          <div className="text-center py-10 text-xs text-zinc-600">טוען...</div>
        ) : (
          <div className="space-y-1.5">
            {GIBUSHIM_LIST.map((name) => {
              const c = pageContent.find((x) => x.title === name);
              return (
                <button key={name} onClick={() => c && setOpenGibush(c)} className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition ${c ? "bg-zinc-900 border-amber-500/30 hover:border-amber-500/60 active:scale-[0.98]" : "bg-zinc-950 border-zinc-800 opacity-50"}`}>
                  <span className="text-sm font-bold text-zinc-200">{name}</span>
                  {c ? <ChevronLeft size={16} className="text-amber-400" /> : <span className="text-[10px] text-zinc-600">אין עדיין מידע</span>}
                </button>
              );
            })}
          </div>
        )}

        {openGibush && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setOpenGibush(null)}>
            <div className="w-full sm:max-w-sm bg-zinc-950 border border-amber-500/30 rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
              <div className="text-base font-black text-zinc-100 mb-1">{openGibush.title}</div>
              {openGibush.dateLabel && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-400 mb-3">
                  <Clock size={12} /> מועד: {openGibush.dateLabel}
                </div>
              )}
              <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{openGibush.body}</div>
              <button onClick={() => setOpenGibush(null)} className="w-full mt-4 text-center text-xs text-zinc-500 hover:text-zinc-300">סגור</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === "ערכים") {
    return (
      <div className="p-4">
        <button onClick={() => setView("main")} className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-sm font-bold mb-4">
          <ChevronRight size={16} /> חזרה למאגר
        </button>
        <SectionTitle icon={Star}>תוכן ערכי לקראת השירות</SectionTitle>
        {loadingPage ? (
          <div className="text-center py-10 text-xs text-zinc-600">טוען...</div>
        ) : pageContent.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-600 bg-zinc-950 border border-zinc-800 rounded-xl">
            אין עדיין תוכן כאן - יתווסף דרך Supabase
          </div>
        ) : (
          <div className="space-y-2.5">
            {pageContent.map((c) => (
              <Card key={c.id} className="p-3.5">
                <div className="text-sm font-black text-zinc-100 mb-1">{c.title}</div>
                <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">{c.body}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={() => openView("יחידות")} className="rounded-2xl py-6 text-center bg-zinc-900 border border-zinc-800 active:scale-95 transition">
          <Shield size={20} className="text-emerald-400 mx-auto mb-1.5" />
          <div className="text-sm font-bold text-zinc-200">יחידות</div>
        </button>
        <button onClick={() => openView("גיבושים")} className="rounded-2xl py-6 text-center bg-zinc-900 border border-zinc-800 active:scale-95 transition">
          <Target size={20} className="text-amber-400 mx-auto mb-1.5" />
          <div className="text-sm font-bold text-zinc-200">גיבושים</div>
        </button>
      </div>
      <button onClick={() => openView("ערכים")} className="w-full rounded-2xl py-6 text-center bg-zinc-900 border border-zinc-800 active:scale-95 transition">
        <Star size={20} className="text-sky-400 mx-auto mb-1.5" />
        <div className="text-sm font-bold text-zinc-200">תוכן ערכי לקראת השירות</div>
      </button>

      <div>
        <SectionTitle icon={Newspaper} tone="amber">עיתון טיפים</SectionTitle>
        {articles.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-600 bg-zinc-950 border border-zinc-800 rounded-xl">אין עדיין כתבות</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {articles.map((a, i) => {
              const unitObj = UNITS.find((u) => u.name === a.unit || u.id === a.unit);
              const hex = unitObj?.hex || ["#10b981", "#f59e0b", "#38bdf8", "#f87171"][i % 4];
              return (
                <button key={a.id} onClick={() => setOpenArticle(a)} className="text-right rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition active:scale-95">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt="" className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${hex}33, ${hex}0a)` }}>
                      <Newspaper size={30} style={{ color: hex }} />
                    </div>
                  )}
                  <div className="p-2.5">
                    <div className="text-xs font-black text-zinc-100 line-clamp-2 leading-tight">{a.title}</div>
                    <div className="text-[10px] text-zinc-600 mt-1">{a.unit}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openArticle && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setOpenArticle(null)}>
          <div className="w-full sm:max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {openArticle.imageUrl ? (
              <img src={openArticle.imageUrl} alt="" className="w-full h-40 object-cover shrink-0" />
            ) : (
              <div className="w-full h-32 flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${(UNITS.find((u) => u.name === openArticle.unit)?.hex || "#10b981")}33, transparent)` }}>
                <Newspaper size={40} className="text-emerald-400" />
              </div>
            )}
            <div className="p-5 overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-xl font-black text-zinc-100 leading-tight">{openArticle.title}</span>
                <button onClick={() => setOpenArticle(null)} className="text-zinc-500 hover:text-zinc-300 shrink-0 mt-1"><X size={18} /></button>
              </div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
                <Pill tone="amber">{openArticle.unit}</Pill>
                {openArticle.author && <span className="text-[11px] text-zinc-500 font-semibold">מאת {openArticle.author}</span>}
              </div>
              <div className="text-[15px] text-zinc-200 leading-8 whitespace-pre-line font-medium">{openArticle.excerpt}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== PROFILE TAB ============================== */

function ProfileTab({ user, setCurrentUser, showToast, onLogout }) {
  const profile = user.profile || {};
  const targetUnitObj = UNITS.find((u) => u.id === profile.targetUnit);
  const [warConfirmOpen, setWarConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [gibushDraftType, setGibushDraftType] = useState("");
  const [gibushDraftDate, setGibushDraftDate] = useState("");

  async function updateProfile(patch) {
    const newProfile = { ...profile, ...patch };
    const newUser = { ...user, profile: newProfile };
    setCurrentUser(newUser);
    try {
      await saveUserProfile(newUser);
    } catch (e) {
      showToast("שגיאה בשמירה", "error");
    }
  }

  function toggleIssue(opt) {
    const list = profile.healthIssues || [];
    const next = list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt];
    updateProfile({ healthIssues: next });
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <SectionTitle icon={User}>נתונים אישיים</SectionTitle>
        <div className="mb-3">
          <label className="text-[10px] text-zinc-500 font-semibold">שם מלא</label>
          <input value={profile.fullName || ""} onChange={(e) => updateProfile({ fullName: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[["גיל", "age", ""], ["גובה", "height", "ס״מ"], ["משקל", "weight", 'ק"ג']].map(([label, key, unit]) => (
            <div key={key}>
              <label className="text-[10px] text-zinc-500 font-semibold">{label}</label>
              <input type="number" value={profile[key] || 0} onChange={(e) => updateProfile({ [key]: Number(e.target.value) })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-100 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
              {unit && <div className="text-[9px] text-zinc-600 mt-0.5">{unit}</div>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle icon={HeartPulse} tone="red">בדיקה רפואית</SectionTitle>
        <div className="flex gap-2">
          <button onClick={() => updateProfile({ healthy: true })} className={`flex-1 rounded-xl py-2.5 text-sm font-bold border ${profile.healthy ? "bg-emerald-500/15 border-emerald-500 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>בריא/ה</button>
          <button onClick={() => updateProfile({ healthy: false })} className={`flex-1 rounded-xl py-2.5 text-sm font-bold border ${!profile.healthy ? "bg-red-500/15 border-red-500 text-red-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>לא בריא/ה</button>
        </div>
        {!profile.healthy && (
          <div className="mt-2.5">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {HEALTH_OPTIONS.map((opt) => (
                <button key={opt} onClick={() => toggleIssue(opt)} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${(profile.healthIssues || []).includes(opt) ? "bg-red-500/15 border-red-500 text-red-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
                  {opt}
                </button>
              ))}
            </div>
            {(profile.healthIssues || []).includes("אחר") && (
              <textarea value={profile.healthOtherNote || ""} onChange={(e) => updateProfile({ healthOtherNote: e.target.value })} placeholder="פרט/י..." rows={2} className="w-full bg-zinc-950 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none" />
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle icon={Target} tone="amber">יעד קרבי</SectionTitle>
        {targetUnitObj && (
          <div className={`rounded-2xl px-4 py-4 bg-zinc-950 border-2 ${targetUnitObj.border} flex items-center justify-between`}>
            <div>
              <div className={`text-base font-black ${targetUnitObj.text}`}>{targetUnitObj.name}</div>
              <div className="text-[11px] text-zinc-500">{targetUnitObj.tagline}</div>
            </div>
            <Lock size={16} className="text-zinc-600" />
          </div>
        )}
        <div className="text-[10px] text-zinc-600 mt-2">היעד נקבע בהרשמה ואינו ניתן לשינוי עצמי</div>
      </Card>

      <Card className="p-4">
        <SectionTitle icon={GaugeIcon}>רמת כושר</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {TIERS.map((t) => (
            <button key={t} onClick={() => updateProfile({ level: t })} className={`rounded-full px-3 py-1.5 text-[11px] font-bold border transition-all duration-300 ${profile.level === t ? "bg-amber-500/15 border-amber-500 text-amber-400 scale-105" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle icon={Users}>צוות</SectionTitle>
        <div className="rounded-2xl px-4 py-4 bg-zinc-950 border-2 border-zinc-700 flex items-center justify-between">
          <div className="text-base font-black text-zinc-100">צוות {profile.teamCode || "—"}</div>
          <Lock size={16} className="text-zinc-600" />
        </div>
        <div className="text-[10px] text-zinc-600 mt-2">הצוות אומת בהרשמה עם קוד ואינו ניתן לשינוי עצמי</div>
      </Card>

      <Card className="p-4">
        <SectionTitle icon={Clock} tone="amber">מועד גיבוש</SectionTitle>
        {profile.gibushDate ? (
          <div
            className="rounded-2xl px-4 py-4 bg-black border-2 flex items-center justify-between"
            style={{ borderColor: (GIBUSH_TYPE_COLORS[profile.gibushType] || {}).hex || "#f59e0b" }}
          >
            <div>
              <div className="text-base font-black" style={{ color: (GIBUSH_TYPE_COLORS[profile.gibushType] || {}).hex || "#f59e0b" }}>{profile.gibushType}</div>
              <div className="text-[11px] text-zinc-500">{new Date(`${profile.gibushDate}T00:00:00`).toLocaleDateString("he-IL")}</div>
            </div>
            <Lock size={16} className="text-zinc-600" />
          </div>
        ) : (
          <>
            <label className="text-[10px] text-zinc-500 font-semibold mb-1.5 block">לאיזה גיבוש?</label>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {GIBUSH_TYPES.map((t) => {
                const c = GIBUSH_TYPE_COLORS[t] || {};
                const sel = gibushDraftType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setGibushDraftType(t)}
                    className={`rounded-lg py-2 text-[11px] font-bold border-2 transition ${sel ? "bg-black" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
                    style={sel ? { borderColor: c.hex, color: c.hex } : undefined}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <label className="text-[10px] text-zinc-500 font-semibold mb-1.5 block">תאריך</label>
            <input type="date" value={gibushDraftDate} onChange={(e) => setGibushDraftDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
            <div className="text-[10px] text-zinc-600 mt-2 mb-3">שימו לב - לאחר השמירה לא ניתן יהיה לשנות</div>
            <GlowButton tone="amber" className="w-full" disabled={!gibushDraftDate || !gibushDraftType} onClick={() => updateProfile({ gibushDate: gibushDraftDate, gibushType: gibushDraftType })}>
              שמור סופית
            </GlowButton>
          </>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle icon={GaugeIcon}>הגדרות</SectionTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-zinc-200 flex items-center gap-1.5"><Siren size={14} className={profile.warMode ? "text-red-400" : "text-zinc-500"} /> מצב מלחמה</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">כשמופעל, דף הבית מוצג מלא בתוכנית החירום</div>
            </div>
            <button
              onClick={() => (profile.warMode ? updateProfile({ warMode: false }) : setWarConfirmOpen(true))}
              className={`w-12 h-7 rounded-full relative transition-colors ${profile.warMode ? "bg-red-600" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${profile.warMode ? "right-0.5" : "right-5.5"}`} style={{ right: profile.warMode ? 2 : 22 }} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div>
              <div className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                {profile.lightMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-zinc-500" />} מצב תצוגה
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{profile.lightMode ? "בהיר" : "כהה"}</div>
            </div>
            <button
              onClick={() => updateProfile({ lightMode: !profile.lightMode })}
              className={`w-12 h-7 rounded-full relative transition-colors ${profile.lightMode ? "bg-amber-500" : "bg-zinc-700"}`}
            >
              <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all" style={{ right: profile.lightMode ? 2 : 22 }} />
            </button>
          </div>
        </div>
      </Card>

      <GlowButton tone="ghost" icon={LogOut} className="w-full" onClick={() => setLogoutConfirmOpen(true)}>
        התנתקות
      </GlowButton>

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setLogoutConfirmOpen(false)}>
          <div className="w-full sm:max-w-xs bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-4">
              <LogOut size={28} className="text-zinc-400 mb-2" />
              <div className="text-sm font-black text-zinc-100">האם אתה בטוח שאתה רוצה לצאת מהמערכת?</div>
            </div>
            <div className="flex gap-2">
              <GlowButton tone="ghost" className="flex-1" onClick={() => setLogoutConfirmOpen(false)}>לא</GlowButton>
              <GlowButton tone="red" icon={LogOut} className="flex-1" onClick={onLogout}>כן</GlowButton>
            </div>
          </div>
        </div>
      )}

      {warConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setWarConfirmOpen(false)}>
          <div className="w-full sm:max-w-xs bg-zinc-950 border border-red-600/40 rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-4">
              <Siren size={28} className="text-red-400 mb-2" />
              <div className="text-sm font-black text-zinc-100">להפעיל מצב מלחמה?</div>
              <div className="text-xs text-zinc-500 mt-1.5">דף הבית שלך יוצג מלא בתוכנית חירום של 6 שבועות. אפשר לכבות בחזרה בכל רגע מכאן.</div>
            </div>
            <div className="flex gap-2">
              <GlowButton tone="ghost" className="flex-1" onClick={() => setWarConfirmOpen(false)}>ביטול</GlowButton>
              <GlowButton tone="red" icon={Siren} className="flex-1" onClick={() => { updateProfile({ warMode: true }); setWarConfirmOpen(false); }}>כן, בטוח/ה</GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== ATTENDANCE TAB (TEAM LEADER) ============================== */

function AttendanceTab({ users, currentUser, officialEvents, showToast }) {
  const myTeamId = currentUser.profile?.teamCode || "";
  const [cadets, setCadets] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const todayEvent = officialEvents.find((e) => e.date === toKey(new Date()));

  useEffect(() => {
    const registered = users
      .filter((u) => u.role === "trainee" && u.onboarded && u.profile?.teamCode === myTeamId)
      .map((u) => ({ id: u.id, name: u.profile?.fullName || u.email.split("@")[0], present: false }));
    setCadets(registered);
    setLoadingRoster(false);
  }, [users, myTeamId]);

  const presentCount = cadets.filter((c) => c.present).length;
  const pct = cadets.length ? Math.round((presentCount / cadets.length) * 100) : 0;

  async function submit() {
    setSubmitting(true);
    try {
      const dateKey = toKey(new Date());
      await submitAttendanceRemote({ teamId: myTeamId, eventId: todayEvent.id, date: dateKey, percentage: pct });
      await submitIndividualAttendanceRemote(
        cadets.map((c) => ({ id: `${todayEvent.id}_${c.id}`, eventId: todayEvent.id, date: dateKey, teamId: myTeamId, userId: c.id, present: c.present }))
      );
      showToast("נוכחות נשמרה בהצלחה", "success");
    } catch (e) {
      showToast("שגיאה בשמירה", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!todayEvent) {
    return (
      <div className="p-4">
        <Card className="p-6 text-center">
          <ClipboardCheck size={28} className="text-zinc-600 mx-auto mb-2" />
          <div className="text-sm text-zinc-400">אין אימון רשמי היום</div>
          <div className="text-xs text-zinc-600 mt-1">נוכחות ניתן לרשום רק כשהמאמן פרסם אימון לתאריך הנוכחי</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <SectionTitle icon={ClipboardCheck} tone="amber">נוכחות - {todayEvent.title} {myTeamId && `(צוות ${myTeamId})`}</SectionTitle>
        <div className="text-[10px] text-zinc-600 mb-3">הרשימה כוללת רק חניכים רשומים באמת בצוות שלך - אין אפשרות להוסיף שמות ידנית</div>
        {loadingRoster ? (
          <div className="text-center py-4 text-xs text-zinc-600">טוען...</div>
        ) : cadets.length === 0 ? (
          <div className="text-center py-4 text-xs text-zinc-600">אין עדיין חניכים רשומים בצוות שלך</div>
        ) : (
          <div className="space-y-1.5">
            {cadets.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                <button onClick={() => setCadets((cs) => cs.map((x) => (x.id === c.id ? { ...x, present: !x.present } : x)))} className="flex items-center gap-2 flex-1">
                  <span className={`w-5 h-5 rounded flex items-center justify-center border ${c.present ? "bg-emerald-500 border-emerald-500" : "border-zinc-600"}`}>
                    {c.present && <Check size={13} className="text-black" />}
                  </span>
                  <span className="text-sm text-zinc-200">{c.name}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-zinc-300">אחוז נוכחות</span>
          <span className="text-2xl font-black text-emerald-400">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-3"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
        <GlowButton tone="emerald" icon={submitting ? Loader2 : Send} className="w-full" disabled={submitting || cadets.length === 0} onClick={submit}>
          {submitting ? "שולח..." : "שלח נוכחות"}
        </GlowButton>
      </Card>
    </div>
  );
}

/* ============================== MANAGEMENT TAB (ADMIN) ============================== */

const CONTENT_CATEGORIES = [
  { id: "tip_article", label: "עיתון טיפים" },
  { id: "training_pool", label: "מאגר אימונים" },
  { id: "unit_info", label: "מידע יחידות/גיבושים" },
];
const TRAINING_SUBCATS = TRAINING_BANK.map((b) => [b.id, b.title]);
const UNIT_INFO_SUBCATS = [["יחידות", "יחידות"], ["גיבושים", "גיבושים"], ["ערכים", "ערכים"]];

/* ============================== COACH HOME (teams, members, push training, appoint leaders) ============================== */

function CoachHomeTab({ users, toggleTeamLeader, toggleAdmin, addOfficialEvent, showToast, onLogout }) {
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [openTeam, setOpenTeam] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [eventForm, setEventForm] = useState({ date: "", title: "", time: "", endTime: "", location: "" });
  const [pushing, setPushing] = useState(false);
  const [injectForm, setInjectForm] = useState(null); // { date, time, title, detail }
  const [injecting, setInjecting] = useState(false);

  const roster = users.filter((u) => u.role !== "admin");
  const teamGroups = TEAM_LIST.map((t) => ({ ...t, members: roster.filter((u) => u.onboarded && u.profile?.teamCode === t.id) }));

  function leaderCountFor(teamId) {
    return roster.filter((u) => u.profile?.teamCode === teamId && u.role === "team_leader").length;
  }

  async function injectWorkout(member) {
    if (!injectForm?.date || !injectForm?.title?.trim()) { showToast("נא למלא תאריך וכותרת", "error"); return; }
    setInjecting(true);
    try {
      await addPersonalLogRemote(member.id, { id: Date.now(), date: injectForm.date, time: injectForm.time || "", title: injectForm.title.trim(), detail: injectForm.detail?.trim() || "" });
      showToast("האימון נוסף ליומן האישי של החניך/ה", "success");
      setInjectForm(null);
    } catch (e) {
      showToast("שגיאה בהוספה", "error");
    } finally {
      setInjecting(false);
    }
  }

  function handleMakeLeader(member) {
    const teamId = member.profile?.teamCode;
    if (member.role !== "team_leader" && leaderCountFor(teamId) >= 3) {
      showToast("הגעתם למכסה של 3 ראשי צוות לצוות זה", "error");
      return;
    }
    toggleTeamLeader(member.id);
    setViewingMember((prev) => (prev ? { ...prev, role: prev.role === "team_leader" ? "trainee" : "team_leader" } : prev));
  }

  function pushEvent() {
    if (!eventForm.date || !eventForm.title.trim()) { showToast("נא למלא תאריך וכותרת", "error"); return; }
    setPushing(true);
    addOfficialEvent({ id: Date.now(), ...eventForm });
    setEventForm({ date: "", title: "", time: "", endTime: "", location: "" });
    setPushing(false);
    showToast("האימון נוסף ליומני כל החניכים", "success");
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-black text-zinc-100">בית - מאמן</div>

      <Card className="p-4">
        <SectionTitle icon={Users} tone="red">צוותים</SectionTitle>
        <div className="space-y-1.5">
          {teamGroups.map((t) => (
            <div key={t.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              <button onClick={() => setOpenTeam(openTeam === t.id ? null : t.id)} className="w-full flex items-center justify-between px-3.5 py-2.5">
                <span className="text-sm font-bold text-zinc-200">{t.label}</span>
                <div className="flex items-center gap-2">
                  <Pill tone="zinc">{t.members.length} חברים</Pill>
                  <ChevronDown size={14} className={`text-zinc-500 transition ${openTeam === t.id ? "rotate-180" : ""}`} />
                </div>
              </button>
              {openTeam === t.id && (
                <div className="px-3 pb-3 space-y-1">
                  {t.members.length === 0 ? (
                    <div className="text-[11px] text-zinc-600 px-1">אין עדיין חברים בצוות זה</div>
                  ) : (
                    t.members.map((m) => (
                      <button key={m.id} onClick={() => { setViewingMember(m); setInjectForm(null); }} className="w-full flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2 hover:border-red-500/40 border border-transparent transition">
                        <span className="text-xs font-bold text-zinc-300">{m.profile?.fullName || m.email}</span>
                        {m.role === "team_leader" && <Pill tone="amber">ראש צוות</Pill>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle icon={CalendarDays} tone="amber">פרסום אימון שבועי ליומני החניכים</SectionTitle>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
          <input placeholder="שעת התחלה" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
          <input placeholder="שעת סיום" value={eventForm.endTime} onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })} className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
        </div>
        <div className="text-[10px] text-zinc-600 mb-2">משוב האימון ייפתח לחניכים 3 שעות מרגע הסיום</div>
        <input placeholder="סוג אימון (לדוגמה: דיונות)" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="w-full mb-2 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
        <input placeholder="מיקום" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} className="w-full mb-2 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
        <GlowButton tone="amber" icon={pushing ? Loader2 : Plus} className="w-full" disabled={pushing} onClick={pushEvent}>הוסף ליומן כל החניכים</GlowButton>
      </Card>

      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => { setViewingMember(null); setInjectForm(null); }}>
          <div className="w-full sm:max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black text-zinc-100">{viewingMember.profile?.fullName || viewingMember.email}</div>
              <button onClick={() => { setViewingMember(null); setInjectForm(null); }} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-2 text-xs text-zinc-400 mb-4">
              <div className="flex justify-between border-b border-zinc-900 pb-1.5"><span className="text-zinc-600">אימייל</span><span dir="ltr">{viewingMember.email}</span></div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5"><span className="text-zinc-600">גיל</span><span>{viewingMember.profile?.age || "—"}</span></div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5"><span className="text-zinc-600">גובה / משקל</span><span>{viewingMember.profile?.height || "—"} ס״מ / {viewingMember.profile?.weight || "—"} ק״ג</span></div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5"><span className="text-zinc-600">רמת כושר</span><span>{viewingMember.profile?.level || "—"}</span></div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5"><span className="text-zinc-600">יעד קרבי</span><span>{viewingMember.profile?.targetUnitName || "—"}</span></div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5"><span className="text-zinc-600">בעיות בריאות</span><span>{(viewingMember.profile?.healthIssues || []).join(", ") || "אין"}</span></div>
              <div className="flex justify-between border-b border-zinc-900 pb-1.5"><span className="text-zinc-600">צוות</span><span>{viewingMember.profile?.teamCode || "—"}</span></div>
              {viewingMember.profile?.gibushDate && (
                <div className="flex justify-between border-b border-zinc-900 pb-1.5"><span className="text-zinc-600">{viewingMember.profile?.gibushType}</span><span>{viewingMember.profile.gibushDate}</span></div>
              )}
            </div>

            {injectForm ? (
              <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-3 mb-2 space-y-2">
                <div className="text-xs font-bold text-emerald-400">הוספת אימון ליומן האישי</div>
                <input type="date" value={injectForm.date} onChange={(e) => setInjectForm({ ...injectForm, date: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                <input placeholder="שעה (אופציונלי)" value={injectForm.time} onChange={(e) => setInjectForm({ ...injectForm, time: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                <input placeholder="כותרת האימון" value={injectForm.title} onChange={(e) => setInjectForm({ ...injectForm, title: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                <input placeholder="פירוט (אופציונלי)" value={injectForm.detail} onChange={(e) => setInjectForm({ ...injectForm, detail: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                <div className="flex gap-2">
                  <GlowButton tone="ghost" className="flex-1" onClick={() => setInjectForm(null)}>ביטול</GlowButton>
                  <GlowButton tone="emerald" icon={injecting ? Loader2 : Plus} className="flex-1" disabled={injecting} onClick={() => injectWorkout(viewingMember)}>הוסף</GlowButton>
                </div>
              </div>
            ) : (
              <GlowButton tone="emerald" icon={Plus} className="w-full mb-2" onClick={() => setInjectForm({ date: toKey(new Date()), time: "", title: "", detail: "" })}>
                הוסף אימון ליומן החניך/ה
              </GlowButton>
            )}

            <GlowButton tone={viewingMember.role === "team_leader" ? "ghost" : "amber"} icon={ClipboardCheck} className="w-full mb-2" onClick={() => handleMakeLeader(viewingMember)}>
              {viewingMember.role === "team_leader" ? "הסר מתפקיד ראש צוות" : "סמן כראש צוות"}
            </GlowButton>
            <button onClick={() => toggleAdmin(viewingMember.id)} className="w-full text-center text-[11px] text-red-400/70 hover:text-red-400 py-1">
              מנה למאמן
            </button>
          </div>
        </div>
      )}

      <GlowButton tone="ghost" icon={LogOut} className="w-full" onClick={() => setLogoutConfirmOpen(true)}>
        התנתקות
      </GlowButton>

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setLogoutConfirmOpen(false)}>
          <div className="w-full sm:max-w-xs bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-4">
              <LogOut size={28} className="text-zinc-400 mb-2" />
              <div className="text-sm font-black text-zinc-100">האם אתה בטוח שאתה רוצה לצאת מהמערכת?</div>
            </div>
            <div className="flex gap-2">
              <GlowButton tone="ghost" className="flex-1" onClick={() => setLogoutConfirmOpen(false)}>לא</GlowButton>
              <GlowButton tone="red" icon={LogOut} className="flex-1" onClick={onLogout}>כן</GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== COACH CALENDARS (trainee monitoring by team) ============================== */

function CoachCalendarsTab({ users }) {
  const [openTeam, setOpenTeam] = useState(null);
  const [viewingTrainee, setViewingTrainee] = useState(null);
  const [traineeLogs, setTraineeLogs] = useState([]);
  const [loadingTraineeLogs, setLoadingTraineeLogs] = useState(false);

  const roster = users.filter((u) => u.role !== "admin" && u.onboarded);
  const teamGroups = TEAM_LIST.map((t) => ({ ...t, members: roster.filter((u) => u.profile?.teamCode === t.id) }));

  async function openTraineeCalendar(trainee) {
    setViewingTrainee(trainee);
    setLoadingTraineeLogs(true);
    const logs = await loadPersonalLogsRemote(trainee.id);
    setTraineeLogs(logs.sort((a, b) => (a.date < b.date ? 1 : -1)));
    setLoadingTraineeLogs(false);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-black text-zinc-100">יומני מתאמנים</div>
      <div className="text-[11px] text-zinc-600 -mt-2">בדיקת עומס אימונים אישי לפי צוות - לזיהוי מתאמנים שמתאמנים יותר מדי</div>

      <div className="space-y-1.5">
        {teamGroups.map((t) => (
          <Card key={t.id} className="overflow-hidden p-0">
            <button onClick={() => setOpenTeam(openTeam === t.id ? null : t.id)} className="w-full flex items-center justify-between px-3.5 py-2.5">
              <span className="text-sm font-bold text-zinc-200">{t.label}</span>
              <div className="flex items-center gap-2">
                <Pill tone="zinc">{t.members.length} חברים</Pill>
                <ChevronDown size={14} className={`text-zinc-500 transition ${openTeam === t.id ? "rotate-180" : ""}`} />
              </div>
            </button>
            {openTeam === t.id && (
              <div className="px-3 pb-3 space-y-1">
                {t.members.length === 0 ? (
                  <div className="text-[11px] text-zinc-600 px-1">אין עדיין חברים בצוות זה</div>
                ) : (
                  t.members.map((m) => (
                    <button key={m.id} onClick={() => openTraineeCalendar(m)} className="w-full flex items-center justify-between bg-zinc-950 rounded-lg px-3 py-2 hover:border-red-500/40 border border-zinc-800 transition">
                      <span className="text-xs font-bold text-zinc-300">{m.profile?.fullName || m.email}</span>
                      <CalendarDays size={13} className="text-zinc-600" />
                    </button>
                  ))
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {viewingTrainee && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl" onClick={() => setViewingTrainee(null)}>
          <div className="w-full sm:max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black text-zinc-100">{viewingTrainee.profile?.fullName || viewingTrainee.email}</div>
              <button onClick={() => setViewingTrainee(null)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            {loadingTraineeLogs ? (
              <div className="text-center py-6 text-xs text-zinc-600">טוען...</div>
            ) : traineeLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-600">המתאמן/ת עדיין לא הוסיף/ה אירועים אישיים ליומן</div>
            ) : (
              <div className="space-y-1.5">
                {traineeLogs.map((l) => (
                  <div key={l.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">{l.title}</span>
                      <span className="text-[10px] text-zinc-500">{l.date} {l.time || ""}</span>
                    </div>
                    {l.detail && <div className="text-[11px] text-zinc-500 mt-0.5">{l.detail}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== COACH FEEDBACK (attendance %, end-of-training feedback, monthly leaderboard) ============================== */

function CoachFeedbackTab({ users, officialEvents, showToast }) {
  const [openEventId, setOpenEventId] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [attendanceReports, setAttendanceReports] = useState([]);
  const [individualAttendance, setIndividualAttendance] = useState([]);

  useEffect(() => {
    (async () => {
      setFeedbackList(await loadFeedbackRemote());
      setLoadingFeedback(false);
      setAttendanceReports(await loadAttendanceReportsRemote());
      setIndividualAttendance(await loadAllIndividualAttendance());
    })();
  }, []);

  async function approveFeedback(id) {
    await approveFeedbackRemote(id);
    setFeedbackList((prev) => prev.map((f) => (f.id === id ? { ...f, status: "approved" } : f)));
    showToast("המשוב אושר", "success");
  }

  function nameOf(userId) {
    const u = users.find((x) => x.id === userId);
    return u ? u.profile?.fullName || u.email : "משתמש לא ידוע";
  }

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyCounts = {};
  individualAttendance
    .filter((r) => r.present && r.date && r.date.startsWith(monthKey))
    .forEach((r) => { monthlyCounts[r.userId] = (monthlyCounts[r.userId] || 0) + 1; });
  const leaderboard = Object.entries(monthlyCounts)
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-black text-zinc-100">מה שהתקבל</div>

      <Card className="p-4">
        <SectionTitle icon={CalendarDays} tone="amber">לוח האימונים שפרסמת</SectionTitle>
        {officialEvents.length === 0 ? (
          <div className="text-xs text-zinc-600 text-center py-3">עדיין לא פרסמת אימונים</div>
        ) : (
          <div className="space-y-1.5">
            {officialEvents.map((ev) => {
              const reports = attendanceReports.filter((r) => r.eventId === ev.id);
              return (
                <div key={ev.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenEventId(openEventId === ev.id ? null : ev.id)} className="w-full flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-xs font-bold text-zinc-200">{ev.title} · {ev.date}</span>
                    <ChevronDown size={14} className={`text-zinc-500 transition ${openEventId === ev.id ? "rotate-180" : ""}`} />
                  </button>
                  {openEventId === ev.id && (
                    <div className="px-4 pb-3">
                      {reports.length === 0 ? (
                        <div className="text-[11px] text-zinc-600">ראשי הצוות עדיין לא סימנו נוכחות לאימון זה</div>
                      ) : (
                        <div className="space-y-1">
                          {reports.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">צוות {r.teamId}</span>
                              <Pill tone="emerald">{r.percentage}%</Pill>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle icon={ClipboardCheck} tone="amber">משובי סוף אימון</SectionTitle>
        {loadingFeedback ? (
          <div className="text-xs text-zinc-600 text-center py-3">טוען...</div>
        ) : feedbackList.length === 0 ? (
          <div className="text-xs text-zinc-600 text-center py-3">עדיין לא התקבלו משובים</div>
        ) : (
          <div className="space-y-2">
            {feedbackList.map((f) => (
              <div key={f.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-200">{f.firstName} · צוות {f.teamCode}</span>
                  {f.status === "approved" ? <Pill tone="emerald">אושר</Pill> : <Pill tone="amber">חדש</Pill>}
                </div>
                <div className="text-[11px] text-zinc-500 mb-1">מאמן: {f.coach} · ציון: {f.valueRating}/5 · המלצה: {f.recommendRating}/5</div>
                <div className="text-xs text-zinc-400">{f.opinion}</div>
                {f.status !== "approved" && (
                  <button onClick={() => approveFeedback(f.id)} className="mt-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300">סמן כנקרא</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionTitle icon={TrendingUp} tone="amber">הכי הרבה אימונים החודש</SectionTitle>
        <div className="text-[10px] text-zinc-600 mb-3">מתאפס בכל חודש - לפי נוכחות שראשי הצוות סימנו</div>
        {leaderboard.length === 0 ? (
          <div className="text-xs text-zinc-600 text-center py-3">אין עדיין נתוני נוכחות החודש</div>
        ) : (
          <div className="space-y-1.5">
            {leaderboard.map((row, i) => (
              <div key={row.userId} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-400 w-4">{i + 1}</span>
                  <span className="text-xs font-bold text-zinc-200">{nameOf(row.userId)}</span>
                </div>
                <Pill tone="emerald">{row.count} אימונים</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================== COACH CONTENT (publishing - articles, training bank, unit info, values) ============================== */

function CoachContentTab({ addArticle, addContent, showToast }) {
  const [contentForm, setContentForm] = useState({ category: "unit_info", subcategory: "ערכים", title: "", body: "", unit: "", imageUrl: "", dateLabel: "" });
  const [publishing, setPublishing] = useState(false);

  async function publish() {
    if (!contentForm.title.trim()) return;
    setPublishing(true);
    try {
      if (contentForm.category === "tip_article") {
        await addArticle({ id: Date.now(), title: contentForm.title, unit: contentForm.unit || "כללי", author: "מאמן", excerpt: contentForm.body, imageUrl: contentForm.imageUrl.trim() });
      } else {
        if (!contentForm.subcategory) { showToast("נא לבחור תת-קטגוריה", "error"); setPublishing(false); return; }
        await addContent({ category: contentForm.category, subcategory: contentForm.subcategory, title: contentForm.title, body: contentForm.body, dateLabel: contentForm.dateLabel.trim() });
      }
      showToast("התוכן פורסם", "success");
      setContentForm({ category: contentForm.category, subcategory: "", title: "", body: "", unit: "", imageUrl: "", dateLabel: "" });
    } catch (e) {
      showToast("שגיאה בפרסום", "error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-black text-zinc-100">פרסום תוכן למאגר</div>

      <Card className="p-4">
        <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 p-3 mb-4">
          <div className="text-xs font-black text-sky-400 flex items-center gap-1.5 mb-1"><Star size={13} /> חדש: תוכן ערכי</div>
          <div className="text-[11px] text-zinc-400">מתחת ליחידות וגיבושים במאגר של החניכים - תוכן ערכי לקראת השירות הצבאי. רק את/ה יכול/ה לפרסם כאן.</div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
            {[...CONTENT_CATEGORIES, { id: "values", label: "תוכן ערכי" }].map((c) => (
              <button
                key={c.id}
                onClick={() => setContentForm({ ...contentForm, category: c.id === "values" ? "unit_info" : c.id, subcategory: c.id === "values" ? "ערכים" : "" })}
                className={`rounded-lg py-2 text-[10px] font-bold border ${(c.id === "values" ? contentForm.subcategory === "ערכים" : contentForm.category === c.id && contentForm.subcategory !== "ערכים") ? "bg-red-500/15 border-red-500 text-red-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {contentForm.category === "training_pool" && (
            <div className="flex gap-1.5">
              {TRAINING_SUBCATS.map(([id, label]) => (
                <button key={id} onClick={() => setContentForm({ ...contentForm, subcategory: id })} className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold border ${contentForm.subcategory === id ? "bg-amber-500/15 border-amber-500 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>{label}</button>
              ))}
            </div>
          )}
          {contentForm.category === "unit_info" && contentForm.subcategory !== "ערכים" && (
            <div className="flex gap-1.5">
              {UNIT_INFO_SUBCATS.filter(([id]) => id !== "ערכים").map(([id, label]) => (
                <button key={id} onClick={() => setContentForm({ ...contentForm, subcategory: id, title: "" })} className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold border ${contentForm.subcategory === id ? "bg-sky-500/15 border-sky-500 text-sky-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>{label}</button>
              ))}
            </div>
          )}

          {contentForm.subcategory === "גיבושים" ? (
            <>
              <label className="text-[10px] text-zinc-500 font-semibold block">איזה גיבוש?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {GIBUSHIM_LIST.map((name) => (
                  <button key={name} onClick={() => setContentForm({ ...contentForm, title: name })} className={`rounded-lg py-2 text-[11px] font-bold border ${contentForm.title === name ? "bg-red-500/15 border-red-500 text-red-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
                    {name}
                  </button>
                ))}
              </div>
              <label className="text-[10px] text-zinc-500 font-semibold block">מועד</label>
              <input placeholder='לדוגמה: אפריל 2026 שייטת 13' value={contentForm.dateLabel} onChange={(e) => setContentForm({ ...contentForm, dateLabel: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all duration-300" />
            </>
          ) : (
            <input placeholder="כותרת" value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all duration-300" />
          )}
          {contentForm.category === "tip_article" && (
            <>
              <input placeholder="יחידה משויכת (אופציונלי)" value={contentForm.unit} onChange={(e) => setContentForm({ ...contentForm, unit: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all duration-300" />
              <input placeholder="קישור לתמונה (אופציונלי - אם ריק, ייווצר עיצוב אוטומטי)" dir="ltr" value={contentForm.imageUrl} onChange={(e) => setContentForm({ ...contentForm, imageUrl: e.target.value })} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all duration-300" />
            </>
          )}
          <textarea placeholder="תוכן / הקשר" value={contentForm.body} onChange={(e) => setContentForm({ ...contentForm, body: e.target.value })} rows={4} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none" />
          <GlowButton tone="red" icon={publishing ? Loader2 : Send} className="w-full" disabled={publishing || !contentForm.title.trim()} onClick={publish}>{publishing ? "מפרסם..." : "פרסם"}</GlowButton>
        </div>
      </Card>
    </div>
  );
}

/* ============================== TRAINING FEEDBACK PAGE ============================== */

function FeedbackTab({ currentUser, officialEvents, showToast, onBack }) {
  const [openEvent] = useState(() => getOpenFeedbackEvent(officialEvents));
  const [checking, setChecking] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [teamCode, setTeamCode] = useState(currentUser.profile?.teamCode || "");
  const [coach, setCoach] = useState("");
  const [coachOther, setCoachOther] = useState("");
  const [valueRating, setValueRating] = useState(0);
  const [recommendRating, setRecommendRating] = useState(0);
  const [opinion, setOpinion] = useState("");
  const [kindWordTeam, setKindWordTeam] = useState("");
  const [kindWordValue, setKindWordValue] = useState("");
  const [kindWordText, setKindWordText] = useState("");
  const [howAreYou, setHowAreYou] = useState("");
  const [messageToYuval, setMessageToYuval] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!openEvent) { setChecking(false); return; }
      const already = await checkFeedbackSubmitted(currentUser.id, openEvent.id);
      setAlreadySubmitted(already);
      setChecking(false);
    })();
  }, [openEvent, currentUser.id]);

  async function submit() {
    if (!firstName.trim() || !teamCode || !coach || valueRating === 0 || recommendRating === 0 || !opinion.trim()) {
      showToast("נא למלא את כל השדות המסומנים כחובה", "error");
      return;
    }
    setSaving(true);
    try {
      const entry = {
        id: Date.now(),
        userId: currentUser.id,
        eventId: openEvent?.id || null,
        eventTitle: openEvent?.title || "",
        submittedAt: new Date().toISOString(),
        status: "pending",
        firstName: firstName.trim(),
        teamCode,
        coach: coach === "אחר" ? coachOther.trim() || "אחר" : coach,
        valueRating,
        recommendRating,
        opinion: opinion.trim(),
        kindWord: kindWordText.trim() ? { team: kindWordTeam, value: kindWordValue, text: kindWordText.trim() } : null,
        howAreYou: howAreYou.trim(),
        messageToYuval: messageToYuval.trim(),
      };
      await submitFeedbackRemote(entry);
      setSubmitted(true);
      showToast("המשוב נשלח למאמן בהצלחה", "success");
    } catch (e) {
      showToast("שגיאה בשליחה, נסה שוב", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-sm font-bold mb-4">
        <ChevronRight size={16} /> חזרה לדף הבית
      </button>

      {checking ? (
        <div className="text-center py-10 text-zinc-600 text-sm">בודק זמינות...</div>
      ) : !openEvent ? (
        <Card className="p-6 text-center">
          <ClipboardCheck size={28} className="text-zinc-600 mx-auto mb-2" />
          <div className="text-sm text-zinc-400">אין כרגע משוב אימון פתוח למילוי.</div>
          <div className="text-xs text-zinc-600 mt-1">הטופס נפתח לשלוש שעות מרגע סיום כל אימון רשמי.</div>
        </Card>
      ) : alreadySubmitted || submitted ? (
        <Card className="p-6 text-center">
          <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
          <div className="text-sm text-zinc-300 font-bold">כבר שלחת משוב לאימון הזה. תודה!</div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-4">
            <SectionTitle icon={ClipboardCheck} tone="amber">משוב אימון - {openEvent.title}</SectionTitle>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold">שם פרטי</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold mb-1.5 block">מספר צוות</label>
                <div className="text-sm font-black text-amber-400 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
                  {teamCode ? `צוות ${teamCode}` : "לא הוגדר בפרופיל"}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold mb-1.5 block">אצל מי התאמנת?</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["עוז", "יובל", "אור", "אחר"].map((c) => (
                    <button key={c} onClick={() => setCoach(c)} className={`rounded-lg py-2 text-xs font-bold border ${coach === c ? "bg-amber-500/15 border-amber-500 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {coach === "אחר" && (
                  <input value={coachOther} onChange={(e) => setCoachOther(e.target.value)} placeholder="שם המאמן" className="w-full mt-2 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
                )}
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold mb-1.5 block">האימון נתן לי ערך (1-5)</label>
                <RatingButtons value={valueRating} onChange={setValueRating} />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold mb-1.5 block">האם היית ממליץ לחברייך להצטרף אלינו? (1-5)</label>
                <RatingButtons value={recommendRating} onChange={setRecommendRating} />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold">מה דעתך על האימון?</label>
                <textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={3} className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 transition-all duration-300" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle icon={Heart} tone="red">מילה טובה (לא חובה)</SectionTitle>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 font-semibold">צוות</label>
                  <select value={kindWordTeam} onChange={(e) => setKindWordTeam(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100">
                    <option value="">בחר/י</option>
                    {TEAM_LIST.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-semibold">ערך</label>
                  <select value={kindWordValue} onChange={(e) => setKindWordValue(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-zinc-100">
                    <option value="">בחר/י</option>
                    {CORE_VALUES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea value={kindWordText} onChange={(e) => setKindWordText(e.target.value)} placeholder="כתוב/י מילה טובה על מישהו/י מהצוות..." rows={2} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all duration-300" />
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle icon={MessageSquare}>עוד כמה דברים (לא חובה)</SectionTitle>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold">מה שלומך?</label>
                <textarea value={howAreYou} onChange={(e) => setHowAreYou(e.target.value)} rows={2} className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-semibold">משהו שתרצה/י להגיד ליובל?</label>
                <textarea value={messageToYuval} onChange={(e) => setMessageToYuval(e.target.value)} rows={2} className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300" />
              </div>
            </div>
          </Card>

          <GlowButton tone="amber" icon={saving ? Loader2 : Send} className="w-full" disabled={saving} onClick={submit}>
            {saving ? "שולח..." : "שלח משוב"}
          </GlowButton>
        </div>
      )}
    </div>
  );
}

/* ============================== ROOT APP ============================== */

export default function CombatFitApp() {
  const [authState, setAuthState] = useState("intro"); // 'intro' | 'auth' | 'onboarding' | 'app'
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  const [users, setUsers] = useState([]);
  const [officialEvents, setOfficialEvents] = useState([]);
  const [personalLogs, setPersonalLogs] = useState([]);
  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [trainingContent, setTrainingContent] = useState([]);

  function showToast(msg, tone = "info") { setToast({ msg, tone }); }
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (authState !== "app" || !currentUser) return;
    let cancelled = false;
    (async () => {
      const [u, ev, arts, logs, tb] = await Promise.all([
        loadUsers(),
        loadOfficialEvents(),
        loadArticlesRemote(),
        loadPersonalLogsRemote(currentUser.id),
        loadContentRemote("training_pool"),
      ]);
      if (cancelled) return;
      setUsers(u);
      setOfficialEvents(ev);
      setArticles(arts);
      setPersonalLogs(logs);
      setTrainingContent(tb);
    })();
    return () => { cancelled = true; };
  }, [authState, currentUser?.id]);

  function handleAuthed(user) {
    setCurrentUser(user);
    setAuthState(user.onboarded ? "app" : "onboarding");
    if (user.role === "admin") setActiveTab("coach_home");
  }
  function handleOnboardingDone(user) {
    setCurrentUser(user);
    setAuthState("app");
  }
  function handleLogout() {
    session.accessToken = null;
    setCurrentUser(null);
    setAuthState("auth");
    setActiveTab("home");
  }

  async function addPersonalLog(entry) {
    const saved = await addPersonalLogRemote(currentUser.id, entry);
    setPersonalLogs((prev) => [saved, ...prev]);
  }
  async function updatePersonalLog(id, patch) {
    setPersonalLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await updatePersonalLogRemote(currentUser.id, id, patch);
  }
  async function removePersonalLog(id) {
    await removePersonalLogRemote(currentUser.id, id);
    setPersonalLogs((prev) => prev.filter((l) => l.id !== id));
  }
  async function setGibushDate(dateStr, gibushType) {
    const newUser = { ...currentUser, profile: { ...currentUser.profile, gibushDate: dateStr, gibushType: gibushType || currentUser.profile?.gibushType || "" } };
    setCurrentUser(newUser);
    try {
      await saveUserProfile(newUser);
    } catch (e) {
      showToast("שגיאה בשמירת מועד הגיבוש", "error");
    }
  }
  async function addOfficialEvent(entry) {
    const saved = await addOfficialEventRemote(entry);
    setOfficialEvents((prev) => [saved, ...prev]);
  }
  async function addArticle(entry) {
    const saved = await addArticleRemote(entry);
    setArticles((prev) => [saved, ...prev]);
  }
  async function addContent(entry) {
    const saved = await addContentRemote(entry);
    if (entry.category === "training_pool") setTrainingContent((prev) => [saved, ...prev]);
  }
  async function toggleTeamLeader(userId) {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const updated = { ...target, role: target.role === "team_leader" ? "trainee" : "team_leader" };
    await saveUserProfile(updated);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    showToast("העדכון בוצע", "success");
  }
  async function toggleAdmin(userId) {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const updated = { ...target, role: target.role === "admin" ? "trainee" : "admin" };
    await saveUserProfile(updated);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    showToast("העדכון בוצע", "success");
  }

  const baseTabs = [
    { id: "home", label: "בית", icon: Home },
    { id: "calendar", label: "יומן", icon: CalendarDays },
    { id: "chat", label: "צ'אט", icon: MessageSquare },
    { id: "hub", label: "מאגר", icon: BookOpen },
    { id: "profile", label: "פרופיל", icon: User },
  ];
  const coachTabs = [
    { id: "coach_home", label: "בית", icon: Home },
    { id: "coach_calendars", label: "יומנים", icon: CalendarDays },
    { id: "coach_feedback", label: "התקבל", icon: ClipboardCheck },
    { id: "coach_content", label: "מאגר", icon: BookOpen },
  ];
  const tabs =
    currentUser?.role === "admin" ? coachTabs
    : currentUser?.role === "team_leader" ? [...baseTabs, { id: "attendance", label: "נוכחות", icon: ClipboardCheck }]
    : baseTabs;
  const isLight = Boolean(currentUser?.profile?.lightMode);

  return (
    <div dir="rtl" className="w-full min-h-screen bg-black flex justify-center" style={{ fontFamily: "'Rubik', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" }}>
      <div
        className={`w-full max-w-md min-h-screen border-x flex flex-col h-screen relative ${isLight ? "light-theme border-zinc-200" : "border-zinc-900"}`}
        style={{
          background: isLight
            ? "radial-gradient(ellipse 100% 40% at 50% 0%, rgba(16,185,129,0.08), transparent 70%), #f8fafc"
            : "radial-gradient(ellipse 100% 40% at 50% 0%, rgba(16,185,129,0.06), transparent 70%), #000",
        }}
      >
        <style>{`
          /* Rubik font is loaded via <link> in index.html, not @import, for performance */
          @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 6px 1px var(--glow-strong), 0 0 18px 4px var(--glow-soft); }
            50%      { box-shadow: 0 0 14px 3px var(--glow-strong), 0 0 34px 8px var(--glow-soft); }
          }
          .glow-btn {
            background-color: #000;
            animation: glowPulse 2.2s ease-in-out infinite;
          }
          .glow-pulse {
            animation: glowPulse 2.2s ease-in-out infinite;
          }
          @keyframes introFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .intro-fade {
            animation: introFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes tabFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .tab-fade {
            animation: tabFadeIn 0.2s ease-out;
          }

          /* ===== Light theme overrides (freshly re-scanned against every class in the file) ===== */
          .light-theme [class~="bg-black"] { background-color: #ffffff !important; }
          .light-theme [class~="bg-black/30"] { background-color: rgba(0,0,0,0.12) !important; }
          .light-theme [class~="bg-black/60"] { background-color: rgba(255,255,255,0.9) !important; }
          .light-theme [class~="bg-black/70"] { background-color: rgba(255,255,255,0.92) !important; }
          .light-theme [class~="bg-black/80"] { background-color: rgba(255,255,255,0.94) !important; }
          .light-theme [class~="bg-black/90"] { background-color: rgba(255,255,255,0.96) !important; }
          .light-theme [class~="bg-zinc-700"] { background-color: #cbd5e1 !important; }
          .light-theme [class~="bg-zinc-800"] { background-color: #e2e8f0 !important; }
          .light-theme [class~="bg-zinc-900"] { background-color: #ffffff !important; }
          .light-theme [class~="bg-zinc-900/40"] { background-color: rgba(241,245,249,0.75) !important; }
          .light-theme [class~="bg-zinc-900/60"] { background-color: rgba(248,250,252,0.9) !important; }
          .light-theme [class~="bg-zinc-900/70"] { background-color: rgba(255,255,255,0.92) !important; }
          .light-theme [class~="bg-zinc-900/80"] { background-color: rgba(255,255,255,0.95) !important; }
          .light-theme [class~="bg-zinc-950"] { background-color: #f1f5f9 !important; }
          .light-theme [class~="border-zinc-600"] { border-color: #cbd5e1 !important; }
          .light-theme [class~="border-zinc-700"] { border-color: #cbd5e1 !important; }
          .light-theme [class~="border-zinc-800"] { border-color: #e2e8f0 !important; }
          .light-theme [class~="border-zinc-800/60"] { border-color: rgba(226,232,240,0.8) !important; }
          .light-theme [class~="border-zinc-800/80"] { border-color: rgba(226,232,240,0.9) !important; }
          .light-theme [class~="border-zinc-900"] { border-color: #e2e8f0 !important; }
          .light-theme [class~="text-zinc-50"] { color: #000000 !important; }
          .light-theme [class~="text-zinc-100"] { color: #000000 !important; }
          .light-theme [class~="text-zinc-200"] { color: #111111 !important; }
          .light-theme [class~="text-zinc-300"] { color: #1f1f1f !important; }
          .light-theme [class~="text-zinc-400"] { color: #3f3f46 !important; }
          .light-theme [class~="text-zinc-500"] { color: #52525b !important; }
          .light-theme [class~="text-zinc-600"] { color: #71717a !important; }
          .light-theme [class~="text-zinc-700"] { color: #a1a1aa !important; }
          .light-theme [class~="placeholder-zinc-600"]::placeholder { color: #a1a1aa !important; }
          .light-theme [class~="shadow-black"] { --tw-shadow-color: rgba(0,0,0,0.08) !important; }
          .light-theme [class~="shadow-black/50"] { --tw-shadow-color: rgba(0,0,0,0.08) !important; }
        `}</style>
        {authState === "intro" && <IntroCarousel onDone={() => setAuthState("auth")} />}
        {authState === "auth" && <AuthScreen onAuthed={handleAuthed} showToast={showToast} />}
        {authState === "onboarding" && currentUser && <OnboardingFlow user={currentUser} onDone={handleOnboardingDone} showToast={showToast} />}
        {authState === "app" && currentUser && (
          <>
            <AppHeader user={currentUser} />
            <div key={activeTab} className="flex-1 overflow-y-auto tab-fade">
              {activeTab === "home" && (
                <HomeTab
                  warMode={Boolean(currentUser.profile?.warMode)}
                  goToWarChat={() => setActiveTab("chat")}
                  officialEvents={officialEvents}
                  goToHub={() => setActiveTab("hub")}
                  goToFeedback={() => setActiveTab("feedback")}
                  goToCalendar={() => setActiveTab("calendar")}
                  role={currentUser.role}
                  trainingContent={trainingContent}
                  profile={currentUser.profile}
                />
              )}
              {activeTab === "calendar" && (
                <CalendarTab
                  officialEvents={officialEvents}
                  personalLogs={personalLogs}
                  addPersonalLog={addPersonalLog}
                  removePersonalLog={removePersonalLog}
                  updatePersonalLog={updatePersonalLog}
                  profile={currentUser.profile}
                  onSetGibushDate={setGibushDate}
                  userId={currentUser.id}
                />
              )}
              {activeTab === "chat" && <ChatTab warMode={Boolean(currentUser.profile?.warMode)} showToast={showToast} profile={currentUser.profile} />}
              {activeTab === "hub" && <HubTab articles={articles} />}
              {activeTab === "profile" && <ProfileTab user={currentUser} setCurrentUser={setCurrentUser} showToast={showToast} onLogout={handleLogout} />}
              {activeTab === "attendance" && currentUser.role === "team_leader" && <AttendanceTab users={users} currentUser={currentUser} officialEvents={officialEvents} showToast={showToast} />}
              {activeTab === "coach_home" && currentUser.role === "admin" && (
                <CoachHomeTab users={users} toggleTeamLeader={toggleTeamLeader} toggleAdmin={toggleAdmin} addOfficialEvent={addOfficialEvent} showToast={showToast} onLogout={handleLogout} />
              )}
              {activeTab === "coach_calendars" && currentUser.role === "admin" && <CoachCalendarsTab users={users} />}
              {activeTab === "coach_feedback" && currentUser.role === "admin" && (
                <CoachFeedbackTab users={users} officialEvents={officialEvents} showToast={showToast} />
              )}
              {activeTab === "coach_content" && currentUser.role === "admin" && (
                <CoachContentTab addArticle={addArticle} addContent={addContent} showToast={showToast} />
              )}
              {activeTab === "feedback" && (
                <FeedbackTab currentUser={currentUser} officialEvents={officialEvents} showToast={showToast} onBack={() => setActiveTab("home")} />
              )}
            </div>
            {activeTab !== "feedback" && <BottomNav tabs={tabs} active={activeTab} setActive={setActiveTab} />}
          </>
        )}
        <Toast toast={toast} />
      </div>
    </div>
  );
}
