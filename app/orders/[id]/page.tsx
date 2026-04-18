"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Star, Clock, Truck, CheckCircle2, AlertCircle, Timer, User, Phone, MapPin, IndianRupee, Calendar, MoreVertical, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
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

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return dateStr; }
};

const formatStatusLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusColor = (status: string) => {
  switch (status) {
    case "PROCESSING": return "bg-amber-100 text-amber-700";
    case "PENDING": return "bg-yellow-100 text-yellow-700";
    case "PICKED_UP": return "bg-blue-100 text-blue-700";
    case "RECEIVED_BY_VENDOR": return "bg-purple-100 text-purple-700";
    case "DELIVERED": return "bg-green-100 text-green-700";
    case "CANCELLED": return "bg-slate-100 text-slate-600";
    case "ISSUE_REPORTED": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getSpeedBadgeClasses = (type?: string) => {
  if (type?.includes("EXPRESS") || type?.includes("express")) return "bg-red-50 text-red-600 border border-red-100";
  return "bg-blue-50 text-blue-600 border border-blue-100";
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${ORDER_API_URL}/${orderId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Order not found");
      setOrder(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await apiFetch(`${ORDER_API_URL}/${orderId}/status`, {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Status updated to ${formatStatusLabel(newStatus)}`);
      fetchOrder();
    } catch (err: any) { toast.error(err.message); }
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading order...</p></div>;
  if (error || !order) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error || "Order not found"}</p><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Go Back</Button></div>;

  const customerName = order.user?.name || "Unknown";
  const customerPhone = order.user?.phone || "";
  const vendorName = order.vendor?.vendorProfile?.businessName || order.vendor?.name || "Unassigned";
  const pickupPerson = order.pickupRider?.name || order.rider?.name || "Not Assigned";
  const deliveryPerson = order.deliveryRider?.name || order.rider?.name || "Not Assigned";
  const displayId = `#${order.id.slice(0, 8).toUpperCase()}`;

  const timelineSteps = [
    { title: "Order Placed", description: `${order.itemCount} items ordered`, time: formatDate(order.createdAt), icon: CheckCircle2, stage: 0 },
    { title: "Pending Assignment", description: "Waiting for vendor/rider", icon: Clock, stage: 1 },
    { title: "Pickup from Customer", description: "Rider picks up items", icon: Package, stage: 2 },
    { title: "In Transit to Vendor", description: "On the way", icon: Truck, stage: 3 },
    { title: "Received at Vendor", description: "Items received", icon: Package, stage: 4 },
    { title: "Processing", description: "Service in progress", icon: Timer, stage: 5 },
    { title: "Ready for Delivery", description: "Items ready", icon: Package, stage: 6 },
    { title: "Out for Delivery", description: "On the way to customer", icon: Truck, stage: 7 },
    { title: "Delivered", description: "Order completed", icon: CheckCircle2, stage: 8 },
  ];

  const statusStageMap: Record<string, number> = {
    pending: 1, pickup_assigned: 2, picked_up: 3, received_by_vendor: 4, processing: 5, ready_for_delivery: 6, out_for_delivery: 7, delivered: 8, cancelled: -1,
  };
  const currentStage = statusStageMap[order.status] ?? 0;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-black tracking-tight">{displayId}</h1>
              <Badge className={cn("font-medium border-none px-3 py-1", getStatusColor(order.status))}>{formatStatusLabel(order.status)}</Badge>
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-2 font-medium"><Calendar className="h-4 w-4" /> Placed {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status?.toLowerCase() !== "delivered" && order.status?.toLowerCase() !== "cancelled" && (
            <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl" onClick={() => {
              const next: Record<string, string> = { 
                pending: "pickup_assigned", 
                pickup_assigned: "picked_up", 
                picked_up: "received_by_vendor", 
                received_by_vendor: "processing", 
                processing: "ready_for_delivery", 
                ready_for_delivery: "out_for_delivery", 
                out_for_delivery: "delivered" 
              };
              const ns = next[order.status?.toLowerCase() || ""];
              if (ns) handleUpdateStatus(ns);
            }}>
              Advance Status
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Items", value: order.itemCount, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Amount", value: formatINR(order.totalAmount), icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Payment", value: order.paymentStatus || "—", icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Delivery Type", value: order.deliveryType || "Standard", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border p-6 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", stat.bg)}><stat.icon className={cn("h-6 w-6", stat.color)} /></div>
            <div><p className="text-sm text-slate-500 font-medium">{stat.title}</p><h3 className="text-2xl font-bold text-black">{stat.value}</h3></div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-base font-bold text-black flex items-center gap-2"><Truck className="h-5 w-5 text-purple-600" /> Order Timeline</h2><p className="text-xs text-slate-500">Track progress</p></div>
            </div>
            <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1px] before:bg-slate-100">
              {timelineSteps.map((step) => {
                const Icon = step.icon;
                const state = step.stage < currentStage ? "completed" : step.stage === currentStage ? "current" : "upcoming";
                const badgeBg = state === "completed" ? "bg-emerald-500" : state === "current" ? "bg-amber-500" : "bg-slate-200";
                return (
                  <div key={step.stage} className="relative">
                    <div className={cn("absolute -left-10 h-8 w-8 rounded-full border-4 border-white shadow-sm z-10 flex items-center justify-center", badgeBg)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className={cn("font-semibold text-sm", state === "upcoming" && "text-slate-400")}>{step.title}</p>
                      <p className={cn("text-xs", state === "upcoming" ? "text-slate-400" : "text-slate-500")}>{step.description}</p>
                      {step.time && <p className="text-[10px] text-slate-400 mt-0.5">{step.time}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-bold text-black flex items-center gap-2 mb-4"><User className="h-4 w-4 text-blue-600" /> Customer</h3>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{customerName.charAt(0)}</div>
              <div><p className="font-bold text-black">{customerName}</p><div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1"><Phone className="h-3 w-3" />{customerPhone}</div></div>
            </div>
          </div>

          {/* Vendor */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-bold text-black flex items-center gap-2 mb-4"><Package className="h-4 w-4 text-purple-600" /> Vendor</h3>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">{vendorName.charAt(0)}</div>
              <div><p className="font-bold text-black">{vendorName}</p><Badge className="bg-purple-100 text-purple-700 border-none text-[10px] mt-1">{order.vendor?.vendorProfile?.commissionRate ? `${order.vendor.vendorProfile.commissionRate}% commission` : "Vendor"}</Badge></div>
            </div>
          </div>

          {/* Staff Assignment */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h3 className="font-bold text-black flex items-center gap-2 mb-4"><Timer className="h-4 w-4 text-amber-500" /> Staff Assignment</h3>
            <div className="space-y-3">
              {[{ label: "Pickup", person: pickupPerson }, { label: "Delivery", person: deliveryPerson }].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                    <p className={cn("text-sm font-bold mt-0.5", s.person === "Not Assigned" ? "text-red-500 italic" : "text-black")}>{s.person}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Note */}
          {order.note && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-md shadow-amber-200 shrink-0"><AlertCircle className="h-6 w-6 text-white" /></div>
                <div><h3 className="font-bold text-amber-900 text-sm">Customer Note</h3><p className="text-amber-700 text-xs mt-1 leading-relaxed font-medium">{order.note}</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
