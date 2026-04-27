"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, Users, Star, MapPin, CheckCircle, Clock, Ban, Loader2, AlertTriangle, RefreshCw, Phone, TrendingUp, IndianRupee, ShieldAlert, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const getStatusColor = (s: string) => { switch (s) { case "Active": return "bg-green-100 text-green-700 border-green-200"; case "Pending": return "bg-amber-100 text-amber-700 border-amber-200"; case "Suspended": return "bg-red-100 text-red-700 border-red-200"; default: return "bg-gray-100 text-gray-700"; } };

const getVendorTier = (v: any) => {
  const sla = v.vendorProfile?.slaScore ?? 0;
  const rating = v.vendorProfile?.rating ?? 0;
  const issueRate = v.vendorProfile?.issueRate ?? 0;
  if (sla >= 95 && rating >= 4.7 && issueRate <= 2) return { label: "Gold", emoji: "🥇", color: "bg-amber-100 text-amber-700" };
  if (sla >= 85 && rating >= 4.0) return { label: "Silver", emoji: "🥈", color: "bg-slate-100 text-slate-600" };
  if (sla < 80 || rating < 3.5 || issueRate > 5) return { label: "Probation", emoji: "⚠️", color: "bg-red-100 text-red-700" };
  return { label: "Standard", emoji: "", color: "bg-blue-50 text-blue-600" };
};

export default function AllVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchVendors = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); const data = await res.json();
      setVendors(Array.isArray(data) ? data : data.vendors || []);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const filtered = useMemo(() => vendors.filter((v) => {
    const name = v.vendorProfile?.businessName || v.name;
    const q = searchQuery.toLowerCase();
    const match = !searchQuery || name.toLowerCase().includes(q) || v.phone?.includes(q);
    const status = v.isBlocked ? "suspended" : !v.vendorProfile?.isApproved ? "pending" : "active";
    if (statusFilter === "all") return match;
    return match && status === statusFilter;
  }), [vendors, searchQuery, statusFilter]);

  // Summary stats
  const activeCount = vendors.filter(v => v.vendorProfile?.isApproved && !v.isBlocked).length;
  const pendingCount = vendors.filter(v => !v.vendorProfile?.isApproved && !v.isBlocked).length;
  const totalRevenue = vendors.reduce((s, v) => s + (v.vendorProfile?.totalRevenue || 0), 0);
  const totalCommission = vendors.reduce((s, v) => s + (v.vendorProfile?.commissionEarned || 0), 0);
  const totalPayoutDue = vendors.reduce((s, v) => s + (v.vendorProfile?.payoutPending || 0), 0);
  const avgSla = vendors.length > 0 ? Math.round(vendors.reduce((s, v) => s + (v.vendorProfile?.slaScore || 0), 0) / Math.max(activeCount, 1)) : 0;

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
          <p className="text-2xl font-bold text-emerald-600">{formatINR(totalRevenue)}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Revenue</p>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search by name or phone..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40 rounded-xl"><Filter className="h-4 w-4 mr-2 text-slate-500" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">Vendor</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">City</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Revenue</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Commission</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Payout Due</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">SLA %</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Rating</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Issue Rate</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Tier</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((v) => {
              const name = v.vendorProfile?.businessName || v.name;
              const status = v.isBlocked ? "Suspended" : !v.vendorProfile?.isApproved ? "Pending" : "Active";
              const city = v.addresses?.[0]?.city || "—";
              const revenue = v.vendorProfile?.totalRevenue || 0;
              const commission = v.vendorProfile?.commissionEarned || 0;
              const payoutDue = v.vendorProfile?.payoutPending || 0;
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
                  <TableCell><div className="flex items-center gap-1.5 text-slate-600 text-sm"><MapPin className="h-3.5 w-3.5 text-slate-400" />{city}</div></TableCell>
                  <TableCell className="text-center">
                    <p className="text-sm font-bold text-emerald-700">{revenue > 0 ? formatINR(revenue) : "—"}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <p className="text-sm font-bold text-blue-600">{commission > 0 ? formatINR(commission) : "—"}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <p className={`text-sm font-bold ${payoutDue > 0 ? "text-orange-600" : "text-slate-400"}`}>{payoutDue > 0 ? formatINR(payoutDue) : "—"}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-bold ${sla >= 90 ? "text-emerald-600" : sla >= 80 ? "text-amber-600" : "text-red-600"}`}>
                      {sla > 0 ? `${sla}%` : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {rating > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
                      </div>
                    ) : <span className="text-sm text-slate-400">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-bold ${issueRate > 5 ? "text-red-600" : issueRate > 2 ? "text-amber-600" : "text-emerald-600"}`}>
                      {issueRate > 0 ? `${issueRate}%` : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${tier.color} border-none text-[10px] font-bold px-2`}>{tier.emoji} {tier.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`${getStatusColor(status)} font-medium gap-1.5 px-2.5 py-0.5`}>
                      {status === "Active" && <CheckCircle className="h-3 w-3" />}
                      {status === "Pending" && <Clock className="h-3 w-3" />}
                      {status === "Suspended" && <Ban className="h-3 w-3" />}
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6"><Button variant="ghost" size="sm" className="text-slate-500 hover:text-[#3E8940]" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${v.id}`); }}>View</Button></TableCell>
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
