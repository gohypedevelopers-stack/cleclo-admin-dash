"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Calendar,
  AlertCircle,
  Bike,
  MapPin,
  Maximize2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

export default function VerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Document Preview State
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    async function loadRider() {
      try {
        setLoading(true);
        const res = await fetch(`${AUTH_API_URL}/users/${id}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load rider details");
        const data = await res.json();
        setRider(data);
      } catch (err) {
        toast.error("Failed to load rider details.");
      } finally {
        setLoading(false);
      }
    }
    loadRider();
  }, [id]);

  const handleApprove = async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'active' })
      });
      if (!res.ok) throw new Error("Verification failed");
      toast.success(`${rider?.name} has been verified successfully.`);
      router.push("/rider");
    } catch (err) {
      toast.error("Failed to approve right now.");
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(`${AUTH_API_URL}/users/${id}/block`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ blocked: true })
      });
      if (!res.ok) throw new Error("Rejection failed");
      toast.error(`${rider?.name}'s application has been rejected.`);
      router.push("/rider");
    } catch (err) {
      toast.error("Failed to reject right now.");
    }
  };

  const toggleDocStatus = (index: number) => {
    toast.info("Document status updated");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <h3 className="font-semibold text-slate-700">Loading Rider Profile...</h3>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Verifications
        </Button>
        <div className="flex flex-col items-center justify-center p-12">
          <p className="text-slate-500">Rider profile not found.</p>
        </div>
      </div>
    );
  }

  const isPending = rider.status !== "active";
  const addressList = rider.addresses || [];
  const primaryAddress = addressList[0] ? `${addressList[0].street}, ${addressList[0].city}` : "Not Provided";
  
  // Simulated Docs for now as standard Rider schema does not embed explicit documents yet.
  const documents = [
    { name: "Driving License", status: isPending ? "Pending" : "Verified", type: "Identity", url: "#" },
    { name: "Vehicle RC", status: isPending ? "Pending" : "Verified", type: "Vehicle", url: "#" }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-slate-100"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5 text-slate-700" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Verify Application
          </h1>
          <p className="text-sm text-slate-500">
            Reviewing user profile #{rider.id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column - Rider Info & Vehicle (4 cols) */}
        <div className="md:col-span-4 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 ring-4 ring-slate-50">
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-2xl uppercase">
                    {(rider.name || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-slate-900">
                  {rider.name}
                </h2>
                <Badge
                  variant={isPending ? "outline" : "secondary"}
                  className={`mt-2 ${isPending ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-100 text-green-700"}`}
                >
                  {isPending ? "Pending Verification" : "Verified"}
                </Badge>

                <div className="w-full mt-6 space-y-4 text-left border-t pt-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-slate-500 col-span-1">Email</span>
                    <span
                      className="font-medium col-span-2 truncate"
                      title={rider.email}
                    >
                      {rider.email}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-slate-500 col-span-1">Phone</span>
                    <span className="font-medium col-span-2">
                      {rider.phone || "Not Provided"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-slate-500 col-span-1">Applied</span>
                    <span className="font-medium col-span-2">
                      {new Date(rider.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-slate-500 col-span-1 flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5" />
                      Address
                    </span>
                    <span className="font-medium col-span-2 text-xs leading-relaxed">
                      {primaryAddress}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bike className="h-4 w-4 text-slate-500" /> Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium">{rider.status}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Wallet</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Documents & Actions (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          <Card className="shadow-sm border-slate-200 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Submitted Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors group gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {doc.type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          PDF • On File
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() =>
                          setPreviewDoc({ name: doc.name, url: doc.url })
                        }
                      >
                        <Eye className="h-3.5 w-3.5" /> View File
                      </Button>
                    </div>

                    {doc.status === "Verified" && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 h-8 px-3"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Verified
                      </Badge>
                    )}
                    {doc.status === "Rejected" && (
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 h-8 px-3"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1.5" /> Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
            {isPending && (
                <div className="p-6 border-t bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl">
                <div className="text-sm text-slate-500">
                    <span className="font-medium text-slate-900">Ensure all verification steps</span>{" "}
                    are complete before approval.
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={handleReject}
                    >
                    Reject Application
                    </Button>
                    <Button
                    className="flex-1 sm:flex-none bg-[#3E8940] hover:bg-[#3E8940]/90 px-8"
                    onClick={handleApprove}
                    >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Rider
                    </Button>
                </div>
                </div>
            )}
          </Card>
        </div>
      </div>

      {/* Document Preview Modal */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-slate-200 shadow-2xl sm:rounded-2xl">
          <DialogHeader className="p-4 flex flex-row items-center justify-between border-b border-slate-100 bg-white space-y-0">
            <DialogTitle className="text-slate-900 font-semibold flex items-center gap-2 text-lg">
              <div className="bg-blue-50 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden">
            {/* Mock Document Preview Placeholder */}
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 max-w-full max-h-full aspect-3/4 flex flex-col items-center justify-center min-w-[320px]">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <FileText className="h-16 w-16 text-slate-300" />
              </div>
              <p className="text-slate-900 font-semibold text-lg mb-2">
                Document On File
              </p>
              <p className="text-sm text-slate-500 text-center max-w-[250px] leading-relaxed">
                This document has been safely stored for <br />
                <span className="font-medium text-slate-700">
                  {rider.name}
                </span>
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
            <Button
              variant="outline"
              className="text-slate-600 hover:bg-slate-50 border-slate-200"
            >
              <Maximize2 className="h-4 w-4 mr-2" /> Full Screen
            </Button>
            <Button
              variant="default"
              className="bg-slate-900 hover:bg-slate-800"
              onClick={() => setPreviewDoc(null)}
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
