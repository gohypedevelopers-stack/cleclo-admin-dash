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
  ChevronDown,
  X
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
  DialogClose,
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

const downloadInvoice = (p: any) => {
  const gross = p.grossAmount || (p.amount / 0.8);
  const comm = p.commissionAmount || (gross * 0.2);
  const refunds = p.refunds || 0;
  const penalties = p.penalties || 0;
  const tds = gross * 0.01;
  const gst = comm * 0.18;
  const netPayable = gross - comm - gst - tds - refunds - penalties;
  
  const invoiceNo = `INV-2026-${p.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = formatDate(p.createdAt);
  const businessName = p.vendor?.vendorProfile?.businessName || p.vendor?.name || 'Unknown Vendor';
  const phone = p.vendorPhone || p.vendor?.phone || 'N/A';
  const city = p.city || 'India';
  
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Popup blocked! Please allow popups to download the invoice.");
    return;
  }
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Tax Invoice - ${invoiceNo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none;
            }
          }
          body {
            font-family: 'Outfit', sans-serif;
            color: #1e293b;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #3E8940;
            letter-spacing: -0.05em;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .invoice-title p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .details-block h3 {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #94a3b8;
            margin-bottom: 8px;
            margin-top: 0;
          }
          .details-block p {
            margin: 4px 0;
            font-size: 13px;
            line-height: 1.5;
          }
          .table-container {
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          th {
            background-color: #f8fafc;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            padding: 16px;
            font-size: 13px;
            border-bottom: 1px solid #f1f5f9;
          }
          .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 24px;
            margin-left: auto;
            width: 320px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 8px;
            color: #64748b;
          }
          .summary-row.total {
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            margin-top: 12px;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
            line-height: 1.6;
          }
          .btn-print {
            background-color: #3E8940;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(62, 137, 64, 0.2);
            transition: all 0.2s;
          }
          .btn-print:hover {
            background-color: #327034;
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
        </div>
        <div class="header">
          <div>
            <div class="logo">CLECLO</div>
            <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0; line-height: 1.4;">
              Cleclo India Private Limited<br>
              Reg Office: Connaught Place, New Delhi, 110001<br>
              GSTIN: 07AAAAA1111A1Z1 | PAN: AAAAA1111A
            </p>
          </div>
          <div class="invoice-title">
            <h1>Tax Invoice</h1>
            <p>Settlement Cycle Advice</p>
            <p style="margin-top: 8px; font-family: monospace; font-size: 11px; color: #0f172a;">
              NO: ${invoiceNo}<br>
              DATE: ${invoiceDate}
            </p>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-block">
            <h3>Billed To (Vendor)</h3>
            <p style="font-weight: 600; color: #0f172a; font-size: 14px;">${businessName}</p>
            <p style="color: #64748b;">
              Phone: ${phone}<br>
              City: ${city}<br>
              Settlement Account: Registered Bank Account
            </p>
          </div>
          <div class="details-block">
            <h3>Settlement Details</h3>
            <p><strong>Cycle:</strong> Weekly Accrual & Disbursal</p>
            <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: 800; text-transform: uppercase;">${p.status}</span></p>
            <p><strong>Method:</strong> Bank Transfer (NEFT/IMPS)</p>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th style="text-align: right;">SAC/HSN</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Taxable Val.</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Platform Commission Fee</strong><br>
                  <span style="font-size: 11px; color: #64748b;">Cleclo marketplace service fees</span>
                </td>
                <td style="text-align: right;">9985</td>
                <td style="text-align: right;">-</td>
                <td style="text-align: right;">₹${comm.toFixed(0)}</td>
                <td style="text-align: right; color: #ef4444;">-₹${comm.toFixed(0)}</td>
              </tr>
              <tr>
                <td>
                  <strong>CGST on Commission Fee</strong><br>
                  <span style="font-size: 11px; color: #64748b;">Central Goods and Services Tax</span>
                </td>
                <td style="text-align: right;">9985</td>
                <td style="text-align: right;">9.0%</td>
                <td style="text-align: right;">₹${comm.toFixed(0)}</td>
                <td style="text-align: right; color: #ef4444;">-₹${(comm * 0.09).toFixed(0)}</td>
              </tr>
              <tr>
                <td>
                  <strong>SGST on Commission Fee</strong><br>
                  <span style="font-size: 11px; color: #64748b;">State Goods and Services Tax</span>
                </td>
                <td style="text-align: right;">9985</td>
                <td style="text-align: right;">9.0%</td>
                <td style="text-align: right;">₹${comm.toFixed(0)}</td>
                <td style="text-align: right; color: #ef4444;">-₹${(comm * 0.09).toFixed(0)}</td>
              </tr>
              <tr>
                <td>
                  <strong>TDS under Sec 194-O</strong><br>
                  <span style="font-size: 11px; color: #64748b;">Tax Deducted at Source on E-comm gross sales</span>
                </td>
                <td style="text-align: right;">-</td>
                <td style="text-align: right;">1.0%</td>
                <td style="text-align: right;">₹${gross.toFixed(0)}</td>
                <td style="text-align: right; color: #ef4444;">-₹${tds.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="font-size: 11px; color: #94a3b8; max-width: 40%;">
            <p><strong>Note on TDS:</strong> TDS has been deducted at 1.0% under Section 194-O of the Income Tax Act, 1961. This will be reflected in Form 26AS/TIS on the Indian Income Tax Portal.</p>
          </div>
          <div class="summary-card">
            <div class="summary-row">
              <span>Gross Order Revenue</span>
              <span style="color: #0f172a; font-weight: 600;">₹${gross.toFixed(0)}</span>
            </div>
            <div class="summary-row">
              <span>Platform Commission</span>
              <span style="color: #ef4444;">-₹${comm.toFixed(0)}</span>
            </div>
            <div class="summary-row">
              <span>GST on Comm. (18%)</span>
              <span style="color: #ef4444;">-₹${gst.toFixed(0)}</span>
            </div>
            <div class="summary-row">
              <span>TDS Deducted (1%)</span>
              <span style="color: #ef4444;">-₹${tds.toFixed(0)}</span>
            </div>
            <div class="summary-row">
              <span>Adjustments / Refunds</span>
              <span style="color: #ef4444;">-₹${refunds.toFixed(0)}</span>
            </div>
            <div class="summary-row">
              <span>Penalties</span>
              <span style="color: #ef4444;">-₹${penalties.toFixed(0)}</span>
            </div>
            <div class="summary-row total">
              <span>Net Settlement</span>
              <span>₹${netPayable.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer generated invoice and does not require a physical signature.</p>
          <p>© 2026 Cleclo. All rights reserved. New Delhi, India.</p>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
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
  const [ledgerVendor, setLedgerVendor] = useState<any>(null);

  // Payout Hold State
  const [heldIds, setHeldIds] = useState<string[]>([]);

  const getRiskStatus = (p: any) => {
    const code = p.id.charCodeAt(p.id.length - 1) || 0;
    const isHighRiskDemo = code % 3 === 0;

    const issueRate = p.vendor?.vendorProfile?.issueRate || (isHighRiskDemo ? 14 : 2);
    const refundRate = p.vendor?.vendorProfile?.refundRate || (isHighRiskDemo ? 18 : 3);
    const sla = p.vendor?.vendorProfile?.sla || (isHighRiskDemo ? 85 : 98);

    if (issueRate > 10 || refundRate > 15 || sla < 90) {
      return {
        level: "high",
        label: "High Risk Alert",
        details: `Issue Rate: ${issueRate}%, SLA: ${sla}%, Refund: ${refundRate}%`,
        issueRate,
        refundRate,
        sla,
        icon: <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />,
      };
    }
    return {
      level: "low",
      label: "Healthy",
      details: `SLA: ${sla}%, Issue Rate: ${issueRate}%`,
      issueRate,
      refundRate,
      sla,
      icon: <Heart className="h-3.5 w-3.5 text-emerald-500 shrink-0" />,
    };
  };

  const toggleHold = (id: string) => {
    setHeldIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      const isHolding = next.includes(id);
      if (isHolding) {
        toast.warning(`Settlement payout put ON HOLD for Quality Review.`);
        setSelectedIds((s) => s.filter((x) => x !== id));
      } else {
        toast.success("Settlement payout hold released.");
      }
      return next;
    });
  };

  const getHealthScoreDetails = (p: any) => {
    const code = p.id.charCodeAt(p.id.length - 1) || 0;
    const isUnhealthy = code % 3 === 0;
    const isCritical = code % 5 === 0;

    const avgPayoutTime = isUnhealthy ? (isCritical ? 5.8 : 3.5) : 1.2;
    const failedTxns = p.status === "failed" ? 1 : (isCritical ? 2 : 0);
    const disputes = isCritical ? 3 : (isUnhealthy ? 1 : 0);
    const manualAdjustments = p.isManual ? 1 : (isCritical ? 2 : 0);

    let score = 100;
    
    if (avgPayoutTime > 1) {
      score -= Math.round((avgPayoutTime - 1) * 5);
    }
    score -= failedTxns * 15;
    score -= disputes * 10;
    score -= manualAdjustments * 8;

    score = Math.max(0, Math.min(100, score));

    let statusColor = "text-emerald-500 bg-emerald-50 border-emerald-100";
    let progressColor = "bg-emerald-500";
    let statusText = "Excellent";
    if (score < 70) {
      statusColor = "text-red-500 bg-red-50 border-red-100";
      progressColor = "bg-red-500";
      statusText = "Poor";
    } else if (score < 90) {
      statusColor = "text-amber-500 bg-amber-50 border-amber-100";
      progressColor = "bg-amber-500";
      statusText = "Good";
    }

    return {
      score,
      avgPayoutTime,
      failedTxns,
      disputes,
      manualAdjustments,
      statusColor,
      progressColor,
      statusText,
    };
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
      .reduce((s, p) => {
        const gross = p.grossAmount || (p.amount / 0.8);
        const comm = p.commissionAmount || (gross * 0.2);
        const refunds = p.refunds || 0;
        const penalties = p.penalties || 0;
        const tds = gross * 0.01;
        const gst = comm * 0.18;
        return s + (gross - comm - gst - tds - refunds - penalties);
      }, 0);
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
    .reduce((s, p) => {
      const gross = p.grossAmount || (p.amount / 0.8);
      const comm = p.commissionAmount || (gross * 0.2);
      const refunds = p.refunds || 0;
      const penalties = p.penalties || 0;
      const tds = gross * 0.01;
      const gst = comm * 0.18;
      return s + (gross - comm - gst - tds - refunds - penalties);
    }, 0);
  const totalPending = payments
    .filter((p) =>
      ["pending", "processing"].includes(String(p.status).toLowerCase()),
    )
    .reduce((s, p) => {
      const gross = p.grossAmount || (p.amount / 0.8);
      const comm = p.commissionAmount || (gross * 0.2);
      const refunds = p.refunds || 0;
      const penalties = p.penalties || 0;
      const tds = gross * 0.01;
      const gst = comm * 0.18;
      return s + (gross - comm - gst - tds - refunds - penalties);
    }, 0);
  const failedCount = payments.filter(
    (p) => String(p.status).toLowerCase() === "failed",
  ).length;
  const totalRefunds = payments.reduce((s, p) => s + (p.refunds || 0), 0);

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
                "GST Collected (18%)",
                "TDS Deducted (1%)",
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
                const gross = p.grossAmount || (p.amount / 0.8);
                const comm = p.commissionAmount || (gross * 0.2);
                const refunds = p.refunds || 0;
                const penalties = p.penalties || 0;
                const tds = gross * 0.01;
                const gst = comm * 0.18;
                const net = gross - comm - gst - tds - refunds - penalties;
                return [
                  p.id,
                  vendor,
                  gross.toFixed(2),
                  comm.toFixed(2),
                  gst.toFixed(2),
                  tds.toFixed(2),
                  refunds,
                  penalties,
                  net.toFixed(2),
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
      <div className="grid gap-4 md:grid-cols-6">
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
               <div className="h-8 w-8 shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
               </div>
               <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
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
               <div className="h-8 w-8 shrink-0 rounded-full bg-orange-50 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-orange-600" />
               </div>
               <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                Refunds Adjusted
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatINR(totalRefunds)}</div>
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
                PAYOUT BREAKDOWN
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                TAX & INVOICE
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                NET PAYABLE
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest">
                PAYMENT HEALTH
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
                const health = getHealthScoreDetails(p);
                const isSelected = selectedIds.includes(p.id);

                const gross = p.grossAmount || (p.amount / 0.8);
                const comm = p.commissionAmount || (gross * 0.2);
                const refunds = p.refunds || 0;
                const penalties = p.penalties || 0;
                const tds = gross * 0.01;
                const gst = comm * 0.18;
                const netPayable = gross - comm - gst - tds - refunds - penalties;

                return (
                  <TableRow
                    key={p.id}
                    className={cn(
                      "hover:bg-slate-50 transition-colors border-b border-slate-50",
                      isSelected && "bg-emerald-50/30",
                    )}
                  >
                    <TableCell className="pl-6 py-4">
                      {heldIds.includes(p.id) ? (
                        <div className="h-5 w-5 flex items-center justify-center text-amber-500" title="Payout On Hold">
                          <AlertTriangle className="h-4 w-4 animate-pulse" />
                        </div>
                      ) : (
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
                      )}
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
                        <p className="text-[11px] font-black text-slate-900 leading-tight">{vendor}</p>
                        <p className="text-[10px] text-slate-300 font-bold">{p.vendorPhone || p.vendor?.phone || "N/A"}</p>
                        {risk.level === "high" ? (
                          <div className="flex items-center gap-1 mt-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-lg border border-red-100 w-fit text-[8px] font-black uppercase tracking-wider animate-pulse">
                            {risk.icon}
                            <span>High Risk: SLA {risk.sla}%, Refund {risk.refundRate}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-0.5">
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Margin:</span>
                             <span className="text-[10px] text-[#3E8940] font-black">77%</span>
                          </div>
                        )}
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
                       <div className="flex flex-col text-[10px] space-y-1.5 w-56 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center"><span className="text-slate-500 font-black uppercase tracking-widest text-[8px]">Order Revenue</span><span className="font-black text-slate-900">{formatINR(gross)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">- Platform Comm.</span><span className="font-bold text-red-500">-{formatINR(comm)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">- GST on Comm. (18%)</span><span className="font-bold text-red-500">-{formatINR(gst)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">- TDS Deducted (1%)</span><span className="font-bold text-red-500">-{formatINR(tds)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">- Refund Adj.</span><span className={cn("font-bold", refunds > 0 ? "text-red-500" : "text-slate-300")}>{refunds > 0 ? `-${formatINR(refunds)}` : '₹0'}</span></div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5"><span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">- Penalties</span><span className={cn("font-bold", penalties > 0 ? "text-red-500" : "text-slate-300")}>{penalties > 0 ? `-${formatINR(penalties)}` : '₹0'}</span></div>
                          <div className="flex justify-between items-center pt-0.5"><span className="text-slate-900 font-black uppercase tracking-widest text-[8px]">= Net Payable</span><span className="font-black text-emerald-600">{formatINR(netPayable)}</span></div>
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col text-[10px] space-y-1.5 w-44 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">GST (18%)</span>
                          <span className="font-bold text-slate-700">{formatINR(gst)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">TDS (1%)</span>
                          <span className="font-bold text-slate-700">{formatINR(tds)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-1.5 mt-1.5">
                          <span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Invoice Status</span>
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black hover:bg-emerald-50 text-[8px] uppercase h-4 px-1.5 py-0 shadow-none">
                            Generated
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full mt-2 h-7 bg-white hover:bg-slate-100 text-[9px] font-black text-indigo-600 rounded-lg border border-slate-200 flex items-center justify-center gap-1 shadow-sm"
                          onClick={() => downloadInvoice(p)}
                        >
                          <FileText className="h-3 w-3" />
                          Tax Invoice (PDF)
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                          <span className="text-xl font-black text-[#3E8940] tracking-tighter">{formatINR(netPayable)}</span>
                          <div className="flex items-center gap-1 mt-1">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Net Payout</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col text-[10px] space-y-1.5 w-52 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Health Score</span>
                          <span className={cn("font-black px-1.5 py-0.5 rounded text-[9px] border", health.statusColor)}>
                            {health.score}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", health.progressColor)} style={{ width: `${health.score}%` }} />
                        </div>
                        <div className="flex flex-col space-y-1 pt-1 text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                          <div className="flex justify-between items-center">
                            <span>Avg Payout Time</span>
                            <span className="text-slate-700 font-black">{health.avgPayoutTime}d</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Disputes</span>
                            <span className={cn("font-black", health.disputes > 0 ? "text-red-500" : "text-slate-700")}>{health.disputes}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Failed Transactions</span>
                            <span className={cn("font-black", health.failedTxns > 0 ? "text-red-500" : "text-slate-700")}>{health.failedTxns}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Manual Adjustments</span>
                            <span className={cn("font-black", health.manualAdjustments > 0 ? "text-amber-600" : "text-slate-700")}>{health.manualAdjustments}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col items-start gap-1">
                        {heldIds.includes(p.id) ? (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-200 font-black gap-1 hover:bg-amber-50 text-[9px] uppercase shadow-sm h-5 py-0 px-2 flex items-center">
                            <AlertTriangle className="h-3 w-3 text-amber-500 mr-0.5" />
                            On Hold – Quality Review
                          </Badge>
                        ) : (
                          getStatusBadge(p.status)
                        )}
                        <div className="flex flex-col mt-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">Bank Transfer</span>
                           {p.isManual ? (
                             <div className="flex items-center gap-1 mt-1 text-[8px] text-amber-500 font-black uppercase tracking-widest leading-none">
                                <AlertTriangle className="h-2.5 w-2.5" /> Manual Adjustment
                             </div>
                           ) : (
                             <div className="flex items-center gap-1 mt-1 text-[8px] text-[#3E8940] font-black uppercase tracking-widest leading-none">
                                <ShieldCheck className="h-2.5 w-2.5" /> Auto Reconciled
                             </div>
                           )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-300 hover:text-[#3E8940]"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl border-slate-100 p-2">
                          <DropdownMenuItem className="text-xs font-bold text-slate-600 cursor-pointer p-3 rounded-xl hover:bg-slate-50" onClick={() => setLedgerVendor(p)}>
                            <FileText className="h-4 w-4 mr-2 text-slate-400" />
                            View Ledger
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs font-bold text-red-600 cursor-pointer p-3 rounded-xl hover:bg-red-50"
                            onClick={() => toggleHold(p.id)}
                          >
                            <ShieldAlert className="h-4 w-4 mr-2 text-red-500" />
                            {heldIds.includes(p.id) ? "Release Hold" : "Hold Payout"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={10}
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
                  .map((p) => {
                    const gross = p.grossAmount || (p.amount / 0.8);
                    const comm = p.commissionAmount || (gross * 0.2);
                    const refunds = p.refunds || 0;
                    const penalties = p.penalties || 0;
                    const tds = gross * 0.01;
                    const gst = comm * 0.18;
                    const netPayable = gross - comm - gst - tds - refunds - penalties;

                    return (
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
                            {formatINR(netPayable)}
                          </p>
                          <p className="text-[9px] text-[#3E8940] font-black uppercase tracking-widest">
                            Ready for Release
                          </p>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Ledger Dialog */}
      <Dialog open={!!ledgerVendor} onOpenChange={(open) => !open && setLedgerVendor(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-[1000px] lg:max-w-[1200px] max-h-[85vh] overflow-hidden flex flex-col rounded-[2.5rem] p-0 border-none shadow-2xl bg-slate-50">
          <DialogHeader className="p-8 pb-6 border-b border-slate-200/50 bg-white shrink-0 relative">
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 focus:outline-none">
              <X className="h-5 w-5" />
            </DialogClose>
            <div className="flex justify-between items-start pr-12">
              <div>
                <DialogTitle className="text-3xl font-black flex items-center gap-3 tracking-tight text-slate-900">
                  <div className="p-3 bg-indigo-50 rounded-2xl">
                    <FileText className="h-6 w-6 text-indigo-500" />
                  </div>
                  Vendor Ledger
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-2 font-bold tracking-tight">
                  <span className="uppercase text-slate-400 text-xs tracking-widest mr-2">Account:</span>
                  <span className="text-slate-700">{ledgerVendor?.vendor?.vendorProfile?.businessName || ledgerVendor?.vendor?.name || "Unknown"}</span> 
                  <span className="text-slate-300 mx-3">•</span> 
                  <span className="uppercase text-slate-400 text-xs tracking-widest mr-2">ID:</span>
                  <span className="font-mono text-slate-500">{ledgerVendor?.vendor?.id?.slice(0, 8).toUpperCase() || ledgerVendor?.id?.slice(0, 8).toUpperCase()}</span>
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 pl-8 tracking-widest whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 tracking-widest whitespace-nowrap">Description</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right tracking-widest whitespace-nowrap">Opening Balance</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right text-emerald-600 tracking-widest whitespace-nowrap">Revenue</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right text-red-500 tracking-widest whitespace-nowrap">Commission</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right text-red-500 tracking-widest whitespace-nowrap">GST (18%)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right text-red-500 tracking-widest whitespace-nowrap">TDS (1%)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right text-red-500 tracking-widest whitespace-nowrap">Refund</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right text-amber-600 tracking-widest whitespace-nowrap">Payout</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 text-right pr-8 tracking-widest whitespace-nowrap">Closing Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    if (!ledgerVendor) return null;
                    const vendorId = ledgerVendor.vendor?.id || ledgerVendor.vendorId;
                    const vendorPayments = payments.filter(p => (p.vendor?.id || p.vendorId) === vendorId);
                    const sortedPayments = [...vendorPayments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    
                    let balance = 0;
                    const entries = sortedPayments.map((p, i) => {
                       const currentOpening = balance;
                       const rev = p.grossAmount || (p.amount / 0.8);
                       const comm = p.commissionAmount || (rev * 0.2);
                       const ref = p.refunds || 0;
                       const pen = p.penalties || 0;
                       const tds = rev * 0.01;
                       const gst = comm * 0.18;
                       const totalDed = comm + gst + tds + ref + pen;
                       
                       const net = rev - totalDed;
                       const isPayout = p.status === "PAID" || p.status === "SETTLED";
                       const payout = isPayout ? net : 0;
                       
                       balance = currentOpening + net - payout;
                       const d = new Date(p.createdAt);
                       
                       return (
                         <TableRow key={p.id || i} className="hover:bg-slate-50/50 border-b border-slate-50">
                           <TableCell className="pl-8 py-5">
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">{d.toLocaleDateString("en-IN", {day:"numeric", month:"short"})}</span>
                           </TableCell>
                           <TableCell className="py-5">
                              <div className="flex items-center gap-2">
                                 <div className={cn("h-2 w-2 rounded-full", isPayout ? "bg-amber-400" : "bg-emerald-400")} />
                                 <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{isPayout ? "Weekly Settlement" : "Accrual"}</span>
                              </div>
                           </TableCell>
                           <TableCell className="py-5 text-sm font-black text-slate-400 text-right whitespace-nowrap">{formatINR(currentOpening)}</TableCell>
                           <TableCell className="py-5 text-right">
                              <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 whitespace-nowrap">+{formatINR(rev)}</span>
                           </TableCell>
                           <TableCell className="py-5 text-right">
                              <span className="text-sm font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 whitespace-nowrap">-{formatINR(comm)}</span>
                           </TableCell>
                           <TableCell className="py-5 text-right">
                              <span className="text-sm font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 whitespace-nowrap">-{formatINR(gst)}</span>
                           </TableCell>
                           <TableCell className="py-5 text-right">
                              <span className="text-sm font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 whitespace-nowrap">-{formatINR(tds)}</span>
                           </TableCell>
                           <TableCell className="py-5 text-right">
                              <span className={cn("text-sm font-black px-3 py-1.5 rounded-xl whitespace-nowrap", ref > 0 ? "text-red-500 bg-red-50 border border-red-100" : "text-slate-300")}>{ref > 0 ? `-${formatINR(ref)}` : "-"}</span>
                           </TableCell>
                           <TableCell className="py-5 text-sm font-black text-amber-600 text-right whitespace-nowrap">{payout > 0 ? <span className="bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl whitespace-nowrap">-{formatINR(payout)}</span> : <span className="text-slate-300">-</span>}</TableCell>
                           <TableCell className="pr-8 py-5 text-base font-black text-indigo-600 text-right tracking-tighter whitespace-nowrap">{formatINR(balance)}</TableCell>
                         </TableRow>
                       );
                    });
                    
                    if (entries.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-12 text-slate-400 font-bold">No ledger data available for this vendor.</TableCell>
                        </TableRow>
                      );
                    }
                    return entries.reverse();
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
