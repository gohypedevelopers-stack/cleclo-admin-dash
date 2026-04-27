"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Wallet,
  Ban,
  Eye,
  Store,
  Bike,
  User,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Users as UsersIcon,
  Shield,
  IndianRupee,
  ShieldAlert,
  Download,
  UserPlus,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

const apiFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
    localStorage.removeItem("admin_auth_token");
    window.location.href = "/login";
  }
  return res;
};

interface UserRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  isBlocked?: boolean;
  walletBalance?: number;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  vendorProfile?: {
    businessName?: string;
    isApproved?: boolean;
    commissionRate?: number;
    bankVerified?: boolean;
    rating?: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Blocked": return "bg-red-100 text-red-700 border-red-200";
    case "Suspended": return "bg-red-100 text-red-700 border-red-200";
    case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

// Single source of truth for user status — checks both isBlocked boolean and status string
const getUserStatus = (user: UserRecord): "Blocked" | "Active" => {
  if (user.isBlocked === true) return "Blocked";
  if (user.status === "blocked" || user.status === "suspended") return "Blocked";
  return "Active";
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case "customer":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 pr-3 text-[10px] font-bold"><User className="w-3 h-3" /> Customer</Badge>;
    case "vendor":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1 pr-3 text-[10px] font-bold"><Store className="w-3 h-3" /> Vendor</Badge>;
    case "rider":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 pr-3 text-[10px] font-bold"><Bike className="w-3 h-3" /> Rider</Badge>;
    case "admin":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 pr-3 text-[10px] font-bold"><Shield className="w-3 h-3" /> Admin</Badge>;
    default:
      return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] font-bold">{role}</Badge>;
  }
};

const getSegmentTag = (user: UserRecord) => {
  if (user.role !== "customer") return null;
  const spent = user.totalSpent || 0;
  const orders = user.totalOrders || 0;
  const lastOrderDays = user.lastOrderDate
    ? Math.floor((Date.now() - new Date(user.lastOrderDate).getTime()) / (1000*60*60*24))
    : 999;

  if (lastOrderDays > 60) return { label: "Dormant", color: "bg-slate-100 text-slate-600", emoji: "💤" };
  if (lastOrderDays > 30) return { label: "At Risk", color: "bg-red-100 text-red-700", emoji: "⚠️" };
  if (spent >= 50000) return { label: "VIP", color: "bg-amber-100 text-amber-700", emoji: "👑" };
  if (spent >= 25000) return { label: "Gold", color: "bg-yellow-100 text-yellow-700", emoji: "🥇" };
  if (spent >= 12500) return { label: "Silver", color: "bg-slate-100 text-slate-600", emoji: "🥈" };
  return { label: "Regular", color: "bg-blue-50 text-blue-600", emoji: "" };
};

const getWalletLabel = (role: string) => {
  switch (role) {
    case "customer": return "Wallet";
    case "vendor": return "Payout Due";
    case "rider": return "Earnings";
    default: return "Balance";
  }
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const PUBLIC_AUTH_URL = AUTH_API_URL.replace("/admin/auth", "/auth");

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState(roleParam || "all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", password: "Password123!", role: "customer" });

  const handleExport = () => {
    if (filteredData.length === 0) return toast.error("No data to export");
    const csvHeader = "ID,Name,Email,Phone,Role,Status,Joined\n";
    const csvContent = filteredData.map(u => `${u.id},"${u.name}",${u.email || ""},${u.phone || ""},${u.role},${getUserStatus(u)},${new Date(u.createdAt).toLocaleDateString()}`).join("\n");
    const blob = new Blob([csvHeader + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cleclo_users_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export successful");
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.phone) return toast.error("Name and Phone are required");
    setIsAdding(true);
    try {
      const payload: any = { name: newUser.name, phone: newUser.phone, password: newUser.password, role: newUser.role, address: "Added by Admin", lat: 0, lng: 0 };
      if (newUser.email.trim() !== "") payload.email = newUser.email;
      
      const res = await fetch(`${PUBLIC_AUTH_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user");
      toast.success(`${newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)} added successfully!`);
      setIsAddModalOpen(false);
      setNewUser({ name: "", email: "", phone: "", password: "Password123!", role: "customer" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (roleParam) setRoleFilter(roleParam);
  }, [roleParam]);

  const filteredData = useMemo(() => {
    return users.filter((user) => {
      const status = getUserStatus(user);
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchQuery) ||
        user.id?.toLowerCase().includes(searchLower);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleBlockUser = async (userId: string, currentBlocked: boolean) => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users/${userId}/block`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ blocked: !currentBlocked }),
      });
      if (!res.ok) throw new Error("Failed to update user status");
      toast.success(currentBlocked ? "User unblocked" : "User blocked");
      fetchUsers();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    }
  };

  const handleViewDetails = (user: UserRecord) => {
    if (user.role === "vendor") {
      router.push(`/vendors/${user.id}`);
    } else {
      router.push(`/users/${user.id}`);
    }
  };

  // Summary stats
  const totalCustomers = users.filter((u) => u.role === "customer").length;
  const totalVendors = users.filter((u) => u.role === "vendor").length;
  const totalRiders = users.filter((u) => u.role === "rider").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const blockedUsers = users.filter((u) => u.status === 'blocked').length;
  const totalWalletLiability = users.filter(u => u.role === "customer").reduce((s, u) => s + (u.walletBalance || 0), 0);
  const totalVendorPayoutDue = users.filter(u => u.role === "vendor").reduce((s, u) => s + (u.walletBalance || 0), 0);

  const pageTitle = roleFilter !== "all"
    ? `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}s`
    : "All Users";

  if (isLoading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading users...</p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Users</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Button onClick={fetchUsers} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-900 font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-slate-500">Manage your {roleFilter === "all" ? "users" : roleFilter} base</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl shadow-sm shadow-[#3E8940]/20" onClick={() => { setNewUser({ ...newUser, role: roleFilter === "all" ? "customer" : roleFilter }); setIsAddModalOpen(true); }}>
            <UserPlus className="h-4 w-4" />
            Add {roleFilter !== "all" ? roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1) : "User"}
          </Button>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total {pageTitle}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{roleFilter === "customer" ? totalCustomers : roleFilter === "vendor" ? totalVendors : users.length}</h3>
            {roleFilter === "customer" && (
              <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+180 this month</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <UsersIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Users</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{users.filter(u => !u.isBlocked).length}</h3>
            <div className="mt-2 text-xs text-slate-400">
              {Math.round((users.filter(u => !u.isBlocked).length / Math.max(users.length, 1)) * 100)}% of total base
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <User className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Orders</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">15.2K</h3>
            <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+12% vs last month</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">New Signups</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{users.filter(u => new Date(u.createdAt).getMonth() === new Date().getMonth()).length}</h3>
            <div className="mt-2 text-xs text-slate-400">Past 30 days</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <UserPlus className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
          <Input
            placeholder="Search by name, email, phone, or ID..."
            className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] bg-white rounded-xl">
              <UsersIcon className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
              <SelectItem value="rider">Riders</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={() => { setRoleFilter("all"); setStatusFilter("all"); setSearchQuery(""); }} className="text-red-500 hover:bg-red-50 font-bold text-xs">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50/30 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{roleFilter === "customer" ? "Customer" : "User"} List</h2>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="py-4 pl-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">Customer</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Contact Info</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Status</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Orders</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Total Spent</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Joined</TableHead>
              <TableHead className="py-4 pr-6 text-right font-bold text-[10px] uppercase tracking-wider text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((user) => {
                const displayName = user.vendorProfile?.businessName || user.name || "Unknown";
                const status = getUserStatus(user);
                const segment = getSegmentTag(user);
                const walletLabel = getWalletLabel(user.role);
                const totalSpent = user.totalSpent || 0;
                const orders = user.totalOrders || 0;
                return (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(user)}>
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarFallback className={`font-bold ${
                            user.role === "vendor" ? "bg-orange-50 text-orange-600" :
                            user.role === "rider" ? "bg-purple-50 text-purple-600" :
                            "bg-blue-50 text-blue-600"
                          }`}>
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">ID: {user.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {user.email && (
                          <p className="text-xs text-slate-600 truncate max-w-[200px]">
                            {user.email}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 font-medium">
                          {user.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(status)} border font-bold text-[10px] shadow-none rounded-full px-3`}>{status}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{orders}</TableCell>
                    <TableCell className="font-bold text-slate-900">{formatINR(totalSpent)}</TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(user); }} className="gap-2">
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleBlockUser(user.id, user.isBlocked); }} className={`gap-2 ${user.isBlocked ? "text-emerald-600" : "text-red-600"}`}>
                            <Ban className="h-4 w-4" /> {user.isBlocked ? "Unblock" : "Block"} Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">No results found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
          <p className="text-sm text-slate-500">Showing {filteredData.length} of {users.length} records</p>
        </div>
      </div>
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New {newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="rounded-xl" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="+91 9876543210" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="rounded-xl" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (Optional)</Label>
              <Input id="email" placeholder="john@example.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="rounded-xl" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label>Assigned Role</Label>
              <div className="p-2 bg-slate-50 rounded-xl border text-sm text-slate-600 font-medium">
                {newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                The user will be created with the temporary password: <span className="font-bold underline">{newUser.password}</span>. They can change it after their first login.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl" onClick={handleAddUser} disabled={isAdding}>
              {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />} 
              Create {newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
      </div>
    }>
      <UsersPageContent />
    </Suspense>
  );
}
