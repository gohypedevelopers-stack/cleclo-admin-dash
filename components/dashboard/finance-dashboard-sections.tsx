"use client";

import React from "react";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Landmark,
  Wallet,
  Receipt,
  CreditCard,
  BarChart3,
  PieChart,
  DollarSign,
  FileText,
  Timer,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type {
  DashboardSettlementRow,
  FinanceSnapshotItem,
} from "@/lib/dashboard-api";

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

/* ─── Commission Intelligence Panel ─────────────────────────── */

interface CommissionProps {
  settlements: DashboardSettlementRow[];
}

export function CommissionIntelligence({ settlements }: CommissionProps) {
  const router = useRouter();
  const totalGross = settlements.reduce((s, r) => s + r.grossAmount, 0);
  const totalCommission = settlements.reduce(
    (s, r) => s + r.commissionAmount,
    0
  );
  const totalPayout = settlements.reduce((s, r) => s + r.amount, 0);
  const avgCommissionRate =
    totalGross === 0 ? 0 : Math.round((totalCommission / totalGross) * 100);
  const totalOrders = settlements.reduce((s, r) => s + r.orderCount, 0);

  // Per-vendor breakdown
  const vendorMap = new Map<
    string,
    { gross: number; commission: number; payout: number; orders: number }
  >();
  settlements.forEach((s) => {
    const v = vendorMap.get(s.vendor) || {
      gross: 0,
      commission: 0,
      payout: 0,
      orders: 0,
    };
    v.gross += s.grossAmount;
    v.commission += s.commissionAmount;
    v.payout += s.amount;
    v.orders += s.orderCount;
    vendorMap.set(s.vendor, v);
  });

  const topVendors = Array.from(vendorMap.entries())
    .sort((a, b) => b[1].commission - a[1].commission)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-emerald-50">
          <IndianRupee className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Commission Intelligence
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Platform earnings breakdown from settlement data
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
          <p className="text-2xl font-bold text-emerald-700">
            {formatINR(totalGross)}
          </p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">
            Gross GMV
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <p className="text-2xl font-bold text-blue-700">
            {formatINR(totalCommission)}
          </p>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">
            Commission Earned
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
          <p className="text-2xl font-bold text-violet-700">
            {formatINR(totalPayout)}
          </p>
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mt-1">
            Vendor Payouts
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
          <p className="text-2xl font-bold text-amber-700">
            {avgCommissionRate}%
          </p>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-1">
            Avg Commission Rate
          </p>
        </div>
      </div>

      {/* Top Vendors by Commission */}
      {topVendors.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Building className="h-4 w-4 text-slate-400" />
            Top Vendors by Commission
          </h3>
          <div className="space-y-2">
            {topVendors.map(([name, stats]) => {
              const rate =
                stats.gross === 0
                  ? 0
                  : Math.round((stats.commission / stats.gross) * 100);
              return (
                <div
                  key={name}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm hover:border-[#3E8940]/30 transition-all cursor-pointer group/vendor"
                  onClick={() => router.push(`/vendors?search=${encodeURIComponent(name)}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate group-hover/vendor:text-[#3E8940] transition-colors">
                      {name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {stats.orders} orders • {formatINR(stats.gross)} GMV
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        {formatINR(stats.commission)}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        Commission
                      </p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-none text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {rate}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Settlement Aging Tracker ───────────────────────────────── */

interface SettlementAgingProps {
  settlements: DashboardSettlementRow[];
}

export function SettlementAgingTracker({
  settlements,
}: SettlementAgingProps) {
  const router = useRouter();

  const now = new Date();
  const pendingSettlements = settlements.filter(
    (s) => s.status === "Pending" || s.status === "Processing"
  );

  const aging = {
    "< 3 days": [] as DashboardSettlementRow[],
    "3-7 days": [] as DashboardSettlementRow[],
    "> 7 days": [] as DashboardSettlementRow[],
  };

  pendingSettlements.forEach((s) => {
    const created = new Date(s.createdAt);
    const daysDiff = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 7) aging["> 7 days"].push(s);
    else if (daysDiff >= 3) aging["3-7 days"].push(s);
    else aging["< 3 days"].push(s);
  });

  const buckets = [
    {
      label: "< 3 Days",
      items: aging["< 3 days"],
      color: "bg-emerald-50",
      border: "border-emerald-100",
      textColor: "text-emerald-700",
      icon: CheckCircle2,
    },
    {
      label: "3-7 Days",
      items: aging["3-7 days"],
      color: "bg-amber-50",
      border: "border-amber-100",
      textColor: "text-amber-700",
      icon: Clock,
    },
    {
      label: "> 7 Days ⚠️",
      items: aging["> 7 days"],
      color: "bg-red-50",
      border: "border-red-100",
      textColor: "text-red-700",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50">
            <Timer className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Settlement Aging Tracker
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Monitor payout aging to prevent overdue settlements
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-slate-200 text-slate-600 font-bold gap-2"
          onClick={() => router.push("/finance/settlements")}
        >
          <CreditCard className="h-4 w-4 text-[#3E8940]" />
          All Settlements
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buckets.map((bucket) => {
          const total = bucket.items.reduce((s, item) => s + item.amount, 0);
          return (
            <div
              key={bucket.label}
              className={`p-5 rounded-xl border ${bucket.border} ${bucket.color} hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group/bucket`}
              onClick={() => router.push(`/finance/settlements?aging=${(bucket.label || "").replace(/[⚠️<> ]/g, "").toLowerCase()}`)}
            >
              <div className="flex items-center gap-2 mb-3">
                <bucket.icon className={`h-5 w-5 ${bucket.textColor} group-hover/bucket:scale-110 transition-transform`} />
                <span
                  className={`text-sm font-bold ${bucket.textColor} uppercase`}
                >
                  {bucket.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 group-hover/bucket:text-[#3E8940] transition-colors">
                {bucket.items.length}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Settlements pending
              </p>
              <p className={`text-lg font-bold ${bucket.textColor} mt-2`}>
                {formatINR(total)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Total amount due
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Payout Reconciliation Summary ──────────────────────────── */

interface PayoutReconciliationProps {
  settlements: DashboardSettlementRow[];
}

export function PayoutReconciliation({
  settlements,
}: PayoutReconciliationProps) {
  const router = useRouter();
  const completed = settlements.filter((s) => s.status === "Completed");
  const pending = settlements.filter(
    (s) => s.status === "Pending" || s.status === "Processing"
  );
  const failed = settlements.filter((s) => s.status === "Failed");

  const completedAmount = completed.reduce((s, r) => s + r.amount, 0);
  const pendingAmount = pending.reduce((s, r) => s + r.amount, 0);
  const failedAmount = failed.reduce((s, r) => s + r.amount, 0);
  const totalAmount = completedAmount + pendingAmount + failedAmount;
  const total = totalAmount || 1;

  const segments = [
    {
      label: "Completed",
      count: completed.length,
      amount: completedAmount,
      pct: Math.round((completedAmount / total) * 100),
      color: "bg-emerald-400",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Pending",
      count: pending.length,
      amount: pendingAmount,
      pct: Math.round((pendingAmount / total) * 100),
      color: "bg-amber-400",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
    },
    {
      label: "Failed",
      count: failed.length,
      amount: failedAmount,
      pct: Math.round((failedAmount / total) * 100),
      color: "bg-red-400",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-indigo-50">
          <Receipt className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Payout Reconciliation Summary
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Settlement status breakdown across all payout runs
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-4 rounded-full overflow-hidden flex mb-6 bg-slate-100">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${seg.pct}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`p-4 rounded-xl ${seg.bgColor} border border-slate-100 text-center hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group/seg`}
            onClick={() => router.push(`/finance/settlements?status=${(seg.label || "").toLowerCase()}`)}
          >
            <p className={`text-2xl font-bold ${seg.textColor} group-hover/seg:scale-110 transition-transform`}>
              {seg.count}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
              {seg.label}
            </p>
            <p className={`text-sm font-bold ${seg.textColor} mt-2`}>
              {formatINR(seg.amount)}
            </p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
              {seg.pct}% of total
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Revenue by Vendor Panel ─────────────────────────────── */

interface RevenueByVendorProps {
  settlements: DashboardSettlementRow[];
}

export function RevenueByVendor({ settlements }: RevenueByVendorProps) {
  const router = useRouter();
  const vendorMap = new Map<
    string,
    {
      gross: number;
      commission: number;
      netPayout: number;
      orders: number;
      city: string;
    }
  >();

  settlements.forEach((s) => {
    const v = vendorMap.get(s.vendor) || {
      gross: 0,
      commission: 0,
      netPayout: 0,
      orders: 0,
      city: s.city,
    };
    v.gross += s.grossAmount;
    v.commission += s.commissionAmount;
    v.netPayout += s.amount;
    v.orders += s.orderCount;
    vendorMap.set(s.vendor, v);
  });

  const vendors = Array.from(vendorMap.entries())
    .sort((a, b) => b[1].gross - a[1].gross)
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-50">
            <BarChart3 className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Vendor Revenue Ledger
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Revenue, commission and payout transparency per vendor
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm font-semibold text-[#3E8940] hover:text-[#3E8940]/80 hover:bg-green-50 gap-1"
          onClick={() => router.push("/vendor/payments")}
        >
          View Payments <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {vendors.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          No vendor settlement data available.
        </p>
      ) : (
        <div className="space-y-2">
          {vendors.map(([name, stats]) => {
            const marginPct =
              stats.gross === 0
                ? 0
                : Math.round((stats.commission / stats.gross) * 100);
            return (
              <div
                key={name}
                className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm hover:border-violet-200 transition-all cursor-pointer group/rev"
                onClick={() => router.push(`/vendors?search=${encodeURIComponent(name)}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm text-slate-900 group-hover/rev:text-violet-600 transition-colors">{name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {stats.city} • {stats.orders} orders
                    </p>
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 border-none text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {marginPct}% margin
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-50">
                    <p className="text-sm font-bold text-slate-900">
                      {formatINR(stats.gross)}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">
                      Gross Revenue
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-50">
                    <p className="text-sm font-bold text-emerald-600">
                      {formatINR(stats.commission)}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">
                      Commission
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-50">
                    <p className="text-sm font-bold text-violet-600">
                      {formatINR(stats.netPayout)}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">
                      Net Payout
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Working Capital Forecast ────────────────────────────── */

interface WorkingCapitalProps {
  settlements: DashboardSettlementRow[];
}

export function WorkingCapitalForecast({
  settlements,
}: WorkingCapitalProps) {
  const router = useRouter();
  const now = new Date();
  const sevenDaysFromNow = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const pendingSettlements = settlements.filter(
    (s) => s.status === "Pending" || s.status === "Processing"
  );
  const upcomingPayouts = pendingSettlements.filter(
    (s) => new Date(s.dueDate) <= sevenDaysFromNow
  );
  const upcomingTotal = upcomingPayouts.reduce((s, r) => s + r.amount, 0);
  const totalPending = pendingSettlements.reduce((s, r) => s + r.amount, 0);
  const completedTotal = settlements
    .filter((s) => s.status === "Completed")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Landmark className="h-32 w-32" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-white/10">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Working Capital Forecast</h2>
            <p className="text-xs text-white/60 font-medium">
              Upcoming cashflow projections
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-amber-400">
              {formatINR(upcomingTotal)}
            </p>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">
              Payout Due (Next 7 Days)
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">
              {upcomingPayouts.length} settlement
              {upcomingPayouts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-red-400">
              {formatINR(totalPending)}
            </p>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">
              Total Outstanding
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">
              {pendingSettlements.length} pending settlement
              {pendingSettlements.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-emerald-400">
              {formatINR(completedTotal)}
            </p>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">
              Total Settled
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">
              Lifetime completed payouts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GST/Tax Compliance Panel ─────────────────────────────── */

interface TaxComplianceProps {
  settlements: DashboardSettlementRow[];
}

export function TaxCompliancePanel({ settlements }: TaxComplianceProps) {
  const totalCommission = settlements.reduce(
    (s, r) => s + r.commissionAmount,
    0
  );
  const gstOnCommission = Math.round(totalCommission * 0.18);
  const tdsDeducted = Math.round(
    settlements
      .filter((s) => s.status === "Completed")
      .reduce((s, r) => s + r.amount, 0) * 0.01
  );
  const invoicesGenerated = settlements.filter(
    (s) => s.status === "Completed"
  ).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-slate-100">
          <FileText className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Tax & Compliance Summary
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            GST, TDS and invoice status across settlements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xl font-bold text-slate-900">
            {formatINR(gstOnCommission)}
          </p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            GST on Commission
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">18% of {formatINR(totalCommission)}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xl font-bold text-slate-900">
            {formatINR(tdsDeducted)}
          </p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            TDS Deducted
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">1% on completed payouts</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xl font-bold text-emerald-700">
            {invoicesGenerated}
          </p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Invoices Generated
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">Auto-generated on settlement</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xl font-bold text-amber-700">
            {settlements.filter((s) => s.status === "Pending").length}
          </p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Pending Invoices
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">Awaiting settlement completion</p>
        </div>
      </div>
    </div>
  );
}
