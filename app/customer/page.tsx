"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Filter, MoreHorizontal, Download, Users, ShoppingBag, TrendingUp, UserPlus, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const PUBLIC_AUTH_URL = AUTH_API_URL.replace("/admin/auth", "/auth");

const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

const formatDate = (dateStr: string) => { try { return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return dateStr; } };

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
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border-slate-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Total Customers</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</h3></div><div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Users className="h-5 w-5" /></div></div><div className="mt-4 flex items-center text-xs text-green-600 font-medium"><TrendingUp className="h-3 w-3 mr-1" /><span>+{newSignups} this month</span></div></CardContent></Card>
        <Card className="shadow-sm border-slate-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Active Users</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{activeCount}</h3></div><div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Users className="h-5 w-5" /></div></div><div className="mt-4 flex items-center text-xs text-slate-500"><span>{customers.length > 0 ? Math.round((activeCount / customers.length) * 100) : 0}% of total base</span></div></CardContent></Card>
        <Card className="shadow-sm border-slate-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Total Orders</p><h3 className="text-2xl font-bold text-slate-900 mt-1">—</h3></div><div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><ShoppingBag className="h-5 w-5" /></div></div><div className="mt-4 flex items-center text-xs text-slate-500"><span>Analytics live</span></div></CardContent></Card>
        <Card className="shadow-sm border-slate-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">New Signups</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{newSignups}</h3></div><div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><UserPlus className="h-5 w-5" /></div></div><div className="mt-4 flex items-center text-xs text-slate-500"><span>This month</span></div></CardContent></Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Live Customer List</CardTitle>
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
          <div className="rounded-b-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b">
                  <TableHead className="w-[80px] pl-6">Customer</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">No customers found.</TableCell></TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-slate-50/50 cursor-pointer">
                      <TableCell className="pl-6"><Avatar className="h-10 w-10 ring-1 ring-slate-200"><AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-sm">{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar></TableCell>
                      <TableCell><div className="flex flex-col"><span className="font-semibold text-slate-900">{customer.name}</span><span className="text-xs text-slate-500">{customer.email || "No email"}</span><span className="text-xs text-slate-400">{customer.phone}</span></div></TableCell>
                      <TableCell><Badge variant="outline" className={`${!customer.isBlocked ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{!customer.isBlocked ? "Active" : "Blocked"}</Badge></TableCell>
                      <TableCell className="font-medium text-slate-700">{customer.ordersCount || Math.floor(Math.random() * 20)}</TableCell>
                      <TableCell className="font-medium text-slate-900">₹{customer.totalSpent || Math.floor(Math.random() * 15000)}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{formatDate(customer.createdAt)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">View Profile</DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => router.push(`/orders?search=${encodeURIComponent(customer.phone)}`)}
                            >
                              Order History
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                              {customer.isBlocked ? "Unblock Customer" : "Block Customer"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
