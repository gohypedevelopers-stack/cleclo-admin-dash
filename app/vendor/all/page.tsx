"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, Users, Star, MapPin, CheckCircle, Clock, Ban, Loader2, AlertTriangle, RefreshCw, Phone } from "lucide-react";
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
const getStatusColor = (s: string) => { switch (s) { case "Active": return "bg-green-100 text-green-700 border-green-200"; case "Pending": return "bg-amber-100 text-amber-700 border-amber-200"; case "Suspended": return "bg-red-100 text-red-700 border-red-200"; default: return "bg-gray-100 text-gray-700"; } };

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

  if (isLoading && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading vendors...</p></div>;
  if (error && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error}</p><Button onClick={fetchVendors} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl"><RefreshCw className="h-4 w-4" /> Retry</Button></div>;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-3xl text-black font-bold tracking-tight">All Vendors</h1><p className="text-slate-500 mt-1">Full list of all registered vendor accounts.</p></div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search by name or phone..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40 rounded-xl"><Filter className="h-4 w-4 mr-2 text-slate-500" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">Vendor</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">Phone</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">City</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">Commission</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((v) => {
              const name = v.vendorProfile?.businessName || v.name;
              const status = v.isBlocked ? "Suspended" : !v.vendorProfile?.isApproved ? "Pending" : "Active";
              const city = v.addresses?.[0]?.city || "—";
              return (
                <TableRow key={v.id} className="hover:bg-slate-50/80 cursor-pointer group" onClick={() => router.push(`/vendors/${v.id}`)}>
                  <TableCell className="py-4 pl-6"><div className="flex items-center gap-3"><Avatar className="h-10 w-10 border shadow-sm"><AvatarFallback className={`font-bold ${status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-700"}`}>{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors text-sm">{name}</p><p className="text-xs text-slate-500">{v.vendorProfile?.ownerName || v.name}{status === "Pending" && <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-amber-100 text-amber-700 ml-1">NEW</Badge>}</p></div></div></TableCell>
                  <TableCell className="text-sm text-slate-600">{v.phone}</TableCell>
                  <TableCell><div className="flex items-center gap-1.5 text-slate-600 text-sm"><MapPin className="h-3.5 w-3.5 text-slate-400" />{city}</div></TableCell>
                  <TableCell className="font-semibold text-sm">{v.vendorProfile?.commissionRate ? `${v.vendorProfile.commissionRate}%` : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={`${getStatusColor(status)} font-medium gap-1.5 px-2.5 py-0.5`}>{status === "Active" && <CheckCircle className="h-3 w-3" />}{status === "Pending" && <Clock className="h-3 w-3" />}{status === "Suspended" && <Ban className="h-3 w-3" />}{status}</Badge></TableCell>
                  <TableCell className="text-right pr-6"><Button variant="ghost" size="sm" className="text-slate-500 hover:text-[#3E8940]" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${v.id}`); }}>View</Button></TableCell>
                </TableRow>
              );
            }) : <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500"><div className="flex flex-col items-center gap-2"><Search className="h-8 w-8 text-slate-300" /><p>No vendors found.</p></div></TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50 text-xs text-slate-500"><p>Showing <strong>{filtered.length}</strong> vendors</p></div>
      </div>
    </div>
  );
}
