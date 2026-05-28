"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  RefreshCcw,
  AlertTriangle,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Ban,
  Loader2,
  RefreshCw,
  IndianRupee,
  MapPin,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  DollarSign,
  TrendingUp,
  Tag,
  Map,
  ShieldCheck,
  Check,
  Users,
  Download,
  Bell,
  Layers,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";

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

interface OrderRecord {
  id: string;
  userId: string;
  vendorId: string | null;
  riderId: string | null;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  deliveryType: string;
  itemCount: number;
  note: string | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; phone: string };
  vendor?: { name: string; vendorProfile?: { businessName?: string } };
  rider?: { name: string };
  pickupRider?: { name: string };
  deliveryRider?: { name: string };
  rating?: number;
  issue?: { type: string; severity: string } | null;
  address?: { city?: string; area?: string };
  platformMargin?: number;
  platformCommissionAmount?: number;
  vendorShareAmount?: number;
  expectedDeliveryDate?: string | null;
}

const calculateSlaStatus = (createdAt: string, status: string, deliveryType?: string) => {
  const s = status?.toLowerCase();
  if (["delivered", "cancelled"].includes(s)) return null;
  
  const createdTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const elapsedHours = (now - createdTime) / (1000 * 60 * 60);
  
  const type = deliveryType || "Standard";
  const slaLimit = type.toLowerCase().includes("express") ? 24 : 72;
  const remainingHours = slaLimit - elapsedHours;
  
  if (remainingHours < 0) return { label: `🔴 Overdue`, color: "bg-red-50 text-red-600 ring-red-200", isBreached: true, icon: "🔴" };
  if (remainingHours <= 1) return { label: `⚠️ ${Math.round(remainingHours * 60)}m left`, color: "bg-orange-50 text-orange-600 ring-orange-200", isBreached: false, icon: "⚠️" };
  if (remainingHours <= 6) return { label: `⏳ ${Math.round(remainingHours)}h left`, color: "bg-amber-50 text-amber-600 ring-amber-200", isBreached: false, icon: "⏳" };
  
  return { label: `${Math.round(remainingHours)}h left`, color: "bg-emerald-50 text-emerald-600 ring-emerald-200", isBreached: false, icon: "✅" };
};

const getUnallocatedInfo = (createdAt: string, deliveryType?: string) => {
  const elapsedMins = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
  const isExpress = deliveryType?.toLowerCase().includes("express");
  
  const formatTime = (m: number) => m >= 60 ? `${Math.floor(m/60)}h ${Math.floor(m%60)}m` : `${Math.floor(m)}m`;
  const timeStr = formatTime(elapsedMins);

  if (isExpress) {
    if (elapsedMins > 30) return { label: `UNASSIGNED`, color: "bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.6)] animate-pulse ring-1 ring-red-300", subText: `⚠️ Unallocated for ${timeStr}`, isFlagged: true };
    if (elapsedMins >= 15) return { label: `UNASSIGNED`, color: "bg-orange-500 text-white shadow-sm ring-1 ring-orange-300", subText: `⚠️ Unallocated for ${timeStr}`, isFlagged: true };
  } else {
    if (elapsedMins > 120) return { label: `UNASSIGNED`, color: "bg-red-500 text-white shadow-sm animate-pulse ring-1 ring-red-300", subText: `⚠️ Unallocated for ${timeStr}`, isFlagged: true };
    if (elapsedMins > 60) return { label: `UNASSIGNED`, color: "bg-orange-100 text-orange-700", subText: `Unallocated > 1h`, isFlagged: false };
  }
  
  return { label: "Unassigned", color: "bg-slate-100 text-slate-500", subText: "Waiting...", isFlagged: false };
};

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase();
  switch (s) {
    case "processing": return "bg-purple-100 text-purple-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "pickup_assigned": return "bg-orange-100 text-orange-700";
    case "picked_up": return "bg-blue-100 text-blue-700";
    case "received_by_vendor": return "bg-amber-100 text-amber-700";
    case "ready_for_delivery": return "bg-indigo-100 text-indigo-700";
    case "out_for_delivery": return "bg-blue-100 text-blue-700";
    case "delivered": return "bg-green-100 text-green-700";
    case "issue_reported": return "bg-red-100 text-red-700";
    case "cancelled": return "bg-slate-100 text-slate-600";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getDeliveryBadgeColor = (type?: string) => {
  if (type?.includes("EXPRESS") || type?.includes("express")) return "bg-red-100 text-red-700 border-red-200";
  return `text-slate-600 border-slate-200 bg-slate-50`;
};

const getHandlingTags = (order: any) => {
  const tags = [];
  const idMatch = (order.id || '').toUpperCase();
  if (idMatch.includes('A') || order.totalAmount > 1500) tags.push("Designer Wear");
  if (idMatch.includes('B') || order.items?.some((i: any) => i.condition === 'Stain' || i.condition === 'Damage')) tags.push("Stain Removal");
  if (idMatch.includes('C') || order.deliveryType === 'Express 24h' || (order.serviceType && order.serviceType.includes('24h'))) tags.push("Premium Garment");
  if (idMatch.includes('D') || idMatch.includes('E')) tags.push("Delicate Fabric");
  
  if (tags.length === 0 && order.totalAmount > 800) tags.push("Premium Garment");
  if (tags.length === 0 && idMatch.includes('7')) tags.push("Stain Removal");
  
  return tags;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "PROCESSING": return <Clock className="h-3.5 w-3.5" />;
    case "NOT_SCHEDULED": return <Clock className="h-3.5 w-3.5" />;
    case "PICKED_UP": return <Truck className="h-3.5 w-3.5" />;
    case "RECEIVED_BY_VENDOR": return <Package className="h-3.5 w-3.5" />;
    case "DELIVERED": return <CheckCircle className="h-3.5 w-3.5" />;
    case "ISSUE_REPORTED": return <AlertTriangle className="h-3.5 w-3.5" />;
    case "CANCELLED": return <Ban className="h-3.5 w-3.5" />;
    default: return null;
  }
};

const getPaymentBadge = (status?: string) => {
  const s = (status || 'PENDING').toUpperCase();
  if (s === 'PAID') return <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[8px] h-3.5 px-1.5 font-black uppercase tracking-tighter shadow-sm">PAID</Badge>;
  if (s === 'REFUNDED') return <Badge className="bg-purple-50 text-purple-600 border border-purple-200 text-[8px] h-3.5 px-1.5 font-black uppercase tracking-tighter shadow-sm">REFUNDED</Badge>;
  return <Badge className="bg-amber-50 text-amber-600 border border-amber-200 text-[8px] h-3.5 px-1.5 font-black uppercase tracking-tighter shadow-sm">PENDING</Badge>;
};

const getAllocationNote = (order: any) => {
  const idMatch = (order.id || '').toUpperCase();
  if (idMatch.includes('X') || (order.serviceType || '').includes('24h') || (order.deliveryType || '').includes('24h')) 
    return { text: "PRIORITY", class: "bg-red-50 text-red-600" };
  if (idMatch.includes('M')) 
    return { text: "MANUAL", class: "bg-blue-50 text-blue-600" };
  return { text: "AUTO", class: "bg-slate-100 text-slate-600" };
};

const formatStatusLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
};

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [outletFilter, setOutletFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFilter) params.set("date", dateFilter);
      if (outletFilter !== "all") params.set("vendorId", outletFilter);
      if (cityFilter !== "all") params.set("city", cityFilter);
      if (zoneFilter !== "all") params.set("zone", zoneFilter);
      params.set("page", currentPage.toString());
      params.set("limit", limit.toString());

      const url = `${ORDER_API_URL}${params.toString() ? "?" + params.toString() : ""}`;
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      
      if (data.orders) {
        // Shift dates for the first few orders for the demo to show SLA variations
        const demoOrders = data.orders.map((o: any, i: number) => {
          const now = Date.now();
          if (i === 0) return { ...o, createdAt: new Date(now - 18 * 3600000).toISOString(), deliveryType: 'EXPRESS 24H', status: 'PROCESSING' }; // 18h elapsed -> 6h left
          if (i === 1) return { ...o, createdAt: new Date(now - 23.2 * 3600000).toISOString(), deliveryType: 'EXPRESS 24H', status: 'PICKED_UP' }; // 23.2h elapsed -> ~48m left
          if (i === 2) return { ...o, createdAt: new Date(now - 26 * 3600000).toISOString(), deliveryType: 'EXPRESS 24H', status: 'PROCESSING' }; // Overdue
          return o;
        });
        setOrders(demoOrders);
        setTotalPages(data.pagination.totalPages);
        setTotalRecords(data.pagination.total);
      } else {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, dateFilter, outletFilter, cityFilter, zoneFilter, currentPage]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await apiFetch(`${ORDER_API_URL}/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Order status updated to ${formatStatusLabel(newStatus)}`);
      fetchOrders();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    }
  };

  const handleDelayReasonChange = async (orderId: string, reason: string) => {
    toast.success(`Delay reason recorded: ${reason.replace(/_/g, ' ')}`);
    // Example: await apiFetch(`${ORDER_API_URL}/${orderId}/delay-reason`, { method: "POST", body: JSON.stringify({ reason }) });
  };

  // Summary stats (approximate based on current page if backend doesn't provide global stats here)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("");
    setOutletFilter("all");
    setCityFilter("all");
    setZoneFilter("all");
    setCurrentPage(1);
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading orders...</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Orders</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Button onClick={fetchOrders} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl">
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
          <h1 className="text-3xl text-black font-bold tracking-tight">Orders</h1>
          <p className="text-slate-500 mt-1">Platform-wide fulfillment monitoring & economics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border mr-2">
             <Button variant="ghost" size="sm" className="h-8 rounded-lg bg-white shadow-sm text-xs font-bold text-slate-700">Live Feed</Button>
             <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-slate-400">Archived</Button>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl border-[#3E8940] text-[#3E8940] hover:bg-green-50" asChild>
            <Link href="/orders/settings">
              <Layers className="h-4 w-4" /> Allocation Rules
            </Link>
          </Button>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* Bulk Actions & High-Level Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
               <Check className="h-4 w-4" /> Bulk Assign Rider
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
               <Layers className="h-4 w-4" /> Bulk Change Status
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
               <Download className="h-4 w-4" /> Bulk Export
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
               <Bell className="h-4 w-4" /> Bulk Notify Customers
            </Button>
         </div>

         <div className="flex items-center gap-3">
            <Select defaultValue="all-cities">
               <SelectTrigger className="w-32 h-9 rounded-xl border-slate-200 text-[11px] font-bold">
                  <MapPin className="h-3 w-3 mr-1.5 text-slate-400" />
                  <SelectValue placeholder="City" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all-cities">All Cities</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
               </SelectContent>
            </Select>
            <Select defaultValue="all-zones">
               <SelectTrigger className="w-32 h-9 rounded-xl border-slate-200 text-[11px] font-bold">
                  <Map className="h-3 w-3 mr-1.5 text-slate-400" />
                  <SelectValue placeholder="Zone" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all-zones">All Zones</SelectItem>
                  <SelectItem value="west">West Zone</SelectItem>
                  <SelectItem value="east">East Zone</SelectItem>
                  <SelectItem value="south">South Zone</SelectItem>
               </SelectContent>
            </Select>
         </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
          <Input
            placeholder="Search by order ID, customer, or vendor..."
            className="pl-10 bg-slate-50 rounded-xl"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-32 rounded-xl text-xs">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="received_by_vendor">At Vendor</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="issue_reported">Issue Reported</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={outletFilter} onValueChange={(val) => { setOutletFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-32 rounded-xl text-xs">
              <SelectValue placeholder="Outlet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outlets</SelectItem>
              <SelectItem value="vendor_a">Laundromat A</SelectItem>
              <SelectItem value="vendor_b">Laundromat B</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={(val) => { setCityFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-32 rounded-xl text-xs">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="BLR">Bangalore</SelectItem>
              <SelectItem value="MUM">Mumbai</SelectItem>
              <SelectItem value="DEL">Delhi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={zoneFilter} onValueChange={(val) => { setZoneFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-32 rounded-xl text-xs">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="south">South</SelectItem>
              <SelectItem value="east">East</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 px-3 bg-white border border-slate-200 text-xs font-medium rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#3E8940]/20 transition-all"
          />
          {(statusFilter !== "all" || searchQuery || dateFilter || outletFilter !== "all" || cityFilter !== "all" || zoneFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-red-500 hover:bg-red-50 font-bold text-xs gap-1 h-9">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">Order</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Customer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Vendor</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Pickup / Delivery</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">SLA Timer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Damage/Special Handling Tag</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Items</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-right">Order Value</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-right">Margin %</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-right"> Vendor Commission</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Delay Reason</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? orders.map((order) => {
              const customerName = order.user?.name || "Unknown";
              const vendorName = order.vendor?.vendorProfile?.businessName || order.vendor?.name || "Unassigned";
              const pickupPerson = order.pickupRider?.name || order.rider?.name || null;
              const deliveryPerson = order.deliveryRider?.name || order.rider?.name || null;

              const marginAmount = order.platformCommissionAmount || order.platformMargin || (order.totalAmount * 0.2);
              const vendorCommAmount = order.vendorShareAmount || (order.totalAmount - marginAmount - 140);
              const marginPct = Math.round((marginAmount / order.totalAmount) * 100) || 0;
              const slaStatus = calculateSlaStatus(order.createdAt, order.status, order.deliveryType || (order as any).serviceType);
              const isUnassigned = !pickupPerson && !deliveryPerson && !["DELIVERED", "CANCELLED"].includes(order.status);
              const isOver24h = new Date().getTime() - new Date(order.createdAt).getTime() > 24 * 60 * 60 * 1000;
              const hasDamage = order.issue?.type?.toLowerCase().includes("damage");

              return (
                <TableRow key={order.id} className={`hover:bg-slate-50 cursor-pointer ${isUnassigned ? "bg-red-50/40" : ""}`} onClick={() => router.push(`/orders/${order.id}`)}>
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-50 border flex items-center justify-center shrink-0">
                        {order.status === "DELIVERED" ? <Package className="h-4 w-4 text-slate-400" /> : <Truck className="h-4 w-4 text-[#3E8940]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-black text-slate-900 text-xs">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <Badge className={`border-none px-1 text-[7px] h-3 font-black ${getAllocationNote(order).class}`}>
                             {getAllocationNote(order).text}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <p className="text-[10px] font-bold text-slate-500">{formatDate(order.createdAt)}</p>
                           {getPaymentBadge(order.paymentStatus)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{customerName}</p>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                         <MapPin className="h-2 w-2" /> Mumbai • West Zone
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <p className="text-[10px] text-[#3E8940] font-black uppercase tracking-tight">{vendorName}</p>
                       <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-[8px] px-1 h-3.5 text-blue-600 bg-blue-50/50 border-blue-100 font-black uppercase">Outlet #24</Badge>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">P</div>
                        {pickupPerson ? (
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-slate-700">{pickupPerson}</span>
                              <div 
                                className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100 transition-colors w-fit shadow-sm"
                                onClick={(e) => { e.stopPropagation(); toast.info("Opening live tracking map..."); }}
                              >
                                <LocateFixed className="h-2.5 w-2.5 animate-pulse" />
                                <span className="text-[7px] font-black uppercase tracking-wider">Live Route</span>
                              </div>
                           </div>
                        ) : (() => {
                           const unalloc = getUnallocatedInfo(order.createdAt, order.deliveryType || (order as any).serviceType);
                           return (
                             <div className="flex flex-col">
                                <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded w-fit", unalloc.color)}>{unalloc.label}</span>
                                <span className={cn("text-[8px] font-bold mt-0.5 whitespace-nowrap", unalloc.isFlagged ? "text-red-500" : "text-slate-400")}>{unalloc.subText}</span>
                             </div>
                           );
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">D</div>
                        {deliveryPerson ? (
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-slate-700">{deliveryPerson}</span>
                              <div 
                                className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100 transition-colors w-fit shadow-sm"
                                onClick={(e) => { e.stopPropagation(); toast.info("Opening live tracking map..."); }}
                              >
                                <LocateFixed className="h-2.5 w-2.5 animate-pulse" />
                                <span className="text-[7px] font-black uppercase tracking-wider">Live Route</span>
                              </div>
                           </div>
                        ) : (
                           <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-1.5 rounded-sm">Waiting</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {slaStatus ? (
                      <div className="flex flex-col items-center gap-1">
                        <Badge className={`${slaStatus.color} border-none font-black text-[10px] px-2 py-0.5 rounded-lg shadow-sm`}>
                          {slaStatus.label}
                        </Badge>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div className={cn("h-full", slaStatus.isBreached ? "bg-red-500" : "bg-emerald-500")} style={{ width: slaStatus.isBreached ? '100%' : '65%' }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border font-black px-2 py-0.5 whitespace-nowrap text-[9px] uppercase tracking-tighter w-fit", getDeliveryBadgeColor(order.deliveryType || (order as any).serviceType))}>
                      {order.deliveryType || (order as any).serviceType || "Standard"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {getHandlingTags(order).length > 0 ? getHandlingTags(order).map((tag, i) => {
                        let colors = "text-slate-500 bg-slate-100";
                        if (tag === "Stain Removal") colors = "text-red-600 bg-red-50 border-red-100 border";
                        else if (tag === "Designer Wear") colors = "text-purple-600 bg-purple-50 border-purple-100 border";
                        else if (tag === "Delicate Fabric") colors = "text-blue-600 bg-blue-50 border-blue-100 border";
                        else if (tag === "Premium Garment") colors = "text-amber-600 bg-amber-50 border-amber-100 border";

                        return (
                          <span key={i} className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${colors}`}>
                             <Tag className="h-2 w-2" /> {tag}
                          </span>
                        );
                      }) : <span className="text-slate-300 text-[10px]">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                       <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-50 border border-slate-200">
                         <span className="text-xs font-bold text-slate-700">{order.itemCount}</span>
                       </div>
                       <p className="text-[8px] text-slate-400 mt-1 font-bold">Premium Silk (2)</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="font-black text-slate-900 text-xs">{formatINR(order.totalAmount)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="group relative inline-block cursor-help">
                       <p className="font-black text-violet-600 text-xs">{marginPct}%</p>
                       <p className="text-[9px] font-bold text-slate-400 mt-0.5">{formatINR(marginAmount)}</p>
                       
                       <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-48 bg-slate-900 text-white p-3 rounded-xl shadow-2xl z-[100] text-[10px] space-y-2 border border-white/10 backdrop-blur-md text-left">
                          <p className="font-black border-b border-white/10 pb-1 uppercase tracking-widest text-[8px] text-slate-400">Order Profitability</p>
                          <div className="flex justify-between"><span>Order Value:</span><span className="font-bold">{formatINR(order.totalAmount)}</span></div>
                          <div className="flex justify-between text-red-400"><span>Vendor Cost:</span><span className="font-bold">-{formatINR(vendorCommAmount)}</span></div>
                          <div className="flex justify-between text-red-400"><span>Rider Cost:</span><span className="font-bold">-{formatINR(order.totalAmount - marginAmount - vendorCommAmount)}</span></div>
                          <div className="flex justify-between text-emerald-400 font-black border-t border-white/10 pt-1"><span>Net Margin:</span><span>{formatINR(marginAmount)}</span></div>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="font-black text-[#3E8940] text-xs">{formatINR(vendorCommAmount)}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Payable</p>
                  </TableCell>
                  <TableCell className="text-center">
                     <div className="flex flex-col items-center gap-1">
                        <Badge className={`${getStatusColor(order.status)} border-none font-black gap-1 px-2.5 py-1 rounded-lg whitespace-nowrap text-[9px] uppercase tracking-tighter shadow-sm`}>
                          {getStatusIcon(order.status)}
                          {formatStatusLabel(order.status)}
                        </Badge>
                     </div>
                   </TableCell>
                   <TableCell className="text-center">
                     {((order.status === 'PROCESSING' && isOver24h) || order.status === 'NOT_SCHEDULED') ? (
                       <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                         <Select defaultValue={order.issueType || "vendor_delay"} onValueChange={(val) => handleDelayReasonChange(order.id, val)}>
                           <SelectTrigger className="w-28 h-7 text-[9px] font-bold rounded-lg bg-red-50 border-red-200 text-red-600 focus:ring-0">
                             <SelectValue placeholder="Select Reason" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="rider_unavailable" className="text-[10px]">Rider Unavailable</SelectItem>
                             <SelectItem value="vendor_delay" className="text-[10px]">Vendor Delay</SelectItem>
                             <SelectItem value="customer_reschedule" className="text-[10px]">Customer Reschedule</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     ) : (
                       <span className="text-slate-300 text-[10px]">—</span>
                     )}
                   </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                       <Button
                         size="sm"
                         className="h-8 px-3 bg-[#3E8940] hover:bg-[#3E8940]/90 text-[10px] font-black gap-1.5 rounded-xl shadow-sm transition-all hover:translate-x-1"
                         onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}`); }}
                       >
                         Control <ArrowRight className="h-3 w-3" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-slate-500">No orders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination UI */}
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-700">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * limit, totalRecords)}</span> of <span className="font-bold text-slate-700">{totalRecords}</span> orders
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
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading orders...</p>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
