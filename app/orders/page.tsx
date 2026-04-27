"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  expectedDeliveryDate?: string | null;
}

const calculateSlaStatus = (createdAt: string, status: string, deliveryType: string) => {
  if (["DELIVERED", "CANCELLED", "RECEIVED_BY_VENDOR"].includes(status)) return null;
  
  const createdTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const elapsedHours = (now - createdTime) / (1000 * 60 * 60);
  
  const slaLimit = deliveryType.toLowerCase().includes("express") ? 24 : 72;
  const remainingHours = slaLimit - elapsedHours;
  
  if (remainingHours < 0) return { label: `${Math.abs(Math.round(remainingHours))}h Overdue`, color: "bg-red-100 text-red-700", isBreached: true };
  if (remainingHours <= 12) return { label: `${Math.round(remainingHours)}h Left`, color: "bg-amber-100 text-amber-700", isBreached: false };
  return { label: `${Math.round(remainingHours)}h Left`, color: "bg-emerald-100 text-emerald-700", isBreached: false };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "PROCESSING": return "bg-purple-100 text-purple-700";
    case "NOT_SCHEDULED": return "bg-slate-100 text-slate-600";
    case "PICKED_UP": return "bg-blue-100 text-blue-700";
    case "RECEIVED_BY_VENDOR": return "bg-amber-100 text-amber-700";
    case "DELIVERED": return "bg-green-100 text-green-700";
    case "ISSUE_REPORTED": return "bg-red-100 text-red-700";
    case "CANCELLED": return "bg-slate-100 text-slate-600";
    case "PENDING": return "bg-yellow-100 text-yellow-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getDeliveryBadgeColor = (type?: string) => {
  if (type?.includes("EXPRESS") || type?.includes("express")) return "bg-red-100 text-red-700 border-red-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFilter) params.set("date", dateFilter);

      const url = `${ORDER_API_URL}${params.toString() ? "?" + params.toString() : ""}`;
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, dateFilter]);

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

  // Summary stats
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("");
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
          <p className="text-slate-500 mt-1">View and manage all platform orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl" asChild>
            <Link href="/orders/settings">
              <RefreshCcw className="h-4 w-4" /> Allocation Settings
            </Link>
          </Button>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        {[
          { label: "Total", value: orders.length, color: "text-slate-700" },
          { label: "Pending", value: (statusCounts["pending"] || 0) + (statusCounts["not_scheduled"] || 0), color: "text-yellow-600" },
          { label: "Processing", value: statusCounts["processing"] || 0, color: "text-purple-600" },
          { label: "Picked Up", value: (statusCounts["picked_up"] || 0) + (statusCounts["pickup_assigned"] || 0) + (statusCounts["out_for_delivery"] || 0), color: "text-blue-600" },
          { label: "At Vendor", value: statusCounts["received_by_vendor"] || 0, color: "text-amber-600" },
          { label: "Delivered", value: statusCounts["delivered"] || 0, color: "text-green-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center hover:shadow-md transition-all">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
          <Input
            placeholder="Search by order ID, customer, or vendor..."
            className="pl-10 bg-slate-50 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 rounded-xl">
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
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 text-xs font-medium rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#3E8940]/20 transition-all"
          />
          {(statusFilter !== "all" || searchQuery || dateFilter) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-red-500 hover:bg-red-50 font-bold text-xs gap-1">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">Order</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Customer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Vendor</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Pickup / Delivery</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">SLA Timer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Items</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-right">Revenue & Margin</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider text-center">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? orders.map((order) => {
              const customerName = order.user?.name || "Unknown";
              const vendorName = order.vendor?.vendorProfile?.businessName || order.vendor?.name || "Unassigned";
              const pickupPerson = order.pickupRider?.name || order.rider?.name || null;
              const deliveryPerson = order.deliveryRider?.name || order.rider?.name || null;

              const marginAmount = order.platformMargin || (order.totalAmount * 0.2); // Est 20% if missing
              const marginPct = Math.round((marginAmount / order.totalAmount) * 100) || 0;
              const slaStatus = calculateSlaStatus(order.createdAt, order.status, order.deliveryType);
              const isUnassigned = !pickupPerson && !deliveryPerson && !["DELIVERED", "CANCELLED"].includes(order.status);
              const hasDamage = order.issue?.type?.toLowerCase().includes("damage");

              return (
                <TableRow key={order.id} className={`hover:bg-slate-50 cursor-pointer ${isUnassigned ? "bg-red-50/30" : ""}`} onClick={() => router.push(`/orders/${order.id}`)}>
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        {order.status === "DELIVERED" ? <Package className="h-4 w-4 text-purple-600" /> : <Truck className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-slate-900 text-xs">#{order.id.slice(0, 8).toUpperCase()}</p>
                          {hasDamage && <Badge className="bg-red-100 text-red-700 border-none px-1 text-[8px] h-3">DAMAGE</Badge>}
                        </div>
                        <p className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{customerName}</p>
                      <p className="text-[10px] text-slate-400">{order.user?.phone || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[10px] text-purple-600 font-bold uppercase">{vendorName}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[8px] px-1 h-3.5 border-slate-200">P</Badge>
                        {pickupPerson ? <span className="text-[10px] font-bold text-slate-700">{pickupPerson}</span> : <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 rounded-sm">Unassigned</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[8px] px-1 h-3.5 border-slate-200">D</Badge>
                        {deliveryPerson ? <span className="text-[10px] font-bold text-slate-700">{deliveryPerson}</span> : <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 rounded-sm">Unassigned</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {slaStatus ? (
                      <Badge className={`${slaStatus.color} border-none font-bold text-[10px]`}>
                        {slaStatus.isBreached ? <AlertTriangle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {slaStatus.label}
                      </Badge>
                    ) : (
                      <span className="text-slate-300 text-[10px]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border font-semibold px-2 py-0.5 whitespace-nowrap text-[10px]", getDeliveryBadgeColor(order.deliveryType))}>
                      {order.deliveryType || "Standard"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">{order.itemCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="font-bold text-slate-900 text-xs">{formatINR(order.totalAmount)}</p>
                    {marginAmount > 0 && (
                      <p className="text-[9px] font-bold text-emerald-600 mt-0.5">+{formatINR(marginAmount)} ({marginPct}%)</p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${getStatusColor(order.status)} border-none font-bold gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap text-[10px]`}>
                      {getStatusIcon(order.status)}
                      {formatStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      size="sm"
                      className="h-7 px-3 bg-[#3E8940] hover:bg-[#3E8940]/90 text-[10px] font-bold gap-1 rounded-lg"
                      onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}`); }}
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Button>
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
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
          <p className="text-sm text-slate-500">Showing {orders.length} orders</p>
        </div>
      </div>
    </div>
  );
}
