"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, Filter, Users, Star, MapPin, CheckCircle, Clock, Ban, Loader2, AlertTriangle, RefreshCw, Phone, TrendingUp, IndianRupee, ShieldAlert, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, BarChart2, Wallet, Percent, Settings2, CalendarClock, AlertOctagon, Bell } from "lucide-react";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const getStatusColor = (s: string) => { 
  switch (s) { 
    case "Active": return "bg-green-100 text-green-700 border-green-200"; 
    case "Live but No Orders": return "bg-blue-100 text-blue-700 border-blue-200";
    case "Verification Pending": return "bg-amber-100 text-amber-700 border-amber-200"; 
    case "Suspended": return "bg-red-100 text-red-700 border-red-200"; 
    default: return "bg-gray-100 text-gray-700"; 
  } 
};

const getVendorTier = (v: any) => {
  // Use performanceTier from backend if available, otherwise calculate locally
  if (v.vendorProfile?.performanceTier) {
    const tier = v.vendorProfile.performanceTier;
    return {
      label: tier.label,
      emoji: tier.badge.split(' ')[0],
      color: tier.color + " border-transparent"
    };
  }

  const sla = v.vendorProfile?.slaScore ?? 0;
  const rating = v.vendorProfile?.rating ?? 0;
  
  if (sla > 95 && rating > 4.7) 
    return { label: "Gold", emoji: "🥇", color: "bg-amber-100 text-amber-700 border-amber-200" };
  if (sla >= 85 && sla <= 95) 
    return { label: "Silver", emoji: "🥈", color: "bg-slate-100 text-slate-700 border-slate-200" };
  if (sla < 80) 
    return { label: "Probation", emoji: "⚠️", color: "bg-red-100 text-red-700 border-red-200" };
  return { label: "Standard", emoji: "⭐", color: "bg-blue-100 text-blue-700 border-blue-200" };
};

export default function AllVendorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [clusterFilter, setClusterFilter] = useState("all");

  const fetchVendors = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); const data = await res.json();
      setVendors(Array.isArray(data) ? data : data.vendors || []);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const filtered = useMemo(() => {
    const filteredByStatus = statusFilter === "all" ? vendors : vendors.filter(v => {
      const status = v.isBlocked ? "suspended" : !v.vendorProfile?.isApproved ? "pending" : "active";
      return status === statusFilter;
    });

    return filteredByStatus.filter(v => {
      const name = (v.vendorProfile?.businessName || v.name).toLowerCase();
      const phone = (v.phone || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.includes(query) || phone.includes(query);

      const city = (v.vendorProfile?.city || "all").toLowerCase();
      const area = (v.vendorProfile?.area || "all").toLowerCase();
      const cluster = (v.vendorProfile?.cluster || "all").toLowerCase();

      const matchesCity = cityFilter === "all" || city === cityFilter.toLowerCase();
      const matchesArea = areaFilter === "all" || area === areaFilter.toLowerCase();
      const matchesCluster = clusterFilter === "all" || cluster === clusterFilter.toLowerCase();

      return matchesSearch && matchesCity && matchesArea && matchesCluster;
    });
  }, [vendors, searchQuery, statusFilter, cityFilter, areaFilter, clusterFilter]);

  // Summary stats
  const activeCount = vendors.filter(v => v.vendorProfile?.isApproved && !v.isBlocked).length;
  const pendingCount = vendors.filter(v => !v.vendorProfile?.isApproved && !v.isBlocked).length;
  const totalRevenue = vendors.reduce((s, v) => s + (v.vendorProfile?.totalRevenue || 0), 0);
  const revenueThisMonth = vendors.reduce((s, v) => s + (v.vendorProfile?.revenueThisMonth || 0), 0);
  const totalCommission = vendors.reduce((s, v) => s + (v.vendorProfile?.commissionEarned || 0), 0);
  const totalPayoutDue = vendors.reduce((s, v) => s + (v.vendorProfile?.payoutPending || 0), 0);
  const totalRefunds = vendors.reduce((s, v) => s + (v.vendorProfile?.refundAmount || 0), 0);
  const uniqueCities = useMemo(() => Array.from(new Set(vendors.map(v => v.vendorProfile?.city).filter(Boolean))), [vendors]);
  const uniqueAreas = useMemo(() => Array.from(new Set(vendors.map(v => v.vendorProfile?.area).filter(Boolean))), [vendors]);
  const uniqueClusters = useMemo(() => Array.from(new Set(vendors.map(v => v.vendorProfile?.cluster).filter(Boolean))), [vendors]);
  const avgSla = vendors.length > 0 ? Math.round(vendors.reduce((s, v) => s + (v.vendorProfile?.slaScore || 0), 0) / Math.max(vendors.length, 1)) : 0;

  if (isLoading && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading vendors...</p></div>;
  if (error && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error}</p><Button onClick={fetchVendors} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl"><RefreshCw className="h-4 w-4" /> Retry</Button></div>;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-3xl text-black font-bold tracking-tight">All Vendors</h1><p className="text-slate-500 mt-1">Full list of all registered vendor accounts with financial performance.</p></div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-slate-700">{vendors.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Vendors</p>
          <p className="text-xs text-slate-500 mt-0.5">{activeCount} active · {pendingCount} pending</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-emerald-600">{formatINR(revenueThisMonth)}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Revenue This Month</p>
          <p className="text-xs text-slate-500 mt-0.5">Total: {formatINR(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-blue-600">{formatINR(totalCommission)}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Commission Earned</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-orange-600">{formatINR(totalPayoutDue)}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Payout Due</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-indigo-600">{avgSla}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Avg SLA Score</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-purple-600">{activeCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Now</p>
          <p className="text-xs text-emerald-500 mt-0.5">● Online</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by name or phone..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 rounded-xl bg-slate-50 border-none"><Filter className="h-4 w-4 mr-2 text-slate-500" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Verification Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
          </Select>
          
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-40 rounded-xl bg-slate-50 border-none"><MapPin className="h-4 w-4 mr-2 text-slate-500" /><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {uniqueCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-40 rounded-xl bg-slate-50 border-none"><MapPin className="h-4 w-4 mr-2 text-slate-500" /><SelectValue placeholder="Area" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {uniqueAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={clusterFilter} onValueChange={setClusterFilter}>
            <SelectTrigger className="w-40 rounded-xl bg-slate-50 border-none"><MapPin className="h-4 w-4 mr-2 text-slate-500" /><SelectValue placeholder="Cluster" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clusters</SelectItem>
              {uniqueClusters.map(cluster => <SelectItem key={cluster} value={cluster}>{cluster}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">Vendor</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Revenue This Month</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Avg Order Value</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Refund Amount</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Commission Earned</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Performance Index</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Tier</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Type</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Capacity / Load</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Coverage</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Agreement</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((v) => {
              const name = v.vendorProfile?.businessName || v.name;
              const totalOrders = v.vendorProfile?.totalOrders || 0;
              const isApproved = v.vendorProfile?.isApproved;
              
              let status = "Verification Pending";
              if (v.isBlocked) status = "Suspended";
              else if (isApproved && totalOrders > 0) status = "Active";
              else if (isApproved && totalOrders === 0) status = "Live but No Orders";
              
              const city = v.addresses?.[0]?.city || "—";
              const revenue = v.vendorProfile?.totalRevenue || 0;
              const commission = v.vendorProfile?.commissionEarned || 0;
              const payoutDue = v.vendorProfile?.payoutPending || 0;
              const refundAmount = v.vendorProfile?.refundAmount || 0;
              const sla = v.vendorProfile?.slaScore || 0;
              const rating = v.vendorProfile?.rating || 0;
              const issueRate = v.vendorProfile?.issueRate || 0;
              const tier = getVendorTier(v);
              const commRate = v.vendorProfile?.commissionRate || 0;

              return (
                <TableRow key={v.id} className="hover:bg-slate-50/80 cursor-pointer group" onClick={() => router.push(`/vendors/${v.id}`)}>
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border shadow-sm"><AvatarFallback className={`font-bold ${status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-700"}`}>{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors text-sm">{name}</p>
                        <p className="text-[10px] text-slate-400">{v.vendorProfile?.ownerName || v.name} · {commRate}% comm.</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="text-sm font-bold text-emerald-700">{formatINR(v.vendorProfile?.revenueThisMonth || 0)}</p>
                      <p className="text-[10px] text-slate-400">Total: {formatINR(revenue)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-bold text-slate-700 text-center">
                      {formatINR(totalOrders > 0 ? (revenue / totalOrders) : 0)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className={`text-sm font-bold text-center ${refundAmount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {refundAmount > 0 ? formatINR(refundAmount) : "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="text-sm font-bold text-blue-600">{commission > 0 ? formatINR(commission) : "—"}</p>
                      <p className="text-[10px] text-slate-400">{commRate}% rate</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <div className="flex flex-col items-center gap-1">
                      {rating > 0 ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-100">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-black text-slate-700">{rating.toFixed(1)}</span>
                        </div>
                      ) : <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">No Rating</span>}
                      
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <div className="flex items-center justify-between gap-3 min-w-[80px]">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">SLA:</span>
                          <span className={`text-[10px] font-black ${sla >= 90 ? "text-emerald-600" : sla >= 80 ? "text-amber-600" : "text-rose-600"}`}>
                            {sla > 0 ? `${sla}%` : "0%"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 min-w-[80px]">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Issue:</span>
                          <span className={`text-[10px] font-black ${issueRate > 5 ? "text-rose-600" : issueRate > 2 ? "text-amber-600" : "text-emerald-600"}`}>
                            {issueRate > 0 ? `${issueRate}%` : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`${tier.color} border font-black text-[10px] px-2.5 py-0.5 gap-1 shadow-sm`}>
                      <span>{tier.emoji}</span>
                      <span>{tier.label.toUpperCase()}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const type = v.vendorProfile?.businessType || "Standard Store";
                      const config: Record<string, { label: string; icon: string; color: string }> = {
                        "Experience Store": { label: "Experience", icon: "🏢", color: "bg-purple-50 text-purple-600 border-purple-100" },
                        "Standard Store": { label: "Standard", icon: "🏬", color: "bg-blue-50 text-blue-600 border-blue-100" },
                        "Processing Hub": { label: "Processing", icon: "🏭", color: "bg-orange-50 text-orange-600 border-orange-100" },
                        "Collection Centre": { label: "Collection", icon: "📦", color: "bg-slate-50 text-slate-600 border-slate-100" },
                      };
                      const item = config[type] || config["Standard Store"];
                      return (
                        <Badge variant="outline" className={`${item.color} border font-black text-[9px] px-2 py-0.5 gap-1 shadow-sm`}>
                          <span>{item.icon}</span>
                          <span>{item.label.toUpperCase()}</span>
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    {(() => {
                      const capacity = v.vendorProfile?.dailyCapacity || 0;
                      const load = v.vendorProfile?.currentLoad || 0;
                      const loadPercent = capacity > 0 ? Math.min(Math.round((load / capacity) * 100), 100) : 0;
                      const loadColor = loadPercent >= 90 ? "bg-rose-500" : loadPercent >= 70 ? "bg-amber-500" : "bg-emerald-500";
                      
                      return capacity > 0 ? (
                        <div className="flex flex-col items-center gap-1.5 min-w-[100px] mx-auto">
                           <div className="flex items-center justify-between w-full px-1">
                             <span className="text-[10px] font-black text-slate-700">{load}/{capacity}</span>
                             <span className={`text-[10px] font-bold ${loadPercent >= 90 ? "text-rose-600" : "text-slate-500"}`}>{loadPercent}%</span>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                             <div className={`h-full ${loadColor} transition-all duration-500`} style={{ width: `${loadPercent}%` }} />
                           </div>
                           {loadPercent >= 95 && (
                              <span className="text-[8px] font-black text-rose-600 mt-0.5 animate-pulse">LIMIT ACTIVE</span>
                           )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Not Set</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                     <div className="flex flex-col items-center gap-1 max-w-[150px] mx-auto">
                        <p className="text-[10px] font-bold text-slate-700 truncate w-full">{v.vendorProfile?.areaCoverage || "Not Defined"}</p>
                        <p className="text-[9px] text-slate-400">{v.vendorProfile?.city || city}</p>
                     </div>
                  </TableCell>
                  <TableCell className="text-center">
                     <div className="flex flex-col items-center gap-0.5">
                        <span className={cn("text-[10px] font-black", new Date(v.vendorProfile?.agreementExpiry || '2026-12-31') < new Date() ? "text-rose-600" : "text-slate-700")}>
                           {formatDate(v.vendorProfile?.agreementExpiry || '2026-12-31')}
                        </span>
                        {new Date(v.vendorProfile?.agreementExpiry || '2026-12-31') < new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) && (
                           <span className="text-[8px] font-bold text-rose-500 uppercase animate-pulse">EXPIRING</span>
                        )}
                     </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`${getStatusColor(status)} font-bold gap-1.5 px-2.5 py-1 text-[10px] shadow-sm`}>
                      {status === "Active" && <CheckCircle className="h-3 w-3" />}
                      {status === "Verification Pending" && <Clock className="h-3 w-3" />}
                      {status === "Live but No Orders" && <Zap className="h-3 w-3" />}
                      {status === "Suspended" && <Ban className="h-3 w-3" />}
                      {status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="sm" className="text-slate-500 font-bold hover:bg-slate-100 hover:text-[#3E8940]" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${v.id}`); }}>View</Button>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200">
                             <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Quick Actions</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 cursor-pointer" onClick={() => router.push(`/vendor/analytics?vendorId=${v.id}`)}>
                                <BarChart2 className="h-3.5 w-3.5 text-blue-500" /> View Performance Dashboard
                             </DropdownMenuItem>
                             <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 cursor-pointer" onClick={() => router.push(`/vendor/payments?vendorId=${v.id}`)}>
                                <Wallet className="h-3.5 w-3.5 text-emerald-500" /> View Settlements
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 cursor-pointer">
                                <Percent className="h-3.5 w-3.5 text-amber-500" /> Adjust Commission %
                             </DropdownMenuItem>
                             <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 cursor-pointer">
                                <Settings2 className="h-3.5 w-3.5 text-slate-500" /> Set SLA Override
                             </DropdownMenuItem>
                             <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 cursor-pointer">
                                <Bell className="h-3.5 w-3.5 text-orange-500" /> Send Warning Notice
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-xs font-bold gap-2 py-2.5 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                                <AlertOctagon className="h-3.5 w-3.5" /> Suspend Temporarily
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : <TableRow><TableCell colSpan={11} className="h-32 text-center text-slate-500"><div className="flex flex-col items-center gap-2"><Search className="h-8 w-8 text-slate-300" /><p>No vendors found.</p></div></TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50 text-xs text-slate-500"><p>Showing <strong>{filtered.length}</strong> vendors</p></div>
      </div>
    </div>
  );
}
