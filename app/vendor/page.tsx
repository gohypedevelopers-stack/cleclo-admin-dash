"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Ban,
  Activity,
  ArrowRight,
  Store,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Calendar,
  Zap,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Phone,
  ClipboardList,
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
  Cell,
} from "recharts";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Filter, DollarSign, ListOrdered } from "lucide-react";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});
const apiFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    localStorage.removeItem("admin_auth_token");
    window.location.href = "/login";
  }
  return res;
};

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700 border-green-200";
    case "Pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Suspended":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getVendorTier = (v: any) => {
  // Use performanceTier from backend if available
  if (v.performanceTier) return v.performanceTier;
  if (v.vendorProfile?.performanceTier) return v.vendorProfile.performanceTier;

  const sla = v.sla || v.vendorProfile?.slaScore || 0;
  const rating = v.rating || v.vendorProfile?.rating || 0;
  
  if (sla > 95 && rating > 4.7) 
    return { tier: "GOLD", label: "Gold", badge: "🥇 Gold", color: "bg-amber-100 text-amber-700" };
  if (sla >= 85 && sla <= 95) 
    return { tier: "SILVER", label: "Silver", badge: "🥈 Silver", color: "bg-slate-100 text-slate-700" };
  if (sla < 80) 
    return { tier: "PROBATION", label: "Probation", badge: "⚠️ Probation", color: "bg-red-100 text-red-700" };
  return { tier: "STANDARD", label: "Standard", badge: "Standard", color: "bg-blue-100 text-blue-700" };
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [filterCity, setFilterCity] = useState("all");
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [viewMode, setViewMode] = useState<"orders" | "revenue">("orders");
  const [filterOptions, setFilterOptions] = useState({ 
    vendors: [] as any[], 
    cities: [] as string[], 
    serviceTypes: [] as string[] 
  });

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vendorsRes, statsRes] = await Promise.all([
        apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() }),
        apiFetch(`${AUTH_API_URL}/dashboard/stats`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (!vendorsRes.ok || !statsRes.ok)
        throw new Error("Failed to fetch dashboard data");

      const vendorsData = await vendorsRes.json();
      const statsData = await statsRes.json();

      setVendors(
        Array.isArray(vendorsData) ? vendorsData : vendorsData.vendors || [],
      );
      setStats(statsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWeeklyActivity = useCallback(async () => {
    setWeeklyLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCity !== "all") params.append("city", filterCity);
      if (filterVendor !== "all") params.append("vendorId", filterVendor);
      if (filterService !== "all") params.append("serviceType", filterService);

      const res = await apiFetch(`${AUTH_API_URL}/vendors/weekly-activity?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setWeeklyActivity(Array.isArray(data.weeklyActivity) ? data.weeklyActivity : []);
      if (data.filters) setFilterOptions(data.filters);
    } catch {
      setWeeklyActivity([]);
    } finally {
      setWeeklyLoading(false);
    }
  }, [filterCity, filterVendor, filterService]);

  useEffect(() => {
    fetchDashboardData();
    fetchWeeklyActivity();
  }, [fetchDashboardData, fetchWeeklyActivity]);

  if (isLoading && vendors.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm text-slate-500">Loading vendor dashboard...</p>
      </div>
    );
  if (error && vendors.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-slate-500">{error}</p>
        <Button
          onClick={fetchDashboardData}
          className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );

  const activeVendors = vendors.filter(
    (v) => !v.isBlocked && v.vendorProfile?.isApproved,
  );
  const pendingVendors = vendors.filter(
    (v) => !v.isBlocked && !v.vendorProfile?.isApproved,
  );
  const recentVendors = [...vendors]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  const growthData = [
    { month: "Aug", vendors: 1 },
    { month: "Sep", vendors: 2 },
    { month: "Oct", vendors: 3 },
    { month: "Nov", vendors: Math.max(3, vendors.length - 2) },
    { month: "Dec", vendors: Math.max(4, vendors.length - 1) },
    { month: "Jan", vendors: vendors.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Vendor Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of vendor performance and status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">
              {activeVendors.length} Active Vendors Online
            </span>
          </div>
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />
          )}
        </div>
      </div>

      {/* Global Financial Liability Summary (Source of Truth) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#3E8940] text-white border-none shadow-xl hover:scale-[1.02] transition-transform overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-125 transition-transform">
            <Wallet className="h-12 w-12" />
          </div>
          <CardContent className="p-5">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Total Customer Wallet Balance</p>
            <h3 className="text-2xl font-black mt-1">₹{Number(stats?.financialSummary?.totalCustomerWalletBalance || 0).toLocaleString('en-IN')}</h3>
            <p className="text-white/50 text-[9px] mt-2 flex items-center gap-1 font-medium italic">
              <ShieldCheck className="h-2.5 w-2.5" /> Platform liability to users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500 text-white border-none shadow-xl hover:scale-[1.02] transition-transform overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-125 transition-transform">
            <CreditCard className="h-12 w-12" />
          </div>
          <CardContent className="p-5">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Total Vendor Payout Due</p>
            <h3 className="text-2xl font-black mt-1">₹{Number(stats?.financialSummary?.totalVendorPayoutDue || 0).toLocaleString('en-IN')}</h3>
            <p className="text-white/50 text-[9px] mt-2 flex items-center gap-1 font-medium italic">
              <Clock className="h-2.5 w-2.5" /> Awaiting settlement cycles
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-600 text-white border-none shadow-xl hover:scale-[1.02] transition-transform overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-125 transition-transform">
            <TrendingUp className="h-12 w-12" />
          </div>
          <CardContent className="p-5">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Total Revenue Generated</p>
            <h3 className="text-2xl font-black mt-1">₹{Number(stats?.financialSummary?.totalGlobalRevenue || 0).toLocaleString('en-IN')}</h3>
            <p className="text-white/50 text-[9px] mt-2 flex items-center gap-1 font-medium italic">
              <BarChart3 className="h-2.5 w-2.5" /> Gross merchandise value
            </p>
          </CardContent>
        </Card>

        <Card className="bg-indigo-600 text-white border-none shadow-xl hover:scale-[1.02] transition-transform overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-125 transition-transform">
            <Zap className="h-12 w-12" />
          </div>
          <CardContent className="p-5">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Total Commission Earned</p>
            <h3 className="text-2xl font-black mt-1">₹{Number(stats?.financialSummary?.totalGlobalCommission || 0).toLocaleString('en-IN')}</h3>
            <p className="text-white/50 text-[9px] mt-2 flex items-center gap-1 font-medium italic">
              <ShieldCheck className="h-2.5 w-2.5" /> Platform net revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Status Snapshot */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlements Due</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">₹{Number(stats?.settlementsDue || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px]">AWAITING</Badge>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#3E8940] group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlements Completed</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">₹{Number(stats?.settlementsCompleted || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-[#3E8940] border-none font-bold text-[9px]">SETTLED</Badge>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue</p>
                <p className="text-lg font-black text-rose-600 mt-0.5">₹{Number(stats?.settlementsOverdue || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-[9px] animate-pulse">CRITICAL</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Strategic KPI Grid */}
      <div className="grid gap-4 md:grid-cols-5 sm:grid-cols-1">
        {[
          {
            key: "risk",
            label: "Vendor Risk Indicator",
            value: `⚠ ${stats?.verificationPending || 0} / 🚨 ${stats?.highRiskVendors || 0}`,
            description: "Review Required / High Risk Alert",
            icon: ShieldCheck,
            grad: (stats?.verificationPending || 0) > 0 || (stats?.highRiskVendors || 0) > 0 ? "from-red-600 to-red-700" : "from-emerald-500 to-emerald-600",
            pulse: (stats?.verificationPending || 0) > 0 || (stats?.highRiskVendors || 0) > 0,
            sub: `Review: ${stats?.verificationPending || 0} | Risk: ${stats?.highRiskVendors || 0}`
          },
          {
            key: "revenue",
            label: "Total Revenue Generated",
            value: `₹${Number(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
            description: "Gross merchandise value",
            icon: Wallet,
            grad: "from-blue-600 to-blue-700",
          },
          {
            key: "aov",
            label: "Platform Avg Order Value",
            value: `₹${Number(stats?.avgOrderValue || 0).toLocaleString("en-IN")}`,
            description: "Overall efficiency metric",
            icon: IndianRupee,
            grad: "from-cyan-600 to-cyan-700",
          },
          {
            key: "commission_total",
            label: "Platform Commission Earned",
            value: `₹${Number(stats?.commissionEarned || 0).toLocaleString("en-IN")}`,
            description: "Cumulative earnings to date",
            icon: BarChart3,
            grad: "from-indigo-600 to-indigo-700",
          },
          {
            key: "commission",
            label: "Commission Earned (This Month)",
            value: `₹${Number(stats?.commissionThisMonth || 0).toLocaleString("en-IN")}`,
            description: `${(stats?.commissionTrend || 0) >= 0 ? "+" : ""}${Number(stats?.commissionTrend || 0).toFixed(1)}% vs last month`,
            icon: TrendingUp,
            grad: "from-emerald-600 to-emerald-700",
          },
          {
            key: "payout",
            label: "Total Pending Payout",
            value: `₹${Number(stats?.payoutPending || 0).toLocaleString("en-IN")}`,
            description: "Awaiting settlement",
            icon: CreditCard,
            grad: "from-violet-600 to-violet-700",
          },
          {
            key: "sla",
            label: "Order Fulfilment Rate",
            value: `${Math.round(stats?.avgSla || 0)}%`,
            description: "Fulfilment vs Commitment",
            icon: CheckCircle,
            grad: "from-teal-600 to-teal-700",
          },
          {
            key: "issues",
            label: "Quality Intelligence",
            value: `IR: ${Number(stats?.avgIssueRate || 0).toFixed(1)}% | DR: ${Number(stats?.avgDamageRate || 0).toFixed(1)}%`,
            description: "Issue Rate (IR) vs Damage Rate (DR)",
            icon: AlertTriangle,
            grad: "from-rose-600 to-rose-700",
          },
          {
            key: "vendors",
            label: "Total Vendors",
            value: stats?.totalVendors || 0,
            description: "Overall platform partners",
            icon: Users,
            grad: "from-slate-700 to-slate-800",
          },
          {
            key: "score",
            label: "Composite Partner Health",
            value: `${(((stats?.avgRating || 0) / 5 * 100 + (stats?.avgSla || 0) + (100 - (stats?.avgIssueRate || 0))) / 3).toFixed(0)}%`,
            description: `Fulfilment: ${Math.round(stats?.avgSla || 0)}% | Rating: ${Number(stats?.avgRating || 0).toFixed(1)} | Issue: ${Number(stats?.avgIssueRate || 0).toFixed(1)}%`,
            icon: Star,
            grad: "from-amber-500 to-orange-600",
          },
        ].map((kpi) => (
          <Card
            key={kpi.key}
            className={`bg-gradient-to-br ${kpi.grad} text-white border-none shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer ${kpi.pulse ? "ring-2 ring-red-400 ring-offset-2 animate-pulse" : ""}`}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[120px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl font-bold mt-1 tracking-tight">{kpi.value}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-white/80 text-[10px] mt-3 font-medium flex items-center gap-1.5 truncate">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendor Growth & Quality Insight */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Vendor Growth & Quality
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium">
                Active vs Registered • Readiness tracking
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                   <div className="h-2 w-2 rounded-full bg-blue-500" />
                   <span className="text-[10px] font-bold text-slate-600">REGISTERED</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="h-2 w-2 rounded-full bg-[#3E8940]" />
                   <span className="text-[10px] font-bold text-[#3E8940]">ACTIVE</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-[220px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats?.growthData || growthData}>
                  <defs>
                    <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3E8940" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3E8940" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length >= 2) {
                        const reg = payload[0].value as number;
                        const act = payload[1].value as number;
                        return (
                          <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-3 text-xs space-y-2">
                            <p className="font-bold text-slate-800 border-b pb-1">{label} Overview</p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Registered</span>
                                <span className="font-bold text-blue-600">{reg}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Approved (Active)</span>
                                <span className="font-bold text-[#3E8940]">{act}</span>
                              </div>
                              <div className="flex justify-between gap-4 border-t pt-1">
                                <span className="text-slate-500">Efficiency</span>
                                <span className="font-bold text-slate-700">
                                  {reg > 0 ? Math.round((act / reg) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="registered" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                  <Area type="monotone" dataKey="active" fill="url(#activeGrad)" stroke="#3E8940" strokeWidth={2} />
                  <Line type="monotone" dataKey="active" stroke="#3E8940" strokeWidth={2} dot={{ r: 3, fill: '#3E8940' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Status Breakdown Legend */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50">
              <div className="flex flex-col items-center p-2 rounded-xl bg-amber-50/50">
                <span className="text-[9px] font-bold text-amber-600 uppercase">Pending</span>
                <span className="text-sm font-bold text-slate-800">{stats?.verificationPending || 0}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-red-50/50">
                <span className="text-[9px] font-bold text-red-600 uppercase">Rejected</span>
                <span className="text-sm font-bold text-slate-800">{stats?.rejectedVendors || 0}</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-xl bg-green-50/50">
                <span className="text-[9px] font-bold text-[#3E8940] uppercase">Approved</span>
                <span className="text-sm font-bold text-slate-800">{stats?.approvedVendors || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity Upgrade */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-col gap-6 p-5 pb-3">
            <div className="flex flex-row items-center justify-between gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Weekly Performance Graph
                  </CardTitle>
                  <Badge className="bg-[#3E8940]/10 text-[#3E8940] border-none text-[9px] font-bold py-0 h-4">
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {viewMode === "orders" ? "Volume tracking" : "Revenue tracking"} • Insights for this week
                </p>
              </div>
              
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 gap-1">
                <button 
                  onClick={() => setViewMode("orders")}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${viewMode === "orders" ? "bg-white text-[#3E8940] shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                >
                  ORDERS
                </button>
                <button 
                  onClick={() => setViewMode("revenue")}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${viewMode === "revenue" ? "bg-white text-[#3E8940] shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                >
                  REVENUE
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-slate-100 w-full" />

            <div className="grid grid-cols-3 gap-3">
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="h-9 text-[10px] bg-white border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <SelectValue placeholder="City" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-[10px]">All Cities</SelectItem>
                  {filterOptions.cities.map(c => (
                    <SelectItem key={c} value={c} className="text-[10px]">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterVendor} onValueChange={setFilterVendor}>
                <SelectTrigger className="h-9 text-[10px] bg-white border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Store className="h-3 w-3 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Vendor" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-[10px]">All Vendors</SelectItem>
                  {filterOptions.vendors.map(v => (
                    <SelectItem key={v.id} value={v.id} className="text-[10px]">{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="h-9 text-[10px] bg-white border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Zap className="h-3 w-3 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Service" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-[10px]">All Services</SelectItem>
                  {filterOptions.serviceTypes.map(s => (
                    <SelectItem key={s} value={s} className="text-[10px]">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <div className="h-[170px]">
              {weeklyLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={weeklyActivity}
                    margin={{ top: 4, right: 8, left: -28, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="wavGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3E8940"
                          stopOpacity={0.18}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3E8940"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value;
                          return (
                            <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-4 py-3 text-sm">
                              <p className="font-semibold text-slate-700 mb-1">{label}</p>
                              <p className="text-[#3E8940] font-bold flex items-center gap-1">
                                {viewMode === "orders" ? <ListOrdered className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                                {viewMode === "orders" ? "Orders" : "Revenue"} : {viewMode === "orders" ? val : `₹${Number(val).toLocaleString('en-IN')}`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={viewMode === "orders" ? "orders" : "revenue"}
                      stroke="#3E8940"
                      strokeWidth={2}
                      fill="url(#wavGrad)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#3E8940",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Breakdown & Quality Dashboard */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Issue Breakdown
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium">
              Quality insights • Performance friction points
            </p>
          </div>
          <Badge className="bg-rose-50 text-rose-700 border-none font-bold text-[10px]">
            ACTION REQUIRED
          </Badge>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.issueBreakdown || []}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value;
                      return (
                        <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-3 text-xs">
                          <p className="font-bold text-slate-800 border-b pb-1 mb-1">{label}</p>
                          <p className="text-rose-600 font-black text-sm">{val} Alerts</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                >
                  {(stats?.issueBreakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#f43f5e]" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Delay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Damage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">No Show</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Refund</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers Section */}
      <div className="grid gap-6">
         <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-2xl bg-[#3E8940] flex items-center justify-center shadow-lg shadow-green-200">
                  <Star className="h-5 w-5 text-white" />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">🏆 Top Performing Vendors</h2>
                  <p className="text-xs text-slate-500 font-medium">Business excellence based on this month's activity</p>
               </div>
            </div>
            <Button variant="ghost" size="sm" className="text-[#3E8940] font-bold text-xs hover:bg-green-100 hover:text-[#3E8940]">
               View Ranking Details
            </Button>
         </div>

         <div className="grid gap-4 md:grid-cols-3">
            {(stats?.topVendors || []).map((vendor: any, idx: number) => (
               <Card key={vendor.id} className="relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 group">
                  {/* Rank Badge */}
                  <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-tighter ${
                     idx === 0 ? 'bg-amber-400 text-amber-950' : 
                     idx === 1 ? 'bg-slate-300 text-slate-800' : 
                     'bg-orange-300 text-orange-950'
                  }`}>
                     #{idx + 1} Rank
                  </div>

                  <CardContent className="p-6">
                     <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-14 w-14 ring-4 ring-slate-50 shadow-md group-hover:scale-110 transition-transform">
                           <AvatarFallback className={`${
                              idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                           } font-black text-lg`}>
                              {vendor.name.slice(0, 2).toUpperCase()}
                           </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                           <h3 className="font-bold text-slate-900 group-hover:text-[#3E8940] transition-colors truncate">{vendor.name}</h3>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              {(() => {
                                 const tier = getVendorTier(vendor);
                                 return (
                                    <Badge className={`${tier.color} border-none font-bold text-[9px] py-0 h-4 gap-1`}>
                                       {tier.badge}
                                    </Badge>
                                 );
                              })()}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-green-50/50 transition-colors">
                           <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Revenue | Orders</p>
                           <p className="text-xs font-black text-slate-800 tracking-tight">
                               ₹{Number(vendor.revenue).toLocaleString('en-IN')} | {vendor.orders}
                           </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-green-50/50 transition-colors">
                           <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Order Fulfilment Rate</p>
                           <p className={`text-xs font-black tracking-tight ${vendor.sla >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                               {Math.round(vendor.sla)}%
                           </p>
                        </div>
                        
                        {/* Capacity Indicator */}
                        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-green-50/50 transition-colors col-span-2">
                           <div className="flex justify-between items-center mb-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Capacity Indicator</p>
                              <span className={`text-[10px] font-black ${
                                 (vendor.currentLoad / vendor.dailyCapacity) >= 0.9 ? 'text-red-600' : 
                                 (vendor.currentLoad / vendor.dailyCapacity) >= 0.7 ? 'text-amber-600' : 
                                 'text-[#3E8940]'
                              }`}>
                                 {vendor.currentLoad}/{vendor.dailyCapacity} Orders
                              </span>
                           </div>
                           <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                 className={`h-full transition-all duration-1000 ${
                                    (vendor.currentLoad / vendor.dailyCapacity) >= 0.9 ? 'bg-red-500' : 
                                    (vendor.currentLoad / vendor.dailyCapacity) >= 0.7 ? 'bg-amber-500' : 
                                    'bg-[#3E8940]'
                                 }`}
                                 style={{ width: `${Math.min((vendor.currentLoad / (vendor.dailyCapacity || 1)) * 100, 100)}%` }}
                              />
                           </div>
                           {(vendor.currentLoad / vendor.dailyCapacity) >= 0.95 && (
                              <p className="text-[8px] font-black text-red-600 mt-1 animate-pulse">⚠️ OVERLOADED - AUTO-LIMIT ACTIVE</p>
                           )}
                        </div>

                        {/* Geographic Coverage */}
                        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-green-50/50 transition-colors col-span-2">
                           <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                              <MapPin className="h-2 w-2" /> Geographic Coverage
                           </p>
                           <p className="text-[10px] font-bold text-slate-700 truncate">
                              {vendor.areaCoverage || "No specific areas listed"}
                           </p>
                           <div className="flex gap-1 mt-1 flex-wrap">
                              {(vendor.areaCoverage || "").split(',').slice(0, 3).map((area: string) => (
                                 <span key={area} className="text-[8px] bg-white px-1.5 py-0.5 rounded-md border text-slate-500 font-bold">
                                    {area.trim()}
                                 </span>
                              ))}
                           </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-green-50/50 transition-colors">
                           <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Avg Order Value</p>
                           <p className="text-xs font-black text-emerald-600 tracking-tight">
                               ₹{Number(vendor.avgOrderValue || 0).toLocaleString('en-IN')}
                           </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-green-50/50 transition-colors">
                           <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Commission</p>
                           <p className="text-xs font-black text-blue-600 tracking-tight">
                               ₹{Number(vendor.commission || (vendor.revenue * 0.15)).toLocaleString('en-IN')}
                           </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-green-50/50 transition-colors">
                           <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Issue | Damage</p>
                           <p className="text-xs font-black tracking-tight">
                               <span className={Number(vendor.issueRate) <= 2 ? 'text-emerald-600' : 'text-red-600'}>{vendor.issueRate}%</span>
                               <span className="mx-1 text-slate-300">/</span>
                               <span className={Number(vendor.damageRate) <= 0.5 ? 'text-emerald-600' : 'text-red-600'}>{vendor.damageRate}%</span>
                           </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-green-50/50 transition-colors">
                           <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Rating</p>
                           <p className="text-xs font-black text-amber-500 flex items-center gap-1">
                               <Star className="h-3 w-3 fill-amber-500" /> {vendor.rating.toFixed(1)}
                           </p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>

      {/* Vendor lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent */}
        <Card
          className={`shadow-sm transition-all duration-300 ${hoveredCard === "vendors" ? "shadow-lg ring-2 ring-blue-200" : ""}`}
          onMouseEnter={() => setHoveredCard("vendors")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Recent Vendors
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] font-bold hover:bg-green-100 hover:text-[#3E8940]"
              onClick={() => router.push("/vendor/all")}
            >
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {recentVendors.map((v) => {
                const name = v.vendorProfile?.businessName || v.name;
                const status = v.isBlocked
                  ? "Suspended"
                  : !v.vendorProfile?.isApproved
                    ? "Pending"
                    : "Active";
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group border border-transparent hover:border-slate-100"
                    onClick={() => router.push(`/vendors/${v.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                        <AvatarFallback className="text-xs bg-green-100 text-green-700 font-bold">
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors">
                          {name}
                        </p>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] text-slate-500 font-bold">
                             {v.vendorProfile?.totalOrders || 0} Orders | ₹{Number(v.vendorProfile?.totalRevenue || 0).toLocaleString('en-IN')} Revenue
                           </p>
                           {(() => {
                              const tier = getVendorTier(v);
                              return (
                                 <span className={`text-[9px] font-black px-1.5 rounded-md ${tier.color}`}>
                                    {tier.badge}
                                 </span>
                              );
                           })()}
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-2.5 w-2.5" /> {v.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(status)} text-xs`}
                      >
                        {status}
                      </Badge>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />{" "}
                        {formatDate(v.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pending Verification */}
        <Card
          className={`shadow-sm transition-all duration-300 ${hoveredCard === "verification" ? "shadow-lg ring-2 ring-amber-200" : ""}`}
          onMouseEnter={() => setHoveredCard("verification")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Pending Verification
              </CardTitle>
              {pendingVendors.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold animate-pulse">
                  {pendingVendors.length}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] font-bold hover:bg-green-100 hover:text-[#3E8940]"
              onClick={() => router.push("/vendor/verification")}
            >
              Review All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {pendingVendors.length > 0 ? (
                pendingVendors.slice(0, 5).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all border border-amber-100"
                    onClick={() => router.push(`/vendors/${v.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-amber-200">
                        <AvatarFallback className="text-xs bg-amber-100 text-amber-700 font-bold">
                          {(v.vendorProfile?.businessName || v.name)
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {v.vendorProfile?.businessName || v.name}
                        </p>
                        <p className="text-xs text-slate-500">{v.phone}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-amber-500 hover:bg-amber-600 border-none rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/vendors/${v.id}`);
                      }}
                    >
                      Review
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">
                    All vendors verified!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
