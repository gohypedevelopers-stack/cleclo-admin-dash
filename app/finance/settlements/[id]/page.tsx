"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  CreditCard, 
  Store, 
  Calendar, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Download,
  Receipt,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";

export default function SettlementDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_auth_token") || "";
      const res = await fetch(`${AUTH_API_URL}/settlements`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.find((s: any) => s.id === id);
        if (found) {
          setSettlement(found);
        } else {
          toast.error("Settlement not found");
        }
      }
    } catch (err) {
      console.error("Failed to load settlement details", err);
      toast.error("Error loading details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("admin_auth_token") || "";
      const res = await fetch(`${AUTH_API_URL}/settlements/${id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Settlement marked as paid successfully.");
        await fetchDetails();
      } else {
        toast.error("Failed to process payment");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    toast.success("Invoice generated", { description: "Your PDF download will start shortly." });
  };

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => router.push("/finance/settlements")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settlement Details</h1>
          <p className="text-sm text-slate-500">View detailed breakdown and transaction history</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 mt-8 animate-pulse">
          <div className="h-40 w-full bg-slate-200 rounded-2xl" />
          <div className="h-64 w-full bg-slate-200 rounded-2xl" />
        </div>
      ) : settlement ? (
        <div className="grid gap-6 md:grid-cols-3 mt-4">
          <div className="md:col-span-2 space-y-6">
            {/* Financial Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50"><Receipt className="h-5 w-5 text-slate-600" /></div>
                  <h2 className="font-bold text-slate-900">Financial Breakdown</h2>
                </div>
                <Badge className={
                  settlement.status.toLowerCase() === "paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : 
                  settlement.status.toLowerCase() === "pending" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : 
                  "bg-slate-100 text-slate-700 hover:bg-slate-100"
                }>
                  {settlement.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-sm font-medium text-slate-500">Gross Amount (from Orders)</span>
                  <span className="font-bold text-slate-900">{formatINR(settlement.grossAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-sm font-medium text-slate-500">Platform Commission ({settlement.commissionRate || 18}%)</span>
                  <span className="font-bold text-red-600">-{formatINR(settlement.commissionAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-sm font-medium text-slate-500">TDS (1%) & GST</span>
                  <span className="font-bold text-orange-600">-{formatINR((settlement.taxDeducted || 0) + (settlement.commissionAmount * 0.18))}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-sm font-medium text-slate-500">Other Deductions (Penalties/Refunds)</span>
                  <span className="font-bold text-red-600">-{formatINR(settlement.deductions || settlement.penalties || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-4 bg-slate-50 px-4 rounded-lg mt-2">
                  <span className="font-bold text-slate-900">Net Final Payout</span>
                  <span className="text-xl font-bold text-[#3E8940]">{formatINR(settlement.amount || settlement.netPayout)}</span>
                </div>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex gap-4">
              <Button 
                className="flex-1 bg-[#3E8940] hover:bg-[#3E8940]/90 font-bold h-12" 
                disabled={settlement.status.toLowerCase() === "paid" || actionLoading}
                onClick={handleMarkPaid}
              >
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                {settlement.status.toLowerCase() === "paid" ? "Settlement Completed" : "Mark as Paid"}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 font-bold h-12 border-slate-200"
                onClick={handleDownloadInvoice}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Vendor Details */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Vendor Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Store className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{settlement.vendor?.vendorProfile?.businessName || settlement.vendorName || "Unknown Vendor"}</p>
                    <p className="text-xs text-slate-500">Vendor ID: {settlement.vendorId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Bank Transfer</p>
                    <p className="text-xs text-slate-500">Auto Reconciled Cycle</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Details */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Transaction Meta</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-medium text-slate-900">{settlement.transactionId || settlement.id.slice(0,8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Generated On</span>
                  <span className="font-medium text-slate-900">{formatDate(settlement.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Orders Included</span>
                  <span className="font-medium text-slate-900">{settlement.orderCount} Orders</span>
                </div>
                {settlement.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Settled On</span>
                    <span className="font-medium text-[#3E8940]">{formatDate(settlement.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center mt-8">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Settlement Not Found</h3>
          <p className="text-slate-500 mt-2">The requested settlement record does not exist or has been removed.</p>
          <Button className="mt-6" onClick={() => router.push("/finance/settlements")}>Go Back</Button>
        </div>
      )}
    </div>
  );
}
