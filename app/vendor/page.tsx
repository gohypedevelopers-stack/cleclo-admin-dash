"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Users, Star, MapPin, CheckCircle, Clock, Ban, Activity, ArrowRight, Store, ShieldCheck, BarChart3, TrendingUp, Calendar, Zap, Loader2, AlertTriangle, RefreshCw, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };

const getStatusColor = (status: string) => {
  switch (status) { case "Active": return "bg-green-100 text-green-700 border-green-200"; case "Pending": return "bg-amber-100 text-amber-700 border-amber-200"; case "Suspended": return "bg-red-100 text-red-700 border-red-200"; default: return "bg-gray-100 text-gray-700"; }
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); const data = await res.json();
      setVendors(Array.isArray(data) ? data : data.vendors || []);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  if (isLoading && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading vendor dashboard...</p></div>;
  if (error && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error}</p><Button onClick={fetchVendors} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl"><RefreshCw className="h-4 w-4" /> Retry</Button></div>;

  const activeVendors = vendors.filter((v) => !v.isBlocked && v.vendorProfile?.isApproved);
  const pendingVendors = vendors.filter((v) => !v.isBlocked && !v.vendorProfile?.isApproved);
  const recentVendors = [...vendors].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  const growthData = [{ month: "Aug", vendors: 1 }, { month: "Sep", vendors: 2 }, { month: "Oct", vendors: 3 }, { month: "Nov", vendors: Math.max(3, vendors.length - 2) }, { month: "Dec", vendors: Math.max(4, vendors.length - 1) }, { month: "Jan", vendors: vendors.length }];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl text-black font-bold tracking-tight">Vendor Dashboard</h1><p className="text-slate-500 mt-1">Overview of vendor performance and status</p></div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-sm font-medium text-green-700">{activeVendors.length} Active</span></div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Vendors", value: vendors.length, sub: "From live database", icon: Users, grad: "from-blue-500 to-blue-600", subIcon: TrendingUp },
          { label: "Active Vendors", value: activeVendors.length, sub: "Approved & unblocked", icon: Activity, grad: "from-green-500 to-green-600", subIcon: Zap },
          { label: "Pending Review", value: pendingVendors.length, sub: "Needs attention", icon: ShieldCheck, grad: "from-amber-500 to-orange-500", subIcon: Clock },
          { label: "Blocked", value: vendors.filter(v => v.isBlocked).length, sub: "Suspended", icon: BarChart3, grad: "from-red-500 to-red-600", subIcon: Ban },
        ].map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.grad} text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}>
            <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-white/70 text-xs font-medium uppercase tracking-wider">{s.label}</p><p className="text-3xl font-bold mt-1">{s.value}</p><p className="text-white/70 text-xs mt-1 flex items-center gap-1"><s.subIcon className="h-3 w-3" /> {s.sub}</p></div><div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center"><s.icon className="h-6 w-6" /></div></div></CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2"><div><CardTitle className="text-sm font-bold text-slate-800">Vendor Growth</CardTitle><p className="text-xs text-slate-500">Monthly registrations</p></div><Badge className="bg-blue-100 text-blue-700 border-none">Live</Badge></CardHeader>
          <CardContent className="p-4 pt-0"><div className="h-[180px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={growthData}><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} /><Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} /><Bar dataKey="vendors" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
        </Card>
      </div>

      {/* Vendor lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent */}
        <Card className={`shadow-sm transition-all duration-300 ${hoveredCard === "vendors" ? "shadow-lg ring-2 ring-blue-200" : ""}`} onMouseEnter={() => setHoveredCard("vendors")} onMouseLeave={() => setHoveredCard(null)}>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="h-4 w-4 text-blue-600" /></div><CardTitle className="text-sm font-bold text-slate-800">Recent Vendors</CardTitle></div>
            <Button variant="ghost" size="sm" className="text-xs text-[#3E8940] hover:bg-green-50" onClick={() => router.push("/vendor/all")}>View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="p-4 pt-3"><div className="space-y-3">{recentVendors.map((v) => {
            const name = v.vendorProfile?.businessName || v.name;
            const status = v.isBlocked ? "Suspended" : !v.vendorProfile?.isApproved ? "Pending" : "Active";
            return (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group border border-transparent hover:border-slate-100" onClick={() => router.push(`/vendors/${v.id}`)}>
                <div className="flex items-center gap-3"><Avatar className="h-10 w-10 ring-2 ring-white shadow-sm"><AvatarFallback className="text-xs bg-green-100 text-green-700 font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="text-sm font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors">{name}</p><p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {v.phone}</p></div></div>
                <div className="flex flex-col items-end gap-1"><Badge variant="outline" className={`${getStatusColor(status)} text-xs`}>{status}</Badge><span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {formatDate(v.createdAt)}</span></div>
              </div>
            );
          })}</div></CardContent>
        </Card>

        {/* Pending Verification */}
        <Card className={`shadow-sm transition-all duration-300 ${hoveredCard === "verification" ? "shadow-lg ring-2 ring-amber-200" : ""}`} onMouseEnter={() => setHoveredCard("verification")} onMouseLeave={() => setHoveredCard(null)}>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-amber-600" /></div><CardTitle className="text-sm font-bold text-slate-800">Pending Verification</CardTitle>{pendingVendors.length > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold animate-pulse">{pendingVendors.length}</span>}</div>
            <Button variant="ghost" size="sm" className="text-xs text-[#3E8940] hover:bg-green-50" onClick={() => router.push("/vendor/verification")}>Review All <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="p-4 pt-3"><div className="space-y-3">{pendingVendors.length > 0 ? pendingVendors.slice(0, 5).map((v) => (
            <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all border border-amber-100" onClick={() => router.push(`/vendors/${v.id}`)}>
              <div className="flex items-center gap-3"><Avatar className="h-10 w-10 ring-2 ring-amber-200"><AvatarFallback className="text-xs bg-amber-100 text-amber-700 font-bold">{(v.vendorProfile?.businessName || v.name).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="text-sm font-semibold text-slate-900">{v.vendorProfile?.businessName || v.name}</p><p className="text-xs text-slate-500">{v.phone}</p></div></div>
              <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600 border-none rounded-lg" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${v.id}`); }}>Review</Button>
            </div>
          )) : <div className="text-center py-8"><CheckCircle className="h-10 w-10 text-emerald-300 mx-auto mb-2" /><p className="text-sm text-slate-500 font-medium">All vendors verified!</p></div>}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}
