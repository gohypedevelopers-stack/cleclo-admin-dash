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
  walletBalance?: number;
  totalOrders?: number;
  totalSpent?: number;
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

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

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
      const status = user.status === 'blocked' ? "Blocked" : "Active";
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
  const blockedUsers = users.filter((u) => u.status === 'blocked').length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-slate-500">Manage all accounts and profiles across the platform.</p>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
      </div>

      {/* Role Tab Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", count: totalCustomers, icon: User, color: "text-blue-600", bg: "bg-blue-50", filter: "customer" },
          { label: "Total Vendors", count: totalVendors, icon: Store, color: "text-orange-600", bg: "bg-orange-50", filter: "vendor" },
          { label: "Total Riders", count: totalRiders, icon: Bike, color: "text-purple-600", bg: "bg-purple-50", filter: "rider" },
          { label: "Blocked Users", count: blockedUsers, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", filter: "blocked" },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              if (tab.filter === "blocked") {
                setRoleFilter("all");
                setStatusFilter("Blocked");
              } else {
                setRoleFilter(tab.filter);
                setStatusFilter("all");
              }
            }}
            className={`p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left ${
              roleFilter === tab.filter ? "ring-2 ring-[#3E8940]/20 border-[#3E8940]/30" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${tab.bg}`}>
                <tab.icon className={`h-4 w-4 ${tab.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${tab.color}`}>{tab.count}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{tab.label}</p>
          </button>
        ))}
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
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="py-4 pl-6 font-bold text-[10px] uppercase tracking-wider text-slate-400">User</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Role</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Contact</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Wallet</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Orders</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Status</TableHead>
              <TableHead className="py-4 pr-6 text-right font-bold text-[10px] uppercase tracking-wider text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((user) => {
                const displayName = user.vendorProfile?.businessName || user.name || "Unknown";
                const status = user.isBlocked ? "Blocked" : "Active";
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
                          <p className="text-[10px] text-slate-400 font-medium">Joined {formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {user.email && (
                          <p className="text-xs flex items-center gap-1.5 text-slate-600 truncate max-w-[200px]">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            {user.email}
                          </p>
                        )}
                        <p className="text-xs flex items-center gap-1.5 text-slate-600">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          {user.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium text-slate-700 text-sm">
                        <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                        {user.walletBalance != null ? formatINR(user.walletBalance) : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium text-slate-900">{user.totalOrders ?? "—"}</span>
                        <span className="text-slate-500 ml-1 text-xs">{user.role === "rider" ? "deliveries" : "orders"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(status)} border font-bold text-[10px] shadow-none`}>{status}</Badge>
                    </TableCell>
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
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">No results found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
          <p className="text-sm text-slate-500">Showing {filteredData.length} of {users.length} records</p>
        </div>
      </div>
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
