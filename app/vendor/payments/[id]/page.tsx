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

  useEffect(() => {
    async function fetchPayment() {
      try {
        setLoading(true);
        // We fetch all settlements to find this specific ID since there is no standard GET /id exposed yet
        const res = await fetch(`${AUTH_API_URL}/settlements`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load settlements");
        const data = await res.json();
        
        const txn = data.find((p: any) => p.id === id);
        setPayment(txn || null);
      } catch (err) {
        toast.error("Failed to load generic transaction details.");
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();
  }, [id]);

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
    alert(`Downloading receipt for transaction ${payment.id}...`);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
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
          <div className="flex items-center gap-2">
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
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700">
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Hash className="h-3 w-3" /> Transaction ID
                </span>
                <span className="font-medium text-slate-900 text-lg break-all">
                  {payment.id}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Date
                </span>
                <span className="font-medium text-slate-900 text-lg">
                  {new Date(payment.createdAt || payment.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <CreditCard className="h-3 w-3" /> Amount
                </span>
                <span className="font-bold text-[#3E8940] text-2xl">
                  ₹{payment.amount || 0}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">Vendor Details</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Name</span>
                    <span className="font-medium">{payment.vendor?.name || payment.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Vendor ID</span>
                    <span className="font-medium break-all">{payment.vendorId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">Payment Method</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Method</span>
                    <span className="font-medium">{payment.method || "System Automated"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Reference ID</span>
                    <span className="font-medium break-all">{payment.transactionId || payment.reference || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
