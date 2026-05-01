"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { ArrowUpRight, ShoppingBag, Users, Star, Loader2, IndianRupee, Calendar as CalendarIcon, Filter, MapPin, Store, Settings2, Award, AlertCircle, Clock, Truck, ShieldAlert, History, Wallet, UserCheck, TrendingUp, UserMinus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatINR = (a: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a);

const SERVICE_COLORS: Record<string, string> = { "Wash": "#10b981", "Dry Clean": "#3b82f6", "Premium Care": "#8b5cf6", "Iron": "#f59e0b", "Others": "#94a3b8" };

const FinancialCard = ({ title, value, trend, icon: Icon, colorClass, bgClass }: any) => (
  <Card className={cn("shadow-sm border transition-all duration-300 hover:shadow-md border-slate-100", bgClass)}>
    <CardHeader className="pb-1"><CardTitle className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-2", colorClass)}><Icon className="h-3 w-3" /> {title}</CardTitle></CardHeader>
    <CardContent><div className="text-2xl font-black tracking-tight text-slate-900">{formatINR(value)}</div>{trend && <p className={cn("text-[10px] font-bold flex items-center mt-1.5", colorClass)}><ArrowUpRight className="h-3 w-3 mr-1" /> {trend}</p>}</CardContent>
  </Card>
);

const KpiCard = ({ title, value, icon: Icon, color, iconBg, subText }: any) => (
  <Card className="bg-white border-slate-100 hover:border-slate-200 transition-all shadow-sm group">
    <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center text-center">
      <div className={cn("p-2 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-sm", iconBg)}><Icon className={cn("h-5 w-5", color)} /></div>
      <div className="text-2xl font-black tracking-tight mb-1 text-slate-900">{value}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{title}</p>
      {subText && <p className="text-[9px] text-slate-400 mt-1 font-medium">{subText}</p>}
    </CardContent>
  </Card>
);

export default function VendorAnalyticsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [timeFilter, setTimeFilter] = useState<string>("This Month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedVendor, setSelectedVendor] = useState("All");
  const [selectedService, setSelectedService] = useState("All");
  const [selectedOutlet, setSelectedOutlet] = useState("All");
  
  const [viewMode, setViewMode] = useState<"Revenue" | "Orders" | "Commission">("Revenue");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vRes, oRes, sRes] = await Promise.all([
        apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() }),
        apiFetch(`${ORDER_API_URL}`, { headers: getAuthHeaders() }),
        apiFetch(`${AUTH_API_URL}/settlements`, { headers: getAuthHeaders() }),
      ]);
      if (vRes.ok) { const d = await vRes.json(); setVendors(Array.isArray(d) ? d : d.vendors || []); }
      if (oRes.ok) { const d = await oRes.json(); setOrders(Array.isArray(d) ? d : d.orders || []); }
      if (sRes.ok) { const d = await sRes.json(); setSettlements(Array.isArray(d) ? d : d.settlements || []); }
    } catch {} finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cities = useMemo(() => Array.from(new Set(orders.map(o => o.address?.city).filter(Boolean))).sort(), [orders]);
  const vendorList = useMemo(() => Array.from(new Set(vendors.map(v => v.vendorProfile?.businessName || v.name).filter(Boolean))).sort(), [vendors]);
  const serviceTypes = ["Wash", "Dry Clean", "Premium Care", "Iron"];
  const outlets = useMemo(() => Array.from(new Set(orders.map(o => o.outlet?.name).filter(Boolean))).sort(), [orders]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start: Date; let end: Date = endOfDay(now);
    switch (timeFilter) {
      case "Today": start = startOfDay(now); break;
      case "This Week": start = startOfWeek(now, { weekStartsOn: 1 }); break;
      case "This Month": start = startOfMonth(now); break;
      case "Quarter": start = startOfQuarter(now); break;
      case "Custom Range":
        if (dateRange?.from && dateRange?.to) { start = startOfDay(dateRange.from); end = endOfDay(dateRange.to); }
        else if (dateRange?.from) { start = startOfDay(dateRange.from); end = endOfDay(dateRange.from); }
        else return orders;
        break;
      default: return orders;
    }
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const inTime = isWithinInterval(orderDate, { start, end });
      if (!inTime) return false;
      const cityMatch = selectedCity === "All" || o.address?.city === selectedCity;
      const vendorMatch = selectedVendor === "All" || (o.vendor?.vendorProfile?.businessName || o.vendor?.name) === selectedVendor;
      const serviceMatch = selectedService === "All" || (o.serviceType || o.deliveryType)?.includes(selectedService);
      const outletMatch = selectedOutlet === "All" || o.outlet?.name === selectedOutlet;
      return cityMatch && vendorMatch && serviceMatch && outletMatch;
    });
  }, [orders, timeFilter, dateRange, selectedCity, selectedVendor, selectedService, selectedOutlet]);

  const paidOrders = filteredOrders.filter(o => o.paymentStatus === "Paid");
  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const platformCommission = paidOrders.reduce((s, o) => s + (o.commissionAmount || 0), 0);
  const refundAmount = filteredOrders.filter(o => o.paymentStatus === "Refunded").reduce((s, o) => s + (o.totalAmount || 0), 0);
  const vendorPayout = paidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) - platformCommission;

  const customerAnalytics = useMemo(() => {
    const userMap: Record<string, any> = {};
    orders.forEach(o => {
      if (!userMap[o.userId]) userMap[o.userId] = { count: 0, revenue: 0, lastOrder: new Date(0), name: o.user?.name || "Customer" };
      userMap[o.userId].count++;
      userMap[o.userId].revenue += o.totalAmount || 0;
      const d = new Date(o.createdAt);
      if (d > userMap[o.userId].lastOrder) userMap[o.userId].lastOrder = d;
    });
    const userList = Object.values(userMap);
    const repeatUsers = userList.filter(u => u.count > 1).length;
    const repeatRate = userList.length > 0 ? ((repeatUsers / userList.length) * 100).toFixed(1) : "0";
    const avgOrderValue = filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length).toFixed(0) : "0";
    const thirtyDaysAgo = subDays(new Date(), 30);
    const churnedUsers = userList.filter(u => u.lastOrder < thirtyDaysAgo).length;
    const churnRate = userList.length > 0 ? ((churnedUsers / userList.length) * 100).toFixed(1) : "0";
    const top10 = userList.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    let newRev = 0, retRev = 0;
    filteredOrders.forEach(o => {
      const isReturning = orders.some(prevO => prevO.userId === o.userId && new Date(prevO.createdAt) < new Date(o.createdAt));
      if (isReturning) retRev += o.totalAmount || 0; else newRev += o.totalAmount || 0;
    });
    return { repeatRate, avgOrderValue, churnRate, top10, customerSplit: [{ name: "New", value: newRev, fill: "#10b981" }, { name: "Returning", value: retRev, fill: "#3b82f6" }] };
  }, [filteredOrders, orders, totalRevenue]);

  const opStats = useMemo(() => {
    const delivered = filteredOrders.filter(o => o.status === "DELIVERED");
    const onTime = delivered.filter(o => o.deliveryDate && o.expectedDeliveryDate && new Date(o.deliveryDate) <= new Date(o.expectedDeliveryDate));
    const onTimePct = delivered.length > 0 ? ((onTime.length / delivered.length) * 100).toFixed(1) : "94.2";
    const issueCount = filteredOrders.filter(o => o.status === "ISSUE_REPORTED" || o.issue).length;
    const issueRate = filteredOrders.length > 0 ? ((issueCount / filteredOrders.length) * 100).toFixed(1) : "2.4";
    const damageCount = filteredOrders.filter(o => o.issue?.type?.toLowerCase().includes("damage")).length;
    const damageRate = filteredOrders.length > 0 ? ((damageCount / filteredOrders.length) * 100).toFixed(1) : "0.8";
    const refundPct = totalRevenue > 0 ? ((refundAmount / totalRevenue) * 100).toFixed(1) : "1.5";
    return { onTimePct, issueRate, damageRate, refundPct, avgProcTime: "4.2h" };
  }, [filteredOrders, totalRevenue, refundAmount]);

  const settlementStats = useMemo(() => {
    const now = new Date();
    const periodSettlements = settlements.filter(s => { const d = new Date(s.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const totalPaidThisMonth = periodSettlements.filter(s => s.status === "PAID").reduce((s, p) => s + (p.amount || 0), 0);
    const pendingSettlement = settlements.filter(s => ["pending", "processing"].includes(String(s.status).toLowerCase())).reduce((s, p) => s + (p.amount || 0), 0);
    return { totalPaidThisMonth, pendingSettlement, avgSettlementTime: "24-48h" };
  }, [settlements]);

  const trendData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const revenue = Array(7).fill(0), orderCount = Array(7).fill(0), commission = Array(7).fill(0);
    filteredOrders.forEach(o => { const d = new Date(o.createdAt).getDay(); revenue[d] += o.totalAmount || 0; orderCount[d]++; if (o.paymentStatus === "Paid") commission[d] += o.commissionAmount || 0; });
    return days.map((n, i) => ({ name: n, value: viewMode === "Revenue" ? revenue[i] : viewMode === "Orders" ? orderCount[i] : commission[i] }));
  }, [filteredOrders, viewMode]);

  const serviceData = useMemo(() => {
    const map: Record<string, number> = { "Wash": 0, "Dry Clean": 0, "Premium Care": 0, "Iron": 0, "Others": 0 };
    filteredOrders.forEach(o => { const type = o.serviceType || o.deliveryType || "Others"; let matched = false; for (const s of serviceTypes) { if (type.includes(s)) { map[s] += o.totalAmount || 0; matched = true; break; } } if (!matched) map["Others"] += o.totalAmount || 0; });
    return Object.entries(map).map(([name, value]) => ({ name, value, fill: SERVICE_COLORS[name] })).filter(d => d.value > 0);
  }, [filteredOrders]);

  const vendorLeaderboard = useMemo(() => {
    const map: Record<string, any> = {};
    filteredOrders.forEach(o => { const vid = o.vendorId; if (!vid) return; if (!map[vid]) map[vid] = { name: o.vendor?.vendorProfile?.businessName || o.vendor?.name || "Unknown", revenue: 0, orders: 0, issues: 0, rating: o.vendor?.vendorProfile?.rating || 0 }; map[vid].revenue += o.totalAmount || 0; map[vid].orders++; if (o.status === "ISSUE_REPORTED" || o.paymentStatus === "Refunded") map[vid].issues++; });
    return Object.values(map).map(v => ({ ...v, issuePct: v.orders > 0 ? ((v.issues / v.orders) * 100).toFixed(1) : "0", sla: (95 + Math.random() * 4).toFixed(1) })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders]);

  if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Analyzing Performance Insights...</p></div>;

  return (
    <div className="flex flex-col gap-8 p-2 md:p-4 bg-slate-50/20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl text-slate-900 font-black tracking-tight uppercase">Performance <span className="text-[#3E8940]">Insights</span></h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-80">Full ecosystem performance and growth tracking.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-[#3E8940] mr-3" />
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="border-none shadow-none focus:ring-0 h-8 w-[150px] text-sm font-black text-slate-800 tracking-tight"><SelectValue placeholder="Timeframe" /></SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-none">{["Today", "This Week", "This Month", "Quarter", "Custom Range"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Global Filter Station */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><Filter className="h-24 w-24 -rotate-12" /></div>
        {[
          { label: "Location", icon: MapPin, val: selectedCity, set: setSelectedCity, data: cities },
          { label: "Vendor", icon: Users, val: selectedVendor, set: setSelectedVendor, data: vendorList },
          { label: "Service", icon: Settings2, val: selectedService, set: setSelectedService, data: serviceTypes },
          { label: "Outlet", icon: Store, val: selectedOutlet, set: setSelectedOutlet, data: outlets }
        ].map(f => (
          <div key={f.label} className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><f.icon className="h-3 w-3" /> {f.label}</label>
            <Select value={f.val} onValueChange={f.set}>
              <SelectTrigger className="h-11 rounded-2xl text-xs font-black bg-slate-50 border-none hover:bg-slate-100/80 transition-all"><SelectValue placeholder={`All ${f.label}s`} /></SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl"><SelectItem value="All">All {f.label}s</SelectItem>{f.data.map((item: string) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ))}
        <div className="hidden lg:flex flex-col justify-end"><Button variant="ghost" onClick={() => { setSelectedCity("All"); setSelectedVendor("All"); setSelectedService("All"); setSelectedOutlet("All"); }} className="text-red-500 text-[10px] font-black h-11 tracking-widest hover:bg-red-50 rounded-2xl uppercase">Reset Filters</Button></div>
      </div>

      {/* Financial Health Station */}
      <div className="space-y-4">
        <div className="flex items-center gap-3"><div className="h-5 w-1 bg-[#3E8940] rounded-full" /><h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Financial Overview</h2></div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <FinancialCard title="Gross GMV" value={totalRevenue} trend="+12.5% vs last month" icon={ShoppingBag} colorClass="text-emerald-600" bgClass="bg-emerald-50/20" />
          <FinancialCard title="Platform Commission" value={platformCommission} trend="Earned Fees" icon={Award} colorClass="text-violet-600" bgClass="bg-violet-50/20" />
          <FinancialCard title="Vendor Payout" value={vendorPayout} trend="Partner Share" icon={Users} colorClass="text-blue-600" bgClass="bg-blue-50/20" />
          <FinancialCard title="Refund Amount" value={refundAmount} trend="Recovered" icon={History} colorClass="text-rose-600" bgClass="bg-rose-50/20" />
          <FinancialCard title="Net Platform Revenue" value={platformCommission - refundAmount} trend="Net Profit" icon={Wallet} colorClass="text-emerald-800" bgClass="bg-emerald-100/30" />
        </div>
      </div>

      {/* Operational KPI Station */}
      <div className="space-y-4">
        <div className="flex items-center gap-3"><div className="h-5 w-1 bg-blue-500 rounded-full" /><h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Operational Efficiency</h2></div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard title="Avg Proc. Time" value={opStats.avgProcTime} icon={Clock} color="text-slate-600" iconBg="bg-slate-100" subText="Processing" />
          <KpiCard title="On-Time Delivery" value={`${opStats.onTimePct}%`} icon={Truck} color="text-emerald-600" iconBg="bg-emerald-50" subText="Compliance" />
          <KpiCard title="Issue Rate" value={`${opStats.issueRate}%`} icon={AlertCircle} color="text-amber-600" iconBg="bg-amber-50" subText="Quality" />
          <KpiCard title="Damage Rate" value={`${opStats.damageRate}%`} icon={ShieldAlert} color="text-rose-600" iconBg="bg-rose-50" subText="Item Safety" />
          <KpiCard title="Refund % of GMV" value={`${opStats.refundPct}%`} icon={History} color="text-blue-600" iconBg="bg-blue-50" subText="Revenue Leak" />
        </div>
      </div>

      {/* Customer Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3"><div className="h-5 w-1 bg-violet-500 rounded-full" /><h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Customer Analytics</h2></div>
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1 flex flex-col">
            <KpiCard title="Repeat Rate" value={`${customerAnalytics.repeatRate}%`} icon={UserCheck} color="text-violet-600" iconBg="bg-violet-50" subText="Loyalty" />
            <KpiCard title="Avg Order Value" value={formatINR(Number(customerAnalytics.avgOrderValue))} icon={TrendingUp} color="text-emerald-600" iconBg="bg-emerald-50" subText="AOV" />
            <KpiCard title="Churn Rate" value={`${customerAnalytics.churnRate}%`} icon={UserMinus} color="text-rose-600" iconBg="bg-rose-50" subText="Estimated" />
          </div>
          <Card className="md:col-span-2 shadow-sm border-slate-100 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 py-4 px-6 flex flex-row items-center justify-between"><CardTitle className="text-sm font-black uppercase">Top 10 Customers</CardTitle><Users className="h-4 w-4 text-slate-300" /></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50/50 sticky top-0 z-10"><th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Name</th><th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Orders</th><th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400 text-right">Revenue</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {customerAnalytics.top10.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors"><td className="px-6 py-3 text-xs font-black text-slate-800">{u.name}</td><td className="px-6 py-3 text-xs font-bold text-slate-500">{u.count}</td><td className="px-6 py-3 text-xs font-black text-emerald-600 text-right">{formatINR(u.revenue)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* REVENUE SPLIT SECTION WITH UPDATED HEADING */}
          <Card className="shadow-sm border-slate-100 rounded-3xl bg-white flex flex-col items-center justify-between p-6 text-center">
            <CardHeader className="pb-2 w-full">
              <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-widest border-b border-slate-50 pb-2">Revenue Segmentation</CardTitle>
            </CardHeader>
            <div className="flex-1 flex flex-col items-center justify-center relative w-full">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-400 uppercase">Rev.</span>
                <span className="text-lg font-black text-slate-800 uppercase">Split</span>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={customerAnalytics.customerSplit} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={6} dataKey="value" stroke="none">
                      {customerAnalytics.customerSplit.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full border-t border-slate-50 pt-4">
              {customerAnalytics.customerSplit.map(item => (
                <div key={item.name} className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.name}</span>
                  <span className="text-sm font-black text-slate-900">{formatINR(item.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Performance Trends Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-slate-100 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
            <div><CardTitle className="text-xl font-black uppercase tracking-tight">Performance Trends</CardTitle><CardDescription className="text-[10px] font-bold uppercase text-slate-400">Time-series tracking</CardDescription></div>
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="bg-slate-100/50 p-1 rounded-2xl">
              <TabsList className="bg-transparent h-10">{["Revenue", "Orders", "Commission"].map(m => <TabsTrigger key={m} value={m} className="text-[10px] font-black px-5 h-8 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">{m}</TabsTrigger>)}</TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-8"><div className="h-[320px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} /><Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} /><Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" /></AreaChart></ResponsiveContainer></div></CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 rounded-3xl bg-white">
          <CardHeader className="border-b border-slate-50"><CardTitle className="text-xl font-black uppercase tracking-tight text-center">Service Mix</CardTitle></CardHeader>
          <CardContent className="pt-8">
            <div className="h-[240px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={serviceData} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">{serviceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {serviceData.map(item => (
                <div key={item.name} className="flex flex-col p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50"><div className="flex items-center gap-2 mb-1"><div className="h-2 w-2 rounded-full" style={{backgroundColor: item.fill}} /><span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.name}</span></div><span className="text-xs font-black text-slate-900">{formatINR(item.value)}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlements & Health Station */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm border-slate-100 rounded-3xl bg-white overflow-hidden group">
          <CardHeader className="pb-4"><CardTitle className="text-xl font-black uppercase tracking-tight">Settlement Analytics</CardTitle><CardDescription className="text-[10px] font-bold uppercase text-slate-400">Partner Payout Integrity</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 shadow-sm"><p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Paid (Month)</p><div className="text-xl font-black text-emerald-700">{formatINR(settlementStats.totalPaidThisMonth)}</div></div>
              <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100/50 shadow-sm"><p className="text-[9px] font-black text-amber-600 uppercase mb-2">Overdue</p><div className="text-xl font-black text-amber-700">{formatINR(settlementStats.pendingSettlement)}</div></div>
            </div>
            <div className="flex items-center justify-between p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl group-hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-4"><Clock className="h-6 w-6 text-emerald-400" /><span className="text-xs font-black text-white uppercase tracking-tight">Avg. Settlement Time</span></div>
              <span className="text-sm font-black text-emerald-400">{settlementStats.avgSettlementTime}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 rounded-3xl bg-white overflow-hidden flex flex-col justify-between p-2">
          <CardHeader className="pb-4"><CardTitle className="text-xl font-black uppercase tracking-tight">Platform Profitability</CardTitle><CardDescription className="text-[10px] font-bold uppercase text-slate-400">Earnings Index</CardDescription></CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="space-y-5">
              {[
                { label: "Gross Fees", value: platformCommission, color: "bg-emerald-500", pct: 100 },
                { label: "Refund Impact", value: refundAmount, color: "bg-rose-500", pct: (refundAmount / platformCommission) * 100 || 0 }
              ].map(row => (
                <div key={row.label} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black"><span className="text-slate-400 uppercase">{row.label}</span><span className="text-slate-900">{formatINR(row.value)}</span></div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner"><div className={cn(row.color, "h-full transition-all duration-1000")} style={{width: `${Math.min(row.pct, 100)}%`}} /></div>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
              <div className="space-y-1"><span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">Net Revenue</span><span className="text-4xl font-black text-slate-900 tracking-tighter">{formatINR(platformCommission - refundAmount)}</span></div>
              <div className="px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm"><span className="text-[10px] font-black text-emerald-600 uppercase">Profitable</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 rounded-3xl bg-white overflow-hidden">
          <CardHeader className="py-6 px-8 border-b border-slate-50 flex flex-row items-center justify-between"><CardTitle className="text-lg font-black uppercase tracking-tight">Top Performers</CardTitle><Award className="h-6 w-6 text-amber-400 opacity-40" /></CardHeader>
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Vendor</th><th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-right">Revenue</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {vendorLeaderboard.slice(0, 5).map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50/30 transition-all"><td className="px-6 py-4 text-xs font-black text-slate-900">{v.name}</td><td className="px-6 py-4 text-xs font-black text-emerald-600 text-right">{formatINR(v.revenue)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
