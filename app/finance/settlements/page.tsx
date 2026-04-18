"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  XCircle,
  ArrowRight,
  BarChart3,
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

interface SettlementStats {
  totalPending: number;
  totalPaid: number;
  totalCommission: number;
  avgCommissionRate: number;
  settlementCount: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Paid": case "PAID": return "bg-emerald-100 text-emerald-700";
    case "Pending": case "PENDING": return "bg-amber-100 text-amber-700";
    case "Processing": case "PROCESSING": return "bg-blue-100 text-blue-700";
    case "Failed": case "FAILED": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      setSettlements(Array.isArray(settData) ? settData : settData.settlements || []);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        s.vendorName?.toLowerCase().includes(searchLower) ||
        s.id?.toLowerCase().includes(searchLower) ||
        s.transactionId?.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === "all" || s.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [settlements, searchQuery, statusFilter]);

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
    } catch (err: any) {
      toast.error("Failed", { description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    toast.success("Export started", { description: "Settlement report will be downloaded shortly." });
  };

  // Compute stats from data if API stats not available
  const displayStats = useMemo(() => {
    if (stats) return stats;
    const pending = settlements.filter((s) => s.status.toLowerCase() === "pending");
    const paid = settlements.filter((s) => s.status.toLowerCase() === "paid");
    return {
      totalPending: pending.reduce((sum, s) => sum + (s.netPayout || 0), 0),
      totalPaid: paid.reduce((sum, s) => sum + (s.netPayout || 0), 0),
      totalCommission: settlements.reduce((sum, s) => sum + (s.commissionAmount || 0), 0),
      avgCommissionRate: settlements.length > 0 ? settlements.reduce((sum, s) => sum + (s.commissionRate || 0), 0) / settlements.length : 0,
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
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50"><Clock className="h-5 w-5 text-amber-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payouts</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatINR(displayStats.totalPending)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50"><Check className="h-5 w-5 text-emerald-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatINR(displayStats.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-50"><IndianRupee className="h-5 w-5 text-purple-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commission Earned</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{formatINR(displayStats.totalCommission)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Commission</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{displayStats.avgCommissionRate.toFixed(1)}%</p>
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
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 pl-6 tracking-wider">ID</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Vendor</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Period</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Orders</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Gross</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Commission</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Deductions</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Net Payout</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 tracking-wider">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 text-right pr-6 tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSettlements.length > 0 ? filteredSettlements.map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50">
                <TableCell className="font-bold text-slate-900 py-4 pl-6 text-xs">
                  {s.transactionId || s.id.slice(0, 8).toUpperCase()}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">{s.vendorName}</p>
                    {s.vendorPhone && <p className="text-[10px] text-slate-400">{s.vendorPhone}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 text-xs">{s.period || formatDate(s.createdAt)}</TableCell>
                <TableCell className="text-xs font-medium">{s.orderCount}</TableCell>
                <TableCell className="text-xs">{formatINR(s.grossAmount)}</TableCell>
                <TableCell className="text-red-600 text-xs font-medium">
                  -{formatINR(s.commissionAmount)}
                  <span className="text-[9px] text-slate-400 ml-1">({s.commissionRate}%)</span>
                </TableCell>
                <TableCell className="text-xs">
                  {s.deductions > 0 ? (
                    <span className="text-orange-600 font-medium">-{formatINR(s.deductions)}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="font-bold text-[#3E8940] text-xs">{formatINR(s.netPayout)}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(s.status)} border-none font-bold text-[10px] gap-1`}>
                    {s.status.toLowerCase() === "paid" && <Check className="h-3 w-3" />}
                    {s.status.toLowerCase() === "pending" && <Clock className="h-3 w-3" />}
                    {s.status.toLowerCase() === "failed" && <XCircle className="h-3 w-3" />}
                    {s.status}
                  </Badge>
                  {s.failureReason && (
                    <p className="text-[9px] text-red-500 mt-0.5 italic">{s.failureReason}</p>
                  )}
                </TableCell>
                <TableCell className="text-right pr-6">
                  {s.status.toLowerCase() === "pending" || s.status.toLowerCase() === "processing" ? (
                    <Button
                      size="sm"
                      className="bg-[#3E8940] hover:bg-[#3E8940]/90 h-7 text-[10px] font-bold rounded-lg"
                      onClick={() => setConfirmPayId(s.id)}
                      disabled={actionLoading === s.id}
                    >
                      {actionLoading === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Paid"}
                    </Button>
                  ) : (
                    <span className="text-[10px] text-slate-400">{formatDate(s.paidAt)}</span>
                  )}
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
          <p className="text-sm text-slate-500">Showing {filteredSettlements.length} of {settlements.length} settlements</p>
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
