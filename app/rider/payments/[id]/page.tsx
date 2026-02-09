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
  Bike,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock Data (duplicated from rider payments page)
const PAYMENTS = [
  {
    id: "PAY-9021",
    rider: "Rahul Kumar",
    riderId: "RID-104",
    amount: "₹4,250.00",
    date: "Oct 24, 2024",
    status: "Completed",
    method: "Bank Transfer",
    reference: "HDFC-11293",
  },
  {
    id: "PAY-9020",
    rider: "Amit Singh",
    riderId: "RID-102",
    amount: "₹3,100.00",
    date: "Oct 24, 2024",
    status: "Processing",
    method: "UPI",
    reference: "UPI-992011",
  },
  {
    id: "PAY-9019",
    rider: "Vikram Malhotra",
    riderId: "RID-108",
    amount: "₹5,600.00",
    date: "Oct 23, 2024",
    status: "Completed",
    method: "Bank Transfer",
    reference: "ICICI-99201",
  },
  {
    id: "PAY-9018",
    rider: "Suresh Raina",
    riderId: "RID-105",
    amount: "₹2,800.00",
    date: "Oct 21, 2024",
    status: "Failed",
    method: "UPI",
    reference: "UPI-119203",
  },
  {
    id: "PAY-9017",
    rider: "Rahul Kumar",
    riderId: "RID-104",
    amount: "₹3,800.00",
    date: "Oct 20, 2024",
    status: "Completed",
    method: "Bank Transfer",
    reference: "HDFC-22910",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Completed":
      return (
        <Badge className="bg-green-100 text-green-700 border-none font-medium gap-1.5 hover:bg-green-100">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "Processing":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-none font-medium gap-1.5 hover:bg-amber-100">
          <Clock className="h-3 w-3" />
          Processing
        </Badge>
      );
    case "Failed":
      return (
        <Badge className="bg-red-100 text-red-700 border-none font-medium gap-1.5 hover:bg-red-100">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function RiderPaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const decodedId = decodeURIComponent(id);
  const payment = PAYMENTS.find((p) => p.id === decodedId);

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
        <div className="flex items-center justify-center p-12">
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
                <span className="font-medium text-slate-900 text-lg">
                  {payment.id}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Date
                </span>
                <span className="font-medium text-slate-900 text-lg">
                  {payment.date}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <CreditCard className="h-3 w-3" /> Amount
                </span>
                <span className="font-bold text-[#3E8940] text-2xl">
                  {payment.amount}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">Rider Details</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Name</span>
                    <span className="font-medium">{payment.rider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Rider ID</span>
                    <span className="font-medium">{payment.riderId}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">Payment Method</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Method</span>
                    <span className="font-medium">{payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Reference ID</span>
                    <span className="font-medium">{payment.reference}</span>
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
