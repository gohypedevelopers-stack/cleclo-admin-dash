"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Star,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Ban,
  CreditCard,
  Pencil,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Store,
  ShieldCheck,
  FileText,
  IndianRupee,
  Zap,
  Activity,
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
import { toast } from "sonner";
import Link from "next/link";

import { useSearchParams } from "next/navigation";


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

interface VendorRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  isBlocked: boolean;
  createdAt: string;
  vendorProfile?: {
    businessName?: string;
    ownerName?: string;
    isApproved?: boolean;
    commissionRate?: number;
    bankVerified?: boolean;
    gstRegistered?: boolean;
    gstNumber?: string;
    ownerIdProofUrl?: string;
    businessProofUrl?: string;
    termsAccepted?: boolean;
    slaAccepted?: boolean;
    rating?: number;
    totalRevenue?: number;
    totalOrders?: number;
    revenueThisMonth?: number;
    refundAmount?: number;
    commissionEarned?: number;
  };
  addresses?: Array<{ city?: string; area?: string; fullAddress?: string }>;
  _count?: { ordersAsVendor?: number };
}

const getStatusLabel = (vendor: VendorRecord) => {
  if (vendor.isBlocked) return "Suspended";
  if (!vendor.vendorProfile?.isApproved) return "Pending";
  return "Active";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-emerald-100 text-emerald-700";
    case "Pending": return "bg-amber-100 text-amber-700";
    case "Suspended": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

function VendorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load vendors");
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : data.vendors || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const displayName = vendor.vendorProfile?.businessName || vendor.name || "";
      const ownerName = vendor.vendorProfile?.ownerName || vendor.name || "";
      const city = vendor.addresses?.[0]?.city || "";
      const status = getStatusLabel(vendor);

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        displayName.toLowerCase().includes(searchLower) ||
        ownerName.toLowerCase().includes(searchLower) ||
        city.toLowerCase().includes(searchLower) ||
        vendor.phone?.includes(searchQuery) ||
        vendor.email?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "all" || status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchQuery, statusFilter]);

  const handleApprove = async (vendorId: string) => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}/approve`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isApproved: true }),
      });
      if (!res.ok) throw new Error("Failed to approve vendor");
      toast.success("Vendor approved successfully");
      fetchVendors();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    }
  };

  const handleSuspend = async (vendorId: string) => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}/suspend`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ suspended: true }),
      });
      if (!res.ok) throw new Error("Failed to suspend vendor");
      toast.success("Vendor suspended");
      fetchVendors();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    }
  };

  const handleReactivate = async (vendorId: string) => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}/suspend`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ suspend: false }),
      });
      if (!res.ok) throw new Error("Failed to reactivate vendor");
      toast.success("Vendor reactivated");
      fetchVendors();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    }
  };

  // Summary stats
  const totalActive = vendors.filter((v) => getStatusLabel(v) === "Active").length;
  const totalPending = vendors.filter((v) => getStatusLabel(v) === "Pending").length;
  const totalSuspended = vendors.filter((v) => getStatusLabel(v) === "Suspended").length;

  if (isLoading && vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading vendors...</p>
      </div>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Vendors</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Button onClick={fetchVendors} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">Vendors</h1>
          <p className="text-slate-500 mt-1">Manage laundry service providers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80 rounded-xl" asChild>
            <Link href="/finance/settlements">
              <CreditCard className="h-4 w-4" />
              Manage Settlements
            </Link>
          </Button>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Vendors", value: vendors.length, filter: "all", color: "bg-[#2170FF]", icon: Store, note: "From live database" },
          { label: "Active Vendors", value: totalActive, filter: "active", color: "bg-[#00B633]", icon: CheckCircle, note: "Approved & unblocked" },
          { label: "Pending Review", value: totalPending, filter: "pending", color: "bg-[#FF8A00]", icon: Clock, note: "Needs attention" },
          { label: "Blocked", value: totalSuspended, filter: "suspended", color: "bg-[#FF002E]", icon: Ban, note: "Suspended" },
        ].map((stat) => (
          <div 
            key={stat.label} 
            className={`${stat.color} rounded-2xl shadow-lg p-6 hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden text-white`}
            onClick={() => setStatusFilter(stat.filter)}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-80">{stat.label}</p>
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">{stat.value}</p>
              <div className="flex items-center gap-1.5 opacity-80">
                {stat.label === "Active Vendors" ? <Zap className="h-3 w-3" /> : stat.label === "Pending Review" ? <Clock className="h-3 w-3" /> : stat.label === "Blocked" ? <Ban className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                <p className="text-[10px] font-medium">{stat.note}</p>
              </div>
            </div>
            {/* Glossy overlay effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            
            {statusFilter === stat.filter && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40" />
            )}
          </div>
        ))}
      </div>


      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
          <Input
            placeholder="Search by name, owner, city, phone..."
            className="pl-10 bg-slate-50 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">Vendor</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider whitespace-nowrap">Revenue This Month</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider whitespace-nowrap">Avg Order Value</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider whitespace-nowrap">Refund Amount</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider whitespace-nowrap">Commission Earned</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-right pr-6 tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => {
                const displayName = vendor.vendorProfile?.businessName || vendor.name || "Unknown";
                const ownerName = vendor.vendorProfile?.ownerName || vendor.name || "";
                const city = vendor.addresses?.[0]?.city || "—";
                const status = getStatusLabel(vendor);
                const commission = vendor.vendorProfile?.commissionRate ? `${vendor.vendorProfile.commissionRate}%` : "—";
                const hasKYC = vendor.vendorProfile?.ownerIdProofUrl && vendor.vendorProfile?.businessProofUrl;
                const hasBank = vendor.vendorProfile?.bankVerified;
                const hasGST = vendor.vendorProfile?.gstRegistered;
                const orderCount = vendor._count?.ordersAsVendor ?? "—";

                return (
                  <TableRow key={vendor.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/vendors/${vendor.id}`)}>
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shadow-sm"><AvatarFallback className="bg-orange-50 text-orange-600 font-bold">{displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-semibold text-black text-sm">{displayName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge className={`${getStatusColor(status)} border-none font-bold text-[8px] px-1.5 py-0`}>{status.toUpperCase()}</Badge>
                            <span className="text-[10px] text-slate-400">· {city}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-emerald-600">₹{(vendor.vendorProfile?.revenueThisMonth || 0).toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400">Total: ₹{(vendor.vendorProfile?.totalRevenue || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-700">₹{vendor.vendorProfile?.totalOrders && vendor.vendorProfile.totalOrders > 0 ? Math.round((vendor.vendorProfile.totalRevenue || 0) / vendor.vendorProfile.totalOrders).toLocaleString() : "0"}</div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${(vendor.vendorProfile?.refundAmount || 0) > 0 ? "text-rose-600 font-medium" : "text-slate-400"}`}>₹{(vendor.vendorProfile?.refundAmount || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-blue-600">₹{(vendor.vendorProfile?.commissionEarned || 0).toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400">{vendor.vendorProfile?.commissionRate || 18}% rate</div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-black" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}`); }}>
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          {status === "Pending" && (
                            <DropdownMenuItem className="gap-2 text-green-600" onClick={(e) => { e.stopPropagation(); handleApprove(vendor.id); }}>
                              <CheckCircle className="h-4 w-4" /> Approve Vendor
                            </DropdownMenuItem>
                          )}
                          {status === "Active" && (
                            <DropdownMenuItem className="gap-2 text-red-600" onClick={(e) => { e.stopPropagation(); handleSuspend(vendor.id); }}>
                              <Ban className="h-4 w-4" /> Suspend Vendor
                            </DropdownMenuItem>
                          )}
                          {status === "Suspended" && (
                            <DropdownMenuItem className="gap-2 text-green-600" onClick={(e) => { e.stopPropagation(); handleReactivate(vendor.id); }}>
                              <CheckCircle className="h-4 w-4" /> Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}?tab=payouts`); }}>
                            <CreditCard className="h-4 w-4" /> View Payouts
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">No vendors found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
          <p className="text-sm text-slate-500">Showing {filteredVendors.length} of {vendors.length} vendors</p>
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading vendors...</p>
      </div>
    }>
      <VendorsContent />
    </Suspense>
  );
}
