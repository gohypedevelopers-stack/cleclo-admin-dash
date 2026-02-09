"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Store,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data
const vendorData = {
  id: "VND-2024-089",
  name: "Fresh Fold Services",
  owner: "Rajesh Kumar",
  email: "rajesh.k@freshfold.com",
  phone: "+91 98765 43210",
  address: "Shop 12, Crystal Plaza, Andheri West, Mumbai, Maharashtra 400053",
  status: "Pending Review",
  type: "Laundry & Dry Cleaning",
  appliedDate: "Oct 22, 2024",
  documents: [
    { name: "Business Registration (GST)", status: "Verified", type: "pdf" },
    { name: "Shop Establishment License", status: "Verified", type: "pdf" },
    { name: "Owner Identity Proof (Aadhar)", status: "Pending", type: "image" },
    { name: "Bank Account Details", status: "Verified", type: "pdf" },
  ],
  bankDetails: {
    accountName: "Fresh Fold Services",
    accountNumber: "XXXX-XXXX-8892",
    bank: "HDFC Bank",
    ifsc: "HDFC0001234",
  },
};

export default function VendorReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Vendor Approved Successfully", {
        description:
          "An email has been sent to the vendor with login credentials.",
      });
      setIsProcessing(false);
      router.push("/admin");
    }, 1500);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setRejectDialogOpen(false);
      toast.error("Vendor Application Rejected", {
        description: "Rejection reason has been sent to the vendor.",
      });
      setIsProcessing(false);
      router.push("/admin");
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-slate-200"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Vendor Application
              </h1>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                {vendorData.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Application ID: {vendorData.id} • Applied on{" "}
              {vendorData.appliedDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setRejectDialogOpen(true)}
            disabled={isProcessing}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject Application
          </Button>
          <Button
            className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white shadow-sm"
            onClick={handleApprove}
            disabled={isProcessing}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve Vendor
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Details */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-slate-500" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Business Name
                  </label>
                  <p className="font-medium text-slate-900 mt-1">
                    {vendorData.name}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Business Type
                  </label>
                  <p className="font-medium text-slate-900 mt-1">
                    {vendorData.type}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Address
                </label>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="font-medium text-slate-900">
                    {vendorData.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-500" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Owner Name
                </label>
                <p className="font-medium text-slate-900 mt-1">
                  {vendorData.owner}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Email
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <p className="font-medium text-slate-900">
                    {vendorData.email}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Phone
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <p className="font-medium text-slate-900">
                    {vendorData.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Info */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-500" />
                Banking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Bank Name
                </label>
                <p className="font-medium text-slate-900 mt-1">
                  {vendorData.bankDetails.bank}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Account Holder
                </label>
                <p className="font-medium text-slate-900 mt-1">
                  {vendorData.bankDetails.accountName}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Account Number
                </label>
                <p className="font-medium text-slate-900 mt-1 font-mono">
                  {vendorData.bankDetails.accountNumber}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  IFSC Code
                </label>
                <p className="font-medium text-slate-900 mt-1 font-mono">
                  {vendorData.bankDetails.ifsc}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Documents */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Submitted Documents
              </CardTitle>
              <CardDescription>
                Review uploaded files for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendorData.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-500 uppercase">
                        {doc.type} • 2.4 MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === "Verified" ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none h-6">
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none h-6">
                        Pending
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Banknote className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex gap-2">
                  <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">
                      verification note
                    </h4>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      Please ensure the shop establishment license name matches
                      with the PAN card details provided.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this vendor? This action cannot be
              undone. Please provide a reason efficiently.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block text-slate-700">
              Rejection Reason
            </label>
            <Textarea
              placeholder="e.g. Invalid documents, Business address not found..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
