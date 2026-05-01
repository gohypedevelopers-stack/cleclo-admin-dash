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
  TrendingUp, Camera,
  ChevronLeft,
  ChevronRight,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3001/admin";

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
  avgOrderValue?: number;
  lastOrderDate?: string;
  refundCount?: number;
  complaintCount?: number;
  vendorProfile?: {
    businessName?: string;
    isApproved?: boolean;
    commissionRate?: number;
    bankVerified?: boolean;
    rating?: number;
  };
}

type NewUserPayload = {
  name: string;
  phone: string;
  password: string;
  role: string;
  address: string;
  lat: number;
  lng: number;
  image?: string;
  email?: string;
};

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "Unexpected error";

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "active") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "blocked" || s === "suspended") return "bg-red-100 text-red-700 border-red-200";
  if (s === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const getUserStatus = (user: UserRecord): string => {
  if (user.isBlocked === true || user.status === "blocked" || user.status === "suspended") return "Blocked";
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

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatRelativeDate = (dateString: string | Date | undefined) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateString);
};

const PUBLIC_AUTH_URL = AUTH_API_URL.replace("/admin/auth", "/auth");

function UsersPageContent() {
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Image size must be less than 2MB");
      const reader = new FileReader();
      reader.onloadend = () => setNewUser((prev) => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const urlSearchQuery = searchParams.get("search") || "";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState(roleParam || "all");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", password: "Password123!", role: "customer", image: "" });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState("Password123!");

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    setIsResetting(true);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users/${resetPasswordUser.id}/reset-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      toast.success("Password reset successfully");
      setIsResetModalOpen(false);
      setNewPassword("Password123!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsResetting(false);
    }
  };

  const handleExport = () => {
    if (users.length === 0) return toast.error("No data to export");
    const csvHeader = "ID,Name,Email,Phone,Role,Status,Joined\n";
    const csvContent = users.map(u => `${u.id},"${u.name}",${u.email || ""},${u.phone || ""},${u.role},${getUserStatus(u)},${new Date(u.createdAt).toLocaleDateString()}`).join("\n");
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
      const payload: NewUserPayload = { name: newUser.name, phone: newUser.phone, password: newUser.password, role: newUser.role, address: "Added by Admin", lat: 0, lng: 0 };
      if (newUser.email.trim() !== "") payload.email = newUser.email;
      
      const res = await fetch(`${PUBLIC_AUTH_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, image: newUser.image })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user");
      toast.success(`${newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)} added successfully!`);
      setIsAddModalOpen(false);
      setNewUser({ name: "", email: "", phone: "", password: "Password123!", role: "customer", image: "" });
      fetchUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", currentPage.toString());
      params.set("limit", limit.toString());

      const res = await apiFetch(`${AUTH_API_URL}/users?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      
      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotalRecords(data.pagination.total);
      } else {
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, currentPage]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  useEffect(() => {
    if (roleParam) {
      setRoleFilter(roleParam);
      setCurrentPage(1);
    }
  }, [roleParam]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
    setCurrentPage(1);
  }, [urlSearchQuery]);

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
    } catch (err: unknown) {
      toast.error("Failed", { description: getErrorMessage(err) });
    }
  };

  const handleViewDetails = (user: UserRecord) => {
    if (user.role === "vendor") {
      router.push(`/vendors/${user.id}`);
    } else {
      router.push(`/users/${user.id}`);
    }
  };

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

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
          <Input
            placeholder="Search by name, email, phone, or ID..."
            className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}>
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
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
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
            <Button variant="ghost" size="sm" onClick={() => { setRoleFilter("all"); setStatusFilter("all"); setSearchQuery(""); setCurrentPage(1); }} className="text-red-500 hover:bg-red-50 font-bold text-xs">
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
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <Table className="min-w-[1200px] w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="py-4 pl-6 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[15%]">Customer</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[15%]">Contact Info</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[10%]">Role</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[8%]">Status</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[6%] text-center">Orders</TableHead>
              <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[10%]">Total Spent</TableHead>
              {roleFilter === "customer" && (
                <>
                  <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[10%]">Avg Value</TableHead>
                  <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[10%]">Last Order</TableHead>
                  <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[6%] text-center">Refunds</TableHead>
                  <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[6%] text-center">Complaints</TableHead>
                </>
              )}
              {roleFilter !== "customer" && (
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[10%]">Joined</TableHead>
              )}
              <TableHead className="py-4 pr-6 text-right font-bold text-[10px] uppercase tracking-wider text-slate-400 w-[8%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => {
                const displayName = user.vendorProfile?.businessName || user.name || "Unknown";
                const status = getUserStatus(user);
                const totalSpent = user.totalSpent || 0;
                const orders = user.totalOrders || 0;
                const avgValue = user.avgOrderValue || 0;
                const lastOrder = user.lastOrderDate ? formatRelativeDate(user.lastOrderDate) : "Never";
                const refunds = user.refundCount || 0;
                const complaints = user.complaintCount || 0;

                // Semantic logic
                const isVIP = user.role === "customer" && totalSpent > 10000;
                const isFraudProne = user.role === "customer" && refunds >= 2;
                
                const lastOrderDays = user.lastOrderDate 
                  ? Math.floor((new Date().getTime() - new Date(user.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isDormant = user.role === "customer" && lastOrderDays !== null && lastOrderDays > 30;

                return (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(user)}>
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border shadow-sm">
                          <AvatarImage src={(user as any).image || null} className="object-cover" />
                          <AvatarFallback className={`font-bold text-xs ${
                            user.role === "vendor" ? "bg-orange-50 text-orange-600" :
                            user.role === "rider" ? "bg-purple-50 text-purple-600" :
                            "bg-blue-50 text-blue-600"
                          }`}>
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1">
                            <p className="font-semibold text-gray-900 text-xs truncate">{displayName}</p>
                            {isVIP && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px] h-3 px-1 font-black leading-none">VIP</Badge>
                            )}
                            {isFraudProne && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-[8px] h-3 px-1 font-black leading-none">RISK</Badge>
                            )}
                            {isDormant && (
                              <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[8px] h-3 px-1 font-black leading-none uppercase">Dormant</Badge>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium">ID: {user.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {user.email && (
                          <p className="text-[11px] text-slate-600 truncate max-w-[150px]">
                            {user.email}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 font-medium">
                          {user.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(status)} border font-bold text-[9px] shadow-none rounded-full px-2`}>{status}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700 text-center text-xs">{orders}</TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs">{formatINR(totalSpent)}</TableCell>
                    
                    {roleFilter === "customer" && (
                      <>
                        <TableCell className="font-medium text-slate-600 text-xs">{formatINR(avgValue)}</TableCell>
                        <TableCell className="text-[11px] text-slate-500">{lastOrder}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("font-bold text-[10px]", refunds > 0 ? "text-red-600 border-red-200 bg-red-50" : "text-slate-400 border-slate-100")}>
                            {refunds}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("font-bold text-[10px]", complaints > 0 ? "text-amber-600 border-amber-200 bg-amber-50" : "text-slate-400 border-slate-100")}>
                            {complaints}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    
                    {roleFilter !== "customer" && (
                      <TableCell className="text-xs text-slate-500">{formatDate(user.createdAt)}</TableCell>
                    )}

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
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setResetPasswordUser(user); setIsResetModalOpen(true); }} className="gap-2 text-amber-600 font-medium">
                            <RefreshCw className="h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleBlockUser(user.id, Boolean(user.isBlocked)); }} className={`gap-2 ${user.isBlocked ? "text-emerald-600" : "text-red-600"}`}>
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
                <TableCell colSpan={roleFilter === "customer" ? 11 : 8} className="h-32 text-center text-slate-500">No results found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
        
        {/* Pagination UI */}
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-700">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * limit, totalRecords)}</span> of <span className="font-bold text-slate-700">{totalRecords}</span> users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={isLoading}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg text-xs font-bold",
                      currentPage === pageNum ? "bg-[#3E8940] hover:bg-[#3E8940]/90" : ""
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Resetting password for <span className="font-bold text-slate-900">{resetPasswordUser?.name}</span>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl" onClick={handleResetPassword} disabled={isResetting}>
              {isResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New {newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-sm">
                  <AvatarImage src={newUser.image || undefined} className="object-cover" />
                  <AvatarFallback className="bg-slate-50 text-slate-400">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 hover:bg-slate-50">
                    <Camera className="h-4 w-4" /> Choose Photo
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name</Label>
              <Input id="add-name" placeholder="John Doe" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="rounded-xl" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone Number</Label>
              <Input id="add-phone" placeholder="+91 9876543210" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="rounded-xl" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email Address (Optional)</Label>
              <Input id="add-email" placeholder="john@example.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="rounded-xl" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label>Assigned Role</Label>
              <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="rider">Rider</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
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
