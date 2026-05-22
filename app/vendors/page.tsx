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
  CheckCircle2,
  AlertCircle,
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
  TrendingUp,
  BarChart3,
  Gauge,
  Package,
  Shield,
  CalendarClock,
  Truck,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    ordersThisMonth?: number;
    refundAmount?: number;
    commissionEarned?: number;
    payoutPending?: number;
    slaScore?: number;
    issueRate?: number;
    dailyCapacity?: number;
    currentLoad?: number;
    areaCoverage?: string;
    city?: string;
    area?: string;
    cluster?: string;
    agreementSignedAt?: string;
    damageRate?: string;
  };
  addresses?: Array<{ city?: string; area?: string; fullAddress?: string }>;
  _count?: { ordersAsVendor?: number };
}

const getVendorTier = (v: any) => {
  // Use performanceTier from backend if available, otherwise calculate locally
  if (v.vendorProfile?.performanceTier) {
    const tier = v.vendorProfile.performanceTier;
    return {
      label: tier.label,
      emoji: tier.badge.split(' ')[0],
      color: tier.color + " border-transparent"
    };
  }

  const sla = v.vendorProfile?.slaScore ?? 0;
  const rating = v.vendorProfile?.rating ?? 0;
  
  if (sla > 95 && rating > 4.7) 
    return { label: "Gold", emoji: "🥇", color: "bg-amber-100 text-amber-700 border-amber-200" };
  if (sla >= 85 && sla <= 95) 
    return { label: "Silver", emoji: "🥈", color: "bg-slate-100 text-slate-700 border-slate-200" };
  if (sla < 80) 
    return { label: "Probation", emoji: "⚠️", color: "bg-red-100 text-red-700 border-red-200" };
  return { label: "Standard", emoji: "⭐", color: "bg-blue-100 text-blue-700 border-blue-200" };
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const getStatusLabel = (vendor: VendorRecord) => {
  if (vendor.isBlocked) return "Suspended";
  if (!vendor.vendorProfile?.isApproved) return "Pending";
  return "Active";
};

const getStatusColor = (s: string) => { 
  switch (s) { 
    case "Active": return "bg-green-100 text-green-700 border-green-200"; 
    case "Live but No Orders": return "bg-blue-100 text-blue-700 border-blue-200";
    case "Verification Pending": return "bg-amber-100 text-amber-700 border-amber-200"; 
    case "Suspended": return "bg-red-100 text-red-700 border-red-200"; 
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
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vendorsRes, statsRes] = await Promise.all([
        apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() }),
        apiFetch(`${AUTH_API_URL}/dashboard/stats`, { headers: getAuthHeaders() }),
      ]);
      if (!vendorsRes.ok || !statsRes.ok) throw new Error("Failed to load vendors data");
      const vendorsData = await vendorsRes.json();
      const statsData = await statsRes.json();
      setVendors(Array.isArray(vendorsData) ? vendorsData : vendorsData.vendors || []);
      setStats(statsData);
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
  const totalHighRisk = vendors.filter((v) => 
    (v.vendorProfile?.issueRate || 0) > 10 || 
    (v.vendorProfile?.slaScore || 100) < 80 || 
    v.isBlocked || 
    getStatusLabel(v) === "Suspended"
  ).length;

  const activeVendorsList = vendors.filter(v => getStatusLabel(v) === "Active");
  
  const totalOrders = vendors.reduce((sum, v) => sum + (v.vendorProfile?.totalOrders || 0), 0);
  const totalRevenue = vendors.reduce((sum, v) => sum + (v.vendorProfile?.totalRevenue || 0), 0);
  const totalCommission = vendors.reduce((sum, v) => sum + (v.vendorProfile?.commissionEarned || 0), 0);
  const totalPayoutPending = vendors.reduce((sum, v) => sum + (v.vendorProfile?.payoutPending || 0), 0);
  
  const avgSla = activeVendorsList.length > 0
    ? activeVendorsList.reduce((sum, v) => sum + (v.vendorProfile?.slaScore || 0), 0) / activeVendorsList.length
    : 0;
    
  const avgRating = activeVendorsList.length > 0
    ? activeVendorsList.reduce((sum, v) => sum + (v.vendorProfile?.rating || 0), 0) / activeVendorsList.length
    : 0;

  const avgIssueRate = activeVendorsList.length > 0
    ? activeVendorsList.reduce((sum, v) => sum + (v.vendorProfile?.issueRate || 0), 0) / activeVendorsList.length
    : 0;

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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total Vendors", value: `${vendors.length}`, filter: "all", color: "bg-[#2170FF]", icon: Store, note: "Overall platform partners" },
          { label: "Total Orders", value: `${totalOrders}`, filter: "all", color: "bg-teal-600", icon: Package, note: "Overall orders serviced" },
          { 
            label: "Vendor Risk Indicator", 
            value: `⚠ ${totalPending} / 🚨 ${totalHighRisk}`, 
            filter: "pending", 
            color: (totalPending > 0 || totalHighRisk > 0) ? "bg-gradient-to-br from-[#FF002E] to-red-700 ring-2 ring-red-400 animate-pulse border-none" : "bg-emerald-600", 
            icon: ShieldCheck, 
            note: "Operational risk tracking", 
            isRisk: true 
          },
          { 
            label: "Composite Vendor Score", 
            value: `${(((avgSla) + (avgRating / 5 * 100) + (100 - avgIssueRate)) / 3).toFixed(0)}%`, 
            filter: "active", 
            color: "bg-[#00B633]", 
            icon: Star, 
            note: "Composite vendor metric", 
            isScore: true 
          },
          { label: "Total Vendor Revenue", value: formatINR(totalRevenue), filter: "all", color: "bg-blue-600", icon: IndianRupee, note: "Gross merchant revenue" },
          { label: "Platform Commission Earned", value: formatINR(totalCommission), filter: "all", color: "bg-indigo-600", icon: TrendingUp, note: "Net commission generated" },
          { 
            label: "Commission Earned (This Month)", 
            value: formatINR(stats?.commissionThisMonth || 0), 
            trend: stats?.commissionTrend,
            filter: "all", 
            color: "from-emerald-600 to-emerald-700 bg-gradient-to-br", 
            icon: TrendingUp, 
            note: "Platform net revenue this month" 
          },
          { label: "Total Pending Payout", value: formatINR(totalPayoutPending), filter: "all", color: "bg-violet-600", icon: CreditCard, note: "Pending settle to partners" },
          { label: "Avg SLA %", value: `${Math.round(avgSla)}%`, filter: "active", color: "bg-[#3E8940]", icon: Award, note: "Order fulfilment rate" },
          { label: "Avg Issue Rate", value: `${avgIssueRate.toFixed(1)}%`, filter: "active", color: "bg-[#FF002E]", icon: AlertTriangle, note: "Incident issue rate" },
        ].map((stat) => (
          <div 
            key={stat.label} 
            className={`${stat.color} rounded-2xl shadow-lg p-5 hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden text-white flex flex-col justify-between min-h-[130px]`}
            onClick={() => stat.filter !== "all" && setStatusFilter(stat.filter)}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-80">{stat.label}</p>
                <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-md">
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              {stat.isRisk ? (
                <div className="flex flex-col gap-1 text-[10px] font-black text-white mt-1 leading-snug">
                  <div>⚠ Under Review: {totalPending}</div>
                  <div>🚨 High Risk: {totalHighRisk}</div>
                </div>
              ) : (
                <p className="text-2xl font-black mb-1">
                  {stat.value}
                  {stat.trend !== undefined && stat.trend !== null && (
                    <span className="ml-1.5 text-xs font-semibold opacity-90">
                      ({stat.trend >= 0 ? "+" : ""}{Math.round(stat.trend)}%)
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="relative z-10 flex flex-col gap-1 opacity-80 mt-2 border-t border-white/10 pt-1.5">
              {stat.isScore ? (
                <div className="flex flex-col text-[8.5px] font-bold text-white/95 leading-snug">
                  <div className="flex justify-between">
                    <span>SLA: {Math.round(avgSla)}%</span>
                    <span>Rating: {avgRating.toFixed(1)}</span>
                  </div>
                  <span>Issue Rate: {avgIssueRate.toFixed(1)}%</span>
                </div>
              ) : stat.isRisk ? (
                <p className="text-[9px] font-medium leading-none">Review Required / Risk Alert</p>
              ) : (
                <p className="text-[9px] font-medium leading-none">{stat.note}</p>
              )}
            </div>
            {/* Glossy overlay effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl" />
          </div>
        ))}
      </div>

      {/* Settlement Status Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlements Due</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{formatINR(stats?.settlementsDue || 0)}</p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px]">AWAITING</Badge>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#3E8940] group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlements Completed</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{formatINR(stats?.settlementsCompleted || 0)}</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-[#3E8940] border-none font-bold text-[9px]">SETTLED</Badge>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue</p>
                <p className="text-lg font-black text-rose-600 mt-0.5">{formatINR(stats?.settlementsOverdue || 0)}</p>
              </div>
            </div>
            <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-[9px] animate-pulse">CRITICAL</Badge>
          </CardContent>
        </Card>
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
        <Table className="min-w-[1200px] w-full">
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b">
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">Vendor</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Rating</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Total Orders</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Total Revenue</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Commission Earned</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Pending Payout</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center whitespace-nowrap">Refund Amount</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Status</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => {
                const vp = vendor.vendorProfile;
                const displayName = vp?.businessName || vendor.name || "Unknown";
                const status = getStatusLabel(vendor);
                
                const isApproved = vp?.isApproved;
                const orders = vp?.totalOrders || 0;
                let displayStatus = "Verification Pending";
                if (vendor.isBlocked) displayStatus = "Suspended";
                else if (isApproved && orders > 0) displayStatus = "Active";
                else if (isApproved && orders === 0) displayStatus = "Live but No Orders";

                const revenue = vp?.totalRevenue || 0;
                const revenueMonth = vp?.revenueThisMonth || 0;
                const commission = vp?.commissionEarned || 0;
                const commRate = vp?.commissionRate || 18;
                const payout = vp?.payoutPending || 0;
                const refundAmount = vp?.refundAmount || 0;
                const sla = vp?.slaScore || 0;
                const rating = vp?.rating || 0;
                const city = vp?.city || vendor.addresses?.[0]?.city || "—";
                const tier = getVendorTier(vendor);

                return (
                  <TableRow key={vendor.id} className="hover:bg-slate-50/80 cursor-pointer group" onClick={() => router.push(`/vendors/${vendor.id}`)}>
                    {/* Vendor Name + Tier */}
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarFallback className={`font-bold ${status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-700"}`}>
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors text-sm">{displayName}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[10px] text-slate-400">{vp?.ownerName || vendor.name}</span>
                            <Badge variant="outline" className={`${tier.color} border font-black text-[8px] h-4 px-1 shadow-sm`}>
                              <span>{tier.emoji}</span>
                              <span>{tier.label.toUpperCase()}</span>
                            </Badge>
                            <span className="text-[10px] text-slate-400">· {city}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Rating */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {rating > 0 ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-100">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold text-slate-800">{rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">No Rating</span>
                        )}
                        <span className="text-[9px] font-bold text-slate-400 uppercase">SLA: {sla > 0 ? `${sla}%` : "0%"}</span>
                      </div>
                    </TableCell>

                    {/* Total Orders */}
                    <TableCell className="text-center">
                      <p className="text-sm font-bold text-slate-800">{orders}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-medium">Orders</p>
                    </TableCell>

                    {/* Total Revenue */}
                    <TableCell className="text-center">
                      <p className="text-sm font-bold text-emerald-700">{formatINR(revenue)}</p>
                      <p className="text-[9px] text-slate-400">Month: {formatINR(revenueMonth)}</p>
                    </TableCell>

                    {/* Commission Earned */}
                    <TableCell className="text-center">
                      <p className="text-sm font-bold text-blue-600">{commission > 0 ? formatINR(commission) : "—"}</p>
                      <p className="text-[9px] text-slate-400">{commRate}% rate</p>
                    </TableCell>

                    {/* Pending Payout */}
                    <TableCell className="text-center">
                      <p className={cn("text-sm font-bold", payout > 0 ? "text-orange-600" : "text-slate-400")}>
                        {payout > 0 ? formatINR(payout) : "—"}
                      </p>
                      {payout > 10000 && <p className="text-[8px] text-red-500 font-semibold uppercase tracking-tighter">⚠️ High</p>}
                    </TableCell>

                    {/* Refund Amount */}
                    <TableCell className="text-center">
                      <p className={cn("text-sm font-bold", refundAmount > 0 ? "text-rose-600" : "text-slate-400")}>
                        {refundAmount > 0 ? formatINR(refundAmount) : "—"}
                      </p>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${getStatusColor(displayStatus)} font-bold gap-1.5 px-2.5 py-1 text-[10px] shadow-sm`}>
                        {displayStatus === "Active" && <CheckCircle className="h-3 w-3" />}
                        {displayStatus === "Verification Pending" && <Clock className="h-3 w-3" />}
                        {displayStatus === "Live but No Orders" && <Zap className="h-3 w-3" />}
                        {displayStatus === "Suspended" && <Ban className="h-3 w-3" />}
                        {displayStatus.toUpperCase()}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-black">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-52">
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}`); }}>
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}?tab=performance`); }}>
                            <BarChart3 className="h-4 w-4" /> View Performance
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}?tab=payouts`); }}>
                            <IndianRupee className="h-4 w-4" /> View Settlements
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}?tab=commission`); }}>
                            <TrendingUp className="h-4 w-4" /> Adjust Commission %
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}?tab=sla`); }}>
                            <Gauge className="h-4 w-4" /> Set SLA Override
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/${vendor.id}?tab=area`); }}>
                            <MapPin className="h-4 w-4" /> Assign City
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {status === "Pending" && (
                            <DropdownMenuItem className="gap-2 text-green-600" onClick={(e) => { e.stopPropagation(); handleApprove(vendor.id); }}>
                              <CheckCircle className="h-4 w-4" /> Approve Vendor
                            </DropdownMenuItem>
                          )}
                          {status === "Active" && (
                            <DropdownMenuItem className="gap-2 text-red-600" onClick={(e) => { e.stopPropagation(); handleSuspend(vendor.id); }}>
                              <Ban className="h-4 w-4" /> Suspend Temporarily
                            </DropdownMenuItem>
                          )}
                          {status === "Suspended" && (
                            <DropdownMenuItem className="gap-2 text-green-600" onClick={(e) => { e.stopPropagation(); handleReactivate(vendor.id); }}>
                              <CheckCircle className="h-4 w-4" /> Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2 text-amber-600" onClick={(e) => { e.stopPropagation(); toast.info("Warning notice sent to vendor"); }}>
                            <AlertTriangle className="h-4 w-4" /> Send Warning Notice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-slate-300" />
                    <p>No vendors found.</p>
                  </div>
                </TableCell>
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
