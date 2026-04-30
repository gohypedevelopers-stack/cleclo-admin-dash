"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { Search, CheckCircle, XCircle, Eye, FileText, MapPin, Phone, Store, Loader2, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };
const getPendingDays = (d: string) => { const diff = new Date().getTime() - new Date(d).getTime(); return Math.floor(diff / (1000 * 60 * 60 * 24)); };

function VendorVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [vendors, setVendors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const REJECTION_REASONS = [
    "Incomplete Documents",
    "Invalid GST",
    "Location Not Supported",
    "Capacity Insufficient",
    "Other"
  ];

  const fetchVendors = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); const data = await res.json();
      const all = data.vendors || [];
      setVendors(all.filter((v: any) => !v.isBlocked && !v.vendorProfile?.isApproved));
      setStats(data.stats || null);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${id}/approve`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ isApproved: true }) });
      if (!res.ok) throw new Error("Failed"); toast.success("Vendor approved"); fetchVendors();
    } catch (err: any) { toast.error(err.message); } finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    const finalReason = rejectionReason === "Other" ? otherReason : rejectionReason;
    if (!finalReason) { toast.error("Please provide a reason"); return; }
    
    setActionLoading(rejectingId);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${rejectingId}/suspend`, { 
        method: "PATCH", 
        headers: getAuthHeaders(), 
        body: JSON.stringify({ suspended: true, reason: finalReason }) 
      });
      if (!res.ok) throw new Error("Failed"); 
      toast.success("Vendor rejected"); 
      setRejectingId(null);
      setRejectionReason("");
      setOtherReason("");
      fetchVendors();
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{stats?.pendingCount || 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Pending Applications</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{stats?.approvedThisMonth || 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Approved This Month</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-2xl font-bold text-rose-600">{stats?.rejectedThisMonth || 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Rejected This Month</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{stats?.avgApprovalTime || 0}h</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Avg Approval Time</p>
        </div>
      </div>
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
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10"><AvatarFallback className="bg-amber-100 text-amber-600 font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-semibold text-black text-sm">{name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-medium"><Store className="h-3 w-3" /> {vp.ownerName || v.name}</span>
                          </div>
                          <div className="flex flex-col mt-1 gap-0.5">
                            <p className="text-[10px] text-slate-400">Applied On: {formatDate(v.createdAt)}</p>
                            <p className={`text-[10px] font-bold ${getPendingDays(v.createdAt) >= 5 ? "text-rose-500 animate-pulse" : "text-emerald-600"}`}>
                              Pending Since: {getPendingDays(v.createdAt)} Days
                            </p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
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
                        <Button size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" disabled={actionLoading === v.id} onClick={() => setRejectingId(v.id)}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
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

      {/* Rejection Modal */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600"><AlertTriangle className="h-5 w-5" /> Reject Vendor Application</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this application. This will be shared with the vendor.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger id="reason" className="rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-slate-200">
                  {REJECTION_REASONS.map((r) => <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {rejectionReason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="other">Specific Reason</Label>
                <Input id="other" placeholder="Enter details..." className="rounded-xl bg-slate-50" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setRejectingId(null)} className="rounded-xl">Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl" disabled={actionLoading === rejectingId} onClick={handleReject}>{actionLoading === rejectingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VendorVerificationPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm text-slate-500">Loading verifications...</p>
      </div>
    }>
      <VendorVerificationContent />
    </Suspense>
  );
}
