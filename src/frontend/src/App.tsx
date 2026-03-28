import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Bell,
  Clock,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Wifi,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface AppDef {
  name: string;
  emoji: string;
  baseMbps: number;
  pid: number;
}

interface AppState extends AppDef {
  currentMbps: number;
  history: number[];
}

// ── Static app definitions ─────────────────────────────────────────────────
const APP_DEFS: AppDef[] = [
  { name: "Chrome", emoji: "🌐", baseMbps: 45, pid: 4821 },
  { name: "YouTube", emoji: "▶️", baseMbps: 120, pid: 3902 },
  { name: "Spotify", emoji: "🎵", baseMbps: 8, pid: 2210 },
  { name: "Discord", emoji: "💬", baseMbps: 3, pid: 5533 },
  { name: "Slack", emoji: "💼", baseMbps: 2, pid: 6614 },
  { name: "Zoom", emoji: "📹", baseMbps: 35, pid: 7740 },
  { name: "VS Code", emoji: "💻", baseMbps: 0.5, pid: 1123 },
  { name: "Steam", emoji: "🎮", baseMbps: 15, pid: 8895 },
  { name: "Dropbox", emoji: "📦", baseMbps: 5, pid: 9901 },
  { name: "Firefox", emoji: "🦊", baseMbps: 20, pid: 3310 },
  { name: "Teams", emoji: "👥", baseMbps: 12, pid: 4420 },
  { name: "WhatsApp", emoji: "📱", baseMbps: 1, pid: 5517 },
];

const SPARK_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function randomUsage(base: number): number {
  return base * (0.7 + Math.random() * 0.6);
}

function formatBandwidth(mbps: number): string {
  if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`;
  return `${(mbps * 1024).toFixed(0)} KB/s`;
}

function formatBandwidthShort(mbps: number): string {
  if (mbps >= 1) return mbps.toFixed(1);
  return (mbps * 1024).toFixed(0);
}

function formatBandwidthUnit(mbps: number): string {
  return mbps >= 1 ? "MB/s" : "KB/s";
}

function initApps(): AppState[] {
  return APP_DEFS.map((def) => ({
    ...def,
    currentMbps: randomUsage(def.baseMbps),
    history: Array.from({ length: 10 }, () => randomUsage(def.baseMbps)),
  }));
}

// ── Sparkline bars ─────────────────────────────────────────────────────────
const Sparkline = memo(function Sparkline({
  history,
  maxVal,
}: { history: number[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-[2px] h-6">
      {SPARK_POSITIONS.map((pos) => {
        const val = history[pos] ?? 0;
        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        const isLast = pos === 9;
        return (
          <div
            key={pos}
            className="w-[5px] rounded-sm"
            style={{
              height: `${Math.max(8, pct)}%`,
              background: isLast ? "#FF9F2A" : "#3a4a5a",
              transition: "height 0.4s ease",
            }}
          />
        );
      })}
    </div>
  );
});

// ── App row card ───────────────────────────────────────────────────────────
const AppCard = memo(function AppCard({
  app,
  rank,
  maxUsage,
  onClose,
}: { app: AppState; rank: number; maxUsage: number; onClose: () => void }) {
  const barPct = maxUsage > 0 ? (app.currentMbps / maxUsage) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      data-ocid={`app.item.${rank}`}
      className="rounded-xl border flex overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #161D24 0%, #1B232B 100%)",
        borderColor: "#2A333C",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* FAR LEFT — Close button */}
      <div className="flex items-center px-2" style={{ background: "#0F1520" }}>
        <button
          type="button"
          onClick={onClose}
          data-ocid={`app.delete_button.${rank}`}
          className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-md transition-all group"
          title={`Close ${app.name}`}
          style={{ color: "#9AA6B2" }}
        >
          <X className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" />
          <span className="text-[9px] font-semibold group-hover:text-red-400 transition-colors">
            Close
          </span>
        </button>
      </div>

      {/* divider */}
      <div className="self-stretch w-px" style={{ background: "#2A333C" }} />

      {/* LEFT — network pressure */}
      <div
        className="flex flex-col justify-between p-4"
        style={{ flex: "0 0 55%" }}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold" style={{ color: "#FF9F2A" }}>
            {formatBandwidthShort(app.currentMbps)}
          </span>
          <span className="text-xs" style={{ color: "#9AA6B2" }}>
            {formatBandwidthUnit(app.currentMbps)}
          </span>
          <span className="text-xs ml-1 truncate" style={{ color: "#9AA6B2" }}>
            {app.name} — {formatBandwidth(app.currentMbps)}
          </span>
        </div>

        {/* usage bar */}
        <div
          className="w-full rounded-full mb-3"
          style={{ height: "6px", background: "#2A333C" }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background: "linear-gradient(90deg, #F39C2D, #FF9F2A)",
              boxShadow: "0 0 8px rgba(255,159,42,0.5)",
            }}
          />
        </div>

        {/* sparkline */}
        <Sparkline history={app.history} maxVal={app.baseMbps * 1.4} />
      </div>

      {/* divider */}
      <div className="self-stretch w-px" style={{ background: "#2A333C" }} />

      {/* RIGHT — app identity */}
      <div
        className="flex flex-col justify-center px-4 py-3 gap-1"
        style={{ flex: "0 0 35%" }}
      >
        <div className="text-3xl leading-none mb-1">{app.emoji}</div>
        <div className="font-semibold text-sm" style={{ color: "#E8EDF2" }}>
          {app.name}
        </div>
        <div className="text-xs" style={{ color: "#9AA6B2" }}>
          PID {app.pid}
        </div>
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit mt-1"
          style={{ background: "#1F3A2B", color: "#2ECC71" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full pulse-dot"
            style={{ background: "#2ECC71" }}
          />
          Active
        </div>
      </div>
    </motion.div>
  );
});

// ── Nav item ───────────────────────────────────────────────────────────────
function NavItem({
  icon: Icon,
  label,
  active = false,
  ocid,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  ocid: string;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
      style={{
        background: active ? "#1F2A34" : "transparent",
        color: active ? "#E8EDF2" : "#9AA6B2",
        borderLeft: active ? "3px solid #2ECC71" : "3px solid transparent",
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </button>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────
const KpiCard = memo(function KpiCard({
  label,
  value,
  sub,
  color,
}: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div
      className="flex-1 rounded-xl p-4 border"
      style={{
        background: "linear-gradient(135deg, #161D24 0%, #1B232B 100%)",
        borderColor: "#2A333C",
      }}
    >
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "#9AA6B2" }}
      >
        {label}
      </div>
      <div className="text-2xl font-bold" style={{ color: color ?? "#E8EDF2" }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: "#9AA6B2" }}>
          {sub}
        </div>
      )}
    </div>
  );
});

// ── Premium features list ──────────────────────────────────────────────────
const PREMIUM_FEATURES = [
  {
    title: "Real-time Deep Packet Inspection & Protocol Analysis",
    desc: "Inspect every packet at the protocol level — HTTP, DNS, WebSocket, QUIC and more. Drill into payload details, decode headers, and pinpoint latency spikes at the byte level.",
  },
  {
    title: "Unlimited App Tracking with Custom Alert Thresholds",
    desc: "Monitor every running process with zero limits. Set per-app bandwidth thresholds and receive instant push/email alerts when usage exceeds your defined limits.",
  },
  {
    title: "Historical Bandwidth Reports — 30-Day Data Export",
    desc: "Access a full 30-day rolling history of network usage per app. Export detailed CSV/PDF reports for audits, billing reconciliation, or capacity planning.",
  },
  {
    title: "AI-Powered Anomaly Detection & Security Alerts",
    desc: "Our on-device ML model learns your normal traffic patterns and automatically flags unusual spikes, suspicious destinations, or potential data exfiltration attempts.",
  },
  {
    title: "Priority Support + Cross-Device Sync Across 5 Devices",
    desc: "Get 24/7 priority support with a guaranteed 2-hour response SLA. Sync your dashboards, alerts, and settings across up to 5 devices seamlessly in real time.",
  },
];

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [apps, setApps] = useState<AppState[]>(() =>
    initApps().sort((a, b) => b.currentMbps - a.currentMbps),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const updateApps = useCallback(() => {
    setApps((prev) =>
      prev
        .map((app) => {
          const next = randomUsage(app.baseMbps);
          return {
            ...app,
            currentMbps: next,
            history: [...app.history.slice(1), next],
          };
        })
        .sort((a, b) => b.currentMbps - a.currentMbps),
    );
    setNow(new Date());
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const id = setInterval(updateApps, 1000);
    return () => clearInterval(id);
  }, [updateApps]);

  const removeApp = useCallback((name: string) => {
    setApps((prev) => prev.filter((a) => a.name !== name));
  }, []);

  const totalBandwidth = apps.reduce((sum, a) => sum + a.currentMbps, 0);
  const avgLatency = (
    18 +
    Math.sin(tick * 0.3) * 6 +
    Math.random() * 4
  ).toFixed(0);
  const maxUsage = apps[0]?.currentMbps ?? 1;
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div
        className="px-5 py-5 flex items-center gap-3"
        style={{ borderBottom: "1px solid #1E2830" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #2ECC71, #1A8A4A)" }}
        >
          <Wifi className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: "#E8EDF2" }}>
            NetPressure
          </div>
          <div className="text-xs" style={{ color: "#9AA6B2" }}>
            v1.1.1
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          active
          ocid="nav.dashboard.link"
        />
        <NavItem icon={Activity} label="Live Alerts" ocid="nav.alerts.link" />
        <NavItem icon={Clock} label="Network History" ocid="nav.history.link" />
        <NavItem icon={Settings} label="Settings" ocid="nav.settings.link" />
      </nav>

      <div className="px-3 py-4" style={{ borderTop: "1px solid #1E2830" }}>
        <NavItem icon={LogOut} label="Log Out" ocid="nav.logout.button" />
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0B0F14" }}
    >
      {/* ── Sidebar desktop ── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 h-full"
        style={{
          width: "240px",
          background: "#141A20",
          borderRight: "1px solid #1E2830",
        }}
      >
        {sidebarContent}
      </aside>

      {/* ── Sidebar mobile drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 flex flex-col lg:hidden"
              style={{
                width: "240px",
                background: "#141A20",
                borderRight: "1px solid #1E2830",
              }}
            >
              <button
                type="button"
                className="absolute top-3 right-3 p-1 rounded-md"
                style={{ color: "#9AA6B2" }}
                onClick={() => setSidebarOpen(false)}
                data-ocid="sidebar.close_button"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 lg:px-6 py-3 flex-shrink-0"
          style={{
            background: "#12181E",
            borderBottom: "1px solid #1E2830",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-md"
              style={{ color: "#9AA6B2" }}
              onClick={() => setSidebarOpen(true)}
              data-ocid="sidebar.open_modal_button"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full pulse-dot"
                style={{ background: "#2ECC71" }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: "#2ECC71" }}
              >
                Live Monitoring
              </span>
            </div>
          </div>

          {/* Center clock */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: "#161D24", border: "1px solid #2A333C" }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: "#FF9F2A" }} />
            <span
              className="text-sm font-mono font-semibold tracking-widest"
              style={{ color: "#E8EDF2" }}
            >
              {timeStr}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Made by tag */}
            <span
              className="text-xs font-semibold hidden sm:inline"
              style={{ color: "#FFD700" }}
            >
              ✨Made by MrFire02 🔥
            </span>
            {/* Upgrade Premium button */}
            <button
              type="button"
              onClick={() => setPremiumOpen(true)}
              data-ocid="header.upgrade_premium.button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all hover:brightness-110 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#000000",
                boxShadow: "0 2px 10px rgba(255,215,0,0.4)",
              }}
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upgrade Premium</span>
              <span className="sm:hidden">Premium</span>
            </button>

            <button
              type="button"
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: "#7E8A96" }}
              data-ocid="header.alerts.button"
            >
              <Bell className="w-5 h-5" />
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "#E74C3C", color: "#fff" }}
              >
                3
              </span>
            </button>
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{ background: "#1F2A34", color: "#E8EDF2" }}
                >
                  AR
                </AvatarFallback>
              </Avatar>
              <span
                className="text-sm hidden sm:block"
                style={{ color: "#E8EDF2" }}
              >
                Alex R
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <main className="px-4 lg:px-6 py-5 space-y-5 max-w-6xl">
            {/* Page title */}
            <div>
              <div className="flex items-center justify-between gap-4">
                <h1
                  className="text-xl lg:text-2xl font-bold tracking-widest uppercase"
                  style={{ color: "#E8EDF2" }}
                >
                  Live Network Monitor
                </h1>
                <span
                  className="text-sm font-bold whitespace-nowrap"
                  style={{ color: "#2ECC71" }}
                >
                  Full Security🔒✅
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#9AA6B2" }}>
                Real-time application bandwidth usage
              </p>
            </div>

            {/* System Overview */}
            <section>
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "#9AA6B2" }}
              >
                System Overview
              </h2>
              <div
                className="flex flex-col sm:flex-row gap-3"
                data-ocid="overview.section"
              >
                <KpiCard
                  label="Active Apps"
                  value={`${apps.length}`}
                  sub="processes tracked"
                  color="#2ECC71"
                />
                <KpiCard
                  label="Total Bandwidth"
                  value={formatBandwidth(totalBandwidth)}
                  sub="combined usage"
                  color="#FF9F2A"
                />
                <KpiCard
                  label="Avg Latency"
                  value={`${avgLatency} ms`}
                  sub="network round-trip"
                  color="#E8EDF2"
                />
              </div>
            </section>

            {/* Active Applications */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#9AA6B2" }}
                >
                  Active Applications
                </h2>
                <span className="text-xs" style={{ color: "#9AA6B2" }}>
                  {apps.length} apps
                </span>
              </div>

              <div className="space-y-2.5" data-ocid="app.list">
                <AnimatePresence initial={false}>
                  {apps.map((app, i) => (
                    <AppCard
                      key={app.name}
                      app={app}
                      rank={i + 1}
                      maxUsage={maxUsage}
                      onClose={() => removeApp(app.name)}
                    />
                  ))}
                </AnimatePresence>
                {apps.length === 0 && (
                  <div
                    className="rounded-xl border p-8 text-center"
                    data-ocid="app.empty_state"
                    style={{
                      borderColor: "#2A333C",
                      background: "#161D24",
                      color: "#9AA6B2",
                    }}
                  >
                    All apps closed. Refresh to reload.
                  </div>
                )}
              </div>
            </section>

            {/* Disclaimer */}
            <div
              className="text-xs px-4 py-3 rounded-lg border"
              style={{
                color: "#9AA6B2",
                borderColor: "#2A333C",
                background: "#161D24",
              }}
            >
              ⚠️ <strong style={{ color: "#FF9F2A" }}>Simulated data</strong> —
              browser apps cannot access real OS process info. This dashboard
              demonstrates how a native monitoring agent would surface network
              pressure per application.
            </div>
          </main>
        </ScrollArea>

        {/* Footer */}
        <footer
          className="flex flex-col sm:flex-row items-center justify-between px-4 lg:px-6 py-2.5 text-xs gap-1 flex-shrink-0"
          style={{
            background: "#12181E",
            borderTop: "1px solid #1E2830",
            color: "#9AA6B2",
          }}
        >
          <span>
            © {new Date().getFullYear()}{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "#9AA6B2" }}
            >
              Built with ❤️ using caffeine.ai
            </a>
          </span>
          <div className="flex items-center gap-3">
            <span>Live monitoring simulation</span>
            <span style={{ color: "#2ECC71" }}>Updated: {timeStr}</span>
          </div>
        </footer>
      </div>

      {/* ── Premium Modal ── */}
      <Dialog open={premiumOpen} onOpenChange={setPremiumOpen}>
        <DialogContent
          data-ocid="premium.dialog"
          className="p-0 overflow-hidden border-0"
          style={{
            maxWidth: "min(1640px, 96vw)",
            width: "min(1640px, 96vw)",
            height: "min(900px, 92vh)",
            background: "#0D1117",
            border: "1px solid #2A333C",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Modal header */}
          <div
            className="px-8 py-6 flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #1A1200 0%, #2A1E00 60%, #1A1200 100%)",
              borderBottom: "1px solid #3D2E00",
            }}
          >
            <DialogHeader>
              <DialogTitle asChild>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #FFD700, #FFA500)",
                    }}
                  >
                    <Crown className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: "#FFD700" }}
                    >
                      Premium Features
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: "#A89060" }}>
                      Unlock the full power of NetPressure Monitor
                    </p>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="flex-1">
            <div className="px-8 py-6 space-y-5">
              {PREMIUM_FEATURES.map((feat, idx) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  className="flex gap-5 rounded-2xl p-5 border"
                  style={{
                    background:
                      "linear-gradient(135deg, #161D24 0%, #1B232B 100%)",
                    borderColor: "#2A333C",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-black"
                    style={{
                      background: "linear-gradient(135deg, #2A1E00, #3D2E00)",
                      border: "1px solid #5A4500",
                      color: "#FFD700",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-bold text-base mb-2"
                      style={{ color: "#E8EDF2" }}
                    >
                      {feat.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#9AA6B2" }}
                    >
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Buy button */}
              <div className="pt-4 pb-2 flex flex-col items-center gap-3">
                <p className="text-sm" style={{ color: "#9AA6B2" }}>
                  Start your premium journey today
                </p>
                <button
                  type="button"
                  data-ocid="premium.subscribe.button"
                  onClick={() => {
                    setPremiumOpen(false);
                    setComingSoonOpen(true);
                  }}
                  className="px-10 py-4 rounded-2xl text-lg font-black tracking-wide transition-all hover:brightness-110 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #FFD700, #FFA500)",
                    color: "#000000",
                    boxShadow: "0 4px 24px rgba(255,215,0,0.45)",
                  }}
                >
                  ₹120/Monthly
                </button>
                <p className="text-xs" style={{ color: "#5A6A7A" }}>
                  Cancel anytime · Secure payment
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Coming Soon Modal ── */}
      <Dialog open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <DialogContent
          data-ocid="coming_soon.dialog"
          className="border-0"
          style={{
            background: "linear-gradient(135deg, #0D1117, #141A20)",
            border: "1px solid #2A333C",
            maxWidth: "420px",
          }}
        >
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
              }}
            >
              🚀
            </div>
            <h2
              className="text-3xl font-black tracking-widest"
              style={{ color: "#FFD700" }}
            >
              Coming Soon...
            </h2>
            <p className="text-sm" style={{ color: "#9AA6B2" }}>
              Premium payments are launching shortly. Stay tuned!
            </p>
            <button
              type="button"
              data-ocid="coming_soon.close_button"
              onClick={() => setComingSoonOpen(false)}
              className="mt-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
              style={{
                background: "#1F2A34",
                color: "#E8EDF2",
                border: "1px solid #2A333C",
              }}
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
