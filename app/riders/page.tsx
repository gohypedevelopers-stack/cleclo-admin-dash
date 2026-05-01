"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { Search, Filter, MoreVertical, Phone, Wallet, Ban, Eye, Loader2, AlertTriangle, RefreshCw, CheckCircle, Calendar, Bike, Star, MapPin, Activity, ShieldAlert, HeartPulse, TrendingUp, TrendingDown, Clock, UserPlus, Store, Bell, CreditCard, ChevronUp, ChevronDown } from "lucide-react";
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
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
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

  const fetchRiders = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load riders");
      const data = await res.json();
      const all = Array.isArray(data) ? data : data.users || [];
      const types = ["Full-Time", "Part-Time", "Contract", "Senior", "New Joiner", "High Performer"];
      const zones = ["Gurgaon Sector 29", "Noida Sector 62", "Delhi CP", "Bangalore Indiranagar", "Mumbai BKC"];
      const outlets = ["Masterclean Experience Store", "Cleclo Hub - South", "Express Point Center"];

      const mappedRiders = all.filter((u: any) => u.role === "rider").map((r: any, idx: number) => {
        const wallet = r.walletBalance || (Math.floor(Math.random() * 5000));
        const deliveries = r.totalOrders || Math.floor(Math.random() * 500);
        return {
          ...r,
          walletBalance: wallet,
          riderProfile: r.riderProfile || {
            type: types[idx % types.length],
            deliveries,
            onTimePct: Math.floor(Math.random() * 15) + 85,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            ratingTrend: Math.random() > 0.5 ? "up" : "down",
            cancellationPct: Math.floor(Math.random() * 5),
            deliveriesToday: Math.floor(Math.random() * 15),
            complaints: Math.floor(Math.random() * 3),
            zone: zones[idx % zones.length],
            outlet: outlets[idx % outlets.length],
            lastActive: Math.random() > 0.7 ? "Online Now" : `${Math.floor(Math.random() * 10) + 1}h ago`,
            incidents: Math.floor(Math.random() * 4),
            damageReports: Math.floor(Math.random() * 2),
            activeDays: Math.floor(Math.random() * 25) + 5,
            activeHours: Math.floor(Math.random() * 160) + 40,
            costPerDelivery: wallet > 0 && deliveries > 0 ? (wallet / deliveries).toFixed(1) : "45.0"
          }
        };
      });
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search by name, zone, phone..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-40 rounded-xl bg-slate-50 border-none"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select>
        </div>
        
        {selectedRiders.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 p-2 px-3 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-right-4">
            <span className="text-xs font-bold text-emerald-700">{selectedRiders.length} Selected</span>
            <div className="h-4 w-px bg-emerald-200 mx-1" />
            <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 gap-1"><Bell className="h-3 w-3" /> Notify</Button>
            <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 gap-1"><MapPin className="h-3 w-3" /> Assign Zone</Button>
            <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-red-600 hover:bg-red-100 gap-1" onClick={() => setSelectedRiders([])}><Ban className="h-3 w-3" /> Block</Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <Table className="min-w-[1400px] w-full">
            <TableHeader><TableRow className="hover:bg-slate-50/50 border-none bg-slate-50/50">
            <TableHead className="w-[40px] pl-4"><Checkbox checked={selectedRiders.length === filtered.length && filtered.length > 0} onCheckedChange={(val) => val ? setSelectedRiders(filtered.map(r => r.id)) : setSelectedRiders([])} /></TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider w-[200px]">Rider & Type</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider w-[180px]">Zone / Outlet</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center w-[150px]">Performance Today</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center w-[120px]">SLA & Quality</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center w-[130px]">Incidents</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center w-[130px]">Utilization</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center w-[130px]">Economics</TableHead>
            <TableHead className="text-[10px] font-bold uppercase text-slate-400 py-4 tracking-wider text-center w-[120px]">Status</TableHead>
            <TableHead className="w-[50px] pr-4"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((r) => {
              const health = getRiderHealth(r);
              const p = r.riderProfile;
              const isSelected = selectedRiders.includes(r.id);
              return (
              <TableRow key={r.id} className={cn("hover:bg-slate-50 transition-colors cursor-pointer border-slate-100", isSelected && "bg-emerald-50/30")}>
                <TableCell className="pl-4"><Checkbox checked={isSelected} onCheckedChange={(val) => val ? setSelectedRiders(prev => [...prev, r.id]) : setSelectedRiders(prev => prev.filter(id => id !== r.id))} onClick={(e) => e.stopPropagation()} /></TableCell>
                <TableCell className="py-4" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border shadow-sm"><AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">{(r.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                      <Badge className={cn("text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 rounded-md border-none", getRiderTypeColor(p.type))}>{p.type}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-400" /> {p.zone}</p>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5"><Store className="h-3 w-3" /> {p.outlet}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{p.deliveriesToday} Today</p>
                    <p className="text-[10px] text-slate-400 font-medium">{p.deliveries} Total</p>
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-slate-700">{p.rating}</span>
                      {p.ratingTrend === "up" ? <TrendingUp className="h-2.5 w-2.5 text-emerald-500" /> : <TrendingDown className="h-2.5 w-2.5 text-red-500" />}
                    </div>
                    <p className="text-[10px] font-bold text-emerald-600">{p.onTimePct}% On-Time</p>
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-1">
                    <p className={cn("text-xs font-bold", p.incidents > 0 ? "text-red-600" : "text-slate-500")}>{p.incidents} Incidents</p>
                    <p className="text-[10px] text-slate-400 font-medium">{p.complaints} Complaints</p>
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">{p.activeDays} Days Active</p>
                    <p className="text-[10px] text-slate-400 font-medium">{p.activeHours} Total Hours</p>
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-1">
                    <p className="font-bold text-[#3E8940] text-sm">{formatINR(r.walletBalance)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">₹{p.costPerDelivery}/del</p>
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={() => router.push(`/rider/${r.id}`)}>
                  <div className="space-y-1.5 flex flex-col items-center">
                    <Badge variant="outline" className={cn("border-none font-bold text-[10px] rounded-full px-3 py-0.5", r.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>{r.isBlocked ? "Blocked" : "Active"}</Badge>
                    <p className={cn("text-[9px] font-bold flex items-center gap-1", p.lastActive === "Online Now" ? "text-emerald-500" : "text-slate-400")}>
                      <Activity className="h-2 w-2" /> {p.lastActive}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/rider/${r.id}`); }}><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); }}><Bell className="h-4 w-4" /> Send Alert</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); }}><CreditCard className="h-4 w-4" /> Process Payout</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-600" onClick={(e) => { e.stopPropagation(); handleBlock(r); }}><Ban className="h-4 w-4" /> {r.isBlocked ? "Unblock" : "Block"} Access</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            }) : <TableRow><TableCell colSpan={10} className="h-48 text-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 opacity-20" /> No riders found matching your criteria.</TableCell></TableRow>}
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
