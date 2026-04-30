"use client";

import React from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  MoreVertical,
  ShieldAlert,
  MessageSquare,
  User,
  Phone,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  UserPlus,
  ArrowUpCircle,
  MessageSquareShare,
  PhoneCall,
  IndianRupee,
  TrendingDown,
  MapPin,
  Calendar,
  Layers,
  Activity,
  Loader2,
  RefreshCw,
  Eye,
  Upload,
  BarChart3,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

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

interface IssueRecord {
  id: string;
  orderId: string;
  supportTicketId: string | null;
  type: string;
  severity: string;
  vendor: string;
  vendorPhone: string;
  vendorName: string;
  customer: string;
  customerPhone: string;
  city: string;
  status: string;
  unread: boolean;
  date: string;
  hoursOpen: number;
  autoEscalateAfterHours: number;
  escalatedTo: string | null;
  assignedTo: string | null;
  rootCause: string | null;
  refundStatus: string;
  description: string;
  summary: string;
  icon: string;
  escalation: { state: string; label: string };
  financialRisk: { label: string; amount: number };
  vendorRisk: { level: string; trigger: string } | null;
  damageClaim: any;
  createdAt: string;
}

interface IssuesData {
  filters: {
    cities: string[];
    vendors: string[];
    issueTypes: string[];
    statuses: string[];
    severities: string[];
    rootCauses: string[];
    teamMembers: string[];
    refundStatuses: string[];
  };
  issues: IssueRecord[];
  summaryCards: { key: string; title: string; value: number; accent: string }[];
  monthlyReport: { key: string; title: string; value: string }[];
}

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "Critical": return "bg-red-50 text-red-700 border-red-100";
    case "High": return "bg-orange-50 text-orange-700 border-orange-100";
    case "Medium": return "bg-yellow-50 text-yellow-700 border-yellow-100";
    case "Low": return "bg-green-50 text-green-700 border-green-100";
    default: return "bg-slate-50 text-slate-700 border-slate-100";
  }
};

const getSeverityBorderColor = (severity: string) => {
  switch (severity) {
    case "Critical": return "border-l-red-500";
    case "High": return "border-l-orange-500";
    case "Medium": return "border-l-yellow-500";
    case "Low": return "border-l-green-500";
    default: return "border-l-slate-300";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Open": return "bg-blue-100 text-blue-700";
    case "Investigating": return "bg-amber-100 text-amber-700";
    case "Escalated": return "bg-red-100 text-red-700";
    case "Resolved": return "bg-emerald-100 text-emerald-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const getAccentColor = (accent: string) => {
  switch (accent) {
    case "red": return "text-red-600";
    case "orange": return "text-orange-600";
    case "amber": return "text-amber-600";
    case "emerald": return "text-emerald-600";
    default: return "text-slate-600";
  }
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const getFilterStyles = (isActive: boolean, activeColor: string = "bg-[#3E8940]/10 text-[#3E8940] ring-1 ring-[#3E8940]/20") => 
  cn(
    "w-fit min-w-[130px] h-8 border-none rounded-full text-[10px] font-bold uppercase tracking-wider transition-all px-4",
    isActive 
      ? activeColor 
      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
  );

export default function IssuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [data, setData] = React.useState<IssuesData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState(urlSearchQuery);
  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [cityFilter, setCityFilter] = React.useState("all");
  const [vendorFilter, setVendorFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateRangeFilter, setDateRangeFilter] = React.useState("all");
  const [assignedToFilter, setAssignedToFilter] = React.useState("all");
  const [refundStatusFilter, setRefundStatusFilter] = React.useState("all");

  const [selectedIssue, setSelectedIssue] = React.useState<IssueRecord | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Resolve dialog state
  const [showResolveDialog, setShowResolveDialog] = React.useState(false);
  const [resolveRootCause, setResolveRootCause] = React.useState("");
  const [resolveRefundStatus, setResolveRefundStatus] = React.useState("Not Initiated");

  // Assign dialog state
  const [showAssignDialog, setShowAssignDialog] = React.useState(false);
  const [assignTarget, setAssignTarget] = React.useState("");

  const fetchIssues = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (cityFilter !== "all") params.set("city", cityFilter);
      if (vendorFilter !== "all") params.set("vendor", vendorFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      if (dateRangeFilter !== "all") params.set("dateRange", dateRangeFilter);
      if (assignedToFilter !== "all") params.set("assignedTo", assignedToFilter);
      if (refundStatusFilter !== "all") params.set("refundStatus", refundStatusFilter);

      const url = `${AUTH_API_URL}/issues${params.toString() ? "?" + params.toString() : ""}`;
      const res = await apiFetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load issues");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, severityFilter, cityFilter, vendorFilter, typeFilter, statusFilter, dateRangeFilter, assignedToFilter, refundStatusFilter]);

  React.useEffect(() => {
    const t = setTimeout(fetchIssues, 300);
    return () => clearTimeout(t);
  }, [fetchIssues]);

  React.useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const handleIssueAction = async (issueId: string, payload: any, successMsg: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/issues/${issueId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Action failed");
      }
      toast.success(successMsg);
      setSelectedIssue(null);
      setShowResolveDialog(false);
      setShowAssignDialog(false);
      fetchIssues();
    } catch (err: any) {
      toast.error("Action Failed", { description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllReviewed = async () => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/issues/review-all`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to mark all reviewed");
      const result = await res.json();
      toast.success(`${result.reviewedCount} issue(s) marked as reviewed`);
      fetchIssues();
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSeverityFilter("all");
    setCityFilter("all");
    setVendorFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateRangeFilter("all");
    setAssignedToFilter("all");
    setRefundStatusFilter("all");
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading issue alerts...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Issues</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Button onClick={fetchIssues} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const unreadCount = data.issues.filter((i) => i.unread).length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Issue Alerts</h1>
            <p className="text-sm font-medium text-slate-500">Manage and resolve platform-wide operational issues</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" className="gap-2 rounded-xl border-slate-200 text-sm font-bold" onClick={handleMarkAllReviewed}>
              <Eye className="h-4 w-4" />
              Mark All Reviewed ({unreadCount})
            </Button>
          )}
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {data.summaryCards.map((stat) => (
          <div key={stat.key} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{stat.title}</p>
            <div className="flex items-end justify-between">
              <span className={`text-3xl font-bold ${getAccentColor(stat.accent)}`}>{stat.value}</span>
              <div className={`h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Report */}
      {data.monthlyReport.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Monthly Issue Analytics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.monthlyReport.map((item) => (
              <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xl font-bold text-slate-900">{item.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
            <Input
              placeholder="Search by Order ID, Vendor, Customer, City..."
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-[#3E8940]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="text-[#3E8940] font-bold gap-2 hover:bg-green-50 rounded-xl h-11" onClick={handleClearFilters}>
            Reset All
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="All Cities" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {data.filters.cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <Store className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="All Vendors" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {data.filters.vendors.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <Layers className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="Issue Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {data.filters.issueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <Activity className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {data.filters.statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="Date Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 pt-5 border-t border-slate-100 overflow-x-auto scrollbar-hide pb-1">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className={getFilterStyles(severityFilter !== "all", "bg-red-50 text-red-600 ring-1 ring-red-200")}>
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 shrink-0" />
                <SelectValue placeholder="Severity" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {data.filters.severities.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
 
          <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
            <SelectTrigger className={getFilterStyles(assignedToFilter !== "all")}>
              <div className="flex items-center gap-2">
                <UserPlus className="h-3 w-3 shrink-0" />
                <SelectValue placeholder="Assigned To" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {data.filters.teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
 
          <Select value={refundStatusFilter} onValueChange={setRefundStatusFilter}>
            <SelectTrigger className={getFilterStyles(refundStatusFilter !== "all")}>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-3 w-3 shrink-0" />
                <SelectValue placeholder="Refund Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Refund Status</SelectItem>
              {data.filters.refundStatuses.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Order / Ticket</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Issue Category</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Severity</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Financial Impact</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Vendor</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Assigned</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.issues.map((issue) => (
              <TableRow
                key={issue.id}
                className={`group border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer border-l-4 ${getSeverityBorderColor(issue.severity)}`}
                onClick={() => setSelectedIssue(issue)}
              >
                <TableCell className="py-5 px-6">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-xs">#{issue.orderId}</span>
                      <span className="text-[10px] text-slate-400">{issue.hoursOpen}h open • {issue.city}</span>
                    </div>
                    {issue.unread && (
                      <span className="inline-flex items-center text-[8px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <span className="font-semibold text-slate-600 text-sm whitespace-nowrap">{issue.type}</span>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <Badge className={`${getSeverityStyles(issue.severity)} border px-2 py-0.5 rounded-md font-bold text-[10px] shadow-none`}>
                    {issue.severity}
                  </Badge>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <Badge className={`${getStatusBadge(issue.status)} border-none px-2 py-0.5 rounded-md font-bold text-[10px] shadow-none`}>
                    {issue.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{issue.financialRisk.label}</span>
                    <span className="text-sm font-bold text-red-600">{formatINR(issue.financialRisk.amount)}</span>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Store className="h-3.5 w-3.5 text-slate-300" />
                      <span className="font-medium text-slate-700 text-xs">{issue.vendor}</span>
                    </div>
                    {issue.vendorRisk && (
                      <span className={`text-[9px] font-bold ${issue.vendorRisk.level === "High" ? "text-red-500" : "text-orange-500"}`}>
                        ⚠ Risk: {issue.vendorRisk.level}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <span className="text-xs font-medium text-slate-600">{issue.assignedTo || "Unassigned"}</span>
                </TableCell>
                <TableCell className="py-5 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 group-hover:bg-slate-100" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                      <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Quick Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {issue.orderId && !issue.orderId.startsWith("TKT") && (
                        <DropdownMenuItem className="flex items-center gap-2 py-2.5 px-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${issue.orderId}`); }}>
                          <ExternalLink className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium">View Order</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="flex items-center gap-2 py-2.5 px-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleIssueAction(issue.id, { action: "review" }, "Issue marked as reviewed"); }}>
                        <Eye className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium">Mark Reviewed</span>
                      </DropdownMenuItem>
                      {issue.status !== "Resolved" && (
                        <>
                          <DropdownMenuItem className="flex items-center gap-2 py-2.5 px-3 cursor-pointer text-emerald-600" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue(issue);
                            setShowResolveDialog(true);
                          }}>
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-bold">Resolve</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center gap-2 py-2.5 px-3 cursor-pointer text-red-600" onClick={(e) => {
                            e.stopPropagation();
                            handleIssueAction(issue.id, { action: "escalate" }, "Issue escalated successfully");
                          }}>
                            <ArrowUpCircle className="h-4 w-4" />
                            <span className="text-sm font-bold">Escalate</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.issues.length === 0 && (
          <div className="py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No issues found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Issue Detail Dialog */}
      <Dialog open={!!selectedIssue && !showResolveDialog && !showAssignDialog} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedIssue && (
            <>
              <DialogHeader className={`p-6 border-b flex-row items-center gap-4 space-y-0 ${selectedIssue.severity === "Critical" ? "bg-red-50/50 border-red-100" : selectedIssue.severity === "High" ? "bg-orange-50/50 border-orange-100" : "bg-slate-50/50 border-slate-100"}`}>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${selectedIssue.severity === "Critical" ? "bg-red-100 text-red-600" : selectedIssue.severity === "High" ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-600"}`}>
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-bold text-slate-900">{selectedIssue.type}</DialogTitle>
                    {selectedIssue.vendorRisk && selectedIssue.vendorRisk.level === "High" && (
                      <Badge className="bg-red-600 border-none text-white font-bold h-5 px-1.5 text-[10px]">HIGH RISK VENDOR</Badge>
                    )}
                  </div>
                  <DialogDescription className="text-slate-500 font-medium">
                    {selectedIssue.orderId} • {selectedIssue.city} • {selectedIssue.hoursOpen}h open
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Status & Severity Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusBadge(selectedIssue.status)} border-none font-bold px-3 rounded-full text-xs`}>{selectedIssue.status}</Badge>
                    <Badge className={`${getSeverityStyles(selectedIssue.severity)} border font-bold px-3 rounded-full text-xs`}>{selectedIssue.severity}</Badge>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{selectedIssue.date}</span>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" /> Issue Description
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedIssue.description}
                  </div>
                </div>

                {/* People */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</p>
                    <p className="text-sm font-bold text-slate-900">{selectedIssue.customer}</p>
                    <p className="text-xs text-slate-500">{selectedIssue.customerPhone}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor</p>
                    <p className="text-sm font-bold text-slate-900">{selectedIssue.vendor}</p>
                    <p className="text-xs text-slate-500">{selectedIssue.vendorPhone}</p>
                    {selectedIssue.vendorRisk && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-fit border border-red-100">
                        <AlertTriangle className="h-3 w-3" /> {selectedIssue.vendorRisk.trigger}
                      </div>
                    )}
                  </div>
                </div>

                {/* Escalation */}
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">{selectedIssue.escalation.label}</p>
                    {selectedIssue.assignedTo && <p className="text-[10px] text-amber-600">Assigned to: {selectedIssue.assignedTo}</p>}
                  </div>
                </div>

                {/* Financial Risk */}
                <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{selectedIssue.financialRisk.label}</p>
                      <p className="text-xl font-bold text-red-700">{formatINR(selectedIssue.financialRisk.amount)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Refund Status</p>
                    <Badge variant="outline" className="font-bold text-xs border-slate-200 mt-0.5">{selectedIssue.refundStatus}</Badge>
                  </div>
                </div>

                {/* Root Cause (if resolved) */}
                {selectedIssue.rootCause && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Root Cause</p>
                    <p className="text-sm font-bold text-emerald-800">{selectedIssue.rootCause}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedIssue.status !== "Resolved" && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Center</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-10 rounded-xl justify-start gap-2 border-slate-200 text-slate-600 font-bold text-xs" onClick={() => { setShowAssignDialog(true); }}>
                        <UserPlus className="h-4 w-4 text-slate-400" /> Assign Team
                      </Button>
                      <Button variant="outline" className="h-10 rounded-xl justify-start gap-2 border-slate-200 text-slate-600 font-bold text-xs" onClick={() => handleIssueAction(selectedIssue.id, { action: "escalate" }, "Issue escalated")}>
                        <ArrowUpCircle className="h-4 w-4 text-red-400" /> Escalate
                      </Button>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button className="flex-1 font-bold h-11 rounded-xl shadow-lg bg-[#3E8940] hover:bg-[#3E8940]/90 text-white" onClick={() => setShowResolveDialog(true)} disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resolve Issue"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={(open) => { if (!open) setShowResolveDialog(false); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Resolve Issue</DialogTitle>
            <DialogDescription>Select root cause and refund status to resolve this issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Root Cause *</Label>
              <Select value={resolveRootCause} onValueChange={setResolveRootCause}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select root cause" /></SelectTrigger>
                <SelectContent>
                  {data?.filters.rootCauses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Refund Status</Label>
              <Select value={resolveRefundStatus} onValueChange={setResolveRefundStatus}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data?.filters.refundStatuses.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowResolveDialog(false)} className="rounded-xl">Cancel</Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white rounded-xl font-bold"
              disabled={!resolveRootCause || actionLoading}
              onClick={() => {
                if (selectedIssue) {
                  handleIssueAction(selectedIssue.id, { action: "resolve", rootCause: resolveRootCause, refundStatus: resolveRefundStatus }, "Issue resolved successfully!");
                }
              }}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => { if (!open) setShowAssignDialog(false); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Assign Team Member</DialogTitle>
            <DialogDescription>Select a team member to handle this issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={assignTarget} onValueChange={setAssignTarget}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select team member" /></SelectTrigger>
              <SelectContent>
                {data?.filters.teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="rounded-xl">Cancel</Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white rounded-xl font-bold"
              disabled={!assignTarget || actionLoading}
              onClick={() => {
                if (selectedIssue) {
                  handleIssueAction(selectedIssue.id, { action: "assign", assignedTo: assignTarget }, `Assigned to ${assignTarget}`);
                }
              }}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
