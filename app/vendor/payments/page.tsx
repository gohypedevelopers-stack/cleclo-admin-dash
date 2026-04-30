"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Download, CreditCard, ArrowUpRight, ArrowDownLeft, Calendar, CheckCircle, Clock, XCircle, MoreVertical, Eye, Loader2, AlertTriangle, RefreshCw, IndianRupee, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatINR = (a: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a);
const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };

const getStatusBadge = (status: string) => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "paid": case "completed": return <Badge className="bg-green-100 text-green-700 border-none font-medium gap-1.5 hover:bg-green-100 text-xs"><CheckCircle className="h-3 w-3" />Completed</Badge>;
    case "pending": case "processing": return <Badge className="bg-amber-100 text-amber-700 border-none font-medium gap-1.5 hover:bg-amber-100 text-xs"><Clock className="h-3 w-3" />Pending</Badge>;
    case "failed": return <Badge className="bg-red-100 text-red-700 border-none font-medium gap-1.5 hover:bg-red-100 text-xs"><XCircle className="h-3 w-3" />Failed</Badge>;
    default: return <Badge variant="secondary" className="text-xs uppercase">{status}</Badge>;
  }
};

export default function VendorPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPayments = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/settlements`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load payments");
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : data.settlements || []);
    } catch (err: any) { setError(err.message); setPayments([]); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const filtered = useMemo(() => payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const vendor = p.vendor?.vendorProfile?.businessName || p.vendor?.name || "";
    const match = !searchQuery || vendor.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q);
    if (statusFilter === "all") return match;
    return match && String(p.status).toLowerCase() === statusFilter.toLowerCase();
  }), [payments, searchQuery, statusFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPaid = payments.filter(p => String(p.status).toLowerCase() === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => ["pending", "processing"].includes(String(p.status).toLowerCase())).reduce((s, p) => s + (p.amount || 0), 0);
  const failedCount = payments.filter(p => String(p.status).toLowerCase() === "failed").length;

  if (isLoading && payments.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading payments...</p></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-3xl text-black font-bold tracking-tight">Vendor Payments</h1><p className="text-slate-500 mt-1">Track and manage payouts to partners</p></div>
        <div className="flex gap-2"><Button variant="outline" className="gap-2 rounded-xl"><Download className="h-4 w-4" /> Export</Button></div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Paid</CardTitle><CreditCard className="h-4 w-4 text-slate-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatINR(totalPaid)}</div><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1" /> {payments.filter(p => p.status === "PAID").length} settlements</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle><Clock className="h-4 w-4 text-slate-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatINR(totalPending)}</div><p className="text-xs text-slate-500 mt-1">{payments.filter(p => p.status === "PENDING").length} awaiting</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Settlements</CardTitle><IndianRupee className="h-4 w-4 text-slate-400" /></CardHeader><CardContent><div className="text-2xl font-bold">{payments.length}</div><p className="text-xs text-slate-500 mt-1">All time</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-500">Failed</CardTitle><XCircle className="h-4 w-4 text-slate-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{failedCount}</div><p className="text-xs text-slate-500 mt-1">{failedCount > 0 ? "Requires attention" : "All clear"}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search vendor or ID..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40 rounded-xl"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="PAID">Completed</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="FAILED">Failed</SelectItem></SelectContent></Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader><TableRow className="bg-[#fbfbfb] hover:bg-[#fbfbfb]">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] pl-6 py-4">ID</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Vendor</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Amount</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Date</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {paginated.length > 0 ? paginated.map((p) => {
              const vendor = p.vendor?.vendorProfile?.businessName || p.vendor?.name || "Unknown";
              return (
                <TableRow key={p.id} className="hover:bg-slate-50">
                  <TableCell className="pl-6 py-4"><div className="font-medium text-slate-900 text-sm">{p.id.slice(0, 8).toUpperCase()}</div></TableCell>
                  <TableCell className="py-4"><span className="font-medium text-black text-sm">{vendor}</span></TableCell>
                  <TableCell className="font-bold text-slate-900 py-4 text-sm">{formatINR(p.amount || 0)}</TableCell>
                  <TableCell className="text-slate-600 py-4 text-sm">{formatDate(p.createdAt)}</TableCell>
                  <TableCell className="py-4">{getStatusBadge(p.status)}</TableCell>
                  <TableCell className="text-right pr-6 py-4"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem className="gap-2" onClick={() => router.push(`/vendor/payments/${p.id}`)}><Eye className="h-4 w-4" /> View</DropdownMenuItem><DropdownMenuItem className="gap-2"><Download className="h-4 w-4" /> Receipt</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              );
            }) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">{error || "No payments found."}</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t bg-[#fbfbfb]/50">
          <p className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-700">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-bold text-slate-700">{filtered.length}</span> payments
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${currentPage === pageNum ? "bg-[#3E8940] hover:bg-[#3E8940]/90" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
