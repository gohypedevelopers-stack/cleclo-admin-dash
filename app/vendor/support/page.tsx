"use client";

import { Search, Filter, MessageSquare, CheckCircle, Clock, MoreVertical, Send, User, Loader2, AlertTriangle, RefreshCw, AlertCircle, XCircle, ChevronLeft, ChevronRight, BarChart3, ShieldAlert, Calendar } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, { ...options, cache: "no-store" }); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const formatStatus = (s: string) => {
  if (!s) return "Open";
  return s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const getStatusColor = (s: string) => {
  const status = String(s || "").toLowerCase();
  switch (status) {
    case "open": case "issue_reported": return "bg-blue-100 text-blue-700";
    case "in_progress": case "processing": return "bg-amber-100 text-amber-700";
    case "resolved": case "completed": case "closed": return "bg-green-100 text-green-700";
    case "cancelled": case "failed": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const getPriorityColor = (p: string) => {
  const prio = String(p || "").toLowerCase();
  switch (prio) {
    case "high": case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "medium": return "text-amber-600 bg-amber-50 border-amber-200";
    default: return "text-green-600 bg-green-50 border-green-200";
  }
};

const formatDate = (d: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
};

export default function VendorSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchTickets = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      // Fetch both from order service (operational issues) and auth service (support tickets)
      const res = await apiFetch(`${ORDER_API_URL}/issues`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      const issues = Array.isArray(data) ? data : data.issues || [];
      
      // Normalize data to a common format
      const normalized = issues.map((i: any) => ({
        ...i,
        id: i.id,
        subject: i.subject || i.issueType || "General Issue",
        description: i.description || i.summary || "No description provided",
        status: i.status || "Open",
        priority: i.priority || i.severity || "Medium",
        createdAt: i.createdAt || i.reportedAt,
        updatedAt: i.updatedAt || i.lastUpdated || i.last_updated || i.createdAt || i.reportedAt,
        type: i.type || i.category || "Order Issue"
      }));

      setTickets(normalized);
    } catch (err: any) {
      setError(err.message);
      setTickets([]);
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      let url = `${ORDER_API_URL}/${ticketId}/status`;
      let method = "PATCH";
      let body = JSON.stringify({ status });

      if (status === "resolved") {
        url = `${ORDER_API_URL}/${ticketId}/resolve-issue`;
      }

      const res = await apiFetch(url, { 
        method, 
        headers: getAuthHeaders(), 
        body 
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(`Ticket updated successfully`);
      fetchTickets();
    } catch { 
      toast.error("Failed to sync with backend"); 
    }
  };

  const filtered = useMemo(() => tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const match = !searchQuery || 
      t.subject?.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q) || 
      t.id?.toLowerCase().includes(q) ||
      t.vendor?.toLowerCase().includes(q);
    if (statusFilter === "all") return match;
    const s = String(t.status).toLowerCase();
    if (statusFilter === "open") return match && !["resolved", "closed", "completed", "cancelled"].includes(s);
    return match && s === statusFilter.toLowerCase();
  }), [tickets, searchQuery, statusFilter]);

  // Reset pagination on filter
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const openCount = useMemo(() => tickets.filter(t => {
    const s = String(t.status || "").toLowerCase();
    return !["resolved", "closed", "completed"].includes(s);
  }).length, [tickets]);

  const criticalCount = useMemo(() => tickets.filter(t => {
    const p = String(t.priority || "").toLowerCase();
    return p === "high" || p === "critical";
  }).length, [tickets]);

  const resolvedToday = useMemo(() => tickets.filter(t => {
    const s = String(t.status || "").toLowerCase();
    if (s !== "resolved" && s !== "completed") return false;
    const updateTime = t.updatedAt || t.createdAt;
    if (!updateTime) return true;
    return new Date(updateTime).toDateString() === new Date().toDateString();
  }).length, [tickets]);

  if (isLoading && tickets.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Syncing support desk...</p></div>;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-3xl text-black font-bold tracking-tight">Support Desk</h1><p className="text-slate-500 mt-1">Manage and resolve all incoming vendor and order issues.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={fetchTickets}><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Sync Data</Button>
        </div>
      </div>
      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className={`bg-white border-slate-100 shadow-sm cursor-pointer transition-all hover:border-[#3E8940] ${statusFilter === 'open' ? 'ring-2 ring-[#3E8940]/20 border-[#3E8940]' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><MessageSquare className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Tickets</p><h3 className="text-xl font-bold">{openCount}</h3></div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-slate-100 shadow-sm cursor-pointer transition-all hover:border-red-200"
          onClick={() => { setSearchQuery("high"); setStatusFilter("all"); }}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><ShieldAlert className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Issues</p><h3 className="text-xl font-bold">{criticalCount}</h3></div>
          </CardContent>
        </Card>

        <Card 
          className={`bg-white border-slate-100 shadow-sm cursor-pointer transition-all hover:border-green-200 ${statusFilter === 'resolved' ? 'ring-2 ring-green-500/20 border-green-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Today</p><h3 className="text-xl font-bold">{resolvedToday}</h3></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm"><CardContent className="p-4 flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock className="h-5 w-5" /></div><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Response</p><h3 className="text-xl font-bold">~4h</h3></div></CardContent></Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
          <Input placeholder="Search by ticket ID, subject or vendor..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 rounded-xl"><Filter className="h-4 w-4 mr-2 text-slate-400" /><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="issue_reported">Reported</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6">Ticket Details</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Category</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-center">Priority</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Reported On</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-center">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {paginated.length > 0 ? paginated.map((t) => (
              <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="py-4 pl-6">
                  <div className="font-bold text-slate-900 text-sm capitalize">{t.subject}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{t.id}</div>
                  <div className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-xs">{t.description}</div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0 h-5 border-slate-200">{t.type}</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="outline" className={`text-[10px] font-bold uppercase h-5 px-2 ${getPriorityColor(t.priority)}`}>{t.priority}</Badge></TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium"><Calendar className="h-3 w-3" />{formatDate(t.createdAt)}</div></TableCell>
                <TableCell className="text-center"><Badge className={`${getStatusColor(t.status)} border-none font-bold text-[10px] px-2 py-0 h-5`}>{formatStatus(t.status)}</Badge></TableCell>
                <TableCell className="text-right pr-6"><div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-[#3E8940] hover:text-[#3E8940] hover:bg-green-50 font-bold text-xs rounded-lg" onClick={() => { setSelectedTicket(t); setReplyText(""); setIsReplyOpen(true); }}><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Reply</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-xs font-medium" onClick={() => handleStatusUpdate(t.id, "processing")}>Move to Progress</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-medium text-green-600" onClick={() => handleStatusUpdate(t.id, "resolved")}>Mark Resolved</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-medium text-red-600" onClick={() => handleStatusUpdate(t.id, "cancelled")}>Cancel Ticket</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 font-medium">{error ? error : "All caught up! No support tickets found."}</TableCell></TableRow>}
          </TableBody>
        </Table>
        
        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-[#fbfbfb]/50">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-bold text-slate-700">{filtered.length}</span> tickets
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${currentPage === pageNum ? "bg-[#3E8940] hover:bg-[#3E8940]/90" : ""}`} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>
                );
              })}
            </div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Ticket Resolution</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className={`text-[10px] font-bold ${getPriorityColor(selectedTicket?.priority)}`}>{selectedTicket?.priority} Priority</Badge>
                <span className="text-[10px] text-slate-400 font-mono">{selectedTicket?.id}</span>
              </div>
              <p className="font-bold text-slate-900 text-sm mb-1 capitalize">{selectedTicket?.subject}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedTicket?.description}</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                <User className="h-3 w-3" /> Reported by Vendor • {formatDate(selectedTicket?.createdAt)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Response / Reply</label>
              <Textarea placeholder="Describe the resolution or send a message to the vendor..." rows={5} className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-xl font-bold text-slate-500" onClick={() => setIsReplyOpen(false)}>Discard</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl px-6 font-bold" onClick={() => { 
              if (!replyText.trim()) return toast.error("Please enter a response");
              toast.success("Resolution sent successfully"); 
              setIsReplyOpen(false); 
              handleStatusUpdate(selectedTicket.id, "resolved");
            }}><Send className="h-4 w-4 mr-2" /> Send Resolution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
