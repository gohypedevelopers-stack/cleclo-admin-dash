"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, MoreVertical, Phone, Wallet, Ban, Eye, Loader2, AlertTriangle, RefreshCw, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const formatINR = (a: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a);

export default function RidersAllPage() {
  const router = useRouter();
  const [riders, setRiders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchRiders = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load riders");
      const data = await res.json();
      const all = Array.isArray(data) ? data : data.users || [];
      setRiders(all.filter((u: any) => u.role === "rider"));
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

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

  if (isLoading && riders.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading riders...</p></div>;
  if (error && riders.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error}</p><Button onClick={fetchRiders} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl"><RefreshCw className="h-4 w-4" /> Retry</Button></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-3xl text-black font-bold tracking-tight">All Riders</h1><p className="text-slate-500 mt-1">Manage rider accounts and profiles</p></div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search by name, phone..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-40 rounded-xl"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader><TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">Rider</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">Phone</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">Wallet</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">Joined</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/rider/${r.id}`)}>
                <TableCell className="py-4 pl-6"><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">{(r.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-semibold text-black text-sm">{r.name}</p>{r.email && <p className="text-xs text-slate-500">{r.email}</p>}</div></div></TableCell>
                <TableCell className="text-sm text-slate-600">{r.phone}</TableCell>
                <TableCell className="font-bold text-[#3E8940] text-sm">{r.walletBalance != null ? formatINR(r.walletBalance) : "₹0"}</TableCell>
                <TableCell className="text-sm text-slate-500">{formatDate(r.createdAt)}</TableCell>
                <TableCell><Badge className={`border-none font-medium text-xs ${r.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{r.isBlocked ? "Blocked" : "Active"}</Badge></TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => router.push(`/rider/${r.id}`)}><Eye className="h-4 w-4" /> View</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleBlock(r)}><Ban className="h-4 w-4" /> {r.isBlocked ? "Unblock" : "Block"}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">No riders found.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t"><p className="text-sm text-slate-500">Showing {filtered.length} of {riders.length} riders</p></div>
      </div>
    </div>
  );
}
