"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Calendar,
  User,
  Hash,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

const getStatusBadge = (status: string) => {
  const norm = status?.toLowerCase() || "";
  if (norm === "paid" || norm === "completed") {
      return (
        <Badge className="bg-green-100 text-green-700 border-none font-medium gap-1.5 hover:bg-green-100">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
  }
  if (norm === "failed" || norm === "error") {
      return (
        <Badge className="bg-red-100 text-red-700 border-none font-medium gap-1.5 hover:bg-red-100">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-none font-medium gap-1.5 hover:bg-amber-100">
        <Clock className="h-3 w-3" />
        Processing
    </Badge>
  );
};

export default function VendorPaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(params.id as string);
  
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${AUTH_API_URL}/settlements`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load settlements");
      const data = await res.json();
      const txn = data.find((p: any) => p.id === id);
      setPayment(txn || null);
    } catch (err) {
      toast.error("Failed to load transaction details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const handleProcessPayment = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${AUTH_API_URL}/settlements/${id}/pay`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success("Payment marked as completed.");
        await fetchPayment();
      } else {
        toast.error("Failed to process payment. Please try again.");
      }
    } catch (err) {
      toast.error("An error occurred during payment processing.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <h3 className="font-semibold text-slate-700">Loading Transaction Details...</h3>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payments
        </Button>
        <div className="flex flex-col items-center justify-center p-12">
          <p className="text-slate-500">Transaction not found.</p>
        </div>
      </div>
    );
  }

  const handleDownloadReceipt = () => {
    if (!payment) return;
    
    const gross = payment.grossAmount || (payment.amount / 0.8).toFixed(2);
    const comm = payment.commissionAmount || (gross * (payment.commissionRate / 100 || 0.2)).toFixed(2);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #3E8940; }
            .details { margin-top: 30px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; color: #3E8940; }
            .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CleClo Admin</div>
            <div>
              <strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}<br>
              <strong>Receipt #:</strong> ${payment.id.slice(0,8).toUpperCase()}
            </div>
          </div>
          <div class="details">
            <h3>Payment Summary</h3>
            <p><strong>Vendor:</strong> ${payment.vendor?.vendorProfile?.businessName || payment.vendor?.name || payment.vendor}</p>
            <p><strong>Vendor ID:</strong> ${payment.vendorId}</p>
            <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Order Revenue (Gross)</td>
                <td>₹${gross}</td>
              </tr>
              <tr>
                <td>Platform Commission (${payment.commissionRate || 20}%)</td>
                <td>-₹${comm}</td>
              </tr>
              <tr>
                <td>Refund Adjustments</td>
                <td>-₹${payment.refunds || 0}</td>
              </tr>
              <tr>
                <td>Penalties / Deductions</td>
                <td>-₹${payment.penalties || 0}</td>
              </tr>
              <tr class="total">
                <td>Net Payout Amount</td>
                <td>₹${payment.amount}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>&copy; ${new Date().getFullYear()} CleClo. All rights reserved.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit gap-2 -ml-2 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payments
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Transaction Details
            </h1>
            <p className="text-slate-500 mt-1">
              View complete details of this payout
            </p>
          </div>
          <div className="flex items-center gap-3">
            {payment.status?.toLowerCase() === 'paid' && (
              <Badge className={payment.isManual || payment.method === 'Manual' ? "bg-amber-50 text-amber-600 border border-amber-100 font-bold gap-1 shadow-none" : "bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold gap-1 shadow-none"}>
                {payment.isManual || payment.method === 'Manual' ? (
                  <><AlertCircle className="h-3 w-3" /> Manual Adjustment</>
                ) : (
                  <><CheckCircle className="h-3 w-3" /> Auto Reconciled</>
                )}
              </Badge>
            )}
            {getStatusBadge(payment.status)}
            <Button
              className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 ml-2"
              onClick={handleDownloadReceipt}
            >
              <Download className="h-4 w-4" /> Download Receipt
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700">
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-slate-100 -mx-6">
              <div className="flex flex-col gap-1 p-6 border-r border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Hash className="h-3 w-3" /> Transaction ID
                </span>
                <span className="font-bold text-slate-900 text-sm break-all mt-1">
                  {payment.id}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-6 border-r border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Date
                </span>
                <span className="font-bold text-slate-900 text-lg mt-1">
                  {new Date(payment.createdAt || payment.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="h-3 w-3" /> Net Payout
                </span>
                <span className="font-black text-[#3E8940] text-3xl mt-1">
                  ₹{payment.amount || 0}
                </span>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <h3 className="font-bold text-slate-900 px-0 flex items-center gap-2 text-base">
                <div className="h-1 w-4 bg-[#3E8940] rounded-full" />
                Payout Breakdown
              </h3>
              <div className="bg-slate-50/80 -mx-6 px-6 py-8 border-y border-slate-200/60 space-y-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Order Revenue (Gross)</span>
                  <div className="flex-1 border-b border-dotted border-slate-300 mx-4 h-3" />
                  <span className="font-bold text-slate-900 text-base">₹{payment.grossAmount || (payment.amount / 0.8).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Platform Commission ({payment.commissionRate || 20}%)</span>
                  <div className="flex-1 border-b border-dotted border-slate-300 mx-4 h-3" />
                  <span className="font-bold text-red-600 text-base">-₹{payment.commissionAmount || (payment.grossAmount ? payment.grossAmount * (payment.commissionRate / 100) : payment.amount * 0.2).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">GST on Commission (18%)</span>
                  <div className="flex-1 border-b border-dotted border-slate-300 mx-4 h-3" />
                  <span className="font-bold text-red-600 text-base">-₹{( (payment.commissionAmount || (payment.grossAmount ? payment.grossAmount * (payment.commissionRate / 100) : payment.amount * 0.2)) * 0.18).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">TDS Deducted (1%)</span>
                  <div className="flex-1 border-b border-dotted border-slate-300 mx-4 h-3" />
                  <span className="font-bold text-red-600 text-base">-₹{((payment.grossAmount || (payment.amount / 0.8)) * 0.01).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Refund Adjustments</span>
                  <div className="flex-1 border-b border-dotted border-slate-300 mx-4 h-3" />
                  <span className="font-bold text-red-600 text-base">-₹{payment.refunds || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Penalties / Deductions</span>
                  <div className="flex-1 border-b border-dotted border-slate-300 mx-4 h-3" />
                  <span className="font-bold text-red-600 text-base">-₹{payment.penalties || payment.deductions || 0}</span>
                </div>
                <div className="h-px bg-slate-200/60 my-2" />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-black text-slate-900 text-lg">Net Payable Amount</span>
                  <div className="text-right">
                    <span className="text-3xl font-black text-[#3E8940]">₹{payment.amount || 0}</span>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 italic">Settled via {payment.method || 'Bank Transfer'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 -mx-6 border-b border-slate-100">
              <div className="p-6 border-r border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest text-slate-400">Vendor Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-medium">Business Name</span>
                    <span className="font-bold text-slate-900 text-sm">{payment.vendor?.vendorProfile?.businessName || payment.vendor?.name || payment.vendor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-medium">Vendor ID</span>
                    <span className="font-mono text-[10px] text-slate-500">{payment.vendorId}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest text-slate-400">Payment Method</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-medium">Transfer Method</span>
                    <span className="font-bold text-slate-900 text-sm">{payment.method || "System Automated"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-medium">Reference ID</span>
                    <span className="font-mono text-[10px] text-slate-500">{payment.transactionId || payment.reference || "N/A"}</span>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-medium">Audit Status</span>
                    <span className={payment.isManual || payment.method === 'Manual' ? "font-bold text-amber-600 text-[10px]" : "font-bold text-emerald-600 text-[10px]"}>
                       {payment.isManual || payment.method === 'Manual' ? '⚠ Manual Adjustment' : '✔ Auto Reconciled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit overflow-hidden border-none shadow-lg ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Settlement Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-8 flex flex-col items-center text-center gap-4">
              {payment.status?.toLowerCase() === 'paid' || payment.status?.toLowerCase() === 'completed' ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 text-lg">Settlement Complete</p>
                    <p className="text-[10px] text-slate-500 px-4 leading-relaxed font-medium">Funds have been successfully transferred to the vendor's registered bank account.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shadow-inner">
                    <Clock className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 text-lg">Payment Processing</p>
                    <p className="text-[10px] text-slate-500 px-4 leading-relaxed font-medium">This settlement is currently in the queue and will be processed shortly.</p>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-[#3E8940] hover:bg-[#3E8940]/90 font-black rounded-xl h-12 shadow-lg shadow-emerald-100 transition-all active:scale-95" 
                    onClick={handleProcessPayment}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                    Mark as Paid
                  </Button>
                </>
              )}
            </div>
            
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-2">
              <Button className="w-full gap-2 border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 h-10 rounded-lg shadow-sm" variant="outline" onClick={handleDownloadReceipt}>
                <Download className="h-4 w-4" /> Download Receipt
              </Button>
              <Button className="w-full gap-2 border-transparent text-slate-400 hover:text-slate-600 font-medium text-[10px]" variant="ghost">
                Need help with this payout?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
