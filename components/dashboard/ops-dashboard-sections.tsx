"use client";

import React from "react";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  TrendingUp,
  Truck,
  MapPin,
  Users,
  Zap,
  Timer,
  Package,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type {
  DashboardOrderRow,
  DashboardIssueDigest,
} from "@/lib/dashboard-api";

/* ─── Order Status Distribution ─────────────────────────────── */

interface StatusDistributionProps {
  orders: DashboardOrderRow[];
}

export function OrderStatusDistribution({ orders }: StatusDistributionProps) {
  const router = useRouter();
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const statuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const total = orders.length || 1;

  const statusColors: Record<string, string> = {
    Processing: "bg-yellow-400",
    Pending: "bg-blue-400",
    Delivered: "bg-emerald-400",
    "Out for Delivery": "bg-indigo-400",
    "Issue Reported": "bg-red-400",
    "Pickup Delayed": "bg-orange-400",
    Cancelled: "bg-gray-400",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-blue-50">
          <BarChart3 className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Live Order Status Distribution
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Real-time breakdown of all active orders
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-6 bg-slate-100">
        {statuses.map(([status, count]) => (
          <div
            key={status}
            className={`${statusColors[status] || "bg-slate-300"} transition-all duration-500`}
            style={{ width: `${(count / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statuses.map(([status, count]) => (
          <div
            key={status}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm hover:border-blue-200 transition-all cursor-pointer group/status min-w-0"
            onClick={() => router.push(`/orders?status=${(status || "").toLowerCase().replace(/ /g, "_")}`)}
          >
            <div
              className={`w-3 h-3 rounded-full ${statusColors[status] || "bg-slate-300"} group-hover/status:scale-125 transition-transform`}
            />
            <div>
              <p className="text-lg font-bold text-slate-900 group-hover/status:text-blue-600 transition-colors">{count}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SLA Risk Indicators ─────────────────────────────────── */

interface SlaRiskProps {
  orders: DashboardOrderRow[];
}

export function SlaRiskPanel({ orders }: SlaRiskProps) {
  const unassigned = orders.filter(
    (o) => o.vendor === "Unassigned" && o.status !== "Delivered" && o.status !== "Cancelled"
  );
  const delayedOrders = orders.filter((o) => o.status === "Pickup Delayed");
  const issueOrders = orders.filter((o) => o.status === "Issue Reported");
  const expressOrders = orders.filter(
    (o) =>
      o.orderType === "Express" &&
      o.status !== "Delivered" &&
      o.status !== "Cancelled"
  );

  const items = [
    {
      label: "Unassigned Orders",
      count: unassigned.length,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      warning:
        unassigned.length > 0
          ? `⚠️ ${unassigned.length} order(s) not yet assigned to any vendor`
          : null,
    },
    {
      label: "Pickup Delayed",
      count: delayedOrders.length,
      icon: Timer,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
      warning:
        delayedOrders.length > 0
          ? `${delayedOrders.length} order(s) breaching pickup SLA`
          : null,
    },
    {
      label: "Issues Reported",
      count: issueOrders.length,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      warning:
        issueOrders.length > 0
          ? `${issueOrders.length} order(s) need investigation`
          : null,
    },
    {
      label: "Express Orders Active",
      count: expressOrders.length,
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      warning:
        expressOrders.length > 0
          ? `${expressOrders.length} express order(s) — priority processing`
          : null,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-orange-50">
          <Timer className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            SLA & Allocation Risk Monitor
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Proactive alerts for operational bottlenecks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`p-4 rounded-xl border ${item.border} ${item.bg} hover:shadow-sm transition-all min-w-0`}
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-2xl font-bold text-slate-900">
                {item.count}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {item.label}
            </p>
            {item.warning && (
              <p className="text-[10px] text-slate-500 font-medium mt-1.5">
                {item.warning}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Vendor SLA Scorecard ────────────────────────────────── */

interface VendorScoreProps {
  orders: DashboardOrderRow[];
}

export function VendorSlaScorecard({ orders }: VendorScoreProps) {
  const router = useRouter();
  const vendorMap = new Map<
    string,
    {
      total: number;
      delivered: number;
      issues: number;
      revenue: number;
      delayed: number;
    }
  >();

  orders.forEach((o) => {
    if (o.vendor === "Unassigned") return;
    const v = vendorMap.get(o.vendor) || {
      total: 0,
      delivered: 0,
      issues: 0,
      revenue: 0,
      delayed: 0,
    };
    v.total += 1;
    if (o.status === "Delivered") v.delivered += 1;
    if (o.status === "Issue Reported") v.issues += 1;
    if (o.status === "Pickup Delayed") v.delayed += 1;
    if (o.paymentStatus === "Paid") v.revenue += o.amount;
    vendorMap.set(o.vendor, v);
  });

  const vendors = Array.from(vendorMap.entries())
    .map(([name, stats]) => {
      const sla =
        stats.total === 0
          ? 0
          : Math.round(
              ((stats.total - stats.issues - stats.delayed) / stats.total) * 100
            );
      const issueRate =
        stats.total === 0
          ? 0
          : Math.round((stats.issues / stats.total) * 100);
      let tier: string;
      let tierColor: string;
      let tierEmoji: string;
      const isHighRisk = sla < 80 || stats.issues >= 5 || issueRate > 10;
      if (isHighRisk) {
        tier = "High Risk";
        tierColor = "bg-red-50 text-red-700 border-red-100";
        tierEmoji = "⚠️";
      } else if (sla >= 95) {
        tier = "Gold";
        tierColor = "bg-amber-100 text-amber-700";
        tierEmoji = "🥇";
      } else if (sla >= 85) {
        tier = "Silver";
        tierColor = "bg-slate-100 text-slate-700";
        tierEmoji = "🥈";
      } else {
        tier = "Probation";
        tierColor = "bg-red-100 text-red-700";
        tierEmoji = "⚠";
      }
      return { name, ...stats, sla, issueRate, tier, tierColor, tierEmoji, isHighRisk };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Vendor SLA Scorecard
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Top vendors by revenue with SLA and issue tracking
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm font-semibold text-[#3E8940] hover:text-[#3E8940]/80 hover:bg-green-50 gap-1"
          onClick={() => router.push("/vendor")}
        >
          View All <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {vendors.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          No vendor data available for this period.
        </p>
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => (
            <div
              key={v.name}
              className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
              onClick={() => router.push("/vendor")}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {v.name}
                  </p>
                  <Badge
                    className={`${v.tierColor} border-none text-[9px] font-bold px-2 py-0.5 rounded-md ${v.isHighRisk ? "animate-pulse" : ""}`}
                  >
                    {v.tierEmoji} {v.tier}
                  </Badge>
                </div>
                {v.isHighRisk && (
                  <p className="text-[9px] text-red-600 font-bold uppercase mt-0.5 mb-1 flex items-center gap-1">
                    Critical: {v.issues} issues • {v.issueRate}% fail rate
                  </p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                  <span>{v.total} orders</span>
                  <span>•</span>
                  <span>{formatINR(v.revenue)} revenue</span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <p
                    className={`text-lg font-bold ${v.sla >= 90 ? "text-emerald-600" : v.sla >= 80 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {v.sla}%
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    SLA
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className={`text-lg font-bold ${v.issueRate <= 2 ? "text-emerald-600" : v.issueRate <= 5 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {v.issueRate}%
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Issues
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Rider Performance Snapshot ──────────────────────────── */
 
 interface RiderPerformanceProps {
   riders: any[];
 }
 
 export function RiderPerformanceSnapshot({ riders }: RiderPerformanceProps) {
   const router = useRouter();
 
   const statusColors: Record<string, string> = {
     online: "bg-emerald-400",
     on_delivery: "bg-amber-400",
     offline: "bg-slate-300",
   };
   const statusLabels: Record<string, string> = {
     online: "Online",
     on_delivery: "On Delivery",
     offline: "Offline",
   };
 
   return (
     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
       <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-3">
           <div className="p-2 rounded-xl bg-violet-50">
             <Truck className="h-5 w-5 text-violet-600" />
           </div>
           <div>
             <h2 className="text-lg font-bold text-slate-900">
               Rider Performance Snapshot
             </h2>
             <p className="text-xs text-slate-500 font-medium">
               Top riders by delivery volume and reliability from live order data
             </p>
           </div>
         </div>
         <Button
           variant="ghost"
           size="sm"
           className="text-sm font-semibold text-[#3E8940] hover:text-[#3E8940]/80 hover:bg-green-50 gap-1"
           onClick={() => router.push("/rider")}
         >
           View All <ArrowRight className="h-4 w-4" />
         </Button>
       </div>
 
       {riders.length === 0 ? (
         <p className="text-sm text-slate-500 text-center py-8">
           No rider activity data available for this period.
         </p>
       ) : (
         <div className="space-y-3">
           {riders.map((r) => (
             <div
               key={r.id}
               className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
               onClick={() => router.push(`/rider?search=${encodeURIComponent(r.name)}`)}
             >
               <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                 <span className="text-sm font-bold text-violet-700">
                    {(r.name || "R")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                 </span>
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                   <p className="font-bold text-sm text-slate-900 truncate">
                     {r.name}
                   </p>
                   <div className="flex items-center gap-1.5">
                     <div
                       className={`w-2 h-2 rounded-full ${statusColors[r.status] || "bg-slate-300"}`}
                     />
                     <span className="text-[10px] text-slate-500 font-medium">
                       {statusLabels[r.status] || "Offline"}
                     </span>
                   </div>
                 </div>
                 <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                   {r.deliveries} deliveries • {r.issues} issues reported
                 </p>
               </div>
               <div className="flex items-center gap-3 shrink-0">
                 <div className="text-center">
                   <p
                     className={`text-sm font-bold ${r.onTime >= 90 ? "text-emerald-600" : r.onTime >= 80 ? "text-amber-600" : "text-red-600"}`}
                   >
                     {r.onTime}%
                   </p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">
                     On-time
                   </p>
                 </div>
                 <div className="text-center">
                   <p className="text-sm font-bold text-slate-900">⭐ {r.rating}</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">
                     Rating
                   </p>
                 </div>
               </div>
             </div>
           ))}
         </div>
       )}
     </div>
   );
 }
