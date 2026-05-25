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
  PhoneCall,
  ImagePlus,
  ShieldQuestion,
  History,
  MoreVertical,
  UserPlus,
  CheckCircle2,
  ArrowUpCircle,
  XCircle,
  Users,
  Trophy,
  Timer,
  Package,
  UserX,
  Truck,
  Ban,
  CircleDot,
  FileCheck,
  Check,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
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
  pending_settlements_count: Clock,
  settlements_completed: CheckCircle,
  failed_transactions: ShieldAlert,
  customer_retention: Users,
  repeat_order_rate: RefreshCw,
  top_vendor: Trophy,
  worst_sla_vendor: AlertTriangle,
  avg_turnaround: Timer,
  quality_intelligence: AlertTriangle,
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
    case "Ready to Activate": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Incomplete Documents": return "bg-amber-50 text-amber-700 border-amber-100";
    case "High Risk": return "bg-red-50 text-red-700 border-red-100";
    default: return "bg-slate-50 text-slate-700 border-slate-100";
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "High Risk": return "🔴";
    case "Incomplete Documents": return "🟡";
    case "Ready to Activate": return "🟢";
    default: return "⚪";
  }
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const getFinancialRisk = (type: string) => {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t.includes('damage')) return { label: 'Estimated Refund Risk', value: '₹620', color: 'text-red-600', icon: AlertTriangle };
  if (t.includes('no show') || t.includes('pickup delay')) return { label: 'Potential Penalty', value: '₹100', color: 'text-amber-600', icon: Activity };
  if (t.includes('complaint')) return { label: 'Service Credit Risk', value: '₹250', color: 'text-orange-600', icon: TrendingUp };
  return null;
};

const ROOT_CAUSES = ['Vendor Fault', 'Rider Fault', 'Customer Fault', 'System Issue'] as const;

// Issue Type Icons
const getIssueTypeIcon = (type: string) => {
  if (!type) return { icon: CircleDot, color: 'text-slate-400' };
  const t = type.toLowerCase();
  if (t.includes('damage')) return { icon: Package, color: 'text-red-500' };
  if (t.includes('no show') || t.includes('no-show')) return { icon: UserX, color: 'text-amber-500' };
  if (t.includes('delay') || t.includes('pickup')) return { icon: Truck, color: 'text-orange-500' };
  if (t.includes('complaint')) return { icon: MessageSquare, color: 'text-blue-500' };
  if (t.includes('cancel')) return { icon: Ban, color: 'text-slate-500' };
  return { icon: CircleDot, color: 'text-slate-400' };
};

// Refund Status Color
const getRefundBadgeStyle = (status?: string) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-100 text-emerald-700';
    case 'Processing': return 'bg-blue-100 text-blue-700';
    case 'Not Initiated': return 'bg-slate-100 text-slate-500';
    default: return 'bg-slate-100 text-slate-500';
  }
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [adminRole, setAdminRole] = React.useState<string>("super_admin");

  const [timeRange, setTimeRange] = React.useState("today");
  const [customDateRange, setCustomDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [issueDateFilter, setIssueDateFilter] = React.useState("");
  const [selectedIssue, setSelectedIssue] = React.useState<DashboardIssueDigest | null>(null);
  const [issueRootCause, setIssueRootCause] = React.useState<string | null>(null);
  const [invoiceValue, setInvoiceValue] = React.useState("");
  const [damageImage, setDamageImage] = React.useState<{name: string, type: string, data: string} | null>(null);
  const [preCleanImage, setPreCleanImage] = React.useState<{name: string, type: string, data: string} | null>(null);
  const [uploadingImage, setUploadingImage] = React.useState<string | null>(null);
  
  const damageImageInputRef = React.useRef<HTMLInputElement>(null);
  const preCleanImageInputRef = React.useRef<HTMLInputElement>(null);

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [vendorFilter, setVendorFilter] = React.useState("all");
  const [cityFilter, setCityFilter] = React.useState("all");
  const [startDateFilter, setStartDateFilter] = React.useState("");
  const [endDateFilter, setEndDateFilter] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
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
        status: statusFilter !== "all" ? statusFilter : undefined,
        vendor: vendorFilter !== "all" ? vendorFilter : undefined,
        city: cityFilter !== "all" ? cityFilter : undefined,
        startDate: timeRange === "custom" && customDateRange?.from ? format(customDateRange.from, "yyyy-MM-dd") : undefined,
        endDate: timeRange === "custom" && customDateRange?.to ? format(customDateRange.to, "yyyy-MM-dd") : undefined,
        tableStartDate: startDateFilter || undefined,
        tableEndDate: endDateFilter || undefined,
      });
      setData(result);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, statusFilter, vendorFilter, cityFilter, startDateFilter, endDateFilter, customDateRange]);

  React.useEffect(() => {
    fetchDashboard();
    setCurrentPage(1);

    // Add polling interval for dynamic updates
    const interval = setInterval(() => {
      fetchDashboard();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const [issueTypeFilter, setIssueTypeFilter] = React.useState("all");
  const [issueStatusFilter, setIssueStatusFilter] = React.useState("all");
  const [issueCityFilter, setIssueCityFilter] = React.useState("all");
  const [issueVendorFilter, setIssueVendorFilter] = React.useState("all");
  const [vendorCommissionFilter, setVendorCommissionFilter] = React.useState("all");
  const [vendorAgreementFilter, setVendorAgreementFilter] = React.useState("all");

  const handleClearFilters = () => {
    setStatusFilter("all");
    setVendorFilter("all");
    setCityFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'damage' | 'pre-clean') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large", { description: "Maximum 5MB allowed" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const payload = {
        name: file.name,
        type: file.type,
        data: reader.result as string
      };
      if (type === 'damage') setDamageImage(payload);
      else setPreCleanImage(payload);
      toast.success(`${type === 'damage' ? 'Damage' : 'Pre-clean'} image uploaded`);
    };
    reader.readAsDataURL(file);
  };

  const handleResolveWithClaim = async () => {
    if (!selectedIssue || !issueRootCause) return;

    try {
      const damageClaimPayload = selectedIssue.type?.toLowerCase().includes('damage') ? {
        invoiceValue: Number(invoiceValue) || 0,
        liabilityCap: Number(invoiceValue || 0) * 0.25,
        damageImageFile: damageImage,
        preCleanImageFile: preCleanImage
      } : undefined;

      await dashboardApi.updateIssue(selectedIssue.id, { 
        action: 'resolve',
        rootCause: issueRootCause as any,
        damageClaim: damageClaimPayload
      });

      toast.success("Issue resolved with evidence", {
        description: `Root cause identified as ${issueRootCause}`
      });
      
      setSelectedIssue(null);
      setIssueRootCause(null);
      setInvoiceValue("");
      setDamageImage(null);
      setPreCleanImage(null);
      fetchDashboard();
    } catch (err: any) {
      toast.error("Failed to resolve issue");
    }
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

  const handleDismissIssue = async (issueId: string) => {
    try {
      await dashboardApi.updateIssue(issueId, { action: 'review' });
      toast.success("Issue dismissed", {
        description: "The issue has been marked as reviewed.",
      });
      setSelectedIssue(null);
      fetchDashboard();
    } catch (err: any) {
      toast.error("Action failed", {
        description: err.message || "Could not dismiss issue",
      });
    }
  };

  const handleEscalateIssue = async (issueId: string) => {
    try {
      await dashboardApi.updateIssue(issueId, { 
        action: 'escalate'
      });
      toast.success("Issue escalated", {
        description: "Assigned to Senior Support Team for immediate resolution.",
      });
      setSelectedIssue(null);
      fetchDashboard();
    } catch (err: any) {
      toast.error("Escalation failed", {
        description: err.message || "Could not escalate issue",
      });
    }
  };

  const handleContactAction = (type: 'vendor' | 'customer', name: string, orderId?: string) => {
    // Find the actual phone number from the orders list if available
    const order = orders.find(o => o.transactionId === orderId || o.id === orderId);
    const phone = type === 'customer' ? (order?.customerPhone || '+91 98765 43210') : (order?.vendorPhone || '+91 91234 56789');
    
    toast.info(`Contacting ${type}`, {
      description: (
        <div className="mt-1 flex flex-col gap-2">
          <p className="font-medium">Dialing {name}...</p>
          <a 
            href={`tel:${phone.replace(/\s/g, '')}`} 
            className="flex items-center gap-2 text-emerald-600 font-bold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <PhoneCall className="h-3 w-3" />
            {phone}
          </a>
        </div>
      ),
      duration: 5000,
      icon: <PhoneCall className="h-4 w-4 text-emerald-500" />,
    });
  };

  const handleMarkAllReviewed = async () => {
    try {
      await dashboardApi.markAllIssuesReviewed();
      toast.success("All issues marked as reviewed", {
        description: "Unread badges have been cleared.",
      });
      fetchDashboard();
    } catch (err: any) {
      toast.error("Failed to mark issues as reviewed", {
        description: err.message || "Could not complete this action",
      });
    }
  };

  const handleAssignToTeam = async (issueId: string) => {
    try {
      await dashboardApi.updateIssue(issueId, { 
        action: 'assign', 
        assignedTo: 'Dispatch Team' 
      });
      toast.success("Assigned to Dispatch Team", {
        description: "Team lead notified for immediate field follow-up.",
      });
      fetchDashboard();
    } catch (err: any) {
      toast.error("Assignment failed", {
        description: err.message || "Could not assign issue to team",
      });
    }
  };

  const handleVendorAction = async (vendorId: string, vendorName: string, action: 'approve' | 'reject') => {
    try {
      await dashboardApi.updateVendor(vendorId, { action });
      toast.success(action === 'approve' ? "Vendor Approved" : "Vendor Rejected", {
        description: `${vendorName} has been ${action === 'approve' ? 'activated' : 'rejected'}.`,
      });
      fetchDashboard();
    } catch (err: any) {
      toast.error("Action failed", {
        description: err.message || `Could not ${action} vendor`,
      });
    }
  };

  const orders = data?.primaryTable.type === "orders" ? (data.primaryTable.rows as DashboardOrderRow[]) : [];
  const settlements = (data?.settlements || []) as DashboardSettlementRow[];

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return orders.slice(start, start + itemsPerPage);
  }, [orders, currentPage]);
  
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // Compute filtered issue count (same logic as the rendering filter)
  const filteredIssueCount = React.useMemo(() => {
    if (!data) return 0;
    return data.issueDigest.filter(issue => {
      if (issueTypeFilter !== "all") {
        const type = issue.type?.toLowerCase() || "";
        if (issueTypeFilter === "damage" && !type.includes("damage")) return false;
        if (issueTypeFilter === "noshow" && !(type.includes("no show") || type.includes("no-show"))) return false;
        if (issueTypeFilter === "complaint" && !type.includes("complaint")) return false;
        if (issueTypeFilter === "delay" && !type.includes("delay")) return false;
        if (issueTypeFilter === "refund" && !(issue.refundStatus === "Processing" || issue.refundStatus === "Completed")) return false;
      }
      if (issueStatusFilter !== "all") {
        if (issueStatusFilter === "open" && issue.status !== "Open") return false;
        if (issueStatusFilter === "escalated" && issue.status !== "Escalated") return false;
        if (issueStatusFilter === "resolved" && issue.status !== "Resolved") return false;
      }
      if (issueCityFilter !== "all" && issue.city !== issueCityFilter) return false;
      if (issueVendorFilter !== "all" && issue.vendor !== issueVendorFilter) return false;
      if (issueDateFilter) {
        if (!issue.createdAt?.startsWith(issueDateFilter)) return false;
      }
      if (adminRole === "operations_admin") {
        const opsTeams = ["Operations Team", "Operations Head"];
        const isAssignedToOps = opsTeams.includes(issue.assignedTo || "");
        const isEscalatedToOps = issue.status === "Escalated";
        if (!isAssignedToOps && !isEscalatedToOps) return false;
      }
      return true;
    }).length;
  }, [data, issueTypeFilter, issueStatusFilter, issueCityFilter, issueVendorFilter, issueDateFilter, adminRole]);

  const settlementDueTotal = React.useMemo(() => {
    return settlements
      .filter((s) => s.status === "Pending" || s.status === "Processing")
      .reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [settlements]);

  const settlementCompletedTotal = React.useMemo(() => {
    return settlements
      .filter((s) => s.status === "Completed")
      .reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [settlements]);

  const settlementOverdueTotal = React.useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return settlements
      .filter((s) => (s.status === "Pending" || s.status === "Processing") && s.createdAt && new Date(s.createdAt) < sevenDaysAgo)
      .reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [settlements]);

  const issueBreakdown = React.useMemo(() => {
    if (!data?.issueDigest) return { delay: 0, damage: 0, noshow: 0, refund: 0, total: 0 };
    let delay = 0, damage = 0, noshow = 0, refund = 0;
    data.issueDigest.forEach(issue => {
      const type = issue.type?.toLowerCase() || "";
      if (type.includes("delay")) delay++;
      if (type.includes("damage")) damage++;
      if (type.includes("no show") || type.includes("no-show")) noshow++;
      if (issue.refundStatus === "Processing" || issue.refundStatus === "Completed") refund++;
    });
    const total = delay + damage + noshow + refund || 1;
    return { delay, damage, noshow, refund, total };
  }, [data]);

  const handleToggleIssueFilter = (category: string) => {
    if (issueTypeFilter === category) {
      setIssueTypeFilter("all");
    } else {
      setIssueTypeFilter(category);
    }
  };

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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#3E8940] font-medium italic">
              {data.subtitle}
            </p>
            <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
              LIVE
            </Badge>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2 hidden sm:inline-block">
              Last Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-nowrap items-center gap-3 overflow-x-auto pb-1 md:w-auto md:justify-end md:overflow-visible md:pb-0">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 rounded-xl border-slate-200 text-slate-600 font-bold gap-2 bg-white shadow-sm hover:bg-slate-50 transition-all shrink-0",
              isLoading && "opacity-50"
            )}
            onClick={() => fetchDashboard()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 text-[#3E8940]", isLoading && "animate-spin")} />
            {isLoading ? "Syncing..." : "Refresh"}
          </Button>
          <Select value={timeRange} onValueChange={(val) => {
            setTimeRange(val);
            if (val === "custom") {
              setTimeout(() => setIsCalendarOpen(true), 50);
            }
          }}>
            <SelectTrigger className="h-10 w-auto min-w-[180px] shrink-0 bg-white border-slate-200 text-slate-700 font-medium rounded-xl">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#3E8940]" />
                <SelectValue placeholder="Select period" />
              </div>
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="w-auto min-w-[180px] rounded-xl border-slate-200 shadow-xl">
              {data.filters?.timeRangeOptions?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {timeRange === "custom" && (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant={isCalendarOpen ? "default" : "outline"} 
                  className={cn(
                    "h-10 shrink-0 gap-2 rounded-xl px-3 font-medium transition-all", 
                    isCalendarOpen ? "bg-[#3E8940] text-white hover:bg-[#3E8940]/90 shadow-md" : "text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>{format(customDateRange.from, "LLL dd")} - {format(customDateRange.to, "LLL dd")}</>
                    ) : (
                      format(customDateRange.from, "LLL dd")
                    )
                  ) : (
                    "Select Dates"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={setCustomDateRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          )}

          <Button
            variant="outline"
            className="h-10 shrink-0 gap-2 text-slate-700 border-slate-200 rounded-xl"
            onClick={handleGenerateReport}
          >
            <Download className="h-4 w-4" />
            Generate Report
          </Button>
          <Button
            className="h-10 shrink-0 gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 text-white shadow-sm rounded-xl"
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

      {/* Wallet Liability Summary (Finance Oversight) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Total Customer Wallet Balance</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black">₹{Number(data.walletLiability?.totalCustomerWalletBalance || 0).toLocaleString('en-IN')}</h2>
              <Badge className="bg-indigo-500/30 text-indigo-100 border-none text-[10px]">Liability Risk</Badge>
            </div>
            <p className="text-indigo-200 text-[10px] mt-2 font-medium">Total funds currently held in customer digital wallets platform-wide.</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <HandCoins className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <p className="text-amber-50 text-xs font-bold uppercase tracking-wider mb-1">Total Vendor Payout Due</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black">₹{Number(data.walletLiability?.totalVendorPayoutDue || 0).toLocaleString('en-IN')}</h2>
              <Badge className="bg-amber-400/30 text-amber-50 border-none text-[10px]">Pending Release</Badge>
            </div>
            <p className="text-amber-100 text-[10px] mt-2 font-medium">Net amount awaiting settlement release to service partners.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data.kpis?.map((kpi) => {
          const accent = ACCENT_COLORS[kpi.accent] || ACCENT_COLORS.slate;
          // Mapping KPI keys to application routes with optional status filtering
          const getRedirectUrl = (key: string) => {
            if (!key) return null;
            const k = key.toLowerCase();
            if (k.includes("order")) {
              if (k.includes("pending")) return "/orders?status=pending";
              if (k.includes("delay")) return "/orders?status=delayed";
              return "/orders";
            }
            if (k.includes("issue")) return "/issues?status=open";
            if (k.includes("vendor")) {
              if (k.includes("active")) return "/vendors?status=active";
              if (k.includes("pending")) return "/vendors?status=pending";
              return "/vendors";
            }
            if (k.includes("customer")) return "/users?role=customer";
            if (k.includes("rider")) return "/riders";
            if (k.includes("revenue") || k.includes("payout") || k.includes("commission")) return "/finance/settlements";
            if (k.includes("aov") || k.includes("average")) return "/analytics";
            return null;
          };

          const redirectUrl = getRedirectUrl(kpi.key);
          const IconComponent = KPI_ICONS[kpi.key] || Activity;
          const displayValue = kpi.key === "issue_reported_count" ? filteredIssueCount : kpi.value;

          return (
            <div
              key={kpi.key}
              className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group ${redirectUrl ? "cursor-pointer" : ""}`}
              onClick={() => redirectUrl && router.push(redirectUrl)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${accent.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`h-5 w-5 ${accent.text}`} />
                </div>
              </div>
              <div>
                <h3 className={`font-bold text-slate-900 tracking-tight leading-tight ${String(displayValue).length > 15 ? 'text-lg' : 'text-xl'}`}>
                  {displayValue}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {kpi.title}
                  </p>
                  {redirectUrl && (
                    <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-[#3E8940] transition-colors" />
                  )}
                </div>
                {kpi.note && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{kpi.note}</p>}
              </div>
            </div>
          );
        })}
      </div>




      {/* Main Content Area (Full Width) */}
      <div className="space-y-8">
        {/* Primary Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-hidden">
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
                    {data.filters?.statuses?.map((s) => (
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
                    {data.filters?.vendors?.map((v) => (
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
                    {data.filters?.cities?.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From:</span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-[130px] h-9 px-2 bg-white border border-slate-200 text-[11px] font-medium rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E8940]/20 focus:border-[#3E8940] transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To:</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-[130px] h-9 px-2 bg-white border border-slate-200 text-[11px] font-medium rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E8940]/20 focus:border-[#3E8940] transition-all"
                />
              </div>

              {(statusFilter !== "all" || vendorFilter !== "all" || cityFilter !== "all" || startDateFilter !== "" || endDateFilter !== "") && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-3 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Orders Table */}
          {data.primaryTable.type === "orders" && (
            <>
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-100 cursor-default">
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Order ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Customer</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Vendor</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Location</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">City</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Order Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Payment Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Pickup Slot</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">Delivery ETA</TableHead>
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
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap font-medium truncate max-w-[150px]">{order.location}</TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap font-medium">{order.city}</TableCell>
                        <TableCell>
                          <Badge className={`${getOrderTypeColor(order.orderType)} border-none text-[10px] font-bold px-2 py-0.5 rounded-md`}>
                            {order.orderType}
                          </Badge>
                        </TableCell>
                        <TableCell 
                          onClick={(e) => {
                            if (order.status === "Issue Reported" && order.issueSummary) {
                              e.stopPropagation();
                              setSelectedIssue({
                                id: `msg-${order.id}`,
                                orderId: order.transactionId,
                                type: order.issueSummary.title,
                                severity: order.issueSummary.severity,
                                vendor: order.vendor,
                                summary: order.issueSummary.summary,
                                city: order.city,
                                unread: false,
                                status: 'Open'
                              } as DashboardIssueDigest);
                            }
                          }}
                        >
                          <Badge className={`${getStatusColor(order.status)} border-none text-[10px] font-bold px-2 py-0.5 rounded-md ${order.status === "Issue Reported" ? "cursor-help hover:scale-105" : ""} transition-transform`}>
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
                    <TableRow className="hover:bg-transparent cursor-default">
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
            </>
          )}

          {/* Settlements Table */}
          {data.primaryTable.type === "settlements" && (
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
                    <TableRow className="hover:bg-transparent cursor-default">
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">No settlements found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          )}
        </div>

        {/* Actionable Panels Section (Moved from Sidebar to Bottom) */}
        {(data.approvals?.length > 0 || data.issueDigest?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Pending Vendor Approvals */}
            {data.approvals?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Pending Approvals
                  </h3>
                  <div className="flex items-center gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1 rounded-full bg-slate-50 border border-slate-100 cursor-help">
                            <Activity className="h-3 w-3 text-slate-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-none rounded-lg p-2">
                          <p className="text-[10px] font-bold">Not all vendors are equal. High risk vendors require physical inspection.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold px-2 rounded-full">
                      {data.approvals?.length}
                    </Badge>
                  </div>
                </div>

                {/* Vendor Approvals Filters Row */}
                <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  <Select value={vendorCommissionFilter} onValueChange={setVendorCommissionFilter}>
                    <SelectTrigger className="h-8 w-auto min-w-[120px] text-[10px] font-bold uppercase bg-white rounded-lg">
                      <SelectValue placeholder="Commission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      <SelectItem value="15">15% Tier</SelectItem>
                      <SelectItem value="18">18% Tier</SelectItem>
                      <SelectItem value="20">20% Tier</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={vendorAgreementFilter} onValueChange={setVendorAgreementFilter}>
                    <SelectTrigger className="h-8 w-auto min-w-[120px] text-[10px] font-bold uppercase bg-white rounded-lg">
                      <SelectValue placeholder="Agreement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-slate-400" onClick={() => { setVendorCommissionFilter("all"); setVendorAgreementFilter("all"); }}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Reset
                  </Button>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {data.approvals?.filter(v => {
                      if (vendorCommissionFilter !== "all" && !v.commissionModel.includes(vendorCommissionFilter)) return false;
                      if (vendorAgreementFilter !== "all") {
                        if (vendorAgreementFilter === "signed" && !v.agreementSigned) return false;
                        if (vendorAgreementFilter === "pending" && v.agreementSigned) return false;
                      }
                      return true;
                    })
                    .map((vendor) => (
                    <div 
                      key={vendor.id} 
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:shadow-sm hover:border-[#3E8940]/30 cursor-pointer group/card"
                      onClick={() => router.push(`/vendors/review/${vendor.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-sm text-slate-900 group-hover/card:text-[#3E8940] transition-colors">{vendor.vendorName}</p>
                        <Badge className={`${getPriorityColor(vendor.priority)} border text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1`}>
                          <span>{getPriorityIcon(vendor.priority)}</span>
                          {vendor.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {vendor.city}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>Applied {vendor.appliedLabel}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 p-3 bg-white rounded-lg border border-slate-100/50">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Document Status</span>
                          <span className={`text-[10px] font-bold ${vendor.documentStatus === "Documents Verified" ? "text-emerald-600" : "text-amber-600"}`}>
                            {vendor.documentStatus}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Commission Model</span>
                          <span className="text-[10px] font-bold text-slate-700">{vendor.commissionModel}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Agreement Signed</span>
                          <div className="flex items-center gap-1">
                            {vendor.agreementSigned ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />}
                            <span className={`text-[10px] font-bold ${vendor.agreementSigned ? "text-emerald-600" : "text-red-600"}`}>
                              {vendor.agreementSigned ? "Signed" : "Pending"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Bank Verified</span>
                          <div className="flex items-center gap-1">
                            {vendor.bankVerified ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />}
                            <span className={`text-[10px] font-bold ${vendor.bankVerified ? "text-emerald-600" : "text-red-600"}`}>
                              {vendor.bankVerified ? "Verified" : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            className="bg-[#3E8940] hover:bg-[#3E8940]/90 h-7 text-[10px] font-semibold shadow-sm px-3 rounded-lg group-hover/card:scale-105 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/vendors/review/${vendor.id}`);
                            }}
                          >
                            Review
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="outline" className="h-7 w-7 p-0 rounded-lg border-slate-200">
                                <MoreVertical className="h-3 w-3 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                              <DropdownMenuItem className="text-xs font-semibold py-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleVendorAction(vendor.id, vendor.vendorName, 'approve'); }}>Approve Now</DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-semibold py-2 text-red-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleVendorAction(vendor.id, vendor.vendorName, 'reject'); }}>Reject</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs font-semibold py-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/vendors/review/${vendor.id}`); }}>View Docs</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
            {data.issueDigest?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Issue Alerts
                  </h3>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-7 text-[10px] font-bold text-slate-400 hover:bg-slate-50 px-2 rounded-lg gap-1.5">
                          <Activity className="h-3 w-3" />
                          Legend
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-4 rounded-xl shadow-2xl border-slate-100">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Severity Guide</h4>
                        <div className="space-y-2.5">
                          {[
                            { label: 'Critical', desc: 'Item Damaged', color: 'bg-red-500' },
                            { label: 'High', desc: 'Customer Complaint', color: 'bg-orange-500' },
                            { label: 'Medium', desc: 'Pickup Delay', color: 'bg-amber-500' },
                            { label: 'Low', desc: 'Customer No Show', color: 'bg-emerald-500' },
                          ].map(s => (
                            <div key={s.label} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${s.color}`} />
                                <span className="text-[10px] font-bold text-slate-700">{s.label}</span>
                              </div>
                              <span className="text-[10px] font-medium text-slate-400">{s.desc}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold px-2 rounded-full">
                      {filteredIssueCount}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-[#3E8940] hover:bg-green-50 px-2" onClick={() => router.push("/issues")}>
                      View Page
                    </Button>
                  </div>
                </div>

                {/* Monthly Issue Analytics Mini-Section */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {[
                    { label: 'Damage Rate', value: `${orders.length ? Math.round((data.issueDigest.filter(i => (i.type || '').toLowerCase().includes('damage')).length / orders.length) * 100) : 0}%`, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'No-Show Rate', value: `${orders.length ? Math.round((data.issueDigest.filter(i => (i.type || '').toLowerCase().includes('show')).length / orders.length) * 100) : 0}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Refund Risk', value: `${data.issueDigest.filter(i => i.refundStatus === 'Processing' || i.refundStatus === 'Completed').length}`, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Top Vendor', value: (() => {
                      const counts: Record<string, number> = {};
                      data.issueDigest.forEach(i => counts[i.vendor] = (counts[i.vendor] || 0) + 1);
                      const top = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
                      return top ? (top[0].split(' ')[0]) : 'None';
                    })(), color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Escalated', value: `${data.issueDigest.filter(i => i.status === 'Escalated').length}`, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Avg Open', value: (() => {
                        const resolved = data.issueDigest.filter(i => i.status === 'Resolved' && i.resolution?.resolvedAt);
                        if (!resolved.length) return "N/A";
                        const avg = resolved.reduce((acc, i) => {
                          const start = new Date(i.createdAt || 0).getTime();
                          const end = new Date(i.resolution!.resolvedAt!).getTime();
                          return acc + (end - start);
                        }, 0) / resolved.length;
                        return `${(avg / (1000 * 60 * 60)).toFixed(1)}h`;
                      })(), color: 'text-violet-600', bg: 'bg-violet-50' },
                  ].map((stat) => (
                    <div key={stat.label} className={`p-1.5 rounded-xl ${stat.bg} border border-slate-100/50 text-center`}>
                      <p className={`text-[9px] font-bold ${stat.color} truncate px-0.5`}>{stat.value}</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mark All Reviewed + Unread Count */}
                {data.summary?.unreadIssues > 0 && (
                  <div className="flex items-center justify-between mb-3 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-blue-700">
                        {data.summary?.unreadIssues} unread alert{data.summary?.unreadIssues > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-[10px] font-bold text-blue-600 hover:bg-blue-100 rounded-lg gap-1.5"
                      onClick={handleMarkAllReviewed}
                    >
                      <FileCheck className="h-3 w-3" />
                      Mark All as Reviewed
                    </Button>
                  </div>
                )}

                {/* Interactive Issue Breakdown Chart */}
                <div className="mb-4 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Breakdown</span>
                    <span className="text-[10px] font-bold text-slate-500">{issueBreakdown.delay + issueBreakdown.damage + issueBreakdown.noshow + issueBreakdown.refund} Segmented Issues</span>
                  </div>
                  
                  {/* Stacked Percentage Bar */}
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner mb-3">
                    {issueBreakdown.delay > 0 && (
                      <button
                        onClick={() => handleToggleIssueFilter("delay")}
                        style={{ width: `${(issueBreakdown.delay / issueBreakdown.total) * 100}%` }}
                        className={cn(
                          "h-full bg-orange-500 transition-all hover:opacity-85 relative",
                          issueTypeFilter === "delay" ? "ring-2 ring-orange-600 ring-offset-1 z-10 scale-y-110" : ""
                        )}
                        title={`Delay: ${issueBreakdown.delay}`}
                      />
                    )}
                    {issueBreakdown.damage > 0 && (
                      <button
                        onClick={() => handleToggleIssueFilter("damage")}
                        style={{ width: `${(issueBreakdown.damage / issueBreakdown.total) * 100}%` }}
                        className={cn(
                          "h-full bg-red-500 transition-all hover:opacity-85 relative",
                          issueTypeFilter === "damage" ? "ring-2 ring-red-600 ring-offset-1 z-10 scale-y-110" : ""
                        )}
                        title={`Damage: ${issueBreakdown.damage}`}
                      />
                    )}
                    {issueBreakdown.noshow > 0 && (
                      <button
                        onClick={() => handleToggleIssueFilter("noshow")}
                        style={{ width: `${(issueBreakdown.noshow / issueBreakdown.total) * 100}%` }}
                        className={cn(
                          "h-full bg-amber-500 transition-all hover:opacity-85 relative",
                          issueTypeFilter === "noshow" ? "ring-2 ring-amber-600 ring-offset-1 z-10 scale-y-110" : ""
                        )}
                        title={`No Show: ${issueBreakdown.noshow}`}
                      />
                    )}
                    {issueBreakdown.refund > 0 && (
                      <button
                        onClick={() => handleToggleIssueFilter("refund")}
                        style={{ width: `${(issueBreakdown.refund / issueBreakdown.total) * 100}%` }}
                        className={cn(
                          "h-full bg-blue-500 transition-all hover:opacity-85 relative",
                          issueTypeFilter === "refund" ? "ring-2 ring-blue-600 ring-offset-1 z-10 scale-y-110" : ""
                        )}
                        title={`Refund: ${issueBreakdown.refund}`}
                      />
                    )}
                  </div>

                  {/* Legend Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleToggleIssueFilter("delay")}
                      className={cn(
                        "flex flex-col items-center p-1.5 rounded-lg border text-center transition-all",
                        issueTypeFilter === "delay" ? "bg-orange-50 border-orange-200" : "bg-white border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Delay</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{issueBreakdown.delay}</span>
                    </button>

                    <button
                      onClick={() => handleToggleIssueFilter("damage")}
                      className={cn(
                        "flex flex-col items-center p-1.5 rounded-lg border text-center transition-all",
                        issueTypeFilter === "damage" ? "bg-red-50 border-red-200" : "bg-white border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Damage</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{issueBreakdown.damage}</span>
                    </button>

                    <button
                      onClick={() => handleToggleIssueFilter("noshow")}
                      className={cn(
                        "flex flex-col items-center p-1.5 rounded-lg border text-center transition-all",
                        issueTypeFilter === "noshow" ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">No Show</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{issueBreakdown.noshow}</span>
                    </button>

                    <button
                      onClick={() => handleToggleIssueFilter("refund")}
                      className={cn(
                        "flex flex-col items-center p-1.5 rounded-lg border text-center transition-all",
                        issueTypeFilter === "refund" ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Refund</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{issueBreakdown.refund}</span>
                    </button>
                  </div>
                </div>

                {/* Issue Filters Row */}
                <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
                    <SelectTrigger className="h-8 w-auto min-w-[100px] text-[10px] font-bold uppercase bg-white rounded-lg">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="delay">Delay</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="noshow">No Show</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={issueStatusFilter} onValueChange={setIssueStatusFilter}>
                    <SelectTrigger className="h-8 w-auto min-w-[100px] text-[10px] font-bold uppercase bg-white rounded-lg">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={issueCityFilter} onValueChange={setIssueCityFilter}>
                    <SelectTrigger className="h-8 w-auto min-w-[100px] text-[10px] font-bold uppercase bg-white rounded-lg">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {data.filters.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={issueVendorFilter} onValueChange={setIssueVendorFilter}>
                    <SelectTrigger className="h-8 w-auto min-w-[120px] text-[10px] font-bold uppercase bg-white rounded-lg">
                      <SelectValue placeholder="Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {data.filters.vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <input
                    type="date"
                    value={issueDateFilter}
                    onChange={(e) => setIssueDateFilter(e.target.value)}
                    className="h-8 px-2 text-[10px] font-bold uppercase bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3E8940]"
                  />
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold text-slate-400" onClick={() => { 
                    setIssueTypeFilter("all"); 
                    setIssueStatusFilter("all"); 
                    setIssueCityFilter("all"); 
                    setIssueVendorFilter("all"); 
                    setIssueDateFilter(""); 
                  }}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Reset
                  </Button>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {data.issueDigest?.filter(issue => {
                      if (issueTypeFilter !== "all") {
                        const type = issue.type?.toLowerCase() || "";
                        if (issueTypeFilter === "damage" && !type.includes("damage")) return false;
                        if (issueTypeFilter === "noshow" && !(type.includes("no show") || type.includes("no-show"))) return false;
                        if (issueTypeFilter === "complaint" && !type.includes("complaint")) return false;
                        if (issueTypeFilter === "delay" && !type.includes("delay")) return false;
                        if (issueTypeFilter === "refund" && !(issue.refundStatus === "Processing" || issue.refundStatus === "Completed")) return false;
                      }
                      if (issueStatusFilter !== "all") {
                        if (issueStatusFilter === "open" && issue.status !== "Open") return false;
                        if (issueStatusFilter === "escalated" && issue.status !== "Escalated") return false;
                        if (issueStatusFilter === "resolved" && issue.status !== "Resolved") return false;
                      }
                      if (issueCityFilter !== "all" && issue.city !== issueCityFilter) return false;
                      if (issueVendorFilter !== "all" && issue.vendor !== issueVendorFilter) return false;
                      if (issueDateFilter) {
                        if (!issue.createdAt?.startsWith(issueDateFilter)) return false;
                      }

                      // Role-based visibility: Ops Admin only sees issues assigned to their team
                      // Super Admin sees everything so they can triage/assign them
                      if (adminRole === "operations_admin") {
                        const opsTeams = ["Operations Team", "Operations Head"];
                        const isAssignedToOps = opsTeams.includes(issue.assignedTo || "");
                        const isEscalatedToOps = issue.status === "Escalated";
                        if (!isAssignedToOps && !isEscalatedToOps) return false;
                      }

                      return true;
                    })
                    .map((issue) => {
                      const colors = getSeverityColor(issue.severity);
                      
                      // Auto-Escalation Logic: If open for > 2 hours
                      const createdAtDate = issue.createdAt ? new Date(issue.createdAt) : null;
                      const hoursOld = createdAtDate ? (new Date().getTime() - createdAtDate.getTime()) / (1000 * 60 * 60) : 0;
                      const isAutoEscalated = hoursOld > 2 && issue.status === 'Open';

                      return (
                        <div
                          key={issue.id}
                          className={`p-3 rounded-xl border transition-all cursor-pointer group/card hover:shadow-sm ${colors.bg} ${colors.border} relative overflow-hidden`}
                          onClick={() => setSelectedIssue(issue)}
                        >
                          {/* Auto-Escalation Banner */}
                          {isAutoEscalated && (
                            <div className="mb-1.5 p-1.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                              <Zap className="h-3 w-3 text-red-600 animate-pulse" />
                              <span className="text-[9px] font-bold text-red-700 uppercase tracking-tight">
                                System: Auto-Escalated (Ops Head & Super Admin Notified)
                              </span>
                            </div>
                          )}
                        {/* Severity left stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.badge.split(" ")[0]}`} />

                        <div className="flex items-center justify-between mb-1 pl-2">
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
                          <div className="flex items-center gap-2">
                            <Badge className={`${colors.badge} border-none text-[9px] font-bold px-1.5 py-0.5 rounded-md`}>
                              {issue.severity}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" className="h-6 w-6 p-0 rounded-md hover:bg-white/50">
                                  <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-100">
                                <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-400 px-3 py-2">Quick Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 text-xs font-semibold py-2 px-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${issue.orderId}`); }}>
                                  <Eye className="h-3.5 w-3.5 text-slate-400" /> View Order
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-xs font-semibold py-2 px-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleContactAction('vendor', issue.vendor, issue.orderId); }}>
                                  <Store className="h-3.5 w-3.5 text-slate-400" /> Contact Vendor
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-xs font-semibold py-2 px-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleContactAction('customer', 'Customer', issue.orderId); }}>
                                  <PhoneCall className="h-3.5 w-3.5 text-slate-400" /> Call Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-xs font-semibold py-2 px-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleAssignToTeam(issue.id); }}>
                                  <UserPlus className="h-3.5 w-3.5 text-slate-400" /> Assign to Team
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 text-xs font-bold py-2 px-3 cursor-pointer text-emerald-600 hover:text-emerald-700" onClick={(e) => { e.stopPropagation(); handleDismissIssue(issue.id); }}>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-xs font-bold py-2 px-3 cursor-pointer text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleEscalateIssue(issue.id); }}>
                                  <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="pl-2 space-y-0.5">
                          <div className="flex items-center gap-2 min-h-[1.25rem]">
                            {/* Issue Type Icon */}
                            {React.createElement(getIssueTypeIcon(issue.type).icon, {
                              className: `h-3.5 w-3.5 ${getIssueTypeIcon(issue.type).color} shrink-0`
                            })}
                            <p className={`text-sm font-bold ${colors.text} truncate`}>
                              {issue.type || "Unspecified Issue"}
                            </p>
                          </div>
                          <p className={`text-[10px] font-bold uppercase tracking-tight ${colors.text} opacity-60 leading-tight`}>
                            Vendor: {issue.vendor} • {issue.city} {issue.assignedTo && `• Assigned: ${issue.assignedTo}`}
                          </p>
                          
                          {/* Financial Risk + Refund Status Row */}
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100/30 flex items-center justify-between gap-2">
                            {getFinancialRisk(issue.type) ? (
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                {React.createElement(getFinancialRisk(issue.type)!.icon, { className: "h-2.5 w-2.5" })}
                                {getFinancialRisk(issue.type)?.label}:
                                <span className={`${getFinancialRisk(issue.type)?.color}`}>
                                  {getFinancialRisk(issue.type)?.value}
                                </span>
                              </span>
                            ) : <span />}
                            {/* Refund Status Badge */}
                            {issue.refundStatus && (
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${getRefundBadgeStyle(issue.refundStatus)}`}>
                                Refund: {issue.refundStatus}
                              </span>
                            )}
                          </div>

                          {/* Vendor Risk Warning */}
                          {issue.vendorRiskLevel === 'High' && (
                            <div className="mt-1 p-1.5 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                              <span className="text-[9px] font-bold text-red-700 uppercase tracking-tight">
                                Vendor Risk Level: HIGH
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

      {/* ─── Operations & Super Admin Sections ───────────────── */}
      {(adminRole === "operations_admin" || adminRole === "super_admin") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SlaRiskPanel orders={orders} />
          <OrderStatusDistribution orders={orders} />
        </div>
      )}

      {(adminRole === "operations_admin" || adminRole === "super_admin") && orders.length > 0 && (
        <div className="mb-6">
          <VendorSlaScorecard orders={orders} />
        </div>
      )}

      {(adminRole === "operations_admin" || adminRole === "super_admin") && data?.riders && (
        <div className="mb-6">
          <RiderPerformanceSnapshot riders={data.riders} />
        </div>
      )}

      {/* Settlement Status Snapshot Panel */}
      {(adminRole === "finance_admin" || adminRole === "super_admin") && settlements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Settlements Due Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Clock className="h-16 w-16 text-[#3E8940]" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-green-50 text-[#3E8940]">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlements Due</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">{formatINR(settlementDueTotal)}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Awaiting release in settlement queue</p>
          </div>

          {/* Settlements Completed Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <CheckCircle className="h-16 w-16 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlements Completed</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">{formatINR(settlementCompletedTotal)}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Successfully transferred to partners</p>
          </div>

          {/* Overdue Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group relative overflow-hidden border-l-4 border-l-red-500">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{"Overdue (>7 Days)"}</span>
            </div>
            <h3 className="text-2xl font-black text-red-600">{formatINR(settlementOverdueTotal)}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Pending payments requiring intervention</p>
          </div>
        </div>
      )}

      {/* ─── Finance & Super Admin Sections ──────────────────── */}
      {(adminRole === "finance_admin" || adminRole === "super_admin") && settlements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <PayoutReconciliation settlements={settlements} />
          <CommissionIntelligence settlements={settlements} />
          <div className="md:col-span-2">
            <SettlementAgingTracker settlements={settlements} />
          </div>
        </div>
      )}

      {(adminRole === "finance_admin" || adminRole === "super_admin") && settlements.length > 0 && (
        <div className="mb-6">
          <RevenueByVendor settlements={settlements} />
        </div>
      )}

      {(adminRole === "finance_admin" || adminRole === "super_admin") && settlements.length > 0 && (
        <div className="mb-6">
          <WorkingCapitalForecast settlements={settlements} />
        </div>
      )}

      {(adminRole === "finance_admin" || adminRole === "super_admin") && settlements.length > 0 && (
        <div className="mb-6">
          <TaxCompliancePanel settlements={settlements} />
        </div>
      )}

      {/* Issue Detail Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-y-auto max-h-[90vh] border-none shadow-2xl custom-scrollbar">
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
                    {selectedIssue.orderId || selectedIssue.supportTicketId} • {selectedIssue.severity} severity
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-6">
                {/* Auto-Escalation Warning in Dialog */}
                {(() => {
                  const createdAtDate = selectedIssue.createdAt ? new Date(selectedIssue.createdAt) : null;
                  const hoursOld = createdAtDate ? (new Date().getTime() - createdAtDate.getTime()) / (1000 * 60 * 60) : 0;
                  if (hoursOld > 2 && selectedIssue.status === 'Open') {
                    return (
                      <div className="p-3 rounded-xl bg-red-600 text-white flex items-center gap-3 shadow-lg shadow-red-200 animate-bounce">
                        <Zap className="h-5 w-5 fill-white" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider">Critical SLA Breach</p>
                          <p className="text-xs font-bold">Auto-Escalated to Operations Head</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <Badge className={`${
                      selectedIssue.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 
                      selectedIssue.status === 'Escalated' ? 'bg-red-50 text-red-700' : 
                      'bg-amber-50 text-amber-700'
                    } border-none font-bold text-[10px]`}>
                      {selectedIssue.status}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned To</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{selectedIssue.assignedTo || 'Unassigned'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</p>
                    <p className="text-sm font-bold text-slate-700">{selectedIssue.city}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {getFinancialRisk(selectedIssue.type)?.label || "Risk Amount"}
                    </p>
                    <p className={cn("text-sm font-bold", getFinancialRisk(selectedIssue.type)?.color || "text-red-600")}>
                      {getFinancialRisk(selectedIssue.type)?.value || selectedIssue.financialRiskAmount || "₹0"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Summary
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedIssue.summary}
                  </div>
                </div>

                {/* Vendor Risk Tracking Banner */}
                {selectedIssue.vendorRiskLevel === 'High' && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <ShieldAlert className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase tracking-tight">⚠️ Vendor Risk Level: HIGH</p>
                      <p className="text-[10px] text-red-600/70 font-medium">
                        This vendor has 5+ damage complaints this week or high refund rate. Physical inspection recommended.
                      </p>
                    </div>
                  </div>
                )}

                {/* Refund & Damage Tracking (Contextual) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <h5 className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Wallet className="h-3 w-3" /> Refund Status
                    </h5>
                    <Badge className={cn(
                      "text-[10px] font-bold rounded-md border-none px-2",
                      selectedIssue.refundStatus === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                      selectedIssue.refundStatus === 'Processing' ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {selectedIssue.refundStatus || 'Not Initiated'}
                    </Badge>
                  </div>

                  {selectedIssue.type?.toLowerCase()?.includes('damage') && (
                    <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3" /> Damage Claim Setup
                        </h5>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-red-800 uppercase opacity-60">Invoice Value</span>
                          <input 
                            type="number" 
                            placeholder="Enter value"
                            value={invoiceValue}
                            onChange={(e) => setInvoiceValue(e.target.value)}
                            className="h-8 px-2 text-xs font-bold bg-white border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-red-800 uppercase opacity-60">Liability Cap (25%)</span>
                          <div className="h-8 px-2 flex items-center text-xs font-bold bg-red-100/50 text-red-700 rounded-lg border border-red-200">
                            {formatINR(Number(invoiceValue || 0) * 0.25)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Damage Images (Contextual) */}
                {selectedIssue.type?.toLowerCase()?.includes('damage') && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <ImagePlus className="h-3.5 w-3.5" />
                      Damage Evidence
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="file" className="hidden" ref={damageImageInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'damage')} />
                      <input type="file" className="hidden" ref={preCleanImageInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'pre-clean')} />
                      
                      <div 
                        className={cn(
                          "aspect-square rounded-xl border border-dashed flex items-center justify-center flex-col gap-1.5 cursor-pointer transition-colors",
                          damageImage ? "bg-red-50 border-red-300" : "bg-slate-100 border-slate-300 hover:bg-slate-200"
                        )}
                        onClick={() => damageImageInputRef.current?.click()}
                      >
                        {damageImage ? (
                          <div className="text-[10px] font-bold text-red-600 flex flex-col items-center gap-1">
                            <Check className="h-4 w-4" />
                            <span>READY</span>
                          </div>
                        ) : (
                          <>
                            <ImagePlus className="h-4 w-4 text-slate-400" />
                            <span className="text-[8px] font-bold text-slate-500 text-center px-1">Damage Image</span>
                          </>
                        )}
                      </div>
                      
                      <div 
                        className={cn(
                          "aspect-square rounded-xl border border-dashed flex items-center justify-center flex-col gap-1.5 cursor-pointer transition-colors",
                          preCleanImage ? "bg-emerald-50 border-emerald-300" : "bg-slate-100 border-slate-300 hover:bg-slate-200"
                        )}
                        onClick={() => preCleanImageInputRef.current?.click()}
                      >
                        {preCleanImage ? (
                          <div className="text-[10px] font-bold text-emerald-600 flex flex-col items-center gap-1">
                            <Check className="h-4 w-4" />
                            <span>READY</span>
                          </div>
                        ) : (
                          <>
                            <ImagePlus className="h-4 w-4 text-slate-400" />
                            <span className="text-[8px] font-bold text-slate-500 text-center px-1">Pre-Clean</span>
                          </>
                        )}
                      </div>
                      
                      <div className="aspect-square rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-col gap-1.5 opacity-50 cursor-not-allowed">
                        <ImagePlus className="h-4 w-4 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-500 text-center px-1">Post-Clean</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Root Cause Selection (Before Resolving) */}
                {selectedIssue.status !== 'Resolved' && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldQuestion className="h-3.5 w-3.5" />
                      Assign Root Cause
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {ROOT_CAUSES.map(cause => (
                        <Button
                          key={cause}
                          variant={issueRootCause === cause ? "default" : "outline"}
                          className={cn(
                            "text-[10px] font-bold h-9 rounded-lg",
                            issueRootCause === cause ? "bg-slate-900 text-white" : "text-slate-600"
                          )}
                          onClick={() => setIssueRootCause(cause)}
                        >
                          {cause}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full bg-[#3E8940] hover:bg-[#3E8940]/90 text-white font-bold h-12 rounded-xl gap-2 shadow-sm"
                    onClick={() => router.push(`/issues?search=${selectedIssue.orderId || selectedIssue.supportTicketId}`)}
                  >
                    View Full Issue Details
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="font-bold h-11 rounded-xl text-slate-600 border-slate-200 bg-white"
                      onClick={() => handleDismissIssue(selectedIssue.id)}
                    >
                      Dismiss Alert
                    </Button>
                    {selectedIssue.status !== 'Resolved' && (
                      <Button
                        variant="outline"
                        disabled={!issueRootCause}
                        className={cn(
                          "font-bold h-11 rounded-xl bg-white",
                          issueRootCause ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50" : "text-slate-300 border-slate-100"
                        )}
                        onClick={handleResolveWithClaim}
                      >
                        Resolve with Cause
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
