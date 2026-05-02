"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

const getCustomerTier = (totalSpent: number) => {
  if (totalSpent >= 50000) return { label: "👑 VIP", color: "bg-purple-100 text-purple-800 border-purple-300" };
  if (totalSpent >= 25000) return { label: "🥇 Gold", color: "bg-amber-100 text-amber-800 border-amber-300" };
  if (totalSpent >= 12500) return { label: "🥈 Silver", color: "bg-slate-100 text-slate-700 border-slate-300" };
  return { label: "Standard", color: "bg-blue-50 text-blue-600 border-blue-200" };
};

const getActivityStatus = (lastOrderDate: string | null) => {
  if (!lastOrderDate) return { label: "New", color: "text-blue-600" };
  const days = daysAgo(lastOrderDate);
  if (days <= 14) return { label: "Active", color: "text-emerald-600" };
  if (days <= 30) return { label: "Cooling", color: "text-amber-600" };
  if (days <= 60) return { label: "⚠️ At Risk", color: "text-orange-600" };
  return { label: "💤 Dormant", color: "text-red-600" };
};

export default function CustomerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm)),
  );

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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-50"><Users className="h-4 w-4 text-blue-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Customers</p><p className="text-xl font-bold text-slate-900">{customers.length}</p></div></div><p className="text-[10px] text-emerald-600 font-semibold mt-2">+{newSignups} this month</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-50"><IndianRupee className="h-4 w-4 text-emerald-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</p><p className="text-xl font-bold text-emerald-700">{formatINR(totalRevenue)}</p></div></div><p className="text-[10px] text-slate-400 mt-2">AOV: {formatINR(avgOrderValue)}</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-50"><TrendingUp className="h-4 w-4 text-purple-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Repeat Rate</p><p className="text-xl font-bold text-purple-700">{repeatRate}%</p></div></div><p className="text-[10px] text-slate-400 mt-2">{repeatCustomers} repeat buyers</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-50"><Clock className="h-4 w-4 text-red-600" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Churn (30d)</p><p className="text-xl font-bold text-red-600">{churnRate}%</p></div></div><p className="text-[10px] text-slate-400 mt-2">{dormantCount} inactive</p></CardContent></Card>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
              <Button variant="outline" className="h-9 px-3 gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
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
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[10%] text-center">Orders / Revenue</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider w-[8%]">AOV (LTV)</TableHead>
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
                    const tier = getCustomerTier(spent);
                    const activity = getActivityStatus(lastOrder);

                    return (
                    <TableRow key={customer.id} className="hover:bg-slate-50/50 cursor-pointer">
                      {/* Customer + Tier */}
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-1 ring-slate-200"><AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-sm">{cleanName(customer.name).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 text-sm truncate">{cleanName(customer.name)}</span>
                              <Badge className={`${tier.color} border text-[7px] h-4 px-1 font-black`}>{tier.label}</Badge>
                            </div>
                            <p className="text-[10px] text-slate-400">{customer.email || "No email"}</p>
                            <p className="text-[10px] text-slate-400">{customer.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={`${!customer.isBlocked ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"} text-[9px] font-bold`}>{!customer.isBlocked ? "Active" : "Blocked"}</Badge>
                        <p className={cn("text-[9px] font-bold mt-0.5", activity.color)}>{activity.label}</p>
                      </TableCell>
                      {/* Orders / Revenue */}
                      <TableCell className="text-center">
                        <p className="text-sm font-bold text-slate-900">{orders} <span className="text-slate-400 text-[10px] font-medium">orders</span></p>
                        <p className="text-xs font-semibold text-emerald-600">{formatINR(spent)}</p>
                      </TableCell>
                      {/* AOV (LTV) */}
                      <TableCell>
                        <p className="text-xs font-bold text-slate-700">{formatINR(aov)}</p>
                        <p className="text-[9px] text-slate-400">LTV: {formatINR(spent)}</p>
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
                      <TableCell className="text-right pr-6">
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
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.info("Internal notes coming soon")}><StickyNote className="h-4 w-4" /> Add Internal Note</DropdownMenuItem>
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
    </div>
  );
}
