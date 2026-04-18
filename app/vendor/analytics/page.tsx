"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { ArrowUpRight, ShoppingBag, Users, Star, Loader2, AlertTriangle, RefreshCw, IndianRupee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatINR = (a: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a);

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#94a3b8"];

export default function VendorAnalyticsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vRes, oRes] = await Promise.all([
        apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() }),
        apiFetch(`${ORDER_API_URL}`, { headers: getAuthHeaders() }),
      ]);
      if (vRes.ok) { const d = await vRes.json(); setVendors(Array.isArray(d) ? d : d.vendors || []); }
      if (oRes.ok) { const d = await oRes.json(); setOrders(Array.isArray(d) ? d : d.orders || []); }
    } catch {} finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeVendors = vendors.filter(v => !v.isBlocked && v.vendorProfile?.isApproved);
  const pendingVendors = vendors.filter(v => !v.isBlocked && !v.vendorProfile?.isApproved);
  const blockedVendors = vendors.filter(v => v.isBlocked);
  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avgRating = vendors.length > 0 ? (vendors.reduce((s, v) => s + (v.vendorProfile?.rating || 0), 0) / vendors.length).toFixed(1) : "0";

  const statusDist = [
    { name: "Active", value: activeVendors.length, fill: PIE_COLORS[0] },
    { name: "Pending", value: pendingVendors.length, fill: PIE_COLORS[1] },
    { name: "Blocked", value: blockedVendors.length, fill: PIE_COLORS[2] },
  ].filter(d => d.value > 0);

  // Group orders by day for the bar chart
  const dailyOrders = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    orders.forEach(o => { const d = new Date(o.createdAt).getDay(); counts[d]++; });
    return days.map((n, i) => ({ name: n, orders: counts[i] }));
  }, [orders]);

  // Top vendors by order count
  const topVendors = useMemo(() => {
    const map: Record<string, { name: string; orders: number; revenue: number; rating: number }> = {};
    orders.forEach(o => {
      const vn = o.vendor?.vendorProfile?.businessName || o.vendor?.name || "Unknown";
      if (!map[vn]) map[vn] = { name: vn, orders: 0, revenue: 0, rating: o.vendor?.vendorProfile?.rating || 0 };
      map[vn].orders++;
      map[vn].revenue += o.totalAmount || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading analytics...</p></div>;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-3xl text-black font-bold tracking-tight">Analytics</h1><p className="text-slate-500 mt-1">Performance metrics and insights across all vendors.</p></div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><IndianRupee className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatINR(totalRevenue)}</div><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1" /> From live orders</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Orders</CardTitle><ShoppingBag className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{orders.length.toLocaleString()}</div><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1" /> Live count</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Vendors</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{activeVendors.length}</div><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1" /> of {vendors.length} total</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg Rating</CardTitle><Star className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{avgRating}</div><p className="text-xs text-slate-500 mt-1">Across all vendors</p></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4"><CardHeader><CardTitle>Daily Orders</CardTitle><CardDescription>Orders by day of week</CardDescription></CardHeader><CardContent className="pl-2"><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyOrders}><XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} /><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} /><Bar dataKey="orders" fill="#3E8940" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>

        <Card className="col-span-3"><CardHeader><CardTitle>Vendor Status</CardTitle><CardDescription>Distribution by status</CardDescription></CardHeader><CardContent>
          <div className="h-[300px] relative"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">{statusDist.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} /></PieChart></ResponsiveContainer><div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"><div className="text-2xl font-bold">{vendors.length}</div><div className="text-xs text-slate-500">Total</div></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2">{statusDist.map(item => <div key={item.name} className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} /><div className="text-sm text-slate-600">{item.name} <span className="text-slate-400">({item.value})</span></div></div>)}</div>
        </CardContent></Card>
      </div>

      {/* Top Vendors */}
      <Card><CardHeader><CardTitle>Top Performing Vendors</CardTitle><CardDescription>Highest revenue generating partners</CardDescription></CardHeader><CardContent><div className="space-y-4">
        {topVendors.length > 0 ? topVendors.map((v, i) => (
          <div key={v.name} className="flex items-center">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full mr-4 font-bold text-white text-sm ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-slate-200 text-slate-700"}`}>{i + 1}</div>
            <div className="flex-1 space-y-1"><p className="text-sm font-medium">{v.name}</p><p className="text-xs text-muted-foreground">{v.orders} Orders</p></div>
            <div className="text-right"><p className="text-sm font-bold text-slate-900">{formatINR(v.revenue)}</p>{v.rating > 0 && <div className="flex items-center justify-end text-xs text-amber-500"><Star className="h-3 w-3 fill-current mr-0.5" />{v.rating}</div>}</div>
          </div>
        )) : <p className="text-sm text-slate-500 text-center py-4">No order data available yet.</p>}
      </div></CardContent></Card>
    </div>
  );
}
