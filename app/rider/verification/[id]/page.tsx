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
  Maximize2,
  Loader2,
  Store,
  Fuel,
  Weight,
  MessageSquare,
  User,
  AlertTriangle,
  Fingerprint,
  Gavel,
  History,
  ShieldAlert,
  AlertCircle,
  Clock,
  MapPin,
  Bike,
  Eye,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

  // Verification Form State
  const [assignment, setAssignment] = useState({
    zone: "",
    outlet: "",
    vendor: ""
  });
  const [vehicle, setVehicle] = useState({
    type: "Bike",
    capacity: "15",
    fuelType: "Petrol"
  });
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    async function loadRider() {
      try {
        setLoading(true);
        const res = await fetch(`${AUTH_API_URL}/users/${id}`, { headers: getAuthHeaders() });
        if (!res.ok) {
          // Check for mock data if API fails or ID is a mock ID
          const mockRiders: Record<string, any> = {
            "R-9921": { id: "R-9921", name: "Deepak Sharma", email: "deepak@example.com", phone: "9833333333", createdAt: new Date().toISOString(), status: "pending" },
            "R-9922": { id: "R-9922", name: "Rahul Verma", email: "rahul@example.com", phone: "9011111111", createdAt: new Date(Date.now() - 86400000).toISOString(), status: "pending" },
            "R-9923": { id: "R-9923", name: "Arun Kumar", email: "arun@example.com", phone: "9822222222", createdAt: new Date(Date.now() - 172800000).toISOString(), status: "rejected" }
          };
          if (mockRiders[id]) {
            setRider(mockRiders[id]);
            return;
          }
          throw new Error("Failed to load rider details");
        }
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
      // Handle mock data
      if (id.startsWith("R-")) {
        toast.success(`${rider?.name} has been verified successfully (Demo).`);
        router.push("/rider/verification");
        return;
      }

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
      // Handle mock data
      if (id.startsWith("R-")) {
        toast.error(`${rider?.name}'s application has been rejected (Demo).`);
        router.push("/rider/verification");
        return;
      }

      const res = await fetch(`${AUTH_API_URL}/users/${id}/block`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ blocked: true, internalNotes })
      });
      if (!res.ok) throw new Error("Rejection failed");
      toast.error(`${rider?.name}'s application has been rejected.`);
      router.push("/rider/verification");
    } catch (err) {
      toast.error("Failed to reject right now.");
    }
  };

  const handleRequestReupload = () => {
    toast.warning("Re-upload request sent to rider");
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
  
  // Dynamic Documents - read from backend, fallback to defaults
  const documents = (rider.documents && rider.documents.length > 0) 
    ? rider.documents.map((d: any) => ({
        name: d.name || d.type || "Document",
        status: d.validation || d.status || "Verified",
        type: d.category || d.type || "General",
        url: d.url || "#",
        expiry: d.expiry || d.expiryDate || "N/A",
        validation: d.validation || (d.status === "expired" ? "Expired" : "Verified")
      }))
    : [
        { name: "Driving License", status: isPending ? "Mismatch" : "Verified", type: "Identity", url: "#", expiry: "12 Dec 2028", validation: isPending ? "Mismatch" : "Verified" },
        { name: "Vehicle RC", status: "Verified", type: "Vehicle", url: "#", expiry: "Valid", validation: "Verified" },
        { name: "Insurance", status: isPending ? "Expired" : "Verified", type: "Safety", url: "#", expiry: "04 May 2026", validation: isPending ? "Expired" : "Verified" }
      ];

  // Dynamic Background Checks - read from backend, fallback to defaults
  const backgroundChecks = (rider.backgroundChecks && rider.backgroundChecks.length > 0)
    ? rider.backgroundChecks.map((c: any) => ({
        name: c.name,
        status: c.status || "Pending",
        icon: c.name?.includes("Police") ? Fingerprint : c.name?.includes("Address") ? MapPin : History,
        color: (c.status === "Completed" || c.status === "Verified") ? "text-emerald-600" : c.status === "Pending" ? "text-amber-600" : "text-red-600"
      }))
    : [
        { name: "Police Verification", status: "Completed", icon: Fingerprint, color: "text-emerald-600" },
        { name: "Address Verification", status: "Verified", icon: MapPin, color: "text-blue-600" },
        { name: "Previous Employment", status: "Pending", icon: History, color: "text-amber-600" }
      ];

  // Dynamic Risk History - read from backend, fallback to defaults
  const riskHistory = rider.riskHistory || rider.previousBlockHistory 
    ? {
        isPreviouslyBlocked: true,
        reason: rider.riskHistory?.reason || rider.previousBlockHistory || "High cancellation rate in 2023",
        date: rider.riskHistory?.date || "15 Jun 2023"
      }
    : { isPreviouslyBlocked: false, reason: "", date: "" };

  // Dynamic Agreements - read from backend, fallback to defaults
  const defaultAgreements = [
    { name: "Terms of Service", accepted: true, summary: "Governs platform operations, commissions, and rider behavior guidelines.", signedDate: "27 May 2026, 11:32 AM", docRef: "TOS-V4.2-2026" },
    { name: "Penalty Policy", accepted: true, summary: "Defines deduction structures for late dispatch, SLA breaches, and no-shows.", signedDate: "27 May 2026, 11:34 AM", docRef: "PP-V1.9-2026" },
    { name: "Damage Liability", accepted: false, summary: "Outlines equipment deposits, damage accountability, and transit safety protocols.", signedDate: "Pending Signature", docRef: "DL-V2.1-2026" }
  ];

  const agreements = (rider.agreements && rider.agreements.length > 0)
    ? rider.agreements.map((a: any) => ({
        name: a.name || "Agreement",
        accepted: a.accepted ?? a.signed ?? false,
        summary: a.summary || a.description || "",
        signedDate: a.signedDate || (a.accepted ? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Pending Signature"),
        docRef: a.docRef || a.reference || `AGR-${a.name?.substring(0, 3).toUpperCase() || "GEN"}`
      }))
    : defaultAgreements;

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

      {/* Risk Alert */}
      {riskHistory.isPreviouslyBlocked && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-red-100 p-2 rounded-lg text-red-600"><ShieldAlert className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-bold text-red-900">Previous Block History Detected</p>
            <p className="text-xs text-red-700 mt-1">Rider was previously blocked on {riskHistory.date} due to: <span className="font-bold underline">{riskHistory.reason}</span>. Please conduct secondary interview before approval.</p>
          </div>
        </div>
      )}

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
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bike className="h-4 w-4 text-[#3E8940]" /> Vehicle Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Vehicle Type</Label>
                <Select value={vehicle.type} onValueChange={(v) => setVehicle({...vehicle, type: v})}>
                  <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bike">Bike / Motorcycle</SelectItem>
                    <SelectItem value="Scooter">Scooter / Moped</SelectItem>
                    <SelectItem value="EV">Electric Vehicle (EV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Load Capacity (KG)</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    type="number" 
                    className="pl-9 h-9 rounded-lg" 
                    value={vehicle.capacity} 
                    onChange={(e) => setVehicle({...vehicle, capacity: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Fuel Type</Label>
                <Select value={vehicle.fuelType} onValueChange={(v) => setVehicle({...vehicle, fuelType: v})}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="Select fuel" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol / Gasoline</SelectItem>
                    <SelectItem value="Electric">Electric / Battery</SelectItem>
                    <SelectItem value="CNG">CNG / Natural Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          {/* Background Checks Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#3E8940]" /> Background Checks
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {backgroundChecks.map((check: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <check.icon className={cn("h-3.5 w-3.5", check.color)} />
                    <span className="text-xs font-medium text-slate-600">{check.name}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px] font-bold py-0 h-5 border-none", 
                    check.status === "Completed" || check.status === "Verified" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {check.status}
                  </Badge>
                </div>
              ))}
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
              {documents.map((doc: any, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors group gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{doc.name}</p>
                        <Badge variant="secondary" className="text-[9px] h-4 font-bold bg-slate-100 text-slate-500 uppercase tracking-tight">
                          {doc.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-bold text-red-500 mt-0.5">Expires: {doc.expiry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        onClick={() =>
                          setPreviewDoc({ name: doc.name, url: doc.url })
                        }
                      >
                        <Eye className="h-3.5 w-3.5" /> View File
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.validation === "Verified" && <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px]"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>}
                      {doc.validation === "Expired" && <Badge className="bg-red-100 text-red-700 border-none font-bold text-[10px]"><Clock className="h-3 w-3 mr-1" /> Expired</Badge>}
                      {doc.validation === "Mismatch" && <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[10px]"><AlertCircle className="h-3 w-3 mr-1" /> Mismatch</Badge>}
                      {doc.validation === "Blurry" && <Badge className="bg-slate-100 text-slate-700 border-none font-bold text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" /> Blurry</Badge>}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t mt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-[#3E8940]" /> Legal & Digital Agreements Acceptance
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {agreements.map((agreement: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-4 rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]",
                        agreement.accepted 
                          ? "bg-emerald-50/30 border-emerald-100 hover:shadow-emerald-50/40" 
                          : "bg-rose-50/30 border-rose-100 hover:shadow-rose-50/40"
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {agreement.name}
                          </span>
                          {agreement.accepted ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[9px] px-1.5 h-4 flex gap-0.5 items-center rounded-md">
                              <CheckCircle className="h-2.5 w-2.5" /> ACCEPTED
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-[9px] px-1.5 h-4 flex gap-0.5 items-center rounded-md">
                              <XCircle className="h-2.5 w-2.5" /> PENDING
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-medium">
                          {agreement.summary}
                        </p>
                      </div>
                      
                      <div className="mt-4 border-t border-dashed border-slate-200/60 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                        <span>Ref: {agreement.docRef}</span>
                        <span className={cn(agreement.accepted ? "text-emerald-600" : "text-rose-500 font-bold")}>
                          {agreement.signedDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            {isPending && (
                <div className="p-6 border-t bg-slate-50/50 space-y-6 rounded-b-xl">
                  {/* Assignment Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Assign Zone</Label>
                      <Select value={assignment.zone} onValueChange={(v) => setAssignment({...assignment, zone: v})}>
                        <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue placeholder="Select Zone" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gurgaon-29">Gurgaon Sector 29</SelectItem>
                          <SelectItem value="noida-62">Noida Sector 62</SelectItem>
                          <SelectItem value="delhi-cp">Delhi CP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Store className="h-3 w-3" /> Assign Outlet</Label>
                      <Select value={assignment.outlet} onValueChange={(v) => setAssignment({...assignment, outlet: v})}>
                        <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue placeholder="Select Outlet" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masterclean-exp">Masterclean Experience</SelectItem>
                          <SelectItem value="cleclo-hub-s">Cleclo Hub - South</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><User className="h-3 w-3" /> Assign Vendor</Label>
                      <Select value={assignment.vendor} onValueChange={(v) => setAssignment({...assignment, vendor: v})}>
                        <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue placeholder="Direct / Vendor" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Direct Hire</SelectItem>
                          <SelectItem value="logistics-pro">Logistics Pro Ltd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Internal Admin Notes</Label>
                    <Textarea 
                      placeholder="Add private observations about this application..." 
                      className="bg-white rounded-xl min-h-[80px]"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    {(() => {
                      const allAgreementsAccepted = agreements.every((a: any) => a.accepted);
                      return (
                        <>
                          <div className="text-[11px] text-slate-500 max-w-[250px]">
                              <span className="font-bold text-slate-900 block mb-1">FINAL REVIEW</span>
                              {!allAgreementsAccepted ? (
                                <span className="text-rose-600 font-bold block mt-0.5 animate-pulse">
                                  ⚠️ Blocked: Pending digital agreement acceptance.
                                </span>
                              ) : (
                                "Ensure Zone, Outlet, and Vendor are assigned before final approval."
                              )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                              <Button
                                variant="outline"
                                className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:bg-slate-100"
                                onClick={handleRequestReupload}
                              >
                                Request Re-upload
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50"
                                onClick={handleReject}
                              >
                                Reject
                              </Button>
                              <Button
                                className="flex-1 sm:flex-none bg-[#3E8940] hover:bg-[#3E8940]/90 px-8 font-bold"
                                onClick={handleApprove}
                                disabled={!assignment.zone || !assignment.outlet || !assignment.vendor || !allAgreementsAccepted}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Rider
                              </Button>
                          </div>
                        </>
                      );
                    })()}
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
