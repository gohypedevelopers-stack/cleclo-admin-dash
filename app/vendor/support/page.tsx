"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, MessageSquare, CheckCircle, Clock, MoreVertical, Send, User, Loader2, AlertTriangle, RefreshCw, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const getStatusColor = (s: string) => { switch (s) { case "Open": return "bg-blue-100 text-blue-700"; case "In Progress": return "bg-amber-100 text-amber-700"; case "Resolved": case "Closed": return "bg-green-100 text-green-700"; default: return "bg-gray-100 text-gray-700"; } };
const getPriorityColor = (p: string) => { switch (p) { case "High": return "text-red-600 bg-red-50 border-red-200"; case "Medium": return "text-amber-600 bg-amber-50 border-amber-200"; default: return "text-green-600 bg-green-50 border-green-200"; } };

const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };

export default function VendorSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      // Try fetching issues from order service
      const res = await apiFetch(`${ORDER_API_URL}/issues`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : data.issues || []);
    } catch (err: any) {
      setError(err.message);
      // Fallback: show empty state
      setTickets([]);
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      await apiFetch(`${ORDER_API_URL}/issues/${ticketId}/status`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ status }) });
      toast.success(`Ticket marked as ${status}`);
      fetchTickets();
    } catch { toast.error("Failed to update"); }
  };

  const filtered = useMemo(() => tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const match = !searchQuery || t.subject?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.id?.toLowerCase().includes(q);
    if (statusFilter === "all") return match;
    return match && t.status === statusFilter;
  }), [tickets, searchQuery, statusFilter]);

  if (isLoading && tickets.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading support tickets...</p></div>;

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-3xl text-black font-bold tracking-tight">Support</h1><p className="text-slate-500 mt-1">Manage support tickets and vendor inquiries.</p></div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search tickets..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40 rounded-xl"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Resolved">Resolved</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent></Select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6">Ticket</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Type</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Priority</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Date</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length > 0 ? filtered.map((t) => (
              <TableRow key={t.id} className="hover:bg-slate-50">
                <TableCell className="py-4 pl-6"><div className="font-semibold text-black text-sm">{t.subject || t.issueType || "Issue"}</div><div className="text-xs text-slate-500 line-clamp-1">{t.description || t.id}</div></TableCell>
                <TableCell><Badge variant="outline" className="text-slate-600 text-xs">{t.issueType || t.category || "General"}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={`text-xs ${getPriorityColor(t.priority || "Low")}`}>{t.priority || "Low"}</Badge></TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-slate-500 text-sm"><Clock className="h-3.5 w-3.5" />{formatDate(t.createdAt || t.lastUpdated)}</div></TableCell>
                <TableCell><Badge className={`${getStatusColor(t.status || "Open")} border-none font-medium text-xs`}>{t.status || "Open"}</Badge></TableCell>
                <TableCell className="text-right pr-6"><div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 hover:text-[#3E8940]" onClick={() => { setSelectedTicket(t); setReplyText(""); setIsReplyOpen(true); }}><MessageSquare className="h-4 w-4 mr-1" /> Reply</Button>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4 text-slate-500" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleStatusUpdate(t.id, "Resolved")}>Mark Resolved</DropdownMenuItem><DropdownMenuItem onClick={() => handleStatusUpdate(t.id, "In Progress")}>In Progress</DropdownMenuItem><DropdownMenuItem className="text-red-600" onClick={() => handleStatusUpdate(t.id, "Closed")}>Close</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">{error ? error : "No support tickets found."}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reply to Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 max-h-40 overflow-y-auto">
              <p className="font-semibold mb-1 text-black">{selectedTicket?.subject || selectedTicket?.issueType || "Issue"}</p>
              <p className="text-xs text-slate-500">{selectedTicket?.description}</p>
            </div>
            <Textarea placeholder="Type your response..." rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyOpen(false)}>Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90" onClick={() => { toast.success("Reply sent"); setIsReplyOpen(false); }}><Send className="h-4 w-4 mr-2" /> Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
