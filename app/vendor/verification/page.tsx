"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, CheckCircle, XCircle, Eye, FileText, MapPin, Phone, Store, Loader2, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

export default function VendorVerificationPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); const data = await res.json();
      const all = Array.isArray(data) ? data : data.vendors || [];
      setVendors(all.filter((v: any) => !v.isBlocked && !v.vendorProfile?.isApproved));
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${id}/approve`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ isApproved: true }) });
      if (!res.ok) throw new Error("Failed"); toast.success("Vendor approved"); fetchVendors();
    } catch (err: any) { toast.error(err.message); } finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${id}/suspend`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ suspended: true }) });
      if (!res.ok) throw new Error("Failed"); toast.success("Vendor rejected"); fetchVendors();
    } catch (err: any) { toast.error(err.message); } finally { setActionLoading(null); }
  };

  const filtered = useMemo(() => vendors.filter((v) => {
    const name = v.vendorProfile?.businessName || v.name;
    const q = searchQuery.toLowerCase();
    return !searchQuery || name.toLowerCase().includes(q) || v.phone?.includes(q);
  }), [vendors, searchQuery]);

  if (isLoading && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading...</p></div>;
  if (error && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error}</p><Button onClick={fetchVendors} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl"><RefreshCw className="h-4 w-4" /> Retry</Button></div>;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-3xl text-black font-bold tracking-tight">New Verification</h1><p className="text-slate-500 mt-1">Review and approve new vendor applications.</p></div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search pending vendors..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filtered.length > 0 ? (
          <Table>
            <TableHeader><TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6">Vendor Details</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Phone</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Documents</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((v) => {
                const vp = v.vendorProfile || {};
                const name = vp.businessName || v.name;
                return (
                  <TableRow key={v.id} className="hover:bg-slate-50">
                    <TableCell className="py-4 pl-6"><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarFallback className="bg-amber-100 text-amber-600 font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-semibold text-black text-sm">{name}</p><div className="flex items-center gap-2 text-xs text-slate-500"><span className="flex items-center gap-1"><Store className="h-3 w-3" /> {vp.ownerName || v.name}</span></div></div></div></TableCell>
                    <TableCell className="text-sm text-slate-600"><div className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" /> {v.phone}</div></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[{ label: "KYC", ok: !!vp.ownerIdProofUrl }, { label: "Business", ok: !!vp.businessProofUrl }, { label: "Bank", ok: !!vp.bankVerified }].map((d) => (
                          <Badge key={d.label} variant="secondary" className={`gap-1 text-xs ${d.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                            {d.ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {d.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/vendors/${v.id}`)}><Eye className="h-4 w-4 mr-1" /> View</Button>
                        <Button size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" disabled={actionLoading === v.id} onClick={() => handleReject(v.id)}>{actionLoading === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" /> Reject</>}</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={actionLoading === v.id} onClick={() => handleApprove(v.id)}>{actionLoading === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>}</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><ShieldCheck className="h-6 w-6 text-emerald-600" /></div>
            <h3 className="text-lg font-semibold text-slate-900">No pending verifications</h3>
            <p className="text-slate-500 max-w-sm mt-1">All vendor applications have been processed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
