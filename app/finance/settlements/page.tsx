"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import {
  CreditCard,
  Check,
  Clock,
  DollarSign,
  Download,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  AlertTriangle,
  IndianRupee,
  Calendar,
  Store,
  X,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Eye,
  XCircle,
  MoreHorizontal,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

interface SettlementRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  period: string;
  settlementCycle?: string;
  daysPending: number;
  paymentMode: string;
  isAutoReconciled: boolean;
  taxDeducted: number;
  hasRisk: boolean;
  orderCount: number;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  deductions: number;
  netPayout: number;
  status: string;
  paidAt: string | null;
  dueDate: string | null;
  transactionId: string | null;
  failureReason: string | null;
  note: string | null;
  createdAt: string;
}

type RawSettlementRecord = SettlementRecord & {
  amount?: number;
  penalties?: number;
  refundAdjustments?: number;
  vendor?: {
    vendorProfile?: {
      businessName?: string;
    };
    name?: string;
    phone?: string;
  };
};

interface SettlementStats {
  totalPending: number;
  totalPaid: number;
  totalCommission: number;
  avgCommissionRate: number;
  settlementCount: number;
  upcomingForecast: number;
  failedCount: number;
}

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "Unexpected error";

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase();
  switch (s) {
    case "paid": return "bg-emerald-100 text-emerald-700";
    case "pending": return "bg-amber-100 text-amber-700";
    case "processing": return "bg-blue-100 text-blue-700";
    case "failed": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

function SettlementsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Increased density
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);

  const fetchSettlements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settRes, statsRes] = await Promise.all([
        apiFetch(`${AUTH_API_URL}/settlements`, { headers: getAuthHeaders() }),
        apiFetch(`${AUTH_API_URL}/settlements/stats`, { headers: getAuthHeaders() }),
      ]);
      if (!settRes.ok) throw new Error("Failed to load settlements");
      const settData = await settRes.json();
      const rawArray = (Array.isArray(settData) ? settData : settData.settlements || []) as RawSettlementRecord[];
      const mappedArray = rawArray.map((s) => ({
        ...s,
        netPayout: s.amount ?? s.netPayout ?? 0,
        grossAmount: s.grossAmount ?? (s.amount ? s.amount / 0.8 : 0),
        commissionAmount: s.commissionAmount ?? (s.grossAmount ? s.grossAmount * 0.2 : (s.amount ? s.amount * 0.25 : 0)),
        commissionRate: s.commissionRate ?? 20,
        deductions: s.deductions ?? s.penalties ?? s.refundAdjustments ?? 0,
        vendorName: s.vendorName || s.vendor?.vendorProfile?.businessName || s.vendor?.name || "Unknown",
        vendorPhone: s.vendorPhone || s.vendor?.phone || "—",
        settlementCycle: s.settlementCycle || "Weekly",
        paymentMode: s.paymentMode || "Bank Transfer",
        isAutoReconciled: s.isAutoReconciled ?? true,
        taxDeducted: s.taxDeducted || Math.round((s.grossAmount || 0) * 0.01),
        hasRisk: (s.penalties || 0) > 500 || s.status.toLowerCase() === "failed",
        daysPending: s.status.toLowerCase() === "pending" ? Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      }));
      setSettlements(mappedArray);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const matchesSearch =
        s.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [settlements, searchQuery, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const paginatedSettlements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSettlements.slice(start, start + itemsPerPage);
  }, [filteredSettlements, currentPage]);

  const totalPages = Math.ceil(filteredSettlements.length / itemsPerPage);

  const handleMarkPaid = async (settlementId: string) => {
    setActionLoading(settlementId);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/settlements/${settlementId}/paid`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ transactionId: `TXN-${Date.now()}` }),
      });
      if (!res.ok) throw new Error("Failed to mark settlement as paid");
      toast.success("Settlement marked as paid");
      setConfirmPayId(null);
      fetchSettlements();
    } catch (err: unknown) {
      toast.error("Failed", { description: getErrorMessage(err) });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    if (settlements.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    toast.success("Export started", { description: "Settlement report will be downloaded shortly." });
    
    const csvHeader = [
      "Settlement ID",
      "Vendor Name",
      "Vendor Phone",
      "Period",
      "Cycle",
      "Gross Amount",
      "Commission Amount",
      "Commission Rate",
      "Tax Deducted",
      "Deductions/Penalties",
      "Net Payout",
      "Status",
      "Payment Mode",
      "Transaction ID",
      "Created At"
    ].join(",");

    const csvRows = settlements.map(s => {
      return [
        s.id,
        `"${s.vendorName.replace(/"/g, '""')}"`,
        s.vendorPhone,
        `"${(s.period || "").replace(/"/g, '""')}"`,
        s.settlementCycle || "Weekly",
        s.grossAmount,
        s.commissionAmount,
        `${s.commissionRate}%`,
        s.taxDeducted,
        s.deductions,
        s.netPayout,
        s.status,
        s.paymentMode,
        s.transactionId || "—",
        new Date(s.createdAt).toLocaleString()
      ].join(",");
    });

    const csvContent = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `settlements_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats dynamically from the mapped data to ensure accuracy
  const displayStats = useMemo(() => {
    const pending = settlements.filter((s) => s.status.toLowerCase() === "pending" || s.status.toLowerCase() === "processing");
    const paid = settlements.filter((s) => s.status.toLowerCase() === "paid");
    const failed = settlements.filter((s) => s.status.toLowerCase() === "failed");
    return {
      totalPending: pending.reduce((sum, s) => sum + (s.netPayout || 0), 0),
      totalPaid: paid.reduce((sum, s) => sum + (s.netPayout || 0), 0),
      totalCommission: settlements.reduce((sum, s) => sum + (s.commissionAmount || 0), 0),
      avgCommissionRate: settlements.length > 0 ? settlements.reduce((sum, s) => sum + (s.commissionRate || 0), 0) / settlements.length : 0,
      failedCount: failed.length,
      upcomingForecast: pending.reduce((sum, s) => sum + (s.netPayout || 0), 0) * 1.2, // Projection
      settlementCount: settlements.length,
    };
  }, [stats, settlements]);

  if (isLoading && settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading settlements...</p>
      </div>
    );
  }

  if (error && settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Settlements</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Button onClick={fetchSettlements} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl">
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
          <h1 className="text-3xl text-black font-bold tracking-tight">Financial Settlements</h1>
          <p className="text-slate-500 mt-1">Manage vendor payouts and commissions</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Report
          </Button>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50"><Clock className="h-5 w-5 text-amber-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payout Due</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{formatINR(displayStats.totalPending)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-50"><IndianRupee className="h-5 w-5 text-purple-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commission Earned</span>
          </div>
          <p className="text-xl font-bold text-purple-600">{formatINR(displayStats.totalCommission)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50"><Check className="h-5 w-5 text-emerald-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlements Completed</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatINR(displayStats.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Working Capital (Next 7d)</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{formatINR(displayStats.upcomingForecast)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-red-50"><XCircle className="h-5 w-5 text-red-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed Transactions</span>
          </div>
          <p className="text-xl font-bold text-red-600">{displayStats.failedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
          <Input
            placeholder="Search by vendor or settlement ID..."
            className="pl-10 bg-slate-50 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-xl">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="w-10 pl-4 py-4"><input type="checkbox" className="rounded" /></TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">ID & Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Vendor</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Period & Age</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Gross & Comm</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Tax & Deductions</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Net Payout</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Status & Mode</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSettlements.length > 0 ? paginatedSettlements.map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50">
                <TableCell className="w-10 pl-4"><input type="checkbox" className="rounded border-slate-300" /></TableCell>
                <TableCell className="py-4">
                  <p className="font-bold text-slate-900 text-xs">{s.transactionId || s.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-[9px] text-slate-400 capitalize">{s.settlementCycle || "standard"} Cycle</p>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">{s.vendorName}</p>
                    {s.vendorPhone && <p className="text-[10px] text-slate-400">{s.vendorPhone}</p>}
                    <p className="text-[9px] text-[#3E8940] mt-0.5">Margin: {Math.round((s.netPayout / (s.grossAmount || 1)) * 100)}%</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-slate-600 text-xs">{s.period || formatDate(s.createdAt)}</p>
                  {s.status.toLowerCase() === "pending" && (
                    <p className={`text-[9px] font-bold mt-0.5 ${(s.daysPending ?? 0) > 7 ? 'text-red-500' : (s.daysPending ?? 0) > 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                      {(s.daysPending ?? 0) > 0 ? `Pending ${s.daysPending ?? 0} days` : 'Added today'}
                      {s.daysPending > 7 && ' ⚠️'}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{formatINR(s.grossAmount)}</span>
                    <span className="text-red-600 font-medium text-[10px]">-{formatINR(s.commissionAmount)} ({s.commissionRate}%)</span>
                    <p className="text-[9px] text-slate-400">{s.orderCount} Orders</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-orange-600 font-medium text-[10px]">-{formatINR(s.commissionAmount * 0.18)}</span>
                      <span className="text-[9px] text-slate-400">GST</span>
                    </div>
                    {s.taxDeducted > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-orange-600 font-medium text-[10px]">-{formatINR(s.taxDeducted)}</span>
                        <span className="text-[9px] text-slate-400">TDS (1%)</span>
                      </div>
                    )}
                    {s.deductions > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-red-600 font-medium text-[10px]">-{formatINR(s.deductions)}</span>
                        <span className="text-[9px] text-slate-400">Penalties</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#3E8940] text-xs">{formatINR(s.netPayout)}</span>
                    <p className="text-[9px] text-slate-400 mt-0.5">Invoice Gen.</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <Badge className={`${getStatusColor(s.status)} border-none font-bold text-[9px] px-1.5 py-0`}>
                      {s.status}
                    </Badge>
                    <p className="text-[9px] text-slate-500 font-medium">{s.paymentMode}</p>
                    <div className="flex items-center gap-1 text-[8px] text-slate-400">
                      {s.isAutoReconciled ? <CheckCircle className="h-2 w-2 text-emerald-500" /> : <AlertTriangle className="h-2 w-2 text-amber-500" />}
                      {s.isAutoReconciled ? "Auto Reconciled" : "Manual Adj."}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-xs cursor-pointer font-medium" 
                        onClick={() => router.push(`/finance/settlements/${s.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4 text-slate-400" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-xs cursor-pointer font-medium text-blue-600"
                        onClick={() => {
                          const csvHeader = "Field,Value\n";
                          const data = [
                            ["Settlement ID", s.id],
                            ["Vendor", s.vendorName],
                            ["Phone", s.vendorPhone],
                            ["Period", s.period || "—"],
                            ["Cycle", s.settlementCycle || "Weekly"],
                            ["Gross Amount", s.grossAmount],
                            ["Commission Amount", s.commissionAmount],
                            ["Tax (GST/TDS)", s.taxDeducted],
                            ["Penalties", s.deductions],
                            ["Net Payout", s.netPayout],
                            ["Status", s.status],
                            ["Date", new Date(s.createdAt).toLocaleString()]
                          ].map(row => row.join(",")).join("\n");
                          
                          const blob = new Blob([csvHeader + data], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `invoice_${s.id.slice(0, 8)}.csv`;
                          link.click();
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download Invoice
                      </DropdownMenuItem>
                      {s.status.toLowerCase() === "pending" || s.status.toLowerCase() === "processing" ? (
                        <>
                          <DropdownMenuSeparator />
                          {s.hasRisk ? (
                            <DropdownMenuItem className="text-xs cursor-pointer font-medium text-red-600" disabled>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Payment On Hold
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-xs cursor-pointer font-medium text-[#3E8940]"
                              onClick={() => setConfirmPayId(s.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-slate-500">No settlements found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSettlements.length)} - {Math.min(currentPage * itemsPerPage, filteredSettlements.length)} of {filteredSettlements.length} settlements
          </p>
          <div className="flex items-center gap-4">
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
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold bg-white text-[#3E8940] border-[#3E8940]/20 hover:bg-[#3E8940]/5">
              Process Bulk Payout
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Pay Dialog */}
      <Dialog open={!!confirmPayId} onOpenChange={() => setConfirmPayId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Confirm Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this settlement as paid? This action records the payout as completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setConfirmPayId(null)} className="rounded-xl">Cancel</Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white rounded-xl font-bold"
              onClick={() => confirmPayId && handleMarkPaid(confirmPayId)}
              disabled={actionLoading === confirmPayId}
            >
              {actionLoading === confirmPayId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettlementsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading settlements...</p>
      </div>
    }>
      <SettlementsContent />
    </Suspense>
  );
}
