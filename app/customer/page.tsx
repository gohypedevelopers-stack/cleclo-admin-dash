"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, MoreHorizontal, Download, Users, ShoppingBag, TrendingUp, UserPlus, Loader2, AlertTriangle, RefreshCw, Wallet, IndianRupee, Star, Clock, Eye, Ban, CreditCard, MessageSquare, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const PUBLIC_AUTH_URL = AUTH_API_URL.replace("/admin/auth", "/auth");

const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatDate = (dateStr: string) => { try { return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return dateStr; } };
const cleanName = (name: string) => name.replace(/\[.*?\]\s*/g, "").trim();
const formatINR = (a: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a);
const daysAgo = (d: string) => { try { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); } catch { return 999; } };
const formatRelative = (d: string) => { const days = daysAgo(d); if (days === 0) return "Today"; if (days === 1) return "Yesterday"; if (days < 30) return `${days} days ago`; return `${Math.floor(days/30)} months ago`; };

const getSegmentBadge = (segment: string) => {
  switch (segment) {
    case "VIP": return { label: "👑 VIP", color: "bg-purple-100 text-purple-800 border-purple-300" };
    case "Gold": return { label: "🥇 Gold", color: "bg-amber-100 text-amber-800 border-amber-300" };
    case "Silver": return { label: "🥈 Silver", color: "bg-slate-100 text-slate-700 border-slate-300" };
    case "At Risk": return { label: "⚠️ At Risk", color: "bg-orange-100 text-orange-800 border-orange-300 font-bold" };
    case "Dormant": return { label: "💤 Dormant", color: "bg-red-100 text-red-800 border-red-300 font-bold" };
    case "New": return { label: "🆕 New", color: "bg-blue-50 text-blue-600 border-blue-200" };
    default: return { label: "Standard", color: "bg-slate-50 text-slate-600 border-slate-200" };
  }
};

export default function CustomerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string>("All");
  const [selectedCustomerForWallet, setSelectedCustomerForWallet] = useState<any | null>(null);

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedCustomerForNotes, setSelectedCustomerForNotes] = useState<any | null>(null);
  const [customerNoteText, setCustomerNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"wallet" | "complaints">("wallet");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", password: "Password123!" });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users?role=customer`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : data.users || []);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleExport = () => {
    if (customers.length === 0) return toast.error("No customers to export");
    const csvHeader = "ID,Name,Email,Phone,Status,Joined\n";
    const csvContent = customers.map(c => `${c.id},"${c.name}",${c.email || ""},${c.phone || ""},${c.isBlocked ? "Blocked" : "Active"},${new Date(c.createdAt).toLocaleDateString()}`).join("\n");
    const blob = new Blob([csvHeader + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cleclo_customers_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export successful");
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return toast.error("Name and Phone are required");
    setIsAdding(true);
    try {
      const payload: any = { name: newCustomer.name, phone: newCustomer.phone, password: newCustomer.password, address: "Added by Admin", lat: 0, lng: 0 };
      if (newCustomer.email.trim() !== "") payload.email = newCustomer.email;
      
      const res = await fetch(`${PUBLIC_AUTH_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create customer");
      toast.success("Customer added successfully!");
      setIsAddModalOpen(false);
      setNewCustomer({ name: "", email: "", phone: "", password: "Password123!" });
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedCustomerForNotes) return;
    setIsSavingNote(true);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users/${selectedCustomerForNotes.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...selectedCustomerForNotes,
          internalNotes: customerNoteText
        })
      });
      if (!res.ok) throw new Error("Failed to save note");
      toast.success("Internal note updated successfully");
      setIsNotesModalOpen(false);
      setSelectedCustomerForNotes(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update note");
    } finally {
      setIsSavingNote(false);
    }
  };

  const getCustomerSegment = (c: any) => {
    if (c.segment) return c.segment;
    const lastOrder = c.lastOrderDate;
    if (!lastOrder) return "New";
    const days = daysAgo(lastOrder);
    if (days > 60) return "Dormant";
    if (days > 30) return "At Risk";
    const monthlySpent = c.monthlySpent !== undefined ? c.monthlySpent : (c.totalSpent || 0);
    if (monthlySpent > 50000) return "VIP";
    if (monthlySpent > 25000) return "Gold";
    if (monthlySpent > 12500) return "Silver";
    return "Standard";
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm));
    
    if (!matchesSearch) return false;
    if (selectedSegment === "All") return true;
    return getCustomerSegment(c) === selectedSegment;
  });

  if (isLoading && customers.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading customers...</p></div>;
  if (error && customers.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error}</p><Button onClick={fetchCustomers} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl"><RefreshCw className="h-4 w-4" /> Retry</Button></div>;

  const thisMonth = new Date().getMonth();
  const newSignups = customers.filter(c => new Date(c.createdAt).getMonth() === thisMonth).length;
  const activeCount = customers.filter(c => !c.isBlocked).length;
  const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const totalOrders = customers.reduce((s, c) => s + (c.totalOrders || c.ordersCount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const walletLiability = customers.reduce((s, c) => s + (c.wallet?.balance || c.walletBalance || 0), 0);
  const repeatCustomers = customers.filter(c => (c.totalOrders || c.ordersCount || 0) > 1).length;
  const repeatRate = customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 100) : 0;
  const dormantCount = customers.filter(c => c.lastOrderDate && daysAgo(c.lastOrderDate) > 30).length;
  const churnRate = customers.length > 0 ? Math.round((dormantCount / customers.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500">Manage your customer base</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl shadow-sm shadow-[#3E8940]/20" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Customer
          </Button>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-50"><Users className="h-4 w-4 text-blue-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Customers</p><p className="text-xl font-bold text-slate-900">{customers.length}</p></div></div><p className="text-[10px] text-emerald-600 font-semibold mt-2">+{newSignups} this month</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-50"><IndianRupee className="h-4 w-4 text-emerald-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue (From Customers)</p><p className="text-xl font-bold text-emerald-700">{formatINR(totalRevenue)}</p></div></div><p className="text-[10px] text-slate-400 mt-2">Total customer spend</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-sky-50"><TrendingUp className="h-4 w-4 text-sky-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Avg Order Value (AOV)</p><p className="text-xl font-bold text-sky-700">{formatINR(avgOrderValue)}</p></div></div><p className="text-[10px] text-slate-400 mt-2">Per order average</p></CardContent></Card>
        
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-50"><RefreshCw className="h-4 w-4 text-purple-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Repeat Purchase Rate</p><p className="text-xl font-bold text-purple-700">{repeatRate}%</p></div></div><p className="text-[10px] text-slate-400 mt-2">{repeatCustomers} repeat buyers</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-50"><Clock className="h-4 w-4 text-red-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Churn Rate</p><p className="text-xl font-bold text-red-600">{churnRate}%</p></div></div><p className="text-[10px] text-slate-400 mt-2">{dormantCount} inactive</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-50"><ShoppingBag className="h-4 w-4 text-amber-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Orders</p><p className="text-xl font-bold text-slate-900">{totalOrders}</p></div></div><p className="text-[10px] text-slate-400 mt-2">All time</p></CardContent></Card>

        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-50"><Wallet className="h-4 w-4 text-orange-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Wallet Liability</p><p className="text-xl font-bold text-orange-700">{formatINR(walletLiability)}</p></div></div><p className="text-[10px] text-slate-400 mt-2">Platform obligation</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-50"><Users className="h-4 w-4 text-green-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Active Users</p><p className="text-xl font-bold text-green-700">{activeCount}</p></div></div><p className="text-[10px] text-slate-400 mt-2">{customers.length > 0 ? Math.round((activeCount / customers.length) * 100) : 0}% of base</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-indigo-50"><UserPlus className="h-4 w-4 text-indigo-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">New Signups</p><p className="text-xl font-bold text-indigo-700">{newSignups}</p></div></div><p className="text-[10px] text-slate-400 mt-2">This month</p></CardContent></Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Customer Intelligence</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input placeholder="Search customers..." className="pl-9 h-9 rounded-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={selectedSegment !== "All" ? "default" : "outline"} className={cn("h-9 px-3 gap-2 rounded-md font-semibold", selectedSegment !== "All" && "bg-emerald-600 hover:bg-emerald-700 text-white")}>
                    <Filter className="h-4 w-4" /> {selectedSegment === "All" ? "All Segments" : selectedSegment}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl w-48 bg-white border border-slate-200 shadow-md">
                  {["All", "VIP", "Gold", "Silver", "Standard", "At Risk", "Dormant", "New"].map((seg) => (
                    <DropdownMenuItem 
                      key={seg} 
                      className={cn("cursor-pointer focus:bg-slate-100", selectedSegment === seg && "bg-slate-100 font-bold")}
                      onClick={() => setSelectedSegment(seg)}
                    >
                      {seg === "All" ? "Show All" : seg}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-slate-50 border-b">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-6 w-[18%]">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[7%]">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[12%] text-center">LTV (Lifetime Value)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[10%] text-center">Avg Order Value (AOV)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[10%]">Last Order</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[9%]">Wallet</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[7%] text-center">Refunds</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[7%] text-center">Complaints</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[8%]">Joined</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider text-right pr-6 w-[6%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="h-24 text-center">No customers found.</TableCell></TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const orders = customer.totalOrders || customer.ordersCount || 0;
                    const spent = customer.totalSpent || 0;
                    const aov = orders > 0 ? Math.round(spent / orders) : 0;
                    const walletBal = customer.wallet?.balance || customer.walletBalance || 0;
                    const refunds = customer.refundCount || 0;
                    const complaints = customer.complaintCount || 0;
                    const lastOrder = customer.lastOrderDate;
                    
                    const segment = getCustomerSegment(customer);
                    const segmentBadge = getSegmentBadge(segment);

                    return (
                    <TableRow key={customer.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedCustomerForWallet(customer)}>
                      {/* Customer + Segment */}
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-1 ring-slate-200"><AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-sm">{cleanName(customer.name).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 text-sm truncate">{cleanName(customer.name)}</span>
                              <Badge className={`${segmentBadge.color} border text-[8px] h-4.5 px-1.5 font-bold`}>{segmentBadge.label}</Badge>
                            </div>
                            <p className="text-[10px] text-slate-400">{customer.email || "No email"}</p>
                            <p className="text-[10px] text-slate-400">{customer.phone}</p>
                            {customer.internalNotes && (
                              <div className="flex items-center gap-1 mt-1 text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md w-fit font-semibold shadow-sm">
                                <StickyNote className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[150px]">{customer.internalNotes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={`${!customer.isBlocked ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"} text-[9px] font-bold`}>{!customer.isBlocked ? "Active" : "Blocked"}</Badge>
                        <p className={cn("text-[9px] font-semibold mt-0.5 text-slate-400")}>
                          {lastOrder ? `Ordered ${formatRelative(lastOrder)}` : "No orders yet"}
                        </p>
                      </TableCell>
                      {/* LTV (Lifetime Value) */}
                      <TableCell className="text-center">
                        <p className="text-sm font-bold text-slate-900">{formatINR(spent)}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{orders} orders</p>
                      </TableCell>
                      {/* Avg Order Value (AOV) */}
                      <TableCell className="text-center">
                        <p className="text-sm font-bold text-emerald-600">{formatINR(aov)}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">AOV</p>
                      </TableCell>
                      {/* Last Order */}
                      <TableCell>
                        {lastOrder ? (
                          <div>
                            <p className="text-xs font-medium text-slate-700">{formatRelative(lastOrder)}</p>
                            <p className="text-[9px] text-slate-400">{formatDate(lastOrder)}</p>
                          </div>
                        ) : <span className="text-[10px] text-slate-400">Never</span>}
                      </TableCell>
                      {/* Wallet */}
                      <TableCell>
                        <p className={cn("text-xs font-bold", walletBal > 0 ? "text-blue-700" : "text-slate-400")}>{formatINR(walletBal)}</p>
                        <p className="text-[9px] text-slate-400">Balance</p>
                      </TableCell>
                      {/* Refunds */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("font-bold text-[10px]", refunds > 0 ? "text-red-600 border-red-200 bg-red-50" : "text-slate-400 border-slate-100")}>{refunds}</Badge>
                      </TableCell>
                      {/* Complaints */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("font-bold text-[10px]", complaints > 0 ? "text-amber-600 border-amber-200 bg-amber-50" : "text-slate-400 border-slate-100")}>{complaints}</Badge>
                      </TableCell>
                      {/* Joined */}
                      <TableCell className="text-slate-500 text-[11px]">{formatDate(customer.createdAt)}</TableCell>
                      {/* Actions */}
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl w-52">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push(`/users/${customer.id}`)}><Eye className="h-4 w-4" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push(`/orders?search=${encodeURIComponent(customer.phone)}`)}><ShoppingBag className="h-4 w-4" /> Order History</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push(`/users/${customer.id}?tab=wallet`)}><Wallet className="h-4 w-4" /> Add Wallet Credit</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.info("Refund flow coming soon")}><CreditCard className="h-4 w-4" /> Issue Refund</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push(`/support?search=${encodeURIComponent(customer.phone)}`)}><MessageSquare className="h-4 w-4" /> View Complaints</DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer" 
                              onClick={() => {
                                setSelectedCustomerForNotes(customer);
                                setCustomerNoteText(customer.internalNotes || "");
                                setIsNotesModalOpen(true);
                              }}
                            >
                              <StickyNote className="h-4 w-4" /> Add Internal Note
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                              onClick={async () => {
                                try {
                                  const res = await apiFetch(`${AUTH_API_URL}/users/${customer.id}/block`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ blocked: !customer.isBlocked }) });
                                  if (!res.ok) throw new Error("Failed");
                                  toast.success(customer.isBlocked ? "Customer unblocked" : "Customer blocked");
                                  fetchCustomers();
                                } catch { toast.error("Action failed"); }
                              }}
                            >
                              <Ban className="h-4 w-4" /> {customer.isBlocked ? "Unblock" : "Block"} Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
            <p className="text-sm text-slate-500">Showing {filteredCustomers.length} of {customers.length} customers</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium text-slate-700">Full Name</label><Input placeholder="John Doe" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="mt-1" autoComplete="off" /></div>
            <div><label className="text-sm font-medium text-slate-700">Phone Code + Number</label><Input placeholder="+91 9876543210" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="mt-1" autoComplete="off" /></div>
            <div><label className="text-sm font-medium text-slate-700">Email Address (Optional)</label><Input placeholder="john@example.com" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="mt-1" autoComplete="off" /></div>
            <div><label className="text-sm font-medium text-slate-700">Temporary Password</label><Input value={newCustomer.password} disabled className="mt-1 bg-slate-50 text-slate-500" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button className="bg-[#3E8940] hover:bg-[#3E8940]/90" onClick={handleAddCustomer} disabled={isAdding}>{isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />} Create User</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Intelligence Hub (Wallet + Complaints) */}
      <Dialog 
        open={selectedCustomerForWallet !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCustomerForWallet(null);
            setActiveModalTab("wallet");
          }
        }}
      >
        <DialogContent className="sm:max-w-xl rounded-2xl border-slate-200 bg-white shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#3E8940]" />
              Customer Intelligence Hub
            </DialogTitle>
          </DialogHeader>

          {selectedCustomerForWallet && (
            <div className="space-y-6 py-2">
              {/* Header profile info */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Avatar className="h-10 w-10 ring-1 ring-slate-200">
                  <AvatarFallback className="bg-emerald-50 text-emerald-800 font-bold text-sm">
                    {cleanName(selectedCustomerForWallet.name).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{cleanName(selectedCustomerForWallet.name)}</h4>
                  <p className="text-xs text-slate-500">{selectedCustomerForWallet.email || "No email"} • {selectedCustomerForWallet.phone}</p>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <Badge className="bg-[#3E8940]/10 text-[#3E8940] hover:bg-[#3E8940]/10 border-0 text-[10px] font-bold">
                    {selectedCustomerForWallet.segment || "Standard"}
                  </Badge>
                  {selectedCustomerForWallet.internalNotes && (
                    <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1 shrink-0">
                      <StickyNote className="h-2.5 w-2.5 text-amber-600" />
                      Note Saved
                    </span>
                  )}
                </div>
              </div>

              {/* Premium Tab Switcher */}
              <div className="flex border-b border-slate-100 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveModalTab("wallet")}
                  className={cn(
                    "pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2",
                    activeModalTab === "wallet"
                      ? "border-[#3E8940] text-[#3E8940]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Wallet className="h-4 w-4" />
                  Wallet Intelligence
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab("complaints")}
                  className={cn(
                    "pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2",
                    activeModalTab === "complaints"
                      ? "border-[#3E8940] text-[#3E8940]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                  Disputes & Complaint History ({selectedCustomerForWallet.tickets?.length || selectedCustomerForWallet.complaintCount || 0})
                </button>
              </div>

              {/* WALLET TAB CONTENT */}
              {activeModalTab === "wallet" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Wallet metrics cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-[#3E8940] to-[#2E6930] p-4 rounded-xl text-white shadow-sm flex flex-col justify-between">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-emerald-100">Wallet Balance</p>
                      <p className="text-2xl font-black mt-2">{formatINR(selectedCustomerForWallet.wallet?.balance || selectedCustomerForWallet.walletBalance || 0)}</p>
                    </div>

                    {/* Referral Credits Card */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Referral Credits</p>
                      <p className="text-xl font-bold text-slate-900 mt-2">{formatINR(selectedCustomerForWallet.referralCredits || 0)}</p>
                    </div>

                    {/* Cashback Used Card */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Cashback Used</p>
                      <p className="text-xl font-bold text-slate-900 mt-2">{formatINR(selectedCustomerForWallet.cashbackUsed || 0)}</p>
                    </div>
                  </div>

                  {/* Transactions Timeline / List */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wallet Transactions ({selectedCustomerForWallet.wallet?.transactions?.length || 0})</p>
                    
                    <div className="max-h-60 overflow-y-auto pr-1 border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white">
                      {!selectedCustomerForWallet.wallet?.transactions || selectedCustomerForWallet.wallet.transactions.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">No transactions recorded for this wallet yet.</div>
                      ) : (
                        selectedCustomerForWallet.wallet.transactions.map((tx: any) => {
                          const isCredit = tx.type === "credit";
                          return (
                            <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{tx.note || "Wallet Adjustment"}</p>
                                <p className="text-[10px] text-slate-400">{formatDate(tx.createdAt)}</p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "font-black text-[10px] px-2 py-0.5",
                                  isCredit 
                                    ? "bg-green-50 text-green-700 border-green-200" 
                                    : "bg-red-50 text-red-700 border-red-200"
                                )}
                              >
                                {isCredit ? "+" : "-"}{formatINR(tx.amount)}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* COMPLAINTS TAB CONTENT */}
              {activeModalTab === "complaints" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Complaint metrics cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Total Complaints */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Complaints</p>
                      <p className="text-2xl font-black text-slate-900 mt-2">{selectedCustomerForWallet.tickets?.length || selectedCustomerForWallet.complaintCount || 0}</p>
                    </div>

                    {/* Refund Amount */}
                    <div className="bg-red-50/30 p-4 rounded-xl border border-red-100 flex flex-col justify-between">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-red-500">Refund Amount</p>
                      <p className="text-2xl font-black text-red-700 mt-2">{formatINR(selectedCustomerForWallet.totalRefundAmount || 0)}</p>
                    </div>

                    {/* Active Disputes */}
                    <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100 flex flex-col justify-between">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-amber-600">Active Disputes</p>
                      <p className="text-xl font-bold text-amber-700 mt-2">
                        {selectedCustomerForWallet.tickets?.filter((t: any) => t.status === "open" || t.status === "escalated")?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Disputed Issue Types Categories */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Issue Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {!selectedCustomerForWallet.tickets || selectedCustomerForWallet.tickets.length === 0 ? (
                        <span className="text-xs text-slate-400">No disputes reported yet.</span>
                      ) : (
                        Array.from(new Set(selectedCustomerForWallet.tickets.map((t: any) => t.category || "General"))).map((cat: any) => (
                          <Badge key={cat} variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-50 capitalize font-bold text-[10px] px-2 py-0.5 border-slate-200">
                            {cat}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Timeline of Complaints / Tickets */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disputes Timeline</p>
                    <div className="max-h-60 overflow-y-auto pr-1 border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white">
                      {!selectedCustomerForWallet.tickets || selectedCustomerForWallet.tickets.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">No complaints filed by this customer yet.</div>
                      ) : (
                        selectedCustomerForWallet.tickets.map((ticket: any) => {
                          const isClosed = ticket.status === "resolved" || ticket.status === "closed";
                          return (
                            <div key={ticket.id} className="p-3 hover:bg-slate-50/50 transition-colors space-y-1 text-left">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 capitalize truncate max-w-[70%]">{ticket.subject || "General Issue"}</span>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "font-black text-[9px] px-1.5 py-0.25 capitalize shrink-0",
                                    isClosed ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                  )}
                                >
                                  {ticket.status}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2">{ticket.message}</p>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1">
                                <span className="font-semibold text-slate-500 capitalize">{ticket.category}</span>
                                <span>•</span>
                                <span>{formatDate(ticket.createdAt)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setSelectedCustomerForWallet(null)}>
              Close View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal Notes Dialog Modal */}
      <Dialog open={isNotesModalOpen} onOpenChange={(open) => !open && setIsNotesModalOpen(false)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-500" />
              Operational Internal Notes
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Maintain critical operational memory for this customer. These notes are strictly internal to admins.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomerForNotes && (
            <div className="space-y-4 py-4">
              {/* Profile Context */}
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                <span className="font-bold text-slate-800">{cleanName(selectedCustomerForNotes.name)}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{selectedCustomerForNotes.phone}</span>
              </div>

              {/* Notes Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">Notes Content</label>
                <textarea
                  className="w-full h-24 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3E8940] focus:border-[#3E8940] transition-colors resize-none"
                  placeholder="Enter internal details, preferences, accounts, or disputes..."
                  value={customerNoteText}
                  onChange={(e) => setCustomerNoteText(e.target.value)}
                />
              </div>

              {/* Quick presets requested by user */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Quick Presets</span>
                <div className="flex flex-col gap-1.5">
                  {[
                    "Corporate account – Monthly Billing.",
                    "Frequent stain disputes.",
                    "High value – handle carefully."
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomerNoteText(preset)}
                      className="text-left w-full text-xs py-1.5 px-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 text-slate-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              onClick={() => setIsNotesModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white rounded-xl font-bold gap-2"
              onClick={handleSaveNote}
              disabled={isSavingNote}
            >
              {isSavingNote ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>Save Notes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
