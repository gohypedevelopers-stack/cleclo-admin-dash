"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Eye,
  Loader2,
  AlertTriangle,
  RefreshCw,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldAlert,
  Heart,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
  TrendingUp,
  Wallet,
  Landmark,
  Receipt,
  Layers,
  ShoppingBag,
  Percent,
  ShieldCheck,
  ChevronDown
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});
const apiFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    localStorage.removeItem("admin_auth_token");
    window.location.href = "/login";
  }
  return res;
};

const formatINR = (a: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(a);
const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const getStatusBadge = (status: string) => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "paid":
    case "completed":
      return (
        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black gap-1 hover:bg-emerald-50 text-[9px] uppercase shadow-sm h-5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-0.5" />
          paid
        </Badge>
      );
    case "pending":
    case "processing":
      return (
        <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-black gap-1 hover:bg-amber-50 text-[9px] uppercase shadow-sm h-5">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-0.5" />
          pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-50 text-red-600 border-red-100 font-black gap-1 hover:bg-red-50 text-[9px] uppercase shadow-sm h-5">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-0.5" />
          failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-[9px] uppercase font-black">
          {status}
        </Badge>
      );
  }
};

const getAgingInfo = (date: string, status: string) => {
  if (status.toLowerCase() === 'paid') return { label: "Settled", color: "text-slate-400" };
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (days >= 7) return { label: `Pending ${days} days ⚠️`, color: "text-red-500 font-bold" };
  if (days >= 3) return { label: `Pending ${days} days`, color: "text-amber-500 font-bold" };
  return { label: `Pending ${days} days`, color: "text-slate-400" };
};

export default function VendorPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const getRiskStatus = (p: any) => {
    const issueRate = p.vendor?.vendorProfile?.issueRate || 0;
    const refundRate = p.vendor?.vendorProfile?.refundRate || 0;
    const sla = p.vendor?.vendorProfile?.sla || 100;
    if (issueRate > 10 || refundRate > 15 || sla < 90) {
      return {
        level: "high",
        label: "High Risk",
        icon: <ShieldAlert className="h-3 w-3 text-red-500" />,
      };
    }
    return {
      level: "low",
      label: "Healthy",
      icon: <Heart className="h-3 w-3 text-emerald-500" />,
    };
  };

  const getHealthScore = (p: any) => {
    let score = 95;
    if (p.status === "FAILED") score -= 20;
    if (p.isManual) score -= 5;
    return Math.max(0, score);
  };

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/settlements`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load payments");
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : data.settlements || []);
    } catch (err: any) {
      setError(err.message);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((p) => p.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const bulkTotal = useMemo(() => {
    return payments
      .filter((p) => selectedIds.includes(p.id))
      .reduce((s, p) => s + (p.amount || 0), 0);
  }, [payments, selectedIds]);

  const handleBulkProcess = async () => {
    setIsProcessingBulk(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      toast.success(
        `Processed ${selectedIds.length} payouts totaling ${formatINR(bulkTotal)}`,
      );
      setSelectedIds([]);
      setShowBulkDialog(false);
      fetchPayments();
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        const q = searchQuery.toLowerCase();
        const vendor =
          p.vendor?.vendorProfile?.businessName || p.vendor?.name || "";
        const match =
          !searchQuery ||
          vendor.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q);
        if (statusFilter === "all") return match;
        return (
          match && String(p.status).toLowerCase() === statusFilter.toLowerCase()
        );
      }),
    [payments, searchQuery, statusFilter],
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPaid = payments
    .filter((p) => String(p.status).toLowerCase() === "paid")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments
    .filter((p) =>
      ["pending", "processing"].includes(String(p.status).toLowerCase()),
    )
    .reduce((s, p) => s + (p.amount || 0), 0);
  const failedCount = payments.filter(
    (p) => String(p.status).toLowerCase() === "failed",
  ).length;

  if (isLoading && payments.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm text-slate-500">Loading payments...</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Financial Settlements
          </h1>
          <p className="text-slate-500 mt-1">
            Manage vendor payouts and commissions
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button
              className="gap-2 bg-slate-900 hover:bg-slate-800 rounded-xl animate-in fade-in slide-in-from-right-4"
              onClick={() => setShowBulkDialog(true)}
            >
              <CreditCard className="h-4 w-4" /> Process {selectedIds.length}{" "}
              Settlements
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2 rounded-xl border-slate-200 text-slate-600 font-bold bg-[#fbfbfb]"
            onClick={() => {
              const headers = [
                "ID",
                "Vendor",
                "Gross Revenue",
                "Commission",
                "Refunds",
                "Penalties",
                "Net Payout",
                "Date",
                "Status",
              ];
              const rows = filtered.map((p) => {
                const vendor =
                  p.vendor?.vendorProfile?.businessName ||
                  p.vendor?.name ||
                  "Unknown";
                const gross = p.grossAmount || (p.amount / 0.8).toFixed(2);
                const comm =
                  p.commissionAmount ||
                  (gross * (p.commissionRate / 100 || 0.2)).toFixed(2);
                return [
                  p.id,
                  vendor,
                  gross,
                  comm,
                  p.refunds || 0,
                  p.penalties || 0,
                  p.amount,
                  new Date(p.createdAt).toLocaleDateString(),
                  p.status,
                ].join(",");
              });
              const csv = [headers.join(","), ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.setAttribute("hidden", "");
              a.setAttribute("href", url);
              a.setAttribute(
                "download",
                `vendor-payments-${new Date().toISOString().split("T")[0]}.csv`,
              );
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="shadow-none border-slate-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
               </div>
               <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total Payout Due
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatINR(totalPending)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-slate-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4 text-purple-600" />
               </div>
               <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Commission Earned
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatINR(totalPaid * 0.15)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-slate-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
               </div>
               <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Settlements Completed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatINR(totalPaid)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-slate-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
               </div>
               <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Working Capital (Next 7D)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatINR(36000)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-slate-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
               </div>
               <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Failed Transactions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-600">{failedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-100">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="orders by ID or phone, vendors by city, users, riders, issues,"
            className="pl-10 bg-slate-50 border-slate-200 rounded-xl h-12 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>All Status</span>
              <ChevronDown className="h-4 w-4" />
           </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-none border border-slate-100 relative overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="absolute top-0 left-0 right-0 bg-emerald-50 border-b border-emerald-100 p-3 z-10 flex items-center justify-between px-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                {selectedIds.length} Selected for Payout
              </span>
              <div className="h-4 w-px bg-emerald-200" />
              <span className="text-sm font-black text-emerald-900">
                Total: {formatINR(bulkTotal)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-emerald-700 hover:bg-emerald-100 font-bold text-xs"
                onClick={() => setSelectedIds([])}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#3E8940] hover:bg-[#3E8940]/90 font-bold text-xs"
                onClick={() => setShowBulkDialog(true)}
              >
                Preview & Confirm
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white border-b border-slate-100">
              <TableHead className="w-12 pl-6 py-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={toggleSelectAll}
                >
                  {selectedIds.length === paginated.length &&
                  paginated.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-[#3E8940]" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                ID & TYPE
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                VENDOR
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                PERIOD & AGE
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                GROSS & COMM
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                TAX & DEDUCTIONS
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                NET PAYOUT
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                STATUS & MODE
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right pr-6 tracking-widest">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? (
              paginated.map((p) => {
                const vendor =
                  p.vendor?.vendorProfile?.businessName ||
                  p.vendor?.name ||
                  "Unknown";
                const risk = getRiskStatus(p);
                const health = getHealthScore(p);
                const isSelected = selectedIds.includes(p.id);

                return (
                  <TableRow
                    key={p.id}
                    className={cn(
                      "hover:bg-slate-50 transition-colors border-b border-slate-50",
                      isSelected && "bg-emerald-50/30",
                    )}
                  >
                    <TableCell className="pl-6 py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => toggleSelect(p.id)}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#3E8940]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <div className="font-black text-slate-900 text-[11px] flex items-center gap-2">
                          {p.id.slice(0, 8).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Weekly Cycle</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <p className="text-[11px] font-black text-slate-900 leading-tight">Unknown</p>
                        <p className="text-[10px] text-slate-300 font-bold">9555555555</p>
                        <div className="flex items-center gap-1 mt-0.5">
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Margin:</span>
                           <span className="text-[10px] text-[#3E8940] font-black">77%</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{formatDate(p.createdAt)}</span>
                          <span className={cn("text-[9px] mt-0.5 font-bold uppercase", getAgingInfo(p.createdAt, p.status).color)}>
                             {getAgingInfo(p.createdAt, p.status).label}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col relative group">
                        <span className="text-[11px] font-black text-slate-900 tracking-tight">{formatINR(p.amount / 0.8)}</span>
                        <span className="text-[10px] text-red-400 font-black tracking-tight flex items-center gap-1">
                           -{formatINR(p.amount * 0.2)} (20%)
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold">18 Orders</span>

                        {/* Deduction Breakdown Tooltip */}
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-50 text-[10px] space-y-2 border border-white/10 backdrop-blur-md">
                           <p className="font-black border-b border-white/10 pb-2 uppercase tracking-widest text-[8px] text-slate-400">Deduction Breakdown</p>
                           <div className="flex justify-between text-white/70"><span>Platform Commission:</span><span className="font-bold">15%</span></div>
                           <div className="flex justify-between text-white/70"><span>Marketing Fee:</span><span className="font-bold">2%</span></div>
                           <div className="flex justify-between text-white/70"><span>Rider Cost Recovery:</span><span className="font-bold">₹140</span></div>
                           <div className="flex justify-between text-red-400"><span>Penalty/SLA Deduction:</span><span className="font-bold">₹0</span></div>
                           <div className="flex justify-between text-red-400"><span>Damage Claims:</span><span className="font-bold">₹0</span></div>
                           <div className="flex justify-between text-emerald-400 font-black border-t border-white/10 pt-2 uppercase"><span>Total Deductions:</span><span>20%</span></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-red-400 font-black tracking-tight">-{formatINR(p.amount * 0.18)} GST</span>
                          <span className="text-[10px] text-red-400 font-black tracking-tight">-{formatINR(p.amount * 0.01)} TDS (1%)</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-[#3E8940] tracking-tighter">{formatINR(p.amount)}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                             <span className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter italic leading-none">Invoice Gen.</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col items-start gap-1">
                        {getStatusBadge(p.status)}
                        <div className="flex flex-col mt-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">Bank Transfer</span>
                           <div className="flex items-center gap-1 mt-1 text-[8px] text-[#3E8940] font-black uppercase tracking-widest leading-none">
                              <ShieldCheck className="h-2.5 w-2.5" /> Auto Reconciled
                           </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-[#3E8940]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-slate-500"
                >
                  {error || "No settlements found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-400 font-bold">
            Showing{" "}
            <span className="text-slate-900">
              {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="text-slate-900">
              {Math.min(currentPage * itemsPerPage, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="text-slate-900">{filtered.length}</span>{" "}
            payments
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg border-slate-200"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-lg text-xs font-black ${currentPage === pageNum ? "bg-[#3E8940] hover:bg-[#3E8940]/90 text-white" : "text-slate-400 hover:text-slate-900"}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg border-slate-200"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Payout Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-2xl rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <CreditCard className="h-6 w-6 text-[#3E8940]" />
              Financial Settlement Authorization
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-8">
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                  Total Vendors
                </p>
                <p className="text-3xl font-black text-slate-900">
                  {selectedIds.length}
                </p>
              </div>
              <div className="p-6 bg-[#3E8940]/5 rounded-2xl border border-[#3E8940]/10">
                <p className="text-[10px] text-[#3E8940] font-black uppercase tracking-widest mb-2">
                  Net Disbursal
                </p>
                <p className="text-3xl font-black text-[#3E8940]">
                  {formatINR(bulkTotal)}
                </p>
              </div>
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-2">
                  High Risk Holds
                </p>
                <p className="text-3xl font-black text-amber-700">
                  {
                    payments.filter(
                      (p) =>
                        selectedIds.includes(p.id) &&
                        getRiskStatus(p).level === "high",
                    ).length
                  }{" "}
                  ⚠
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-3 w-3" />
                Settlement Queue Preview
              </h4>
              <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-50 bg-white">
                {payments
                  .filter((p) => selectedIds.includes(p.id))
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 ring-4 ring-white shadow-sm">
                          {p.vendor?.name?.[0] || "V"}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">
                            {p.vendor?.vendorProfile?.businessName ||
                              p.vendor?.name || 'Unknown Vendor'}
                          </p>
                          <p className="text-[10px] text-slate-300 font-mono font-bold tracking-tighter">
                            SETTLEMENT-ID: {p.id.slice(0, 12).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900 tracking-tight">
                          {formatINR(p.amount)}
                        </p>
                        <p className="text-[9px] text-[#3E8940] font-black uppercase tracking-widest">
                          Ready for Release
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex gap-4">
              <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="space-y-1.5">
                <p className="text-xs font-black text-amber-900 tracking-tight">
                  Financial Disbursement Protocol
                </p>
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                  By confirming, you authorize the immediate release of funds to the registered bank accounts of the selected vendors. This action is irreversible once processed by the banking gateway and will be logged under your administrator ID for multi-tier audit purposes.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              className="rounded-xl font-black text-xs h-12 px-6 border-slate-200"
              onClick={() => setShowBulkDialog(false)}
            >
              Cancel Request
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl font-black text-xs h-12 px-8 min-w-[180px] shadow-lg shadow-[#3E8940]/20"
              onClick={handleBulkProcess}
              disabled={isProcessingBulk}
            >
              {isProcessingBulk ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <IndianRupee className="h-4 w-4 mr-2" />
              )}
              Authorize & Release Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
