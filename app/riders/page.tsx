"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { Search, Filter, MoreVertical, Phone, Wallet, Ban, Eye, Loader2, AlertTriangle, RefreshCw, CheckCircle, Calendar, Bike, Star, MapPin, Activity, ShieldAlert, ShieldCheck, HeartPulse, TrendingUp, TrendingDown, Clock, UserPlus, Store, Bell, CreditCard, ChevronUp, ChevronDown, FileText, Flame, Send } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const formatINR = (a: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a);

const getRiderHealth = (r: any) => {
  const onTime = r.riderProfile?.onTimePct ?? 0;
  const rating = parseFloat(r.riderProfile?.rating ?? 0);
  const cancellations = r.riderProfile?.cancellationPct ?? 0;
  
  const ratingScore = (rating / 5) * 100;
  const cancellationScore = Math.max(0, 100 - (cancellations * 5));
  const composite = (onTime * 0.6) + (ratingScore * 0.3) + (cancellationScore * 0.1);

  if (composite >= 90) return { label: "Excellent", color: "bg-emerald-100 text-emerald-700", score: Math.round(composite) };
  if (composite >= 75) return { label: "Good", color: "bg-blue-50 text-blue-600", score: Math.round(composite) };
  if (composite >= 60) return { label: "Fair", color: "bg-amber-100 text-amber-700", score: Math.round(composite) };
  return { label: "At Risk", color: "bg-red-100 text-red-700", score: Math.round(composite) };
};

const getRiderTypeColor = (type: string) => {
  switch (type) {
    case "Full-Time": return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "Senior": return "bg-purple-100 text-purple-700 border-purple-200";
    case "High Performer": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "New Joiner": return "bg-blue-100 text-blue-700 border-blue-200";
    case "Part-Time": return "bg-amber-100 text-amber-700 border-amber-200";
    case "Contract": return "bg-orange-100 text-orange-700 border-orange-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const formatLastActive = (lastActive: string | undefined, availability: string | undefined) => {
  if (availability === 'online') return { text: 'Online Now', color: 'text-emerald-600', dot: '🟢' };
  if (!lastActive || lastActive === 'Never') return { text: 'Never seen', color: 'text-slate-400', dot: '⚫' };
  try {
    const diff = Date.now() - new Date(lastActive).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return { text: 'Just now', color: 'text-emerald-500', dot: '🟢' };
    if (mins < 60) return { text: `${mins}m ago`, color: 'text-blue-500', dot: '🔵' };
    const hours = Math.floor(mins / 60);
    if (hours < 24) return { text: `${hours}h ago`, color: 'text-amber-500', dot: '🟡' };
    const days = Math.floor(hours / 24);
    return { text: `${days}d ago`, color: 'text-red-500', dot: '🔴' };
  } catch { return { text: 'Unknown', color: 'text-slate-400', dot: '⚫' }; }
};

function RidersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [riders, setRiders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [filterType, setFilterType] = useState("all");
  const [selectedRiders, setSelectedRiders] = useState<string[]>([]);
  const [earningsStats] = useState({
    totalEarningsMonth: 145800,
    avgEarningsPerRider: 4860,
    incentivesPaid: 12400,
    pendingPayout: 32150,
  });

  const fetchRiders = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/riders`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load riders");
      const data = await res.json();
      const mappedRiders = (data.riders || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        status: r.status,
        isBlocked: r.status === "blocked",
        riderProfile: r.riderProfile || {}
      }));
      setRiders(mappedRiders);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const handleBlock = async (rider: any) => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users/${rider.id}/block`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ blocked: !rider.isBlocked }) });
      if (!res.ok) throw new Error("Failed");
      toast.success(rider.isBlocked ? "Rider unblocked" : "Rider blocked");
      fetchRiders();
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = useMemo(() => riders.filter((r) => {
    const q = searchQuery.toLowerCase();
    const match = !searchQuery || r.name?.toLowerCase().includes(q) || r.phone?.includes(q) || r.email?.toLowerCase().includes(q);
    if (filterType === "all") return match;
    if (filterType === "blocked") return match && r.isBlocked;
    if (filterType === "active") return match && !r.isBlocked;
    return match;
  }), [riders, searchQuery, filterType]);

  // Summary stats
  const activeCount = riders.filter(r => !r.isBlocked).length;
  const avgHealth = riders.length > 0 ? Math.round(riders.reduce((s, r) => s + getRiderHealth(r).score, 0) / riders.length) : 0;
  const highRisk = riders.filter(r => getRiderHealth(r).score < 75).length;
  const totalDeliveries = riders.reduce((s, r) => s + (r.riderProfile?.deliveries || 0), 0);
  const totalIncidents = riders.reduce((s, r) => s + (r.riderProfile?.incidentsCount || 0), 0);
  const totalDamageReports = riders.reduce((s, r) => s + (r.riderProfile?.damageReportsCount || 0), 0);

  if (isLoading && riders.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading riders...</p></div>;
  if (error && riders.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error}</p><Button onClick={fetchRiders} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl"><RefreshCw className="h-4 w-4" /> Retry</Button></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl md:text-3xl text-black font-bold tracking-tight">Riders</h1><p className="text-sm text-slate-500 mt-1">Manage rider performance, health, and utilization</p></div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200"><RefreshCw className="h-4 w-4" /> Sync Fleet</Button>
          <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl gap-2"><UserPlus className="h-4 w-4" /> Add Rider</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Bike className="h-5 w-5" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Fleet</p><p className="text-xl font-bold text-slate-900">{riders.length}</p></div>
          </div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="h-5 w-5" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Avg On-Time</p><p className="text-xl font-bold text-emerald-600">94.2%</p></div>
          </div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="h-5 w-5" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Avg Utilization</p><p className="text-xl font-bold text-amber-600">72%</p></div>
          </div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="h-5 w-5" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">At Risk</p><p className="text-xl font-bold text-red-600">{highRisk}</p></div>
          </div>
        </Card>
        <Card className="p-4 shadow-sm border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Flame className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Incident Count</p>
              <p className="text-xl font-bold text-orange-600">{totalIncidents + totalDamageReports}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-semibold text-orange-500">Incidents: {totalIncidents}</span>
                <span className="text-[9px] text-slate-300">|</span>
                <span className="text-[9px] font-semibold text-rose-500">Damage: {totalDamageReports}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Rider Earnings Panel */}
      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden my-6">
        <CardHeader className="border-b bg-slate-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#3E8940]" />
              <CardTitle className="text-lg font-bold text-slate-800">Rider Earnings Panel</CardTitle>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
              <FileText className="h-3 w-3" /> Reconciliation Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-4 divide-x divide-slate-100">
            <div className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Earnings (Month)</p>
              <p className="text-2xl font-black text-slate-900">₹{earningsStats.totalEarningsMonth.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-green-600 font-bold mt-2">↑ 12.5% vs last month</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Earnings / Rider</p>
              <p className="text-2xl font-black text-slate-900">₹{earningsStats.avgEarningsPerRider.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500 font-bold mt-2">Target: ₹6,000</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Incentives Paid</p>
              <p className="text-2xl font-black text-indigo-600">₹{earningsStats.incentivesPaid.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-indigo-500 font-bold mt-2">High performance bonuses</p>
            </div>
            <div className="p-6 bg-amber-50/30">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Pending Payout</p>
              <p className="text-2xl font-black text-amber-700">₹{earningsStats.pendingPayout.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-amber-500 font-bold mt-2">Scheduled for next cycle</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispatch system safeguard info */}
      <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-[#3E8940]" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Automated Dispatch Capacity Safeguard Active</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            The automated order dispatch system dynamically evaluates rider capacity. If a rider's <span className="font-semibold text-slate-700">Active Orders</span> meet or exceed their configured <span className="font-semibold text-slate-700">Max Capacity</span>, they are flagged as <span className="font-bold text-red-600">OVERLOADED</span> and are automatically excluded from new automated assignments to safeguard fulfillment SLAs.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search by name, zone, phone..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-40 rounded-xl bg-slate-50 border-none"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select>
        </div>
        
        {/* Bulk Actions */}
        <div className={cn(
          "flex items-center gap-2 p-2 px-3 rounded-xl border transition-all",
          selectedRiders.length > 0 
            ? "bg-emerald-50 border-emerald-200 shadow-sm" 
            : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-center gap-2 mr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bulk Actions</span>
            {selectedRiders.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-bold px-1.5 h-5">
                {selectedRiders.length} selected
              </Badge>
            )}
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <Button 
            size="sm" 
            variant="ghost" 
            className={cn(
              "h-7 text-[10px] font-bold gap-1 rounded-lg",
              selectedRiders.length > 0 
                ? "text-red-600 hover:bg-red-100" 
                : "text-slate-400 cursor-not-allowed"
            )}
            disabled={selectedRiders.length === 0}
            onClick={() => { toast.info(`Blocking ${selectedRiders.length} riders...`); }}
          >
            <Ban className="h-3 w-3" /> Block Selected
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className={cn(
              "h-7 text-[10px] font-bold gap-1 rounded-lg",
              selectedRiders.length > 0 
                ? "text-blue-600 hover:bg-blue-100" 
                : "text-slate-400 cursor-not-allowed"
            )}
            disabled={selectedRiders.length === 0}
            onClick={() => { toast.info(`Assigning zone for ${selectedRiders.length} riders...`); }}
          >
            <MapPin className="h-3 w-3" /> Assign Zone
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className={cn(
              "h-7 text-[10px] font-bold gap-1 rounded-lg",
              selectedRiders.length > 0 
                ? "text-emerald-700 hover:bg-emerald-100" 
                : "text-slate-400 cursor-not-allowed"
            )}
            disabled={selectedRiders.length === 0}
            onClick={() => { toast.info(`Sending notification to ${selectedRiders.length} riders...`); }}
          >
            <Send className="h-3 w-3" /> Send Notification
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className={cn(
              "h-7 text-[10px] font-bold gap-1 rounded-lg",
              selectedRiders.length > 0 
                ? "text-purple-600 hover:bg-purple-100" 
                : "text-slate-400 cursor-not-allowed"
            )}
            disabled={selectedRiders.length === 0}
            onClick={() => { toast.info(`Processing payout for ${selectedRiders.length} riders...`); }}
          >
            <CreditCard className="h-3 w-3" /> Process Payout
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <Table className="min-w-[1900px] w-full">
            <TableHeader><TableRow className="hover:bg-slate-50/50 border-none bg-slate-50/50">
            <TableHead className="w-[40px] pl-4"><Checkbox checked={selectedRiders.length === filtered.length && filtered.length > 0} onCheckedChange={(val) => val ? setSelectedRiders(filtered.map(r => r.id)) : setSelectedRiders([])} /></TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider">Rider Name</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider">Contact</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider">Assigned Zone</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider">Assigned Outlet</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider">Performance</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center">Rider Utilization</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center">Active Orders</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center">Late Delivery %</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center">Failed Pickups</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center">Avg Pickup Delay</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center">Earnings/Settlement</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center">Cost-to-Platform</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center">Status</TableHead>
            <TableHead className="w-[50px] pr-4"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((r) => {
              const health = getRiderHealth(r);
              const p = r.riderProfile;
              const isSelected = selectedRiders.includes(r.id);

              // Availability indicator
              const availMap: Record<string, { dot: string; label: string; color: string }> = {
                online: { dot: "🟢", label: "Online", color: "text-emerald-600" },
                on_delivery: { dot: "🟡", label: "On Delivery", color: "text-amber-600" },
                offline: { dot: "🔴", label: "Offline", color: "text-red-500" },
                suspended: { dot: "⚫", label: "Suspended", color: "text-slate-500" },
              };
              const avail = availMap[p.availability] || availMap.offline;

              return (
              <TableRow key={r.id} className={cn("hover:bg-slate-50 transition-colors cursor-pointer border-slate-100", isSelected && "bg-emerald-50/30")}>
                <TableCell className="pl-4"><Checkbox checked={isSelected} onCheckedChange={(val) => val ? setSelectedRiders(prev => [...prev, r.id]) : setSelectedRiders(prev => prev.filter(id => id !== r.id))} onClick={(e) => e.stopPropagation()} /></TableCell>
                
                {/* Rider Name */}
                <TableCell className="py-4" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border shadow-sm"><AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">{(r.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                      <Badge className={cn("text-[8px] font-black uppercase tracking-tighter px-1 py-0 rounded-md border-none", getRiderTypeColor(p.type))}>{p.type}</Badge>
                    </div>
                  </div>
                </TableCell>

                {/* Contact */}
                <TableCell onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1"><Phone className="h-2.5 w-2.5 text-slate-400" /> {r.phone}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{r.email}</p>
                  </div>
                </TableCell>

                {/* Assigned Zone */}
                <TableCell onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                       <MapPin className="h-3 w-3 text-blue-500" /> {p.zone || "Not Assigned"}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 pl-4">
                       Cluster: {p.cluster || "NCR"}
                    </p>
                  </div>
                </TableCell>

                {/* Assigned Outlet */}
                <TableCell onClick={() => router.push(`/rider/${r.id}`)}>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-[#3E8940]" /> {p.assignedVendor || "Unassigned Outlet"}
                  </p>
                </TableCell>

                {/* Performance */}
                <TableCell className="text-xs font-medium" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 text-xs">Orders: <span className="font-bold text-[#3E8940]">{p.deliveries || 0}</span></p>
                    <p className="text-[11px] text-slate-500 font-medium">On-Time: <span className="text-indigo-600 font-bold">{p.onTimePct != null ? `${Math.round(p.onTimePct)}%` : "—"}</span></p>
                    <p className="text-[11px] text-slate-500 font-medium">Rating: {p.rating != null ? (() => { const curr = parseFloat(String(p.rating)); const prev = p.previousRating != null ? parseFloat(String(p.previousRating)) : curr; const trend = curr > prev ? "up" : curr < prev ? "down" : "neutral"; return (<span className={cn("font-bold", trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-amber-600")}>⭐ {curr.toFixed(1)} {trend === "up" ? <TrendingUp className="inline h-3 w-3 ml-0.5" /> : trend === "down" ? <TrendingDown className="inline h-3 w-3 ml-0.5" /> : null}</span>); })() : <span className="text-amber-600 font-bold">—</span>}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Cancellation: <span className="text-rose-600 font-bold">{p.cancellationPct != null ? `${p.cancellationPct}%` : "—"}</span></p>
                    <p className="text-[11px] text-slate-500 font-medium">Today: <span className="text-emerald-600 font-bold">{p.deliveriesToday || 0}</span></p>
                    <p className="text-[11px] text-slate-500 font-medium">Complaints: <span className="text-red-500 font-bold">{p.complaintsCount || 0}</span></p>
                    <p className="text-[11px] text-slate-500 font-medium">Incidents: <span className="text-orange-600 font-bold">{p.incidentsCount || 0}</span></p>
                    <p className="text-[11px] text-slate-500 font-medium">Damage Reports: <span className="text-rose-700 font-bold">{p.damageReportsCount || 0}</span></p>
                  </div>
                </TableCell>

                {/* Rider Utilization */}
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-semibold text-slate-500">Active Days (30d)</span>
                        <span className={cn("text-[10px] font-bold", (p.activeDays30 || 0) >= 25 ? "text-emerald-600" : (p.activeDays30 || 0) >= 15 ? "text-amber-600" : "text-red-500")}>{p.activeDays30 || 0}/30</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", (p.activeDays30 || 0) >= 25 ? "bg-emerald-500" : (p.activeDays30 || 0) >= 15 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${Math.min(100, ((p.activeDays30 || 0) / 30) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-semibold text-slate-500">Total Hours</span>
                        <span className={cn("text-[10px] font-bold", (p.totalActiveHours || 0) >= 180 ? "text-emerald-600" : (p.totalActiveHours || 0) >= 100 ? "text-amber-600" : "text-red-500")}>{p.totalActiveHours || 0}h</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", (p.totalActiveHours || 0) >= 180 ? "bg-emerald-500" : (p.totalActiveHours || 0) >= 100 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${Math.min(100, ((p.totalActiveHours || 0) / 240) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="flex flex-col items-center">
                    <p className={cn("text-sm font-bold", p.activeOrders >= p.maxCapacity ? "text-red-600" : "text-slate-900")}>
                      {p.activeOrders} <span className="text-slate-400 font-normal">/ {p.maxCapacity}</span>
                    </p>
                    <p className="text-[9px] text-slate-400">Load Factor: {Math.round((p.activeOrders / (p.maxCapacity || 1)) * 100)}%</p>
                    {p.activeOrders >= p.maxCapacity && <Badge className="text-[7px] bg-red-100 text-red-700 border-none px-1 h-3 uppercase">Overloaded</Badge>}
                  </div>
                </TableCell>

                {/* Late Delivery % */}
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                   <p className={cn("text-sm font-bold", p.lateDeliveryPct > 8 ? "text-red-600" : "text-slate-600")}>{p.lateDeliveryPct}%</p>
                </TableCell>

                {/* Failed Pickups */}
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                   <p className={cn("text-sm font-bold", p.failedPickups > 0 ? "text-red-600" : "text-slate-600")}>{p.failedPickups}</p>
                   {p.failedPickups > 0 && <span className="text-[8px] font-black text-red-400 uppercase">Alert</span>}
                </TableCell>

                {/* Avg Pickup Delay */}
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <p className={cn("text-sm font-bold", p.avgPickupDelay > 10 ? "text-red-600" : "text-emerald-600")}>{p.avgPickupDelay} min</p>
                </TableCell>

                {/* Earnings/Settlement */}
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="bg-slate-50/30 rounded-xl p-2 inline-block min-w-[120px]">
                    <p className="font-black text-[#3E8940] text-sm mb-0.5">
                      {formatINR((p.earningsPending || 0) + (p.incentivesPending || 0))}
                    </p>
                    <p className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Net Settlement Due</p>
                    <div className="flex items-center justify-between gap-3 px-1 border-t border-slate-200/40 pt-1.5">
                       <div className="text-left">
                         <p className="text-[7px] uppercase font-bold text-slate-400 leading-none">Earnings</p>
                         <p className="text-[10px] font-bold text-slate-700">{formatINR(p.earningsPending || 0)}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[7px] uppercase font-bold text-indigo-400 leading-none">Incentives</p>
                         <p className="text-[10px] font-bold text-indigo-600">{formatINR(p.incentivesPending || 0)}</p>
                       </div>
                    </div>
                  </div>
                </TableCell>

                {/* Cost-to-Platform */}
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  {(() => {
                    const totalDel = p.deliveries || 0;
                    const totalEarn = (p.earningsPending || 0) + (p.incentivesPending || 0) + (p.earningsSettled || 0);
                    const costPerDel = totalDel > 0 ? totalEarn / totalDel : 0;
                    const isEfficient = costPerDel > 0 && costPerDel < 50;
                    const isModerate = costPerDel >= 50 && costPerDel <= 80;
                    return (
                      <div className="bg-slate-50/50 rounded-xl p-2 inline-block min-w-[110px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] uppercase font-bold text-slate-400">Deliveries</span>
                            <span className="text-[11px] font-bold text-slate-800">{totalDel}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] uppercase font-bold text-slate-400">Earnings</span>
                            <span className="text-[11px] font-bold text-slate-700">{formatINR(totalEarn)}</span>
                          </div>
                          <div className="border-t border-slate-200/60 pt-1 mt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] uppercase font-bold text-slate-400">Cost/Delivery</span>
                              <span className={cn("text-[11px] font-black", isEfficient ? "text-emerald-600" : isModerate ? "text-amber-600" : "text-red-600")}>
                                {totalDel > 0 ? formatINR(Math.round(costPerDel)) : "—"}
                              </span>
                            </div>
                            {totalDel > 0 && (
                              <Badge className={cn("text-[7px] font-black uppercase border-none px-1 h-3 mt-0.5", isEfficient ? "bg-emerald-100 text-emerald-700" : isModerate ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                                {isEfficient ? "Efficient" : isModerate ? "Moderate" : "High Cost"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </TableCell>

                {/* Status */}
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="flex flex-col items-center">
                    <p className={cn("text-xs font-bold flex items-center gap-1", avail.color)}>
                      <span>{avail.dot}</span> {avail.label}
                    </p>
                    {(() => { const la = formatLastActive(p.lastActive, p.availability); return (
                      <p className={cn("text-[9px] font-semibold flex items-center gap-0.5", la.color)}>
                        <span className="text-[8px]">{la.dot}</span> {la.text}
                      </p>
                    ); })()}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="pr-4 text-right">
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl w-52">
                      <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/rider/${r.id}`); }}><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-600" onClick={(e) => { e.stopPropagation(); handleBlock(r); }}><Ban className="h-4 w-4" /> {r.isBlocked ? "Unblock" : "Block"} Access</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            }) : <TableRow><TableCell colSpan={14} className="h-48 text-center text-slate-500">No riders found.</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
        <div className="flex items-center justify-between p-4 border-t"><p className="text-sm text-slate-500">Showing {filtered.length} of {riders.length} riders</p></div>
      </div>
    </div>
  );
}

export default function RidersAllPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm text-slate-500">Loading riders...</p>
      </div>
    }>
      <RidersContent />
    </Suspense>
  );
}
