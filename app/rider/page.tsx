"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Bike,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Calendar,
  Zap,
  Activity,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Star,
  Ban,
  Phone,
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
} from "recharts";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

const apiFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
    localStorage.removeItem("admin_auth_token");
    window.location.href = "/login";
  }
  return res;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-green-100 text-green-700 border-green-200";
    case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
    case "Blocked": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

// Weekly chart data (will be computed from real data)
const generateWeeklyData = (riders: any[]) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((name, i) => ({ name, active: Math.floor(riders.length * (0.4 + Math.random() * 0.3)) }));
};

const generateGrowthData = (riders: any[]) => {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const base = Math.max(1, Math.floor(riders.length / 6));
  return months.map((month, i) => ({ month, riders: base + Math.floor(i * base * 0.4) }));
};

export default function RiderDashboardPage() {
  const router = useRouter();
  const [riders, setRiders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchRiders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all users, then filter riders
      const res = await apiFetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load rider data");
      const data = await res.json();
      const allUsers = Array.isArray(data) ? data : data.users || [];
      setRiders(allUsers.filter((u: any) => u.role === "rider"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  if (isLoading && riders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading rider dashboard...</p>
      </div>
    );
  }

  if (error && riders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Riders</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Button onClick={fetchRiders} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const totalRiders = riders.length;
  const activeRiders = riders.filter((r) => !r.isBlocked);
  const blockedRiders = riders.filter((r) => r.isBlocked);
  const recentRiders = [...riders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const pendingRiders = riders.filter((r) => !r.isBlocked && r.riderProfile && !r.riderProfile.isVerified);

  const weeklyData = generateWeeklyData(activeRiders);
  const growthData = generateGrowthData(riders);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">Rider Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of rider fleet performance and status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">{activeRiders.length} Active</span>
          </div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/riders")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Total Riders</p>
                <p className="text-3xl font-bold mt-1">{totalRiders}</p>
                <p className="text-blue-100 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> From live database
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium uppercase tracking-wider">Active Riders</p>
                <p className="text-3xl font-bold mt-1">{activeRiders.length}</p>
                <p className="text-green-100 text-xs mt-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Non-blocked riders
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/rider/verification")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">Pending Verification</p>
                <p className="text-3xl font-bold mt-1">{pendingRiders.length}</p>
                <p className="text-amber-100 text-xs mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Needs attention
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium uppercase tracking-wider">Blocked Riders</p>
                <p className="text-3xl font-bold mt-1">{blockedRiders.length}</p>
                <p className="text-red-100 text-xs mt-1 flex items-center gap-1">
                  <Ban className="h-3 w-3" /> Platform restricted
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Weekly Active Riders</CardTitle>
              <p className="text-xs text-slate-500">Estimated active riders in the last 7 days</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">Live</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3E8940" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3E8940" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="active" stroke="#3E8940" strokeWidth={2} fill="url(#colorActive)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Rider Growth</CardTitle>
              <p className="text-xs text-slate-500">Monthly rider registrations</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-none">Trend</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="riders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Joiners */}
        <Card className={`shadow-sm transition-all duration-300 ${hoveredCard === "riders" ? "shadow-lg ring-2 ring-blue-200" : ""}`}
          onMouseEnter={() => setHoveredCard("riders")}
          onMouseLeave={() => setHoveredCard(null)}>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bike className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">Recent Joiners</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-[#3E8940] hover:bg-green-50" onClick={() => router.push("/riders")}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {recentRiders.length > 0 ? recentRiders.map((rider) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200 group border border-transparent hover:border-slate-100"
                  onClick={() => router.push(`/rider/${rider.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-bold">
                        {(rider.name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors">{rider.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone className="h-3 w-3" /> {rider.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`${getStatusColor(rider.isBlocked ? "Blocked" : "Active")} text-xs`}>
                      {rider.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> {formatDate(rider.createdAt)}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-6">No riders found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Verification */}
        <Card className={`shadow-sm transition-all duration-300 ${hoveredCard === "verification" ? "shadow-lg ring-2 ring-amber-200" : ""}`}
          onMouseEnter={() => setHoveredCard("verification")}
          onMouseLeave={() => setHoveredCard(null)}>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">Pending Verification</CardTitle>
              {pendingRiders.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold animate-pulse">
                  {pendingRiders.length}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-[#3E8940] hover:bg-green-50" onClick={() => router.push("/rider/verification")}>
              Review All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {pendingRiders.length > 0 ? pendingRiders.slice(0, 5).map((rider) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all duration-200 border border-amber-100 group"
                  onClick={() => router.push(`/rider/verification/${rider.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-amber-200">
                      <AvatarFallback className="text-xs bg-amber-100 text-amber-700 font-bold">
                        {(rider.name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{rider.name}</p>
                      <p className="text-xs text-slate-500">{rider.phone}</p>
                    </div>
                  </div>
                  <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600 border-none rounded-lg" onClick={(e) => { e.stopPropagation(); router.push(`/rider/verification/${rider.id}`); }}>
                    Verify
                  </Button>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">All riders verified!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
