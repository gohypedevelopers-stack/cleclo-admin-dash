"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, MapPin, Store, Phone, User, Star, MoreVertical, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

export default function OutletsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
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

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Derive outlets from vendors (each vendor is effectively an outlet/store)
  const outlets = useMemo(() => vendors.map((v) => ({
    id: v.id,
    name: v.vendorProfile?.businessName || v.name,
    vendorName: v.vendorProfile?.ownerName || v.name,
    location: v.addresses?.[0]?.city || "—",
    phone: v.phone,
    manager: v.vendorProfile?.ownerName || v.name,
    rating: v.vendorProfile?.rating || 0,
    ordersProcessed: v._count?.ordersAsVendor || 0,
    status: v.isBlocked ? "Inactive" : v.vendorProfile?.isApproved ? "Active" : "Pending",
  })), [vendors]);

  const filtered = useMemo(() => outlets.filter((o) => {
    const q = searchQuery.toLowerCase();
    const match = !searchQuery || o.name.toLowerCase().includes(q) || o.location.toLowerCase().includes(q) || o.vendorName.toLowerCase().includes(q);
    if (statusFilter === "all") return match;
    return match && o.status === statusFilter;
  }), [outlets, searchQuery, statusFilter]);

  if (isLoading && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading outlets...</p></div>;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-3xl text-black font-bold tracking-tight">Outlets</h1><p className="text-slate-500 mt-1">Manage and monitor all vendor outlet locations.</p></div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search outlets, vendors, or locations..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40 rounded-xl"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6">Outlet</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Owner</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Location</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Phone</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Rating</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((o) => (
              <TableRow key={o.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/vendors/${o.id}`)}>
                <TableCell className="py-4 pl-6"><div className="flex items-center gap-2"><Store className="h-4 w-4 text-[#3E8940]" /><div className="font-semibold text-black text-sm">{o.name}</div></div></TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-sm"><User className="h-3.5 w-3.5 text-slate-400" />{o.manager}</div></TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-slate-600 text-sm"><MapPin className="h-3.5 w-3.5 text-slate-400" />{o.location}</div></TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3 w-3" />{o.phone}</div></TableCell>
                <TableCell>{o.rating > 0 ? <div className="flex items-center gap-1"><div className="bg-amber-50 p-1 rounded-md"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /></div><span className="font-semibold text-sm">{o.rating}</span></div> : <span className="text-slate-400 text-sm italic">New</span>}</TableCell>
                <TableCell><Badge className={`border-none font-medium text-xs ${o.status === "Active" ? "bg-green-100 text-green-700" : o.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{o.status}</Badge></TableCell>
                <TableCell className="text-right pr-6"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4 text-slate-500" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/vendors/${o.id}`)}>View Details</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">{error || "No outlets found."}</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t text-xs text-slate-500"><p>Showing {filtered.length} outlets</p></div>
      </div>
    </div>
  );
}
