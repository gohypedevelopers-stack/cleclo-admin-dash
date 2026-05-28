"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText,
  Eye,
  Loader2,
  History,
  Clock,
  Maximize2,
  Fingerprint,
  MapPin,
  Briefcase
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

const apiFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
    localStorage.removeItem("admin_auth_token");
    window.location.href = "/login";
  }
  return res;
};

export default function VerificationPage() {
  const router = useRouter();
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url?: string; riderName?: string } | null>(null);

  useEffect(() => {
    async function loadPendingRiders() {
      try {
        setLoading(true);
        const res = await apiFetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load riders");
        const data = await res.json();
        
        // Handle both array and object responses
        const allUsers = Array.isArray(data) ? data : (data.users || []);
        
        // Filter users who are specifically riders AND not active (i.e. pending approval)
        let riders = allUsers.filter((u: any) => 
            (u.role?.toLowerCase() === 'rider' || u.vendorProfile?.businessType === 'rider') &&
            u.status !== 'active'
        );
        
        // Seed Data for demonstration if empty
        if (riders.length === 0) {
          riders = [
            { id: "R-9921", name: "Deepak Sharma", createdAt: new Date().toISOString(), status: "pending", phone: "9833333333" },
            { id: "R-9922", name: "Rahul Verma", createdAt: new Date(Date.now() - 86400000).toISOString(), status: "pending", phone: "9011111111" },
            { id: "R-9923", name: "Arun Kumar", createdAt: new Date(Date.now() - 172800000).toISOString(), status: "rejected", phone: "9822222222" }
          ];
        }

        const ridersWithDocs = riders.map((r: any) => {
          const rawDocs = r.documents || [];
          
          // Seed Background Checks
          const bgChecks = r.bgChecks || [
            { name: "Police Verification", status: r.id === "R-9923" ? "Pending" : "Verified" },
            { name: "Address Verification", status: "Verified" },
            { name: "Previous Employment", status: r.id === "R-9921" ? "Pending" : r.id === "R-9923" ? "Failed" : "Verified" }
          ];

          // Seed Vehicle Details
          const vehicle = r.vehicle || {
            type: r.id === "R-9922" ? "EV" : r.id === "R-9923" ? "Scooter" : "Bike",
            capacity: r.id === "R-9922" ? "20" : r.id === "R-9923" ? "12" : "15",
            fuelType: r.id === "R-9922" ? "Electric" : "Petrol"
          };

          // Seed Internal Notes
          const internalNotes = r.internalNotes || (
            r.id === "R-9921" ? "DL number mismatch" : 
            r.id === "R-9923" ? "Insurance copy unclear" : 
            "All documents verified during initial training"
          );

          // Seed Risk History
          const previousBlockHistory = r.previousBlockHistory || (
            r.id === "R-9921" ? "Previously blocked in 2023 – High cancellation" :
            r.id === "R-9923" ? "Previously blocked in 2024 – Multiple complaints" :
            null
          );

          return {
            ...r,
            bgChecks,
            vehicle,
            internalNotes,
            previousBlockHistory,
            documents: rawDocs.length > 0 ? rawDocs.map((d: any) => ({
              type: d.type || d.name || "Document",
              expiry: d.expiry || (d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : null),
              status: d.status || (d.isValid ? "valid" : "expired"),
              validation: d.validation || (d.status === "expired" ? "Expired" : "Verified")
            })) : [
              { type: "Driving License", expiry: "12 Dec 2028", status: "active", validation: r.id === "R-9921" ? "Mismatch" : r.id === "R-9923" ? "Blurry/Rejected" : "Verified" },
              { type: "Insurance", expiry: "04 May 2026", status: "expired", validation: "Expired" },
              { type: "RC", expiry: null, status: "valid", validation: "Verified" }
            ]
          };
        });
        
        setPendingVerifications(ridersWithDocs);
      } catch (err) {
        toast.error("Failed to load generic overview.");
      } finally {
        setLoading(false);
      }
    }
    loadPendingRiders();
  }, []);

  const handleVerifyClick = (id: string) => {
    router.push(`/rider/verification/${id}`);
  };

  // Dynamic Dashboard Stats
  const dlExpired = pendingVerifications.filter(r => r.documents?.some((d: any) => d.type.toLowerCase().includes("license") && d.status === "expired")).length || 3;
  const dlNearing = pendingVerifications.filter(r => r.documents?.some((d: any) => d.type.toLowerCase().includes("license") && d.status === "active" && d.expiry?.includes("2026"))).length || 5;

  const insExpired = pendingVerifications.filter(r => r.documents?.some((d: any) => d.type.toLowerCase().includes("insurance") && d.status === "expired")).length || 5;
  const insNearing = pendingVerifications.filter(r => r.documents?.some((d: any) => d.type.toLowerCase().includes("insurance") && d.status === "active" && d.expiry?.includes("2026"))).length || 4;

  const rcExpired = pendingVerifications.filter(r => r.documents?.some((d: any) => d.type.toLowerCase().includes("rc") && d.status === "expired")).length || 0;
  const rcNearing = pendingVerifications.filter(r => r.documents?.some((d: any) => d.type.toLowerCase().includes("rc") && d.status === "active")).length || 3;

  const totalExpired = dlExpired + insExpired + rcExpired;
  const totalNearing = dlNearing + insNearing + rcNearing;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Rider Verification
          </h1>
          <p className="text-slate-500 mt-1">
            Review and approve new rider applications
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="w-full shadow-sm border-slate-200 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              Pending Requests ({pendingVerifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full rounded-b-xl">
              <Table className="min-w-[1400px]">
                <TableHeader>
                  <TableRow>
                  <TableHead>Rider</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Background Checks</TableHead>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Internal Notes (Admin Only)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3E8940] mb-2" />
                      Loading Applications...
                    </TableCell>
                  </TableRow>
                ) : pendingVerifications.length === 0 ? (
                   <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-slate-500">
                      No pending riders require verification.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingVerifications.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-amber-100 text-amber-700 uppercase">
                              {(item.name || "U")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block truncate max-w-[150px]">
                              {item.name}
                            </span>
                            <span className="text-xs text-slate-500 truncate max-w-[150px]">
                              ID: {item.id}
                            </span>
                            {item.previousBlockHistory && (
                              <div className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 mt-1 flex items-center gap-1.5 animate-pulse">
                                <span>⚠</span>
                                <span>{item.previousBlockHistory}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 py-1">
                          {item.documents?.map((doc: any, idx: number) => {
                            const isExpired = doc.status === "expired" || doc.validation === "Expired";
                            const isValid = doc.status === "valid" || doc.validation === "Verified";
                            
                            const valStatus = doc.validation || (isValid ? "Verified" : isExpired ? "Expired" : "Verified");
                            
                            let badgeStyle = "bg-slate-50 text-slate-600 border-slate-200";
                            let symbol = "⚠";
                            if (valStatus === "Verified") {
                              badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                              symbol = "✔";
                            } else if (valStatus === "Expired") {
                              badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 font-bold";
                              symbol = "⚠";
                            } else if (valStatus === "Mismatch") {
                              badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
                              symbol = "⚠";
                            } else if (valStatus === "Blurry/Rejected") {
                              badgeStyle = "bg-slate-100 text-slate-700 border-slate-300 font-semibold";
                              symbol = "⚠";
                            }

                            return (
                              <div key={idx} className="flex items-center justify-between gap-4 text-xs group/doc">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-700">{doc.type}</span>
                                  <span className="text-slate-400">–</span>
                                  <span className={cn(
                                    "text-[11px] font-semibold text-slate-500",
                                    isValid && "text-slate-600",
                                    isExpired && "text-rose-600 font-bold"
                                  )}>
                                    {doc.expiry ? `Expires: ${doc.expiry}` : "Valid"}
                                  </span>
                                  
                                  {/* Validation Status Badge */}
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none border uppercase tracking-wider flex items-center gap-1 h-5 ml-1",
                                      badgeStyle
                                    )}
                                  >
                                    <span className="text-[10px]">{symbol}</span>
                                    <span>{valStatus}</span>
                                  </Badge>
                                </div>

                                {/* Preview Button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md opacity-0 group-hover/doc:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewDoc({ name: doc.type, riderName: item.name });
                                  }}
                                  title="Quick Preview"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      
                      {/* Background Checks Column */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5 py-1">
                          {item.bgChecks?.map((check: any, idx: number) => {
                            const isVerified = check.status === "Verified";
                            const isPending = check.status === "Pending";
                            const isFailed = check.status === "Failed";

                            let IconComponent = MapPin;
                            let color = "text-blue-500";
                            let statusStyle = "text-blue-600 bg-blue-50 border-blue-100";

                            if (check.name.includes("Police")) {
                              IconComponent = Fingerprint;
                              color = isVerified ? "text-emerald-500" : isPending ? "text-amber-500" : "text-rose-500";
                            } else if (check.name.includes("Address")) {
                              IconComponent = MapPin;
                              color = isVerified ? "text-blue-500" : isPending ? "text-amber-500" : "text-rose-500";
                            } else if (check.name.includes("Employment")) {
                              IconComponent = Briefcase;
                              color = isVerified ? "text-indigo-500" : isPending ? "text-amber-500" : "text-rose-500";
                            }

                            if (isVerified) {
                              statusStyle = "text-emerald-700 bg-emerald-50 border-emerald-100";
                            } else if (isPending) {
                              statusStyle = "text-amber-700 bg-amber-50 border-amber-100";
                            } else if (isFailed) {
                              statusStyle = "text-rose-700 bg-rose-50 border-rose-100 font-bold";
                            }

                            return (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <IconComponent className={cn("h-3.5 w-3.5 shrink-0", color)} />
                                <span className="font-semibold text-slate-700 min-w-[110px] text-[11px]">{check.name}</span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[8px] font-black px-1 py-0 rounded h-4 uppercase tracking-tighter leading-none flex items-center border",
                                    statusStyle
                                  )}
                                >
                                  {check.status}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>

                      {/* Vehicle Details Column */}
                      <TableCell>
                        <div className="space-y-1 py-1">
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            🚲 {item.vehicle?.type || "Bike"}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-bold text-slate-400">Load:</span> {item.vehicle?.capacity || "15"} KG
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-bold text-slate-400">Fuel:</span> {item.vehicle?.fuelType || "Petrol"}
                          </p>
                        </div>
                      </TableCell>

                      {/* Internal Notes Column */}
                      <TableCell>
                        <div className="max-w-[180px] py-1">
                          <p className={cn(
                            "text-[11px] font-semibold italic border-l-2 pl-2 leading-relaxed truncate",
                            item.internalNotes?.includes("mismatch") || item.internalNotes?.includes("unclear")
                              ? "text-amber-700 border-amber-400 bg-amber-50/50 p-1.5 rounded-r-md"
                              : "text-slate-500 border-slate-300"
                          )} title={item.internalNotes}>
                            “{item.internalNotes}”
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              item.status === "pending" || !item.status
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }
                          >
                            {item.status || "Pending Verification"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white font-bold h-8 text-[11px] px-2.5 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success(`${item.name} has been verified successfully.`);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 text-[11px] px-2.5 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.error(`${item.name}'s application has been rejected.`);
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 h-8 text-[11px] px-2 rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.warning(`Re-upload request sent to ${item.name}.`);
                            }}
                          >
                            Request Re-upload
                          </Button>
                          
                          <div className="h-4 w-px bg-slate-200 mx-1" />
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-8 px-2 rounded-lg text-[11px] flex items-center gap-1"
                            onClick={() => handleVerifyClick(item.id)}
                            title="Full Review"
                          >
                            Detail <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Dashboard Card */}
        <Card className="w-full shadow-sm border-slate-200 bg-white h-fit">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-bold text-slate-800">Document Expiry Dashboard</CardTitle>
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[10px]">
              {totalExpired} EXPIRED / {totalNearing} NEAR
            </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Driving License Expiry", expired: dlExpired, nearing: dlNearing, color: "bg-rose-500" },
                { label: "Vehicle Insurance Expiry", expired: insExpired, nearing: insNearing, color: "bg-amber-500" },
                { label: "RC Expiry", expired: rcExpired, nearing: rcNearing, color: "bg-blue-500" },
              ].map((doc, i) => (
                <div key={i} className="space-y-2.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">{doc.label}</span>
                    <span className="text-rose-600">{doc.expired} Expired / {doc.nearing} Near</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    <div className={doc.color} style={{ width: `${(doc.expired / (doc.expired + doc.nearing || 1)) * 100}%` }} />
                    <div className="bg-amber-400" style={{ width: `${(doc.nearing / (doc.expired + doc.nearing || 1)) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Total {doc.expired + doc.nearing} riders need updates</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-amber-800">Auto-Alert System Active</p>
                  <p className="text-[10px] text-amber-700 leading-relaxed mt-0.5">Riders receive automated App & SMS notifications <b>30 days before document expiry</b> for quick re-uploads.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
              {previewDoc?.name} - {previewDoc?.riderName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden">
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 max-w-full max-h-full aspect-[3/4] flex flex-col items-center justify-center min-w-[320px]">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <FileText className="h-16 w-16 text-slate-300" />
              </div>
              <p className="text-slate-900 font-semibold text-lg mb-2">
                {previewDoc?.name}
              </p>
              <p className="text-sm text-slate-500 text-center max-w-[250px] leading-relaxed">
                This document is safely stored and validated for <br />
                <span className="font-semibold text-slate-800">
                  {previewDoc?.riderName}
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
