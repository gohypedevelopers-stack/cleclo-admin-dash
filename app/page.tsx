"use client";

import {
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  IndianRupee,
  HandCoins,
  Activity,
  User,
  Phone,
  MapPin,
  MessageSquare,
  ShieldAlert,
  X,
  Search,
  Store,
  Wallet,
  Loader2,
  RefreshCw,
  Zap,
  BarChart3,
  ArrowRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import React from "react";
import {
  dashboardApi,
  type DashboardOverview,
  type DashboardOrderRow,
  type DashboardSettlementRow,
  type DashboardIssueDigest,
} from "@/lib/dashboard-api";
import { exportToCSV } from "@/lib/csv-export";

// Role-specific dashboard sections
import {
  OrderStatusDistribution,
  SlaRiskPanel,
  VendorSlaScorecard,
  RiderPerformanceSnapshot,
} from "@/components/dashboard/ops-dashboard-sections";
import {
  CommissionIntelligence,
  SettlementAgingTracker,
  PayoutReconciliation,
  RevenueByVendor,
  WorkingCapitalForecast,
  TaxCompliancePanel,
} from "@/components/dashboard/finance-dashboard-sections";

const ACCENT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
  red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "text-indigo-500" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", icon: "text-violet-500" },
  slate: { bg: "bg-slate-50", text: "text-slate-600", icon: "text-slate-500" },
};

const KPI_ICONS: Record<string, any> = {
  orders_today: ClipboardList,
  revenue_today: IndianRupee,
  pending_orders: Clock,
  pickup_delay_count: AlertTriangle,
  issue_reported_count: ShieldAlert,
  avg_order_value: TrendingUp,
  gross_platform_revenue: Wallet,
  net_commission_earned: TrendingUp,
  vendor_payout_due: HandCoins,
  settlement_pending_amount: Activity,
  settlements_completed: CheckCircle,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Processing": return "bg-yellow-100 text-yellow-700";
    case "Pending": return "bg-blue-100 text-blue-700";
    case "Delivered": return "bg-green-100 text-green-700";
    case "Out for Delivery": return "bg-indigo-100 text-indigo-700";
    case "Issue Reported": return "bg-red-100 text-red-700";
    case "Pickup Delayed": return "bg-orange-100 text-orange-700";
    case "Cancelled": return "bg-gray-100 text-gray-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getPaymentStatusColor = (status: string) =>
  status === "Paid" ? "bg-emerald-50 text-emerald-700" : status === "Refunded" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";

const getOrderTypeColor = (type: string) =>
  type === "Express" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700";

const getSettlementStatusColor = (status: string) => {
  switch (status) {
    case "Completed": return "bg-emerald-100 text-emerald-700";
    case "Pending": return "bg-amber-100 text-amber-700";
    case "Processing": return "bg-blue-100 text-blue-700";
    case "Failed": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "Critical": return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" };
    case "High": return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" };
    case "Medium": return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" };
    case "Low": return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" };
    default: return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-700" };
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Ready to Activate": return "bg-emerald-100 text-emerald-700";
    case "Incomplete Documents": return "bg-amber-100 text-amber-700";
    case "High Risk": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [adminRole, setAdminRole] = React.useState<string>("super_admin");

  const [timeRange, setTimeRange] = React.useState("today");
  const [selectedIssue, setSelectedIssue] = React.useState<DashboardIssueDigest | null>(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [vendorFilter, setVendorFilter] = React.useState("all");
  const [cityFilter, setCityFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  // Detect admin role from localStorage
  React.useEffect(() => {
    try {
      const userStr = localStorage.getItem("admin_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.adminRole) setAdminRole(user.adminRole);
      }
    } catch (e) {
      console.error("Failed to parse admin role", e);
    }
  }, []);

  // Debounced search
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  const fetchDashboard = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const periodMap: Record<string, string> = {
        today: "today",
        yesterday: "yesterday",
        week: "this_week",
        month: "this_month",
        custom: "custom",
      };

      const result = await dashboardApi.getOverview({
        period: periodMap[timeRange] || "today",
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        vendor: vendorFilter !== "all" ? vendorFilter : undefined,
        city: cityFilter !== "all" ? cityFilter : undefined,
        date: dateFilter || undefined,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, debouncedSearch, statusFilter, vendorFilter, cityFilter, dateFilter]);

  React.useEffect(() => {
    fetchDashboard();
    setCurrentPage(1);

    // Add polling interval for dynamic updates
    const interval = setInterval(() => {
      fetchDashboard();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleClearFilters = () => {
    setStatusFilter("all");
    setVendorFilter("all");
    setCityFilter("all");
    setDateFilter("");
    setSearchQuery("");
  };

  const handleGenerateReport = () => {
    if (!data) return;
    
    try {
      const reportData = data.primaryTable.rows;
      const reportType = data.primaryTable.type;
      const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;
      
      exportToCSV(reportData, filename);
      
      toast.success("Report generated", {
        description: `Downloading ${reportType} report...`,
      });
    } catch (err: any) {
      toast.error("Export failed", {
        description: err.message || "Could not generate report",
      });
    }
  };

  const orders = data?.primaryTable.type === "orders" ? (data.primaryTable.rows as DashboardOrderRow[]) : [];
  const settlements = data?.primaryTable.type === "settlements" ? (data.primaryTable.rows as DashboardSettlementRow[]) : [];

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return orders.slice(start, start + itemsPerPage);
  }, [orders, currentPage]);
  
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading dashboard data...</p>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Failed to Load Dashboard</h2>
          <p className="text-sm text-slate-500 max-w-md">{error}</p>
          <p className="text-xs text-slate-400 mt-2">
            Ensure backend services are running (auth-service on :3001, gateway on :3000)
          </p>
        </div>
        <Button onClick={fetchDashboard} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl mt-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            {data.title}
          </h1>
          <p className="text-[#3E8940] mt-1 font-medium italic">
            {data.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Top-level Search */}
          <div className="relative group w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
            <Input
              placeholder={data.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 bg-white border-slate-200 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-[#3E8940] transition-all"
            />
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200 text-slate-700 font-medium rounded-xl">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#3E8940]" />
                <SelectValue placeholder="Select period" />
              </div>
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="w-[180px] rounded-xl border-slate-200 shadow-xl">
              {data.filters.timeRangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-10 gap-2 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl"
            onClick={handleGenerateReport}
          >
            <Download className="h-4 w-4" />
            Generate Report
          </Button>
          <Button
            variant="outline"
            className="h-10 w-10 p-0 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl"
            onClick={fetchDashboard}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            className="h-10 gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 text-white shadow-sm rounded-xl"
            onClick={() => router.push("/analytics")}
          >
            <Activity className="h-4 w-4" />
            View Analytics
          </Button>

          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.kpis.map((kpi) => {
          const accent = ACCENT_COLORS[kpi.accent] || ACCENT_COLORS.slate;
          const IconComponent = KPI_ICONS[kpi.key] || Activity;
          return (
            <div
              key={kpi.key}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${accent.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`h-5 w-5 ${accent.text}`} />
                </div>
                <span className={`text-[10px] font-bold ${accent.text} uppercase tracking-wider`}>Live</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {kpi.value}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {kpi.title}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{kpi.note}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Finance Snapshot */}
      {data.financeSnapshot.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet className="h-32 w-32 text-[#3E8940]" />
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settlement & Finance Snapshot</h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5">Real-time overview of platform liquidity and vendor payouts</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 font-bold gap-2" onClick={() => router.push("/finance/settlements")}>
              <TrendingUp className="h-4 w-4 text-[#3E8940]" />
              Full Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.financeSnapshot.map((item) => (
              <div key={item.key} className="relative p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg hover:border-transparent transition-all duration-300 group/card">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{item.value}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
                  <p className="text-[10px] font-medium text-slate-500 pt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Metrics */}
      {data.growthMetrics.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Growth Metrics</h2>
                <p className="text-xs text-slate-500 font-medium">Platform intelligence from live data</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.growthMetrics.map((metric) => (
              <div key={metric.key} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">{metric.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Operations Admin: SLA & Allocation Risk ──────────── */}
      {adminRole === "operations_admin" && orders.length > 0 && (
        <SlaRiskPanel orders={orders} />
      )}

      {/* ─── Operations Admin: Order Status Distribution ─────── */}
      {adminRole === "operations_admin" && orders.length > 0 && (
        <OrderStatusDistribution orders={orders} />
      )}

      {/* ─── Finance Admin: Commission Intelligence ──────────── */}
      {adminRole === "finance_admin" && settlements.length > 0 && (
        <CommissionIntelligence settlements={settlements} />
      )}

      {/* ─── Finance Admin: Settlement Aging ──────────────────── */}
      {adminRole === "finance_admin" && settlements.length > 0 && (
        <SettlementAgingTracker settlements={settlements} />
      )}

      {/* Main Content Grid */}
      <div className={`grid gap-8 ${data.approvals.length > 0 || data.issueDigest.length > 0 ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
        {/* Primary Table */}
        <div className={`${data.approvals.length > 0 || data.issueDigest.length > 0 ? "lg:col-span-2" : "lg:col-span-1"} bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-hidden`}>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{data.primaryTable.title}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{data.primaryTable.description}</p>
              </div>
              <Button
                variant="ghost"
                className="text-sm font-semibold text-[#3E8940] hover:text-[#3E8940]/80 hover:bg-green-50 gap-1"
                onClick={() => router.push(data.primaryTable.type === "orders" ? "/orders" : "/finance/settlements")}
              >
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9 bg-white border-slate-200 text-xs font-medium rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    {data.filters.statuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor:</span>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200 text-xs font-medium rounded-lg">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="all">All Vendors</SelectItem>
                    {data.filters.vendors.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City:</span>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[130px] h-9 bg-white border-slate-200 text-xs font-medium rounded-lg">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="all">All Cities</SelectItem>
                    {data.filters.cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date:</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-[140px] h-9 px-3 bg-white border border-slate-200 text-xs font-medium rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E8940]/20 focus:border-[#3E8940] transition-all"
                />
              </div>

              {(statusFilter !== "all" || vendorFilter !== "all" || cityFilter !== "all" || dateFilter !== "" || searchQuery !== "") && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-3 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Orders Table */}
          {data.primaryTable.type === "orders" && (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Order ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Customer</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Vendor</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">City</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Payment</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Pickup</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">ETA</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 text-right whitespace-nowrap">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 cursor-pointer transition-colors"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <TableCell className="font-bold text-slate-900 whitespace-nowrap text-xs">
                          #{order.transactionId || order.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700 whitespace-nowrap text-xs">{order.customer}</TableCell>
                        <TableCell className="text-slate-600 whitespace-nowrap text-xs">{order.vendor}</TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap font-medium">{order.city}</TableCell>
                        <TableCell>
                          <Badge className={`${getOrderTypeColor(order.orderType)} border-none text-[10px] font-bold px-2 py-0.5 rounded-md`}>
                            {order.orderType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(order.status)} border-none text-[10px] font-bold px-2 py-0.5 rounded-md`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPaymentStatusColor(order.paymentStatus)} border-none text-[10px] font-bold px-2 py-0.5 rounded-md`}>
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] font-medium text-slate-600 whitespace-nowrap">{order.pickupSlot}</TableCell>
                        <TableCell className="text-[11px] font-bold text-[#3E8940] whitespace-nowrap">{order.deliveryEta}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900 whitespace-nowrap">{formatINR(order.amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-slate-500 font-medium">
                        No orders found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {orders.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t bg-slate-50/50 mt-4">
                  <p className="text-sm text-slate-500">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, orders.length)} - {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} orders
                  </p>
                  <div className="flex items-center gap-1.5 mr-4 bg-white border border-slate-200 rounded-lg p-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 rounded-md" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider">
                      Page {currentPage} of {Math.max(1, totalPages)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 rounded-md" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settlements Table */}
          {data.primaryTable.type === "settlements" && (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Transaction ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Vendor</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">City</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Due Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 text-right whitespace-nowrap">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.length > 0 ? (
                    settlements.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 cursor-pointer transition-colors" onClick={() => router.push("/finance/settlements")}>
                        <TableCell className="font-bold text-slate-900 whitespace-nowrap text-xs">{s.transactionId}</TableCell>
                        <TableCell className="font-medium text-slate-700 whitespace-nowrap text-xs">{s.vendor}</TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap font-medium">{s.city}</TableCell>
                        <TableCell>
                          <Badge className={`${getSettlementStatusColor(s.status)} border-none text-[10px] font-bold px-2 py-0.5 rounded-md`}>{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-[11px] font-medium text-slate-600 whitespace-nowrap">{s.dueDate}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900 whitespace-nowrap">{formatINR(s.amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">No settlements found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        {(data.approvals.length > 0 || data.issueDigest.length > 0) && (
          <div className="space-y-6">
            {/* Pending Vendor Approvals */}
            {data.approvals.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Pending Approvals
                  </h3>
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold px-2 rounded-full">
                    {data.approvals.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {data.approvals.slice(0, 5).map((vendor) => (
                    <div key={vendor.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-sm text-slate-900">{vendor.vendorName}</p>
                        <Badge className={`${getPriorityColor(vendor.priority)} border-none text-[9px] font-bold px-2 py-0.5 rounded-md`}>
                          {vendor.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mb-3">
                        <span>{vendor.city}</span>
                        <span>•</span>
                        <span>{vendor.appliedLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge variant="outline" className={`text-[9px] font-bold rounded-md ${vendor.documentStatus === "Documents Verified" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-amber-300 text-amber-700 bg-amber-50"}`}>
                          {vendor.documentStatus}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] font-bold rounded-md ${vendor.bankVerified ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-red-300 text-red-700 bg-red-50"}`}>
                          {vendor.bankVerified ? "Bank ✓" : "Bank ✗"}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] font-bold rounded-md ${vendor.agreementSigned ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-red-300 text-red-700 bg-red-50"}`}>
                          {vendor.agreementSigned ? "Agreement ✓" : "Agreement ✗"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">{vendor.commissionModel}</span>
                        <Button size="sm" className="bg-[#3E8940] hover:bg-[#3E8940]/90 h-7 text-[10px] font-semibold shadow-sm px-3 rounded-lg" onClick={() => router.push(`/vendors/review/${vendor.id}`)}>
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-sm font-semibold text-[#3E8940] hover:text-[#3E8940]/90 hover:bg-green-50" onClick={() => router.push("/vendors")}>
                  View All Vendors
                </Button>
              </div>
            )}

            {/* Issue Alerts */}
            {data.issueDigest.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Issue Alerts
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold px-2 rounded-full">
                      {data.summary.openIssues}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-[#3E8940] hover:bg-green-50 px-2" onClick={() => router.push("/issues")}>
                      View Page
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {data.issueDigest.map((issue) => {
                    const colors = getSeverityColor(issue.severity);
                    return (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-sm ${colors.bg} ${colors.border} relative overflow-hidden`}
                        onClick={() => setSelectedIssue(issue)}
                      >
                        {/* Severity left stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.badge.split(" ")[0]}`} />

                        <div className="flex items-center justify-between mb-2 pl-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-[10px] px-2 py-0.5 rounded-md ${colors.badge}`}>
                              #{issue.orderId}
                            </span>
                            {issue.unread && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                NEW
                              </span>
                            )}
                          </div>
                          <Badge className={`${colors.badge} border-none text-[9px] font-bold px-1.5 py-0.5 rounded-md`}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className={`text-sm font-bold mb-0.5 pl-2 ${colors.text}`}>
                          {issue.type}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-tight pl-2 ${colors.text} opacity-60`}>
                        Vendor: {issue.vendor} • {issue.city}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

      {/* ─── Operations Admin: Vendor SLA Scorecard ──────────── */}
      {adminRole === "operations_admin" && orders.length > 0 && (
        <VendorSlaScorecard orders={orders} />
      )}

      {/* ─── Operations Admin: Rider Performance ─────────────── */}
      {adminRole === "operations_admin" && (
        <RiderPerformanceSnapshot />
      )}

      {/* ─── Finance Admin: Payout Reconciliation ────────────── */}
      {adminRole === "finance_admin" && settlements.length > 0 && (
        <PayoutReconciliation settlements={settlements} />
      )}

      {/* ─── Finance Admin: Revenue by Vendor ────────────────── */}
      {adminRole === "finance_admin" && settlements.length > 0 && (
        <RevenueByVendor settlements={settlements} />
      )}

      {/* ─── Finance Admin: Working Capital Forecast ──────────── */}
      {adminRole === "finance_admin" && settlements.length > 0 && (
        <WorkingCapitalForecast settlements={settlements} />
      )}

      {/* ─── Finance Admin: Tax Compliance ────────────────────── */}
      {adminRole === "finance_admin" && settlements.length > 0 && (
        <TaxCompliancePanel settlements={settlements} />
      )}

      {/* Issue Detail Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedIssue && (
            <>
              <DialogHeader className="p-6 bg-red-50/50 border-b border-red-100 flex-row items-center gap-4 space-y-0">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-red-900 leading-tight">
                    {selectedIssue.type}
                  </DialogTitle>
                  <DialogDescription className="text-red-700/70 font-medium">
                    {selectedIssue.orderId} • {selectedIssue.severity} severity
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">Severity</span>
                    <Badge className={`${getSeverityColor(selectedIssue.severity).badge} font-bold px-3 rounded-full text-xs border-none`}>
                      {selectedIssue.severity}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    Summary
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedIssue.summary}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Store className="h-4 w-4 text-slate-400" />
                      {selectedIssue.vendor}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">City</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {selectedIssue.city}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-[#3E8940] hover:bg-[#3E8940]/90 text-white font-bold h-11 rounded-xl shadow-md"
                    onClick={() => {
                      router.push("/issues");
                      setSelectedIssue(null);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View in Issues Page
                  </Button>
                  <Button
                    variant="outline"
                    className="font-bold h-11 rounded-xl text-slate-600 border-slate-200"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
