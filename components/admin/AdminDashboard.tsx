"use client";

import { useEffect, useState } from "react";
import {
 Users,
 Activity,
 Zap,
 TrendingUp,
 DollarSign,
 Globe,
 Crown,
 Cpu,
 RefreshCw,
 BarChart3,
 AlertCircle,
 X,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Metrics {
 totalUsers: number;
 activeUsers: number;
 subscribedUsers: number;
 totalGenerations: number;
 totalGenerationsThisMonth: number;
 subscriptionBreakdown: Record<string, { monthly: number; annual: number; total: number }>;
 estimatedMRR: number;
 currentMonthTokens: number;
 currentMonthCostUSD: number;
 byModel: Record<string, { tokens: number; costUSD: number; calls: number }>;
}

const PLAN_COLORS: Record<string, string> = {
 starter:"#6366f1",
 pro:"#a855f7",
 agency:"#ec4899",
};

const PLAN_PRICES: Record<string, string> = {
 starter:"₹599/mo",
 pro:"₹1,499/mo",
 agency:"₹3,999/mo",
};

function StatCard({
 icon: Icon,
 label,
 value,
 sub,
 color,
}: {
 icon: any;
 label: string;
 value: string | number;
 sub?: string;
 color: string;
}) {
 return (
 <div className="bg-background border border-border rounded-2xl p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium text-muted-foreground">{label}</span>
 <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
 <Icon className="w-4 h-4" style={{ color }} />
 </div>
 </div>
 <div>
 <p className="text-3xl font-black text-foreground">{value}</p>
 {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
 </div>
 </div>
 );
}

export default function AdminDashboard() {
 const [metrics, setMetrics] = useState<Metrics | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
 const router = useRouter();

 const fetchMetrics = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await fetch("/api/admin/metrics");
 if (!res.ok) throw new Error("Failed to fetch metrics");
 const data = await res.json();
 setMetrics(data);
 setLastRefreshed(new Date());
 } catch (e: any) {
 setError(e.message);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchMetrics();
 }, []);

 const now = new Date();
 const monthName = now.toLocaleString("default", { month:"long", year:"numeric"});

 return (
 <div className="min-h-screen bg-background text-foreground">
 {/* Header */}
 <div className="border-b border-border bg-background/60 backdrop-blur-sm sticky top-0 z-10">
 <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
 <BarChart3 className="w-4 h-4 text-primary"/>
 </div>
 <div>
 <h1 className="font-bold text-lg">Admin Dashboard</h1>
 <p className="text-xs text-muted-foreground">CrawlCube — Internal</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 {lastRefreshed && (
 <span className="text-xs text-muted-foreground hidden sm:block">
 Updated {lastRefreshed.toLocaleTimeString()}
 </span>
 )}
 <button
 onClick={fetchMetrics}
 disabled={loading}
 className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium transition-all disabled:opacity-50"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loading ?"animate-spin":""}`} />
 Refresh
 </button>
 <button
 onClick={() => router.push("/")}
 className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-muted-foreground transition-all border border-border"
 title="Return to Home"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-6 py-10">
 {error && (
 <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 mb-8 text-red-600 dark:text-red-400">
 <AlertCircle className="w-5 h-5 shrink-0"/>
 <p className="text-sm font-medium">{error}</p>
 </div>
 )}

 {loading && metrics! ? (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
 {[...Array(8)].map((_, i) => (
 <div key={i} className="bg-background border border-border rounded-2xl p-6 h-32 animate-pulse"/>
 ))}
 </div>
 ) : metrics ? (
 <>
 {/* ── Summary Stats ── */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
 <StatCard
 icon={Users}
 label="Total Users"
 value={metrics.totalUsers.toLocaleString()}
 sub={`${metrics.activeUsers} active in last 30 days`}
 color="#6366f1"
 />
 <StatCard
 icon={Activity}
 label="Active Users"
 value={metrics.activeUsers.toLocaleString()}
 sub={`${Math.round((metrics.activeUsers / Math.max(metrics.totalUsers, 1)) * 100)}% of total`}
 color="#22c55e"
 />
 <StatCard
 icon={Crown}
 label="Subscribed Users"
 value={metrics.subscribedUsers.toLocaleString()}
 sub={`${Math.round((metrics.subscribedUsers / Math.max(metrics.totalUsers, 1)) * 100)}% conversion`}
 color="#a855f7"
 />
 <StatCard
 icon={DollarSign}
 label="Estimated MRR"
 value={`₹${metrics.estimatedMRR.toLocaleString()}`}
 sub="Active subscriptions only"
 color="#ec4899"
 />
 <StatCard
 icon={Globe}
 label="Total Generations"
 value={metrics.totalGenerations.toLocaleString()}
 sub="All time"
 color="#f59e0b"
 />
 <StatCard
 icon={TrendingUp}
 label="Generations This Month"
 value={metrics.totalGenerationsThisMonth.toLocaleString()}
 sub={monthName}
 color="#06b6d4"
 />
 <StatCard
 icon={Cpu}
 label="Tokens This Month"
 value={`${(metrics.currentMonthTokens / 1000).toFixed(1)}K`}
 sub={monthName}
 color="#8b5cf6"
 />
 <StatCard
 icon={Zap}
 label="API Cost This Month"
 value={`$${metrics.currentMonthCostUSD.toFixed(4)}`}
 sub={`≈ ₹${Math.round(metrics.currentMonthCostUSD * 85).toLocaleString()}`}
 color="#ef4444"
 />
 </div>

 {/* ── Subscription Breakdown ── */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
 <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
 <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
 <Crown className="w-4 h-4 text-primary"/>
 Subscription Breakdown
 </h2>
 {Object.keys(metrics.subscriptionBreakdown).length === 0 ? (
 <p className="text-muted-foreground text-sm text-center py-6">No active subscriptions yet.</p>
 ) : (
 <div className="space-y-4">
 {Object.entries(metrics.subscriptionBreakdown).map(([plan, data]) => (
 <div key={plan} className="flex items-center gap-4">
 <div
 className="w-3 h-3 rounded-full shrink-0"
 style={{ background: PLAN_COLORS[plan] ??"#6366f1"}}
 />
 <div className="flex-1">
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-semibold capitalize">{plan}</span>
 <span className="text-xs text-muted-foreground">{PLAN_PRICES[plan]}</span>
 </div>
 <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
 <div
 className="h-full rounded-full transition-all"
 style={{
 width: `${Math.min(100, (data.total / Math.max(metrics.subscribedUsers, 1)) * 100)}%`,
 background: PLAN_COLORS[plan] ??"#6366f1",
 }}
 />
 </div>
 <div className="flex gap-3 mt-1">
 <span className="text-xs text-muted-foreground">{data.monthly} monthly</span>
 <span className="text-xs text-muted-foreground">{data.annual} annual</span>
 <span className="text-xs font-bold" style={{ color: PLAN_COLORS[plan] ??"#6366f1"}}>
 {data.total} total
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* ── Per-Model API Cost ── */}
 <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
 <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
 <Cpu className="w-4 h-4 text-blue-400"/>
 API Spend by Model — {monthName}
 </h2>
 {Object.keys(metrics.byModel).length === 0 ? (
 <div className="text-center py-6">
 <p className="text-muted-foreground text-sm">No API usage tracked yet.</p>
 <p className="text-muted-foreground text-xs mt-1">Data will appear after the next generation.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {Object.entries(metrics.byModel)
 .sort((a, b) => b[1].costUSD - a[1].costUSD)
 .map(([model, data]) => {
 const shortName = model.split("/")[1] ?? model;
 const pct = (data.costUSD / Math.max(metrics.currentMonthCostUSD, 0.000001)) * 100;
 return (
 <div key={model}>
 <div className="flex items-center justify-between mb-1">
 <span className="text-sm font-medium truncate max-w-[180px]" title={model}>
 {shortName}
 </span>
 <div className="flex items-center gap-3 text-xs text-muted-foreground">
 <span>
 {((data?.tokens ?? 0) / 1000).toFixed(1)}K tokens
 </span>
 <span>
 {data?.calls ?? 0} calls
 </span>
 <span className="font-bold text-foreground">
 ${Number(data?.costUSD ?? 0).toFixed(5)}
 </span>
 </div>
 </div>
 <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
 <div
 className="h-full rounded-full bg-linear-to-r from-blue-500 to-purple-500"
 style={{ width: `${Math.max(2, pct)}%` }}
 />
 </div>
 </div>
 );
 })}
 <div className="border-t border-border pt-3 mt-3 flex justify-between text-sm">
 <span className="font-semibold">Total this month</span>
 <div className="flex items-center gap-3">
 <span className="text-muted-foreground">{(metrics.currentMonthTokens / 1000).toFixed(1)}K tokens</span>
 <span className="font-bold text-red-500 dark:text-red-400">${metrics.currentMonthCostUSD.toFixed(5)}</span>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* ── Footer note ── */}
 <p className="text-center text-muted-foreground text-xs pb-4">
 Token tracking live from {monthName}. Previous months preserved in Firestore <code>apiUsageHistory</code>.
 </p>
 </>
 ) : null}
 </div>
 </div>
 );
}
