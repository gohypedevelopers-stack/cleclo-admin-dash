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
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock Data (extended with Vehicle and Address)
const MOCK_VERIFICATIONS = [
  {
    id: "pv1",
    name: "Rahul Kumar",
    applied: "2 hours ago",
    status: "Pending",
    documents: [
      {
        name: "Driving License",
        status: "Pending",
        type: "Identity",
        url: "/documents/license-mock.png",
      },
      {
        name: "Vehicle RC",
        status: "Pending",
        type: "Vehicle",
        url: "/documents/rc-mock.png",
      },
      {
        name: "Insurance",
        status: "Pending",
        type: "Vehicle",
        url: "/documents/insurance-mock.png",
      },
    ],
    avatar: "RK",
    notes: "Please check the expiry date on Insurance.",
    email: "rahul.k@example.com",
    phone: "+91 98765 43210",
    vehicle: {
      type: "Bike",
      model: "Hero Splendor Plus",
      plate: "KA 01 AB 1234",
    },
    address: "#123, 4th Cross, Indiranagar, Bangalore - 560038",
  },
  {
    id: "pv2",
    name: "Amit Singh",
    applied: "5 hours ago",
    status: "In Review",
    documents: [
      {
        name: "Driving License",
        status: "Verified",
        type: "Identity",
        url: "#",
      },
      { name: "Vehicle RC", status: "Pending", type: "Vehicle", url: "#" },
    ],
    avatar: "AS",
    notes: "",
    email: "amit.s@example.com",
    phone: "+91 98765 12345",
    vehicle: {
      type: "Scooter",
      model: "Honda Activa 6G",
      plate: "KA 05 XY 9876",
    },
    address: "Flat 402, Sunshine Apts, Koramangala, Bangalore",
  },
  {
    id: "pv3",
    name: "Priya Sharma",
    applied: "1 day ago",
    status: "Action Required",
    documents: [
      { name: "Insurance", status: "Rejected", type: "Vehicle", url: "#" },
    ],
    avatar: "PS",
    notes: "Insurance document is blurry.",
    email: "priya.s@example.com",
    phone: "+91 98765 67890",
    vehicle: {
      type: "Bike",
      model: "Royal Enfield Classic 350",
      plate: "KA 51 MN 4567",
    },
    address: "HSR Layout, Sector 2, Bangalore",
  },
];

export default function VerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [rider, setRider] = useState<(typeof MOCK_VERIFICATIONS)[0] | null>(
    null,
  );

  // Document Preview State
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (id) {
      const found = MOCK_VERIFICATIONS.find((r) => r.id === id);
      if (found) {
        setRider(found);
      } else {
        setRider(MOCK_VERIFICATIONS[0]);
      }
    }
  }, [id]);

  const handleApprove = () => {
    toast.success(`${rider?.name} has been verified successfully.`);
    router.push("/rider/verification");
  };

  const handleReject = () => {
    toast.error(`${rider?.name}'s application has been rejected.`);
    router.push("/rider/verification");
  };

  const toggleDocStatus = (index: number) => {
    // In a real app, this would update state/backend.
    // For mock, we'll just show a toast imagining it changed.
    toast.info("Document status updated (Mock)");
  };

  if (!rider)
    return <div className="p-8 text-center text-slate-500">Loading...</div>;

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
            Reviewing application #{rider.id}
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
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-2xl">
                    {rider.avatar}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-slate-900">
                  {rider.name}
                </h2>
                <Badge
                  variant={rider.status === "Pending" ? "outline" : "secondary"}
                  className={`mt-2 ${rider.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}`}
                >
                  {rider.status}
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
                      {rider.phone}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-slate-500 col-span-1">Applied</span>
                    <span className="font-medium col-span-2">
                      {rider.applied}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-slate-500 col-span-1 flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5" />
                      Address
                    </span>
                    <span className="font-medium col-span-2 text-xs leading-relaxed">
                      {rider.address}
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
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium">{rider.vehicle.type}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Model</span>
                  <span className="font-medium">{rider.vehicle.model}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Plate Number</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 border">
                    {rider.vehicle.plate}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {rider.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">
                    Review Note
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">{rider.notes}</p>
                </div>
              </div>
            </div>
          )}
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
              {rider.documents.map((doc, idx) => (
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
                          PDF • 2.4 MB
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
            <div className="p-6 border-t bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl">
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-900">3 documents</span>{" "}
                require verification before approval.
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
          </Card>
        </div>
      </div>

      {/* Document Preview Modal */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      >
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
                  Document Preview
                </p>
                <p className="text-sm text-slate-500 text-center max-w-[250px] leading-relaxed">
                  This is a placeholder preview for <br />
                  <span className="font-medium text-slate-700">
                    {previewDoc?.name}
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
      </Dialog>
    </div>
  );
}
