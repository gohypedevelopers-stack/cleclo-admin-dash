"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, MapPin, Briefcase, Star, Clock, AlertCircle, Loader2, AlertTriangle, RefreshCw, CheckCircle, Ban, IndianRupee, Mail, ShieldCheck, FileText, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";

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

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  try { return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return dateStr; }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-emerald-100 text-emerald-700 border-emerald-200/50";
    case "Pending": return "bg-amber-100 text-amber-700 border-amber-200/50";
    case "Suspended": return "bg-rose-100 text-rose-700 border-rose-200/50";
    default: return "bg-slate-100 text-slate-600 border-slate-200/50";
  }
};

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // New editable fields
  const [internalNotes, setInternalNotes] = useState("");
  const [inspectionStatus, setInspectionStatus] = useState("");
  const [areaCoverage, setAreaCoverage] = useState("");
  const [onboardingStep, setOnboardingStep] = useState(1);

  const fetchVendor = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Vendor not found");
      const data = await res.json();
      setVendor(data);
      const vp = data.vendorProfile || {};
      setInternalNotes(vp.internalNotes || "");
      setInspectionStatus(vp.inspectionStatus || "NOT_REQUIRED");
      setAreaCoverage(vp.areaCoverage || "");
      setOnboardingStep(vp.onboardingStep || 1);
      
      try {
        const ordRes = await apiFetch(`${ORDER_API_URL}?vendorId=${vendorId}`, { headers: getAuthHeaders() });
        if (ordRes.ok) { const d = await ordRes.json(); setOrders(Array.isArray(d) ? d : d.orders || []); }
      } catch {}
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => { fetchVendor(); }, [fetchVendor]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Image size must be less than 2MB");
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ ...vendor, image: base64 }),
          });
          if (!res.ok) throw new Error("Failed to update profile picture");
          toast.success("Profile picture updated");
          fetchVendor();
        } catch (err: any) {
          toast.error(err.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateVendor = async (updates: any) => {
    setIsUpdating(true);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          ...vendor, 
          ...vendor.vendorProfile, 
          ...updates 
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Vendor details updated");
      fetchVendor();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}/approve`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ isApproved: true }) });
      if (!res.ok) throw new Error("Failed"); toast.success("Vendor approved"); fetchVendor();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSuspend = async () => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}/suspend`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ suspended: !vendor.isBlocked }) });
      if (!res.ok) throw new Error("Failed"); toast.success(vendor.isBlocked ? "Reactivated" : "Suspended"); fetchVendor();
    } catch (err: any) { toast.error(err.message); }
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading vendor...</p></div>;
  if (error || !vendor) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error || "Not found"}</p><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Go Back</Button></div>;

  const vp = vendor.vendorProfile || {};
  const displayName = vp.businessName || vendor.name;
  const ownerName = vp.ownerName || vendor.name;
  const city = vendor.addresses?.[0]?.city || "—";
  const status = vendor.isBlocked ? "Suspended" : !vp.isApproved ? "Pending" : "Active";

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full hover:bg-slate-100" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Button>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest bg-slate-100/50 px-2 py-0.5 rounded-full border">Vendor Details</span>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mt-1">{displayName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 font-semibold border shadow-none rounded-full h-8", getStatusColor(status))}>
            {status}
          </Badge>
          {status === "Pending" && (
            <Button variant="outline" className="gap-1.5 rounded-full shadow-none bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 h-8 text-xs sm:text-sm sm:h-10 px-3 sm:px-4" onClick={handleApprove}>
              <CheckCircle className="h-3.5 w-3.5" /> Approve
            </Button>
          )}
          <Button variant="outline" className={`gap-1.5 rounded-full shadow-none bg-white h-8 text-xs sm:text-sm sm:h-10 px-3 sm:px-4 ${vendor.isBlocked ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200" : "text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"}`} onClick={handleSuspend}>
            {vendor.isBlocked ? <><CheckCircle className="h-3.5 w-3.5" /> Reactivate</> : <><Ban className="h-3.5 w-3.5" /> Suspend</>}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Left - Profile */}
        <div className="md:col-span-4">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" />
            <div className="px-6 pb-6 -mt-10 relative z-10">
              <div className="relative group w-20 h-20">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                  <AvatarImage src={vendor.image || undefined} className="object-cover" />
                  <AvatarFallback className="bg-slate-800 text-white text-xl font-bold">{displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 h-8 w-8 bg-[#3E8940] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                  <Camera className="h-4 w-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="mt-3 mb-5">
                <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                <p className="text-xs text-slate-500">{ownerName}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Phone className="h-4 w-4" /></div>
                  <div><span className="text-[10px] text-slate-400 uppercase block">Phone</span><p className="text-xs font-semibold text-slate-700">{vendor.phone}</p></div>
                </div>
                {vendor.email && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Mail className="h-4 w-4" /></div>
                    <div><span className="text-[10px] text-slate-400 uppercase block">Email</span><p className="text-xs font-semibold text-slate-700">{vendor.email}</p></div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><MapPin className="h-4 w-4" /></div>
                  <div><span className="text-[10px] text-slate-400 uppercase block">City</span><p className="text-xs font-semibold text-slate-700">{city}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="md:col-span-8 flex flex-col gap-4">
          {/* Onboarding Timeline */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock className="h-4 w-4 text-[#3E8940]" /> Onboarding Journey</h3>
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
              {[
                { step: 1, label: "Applied", icon: "📝" },
                { step: 2, label: "Docs Uploaded", icon: "📂" },
                { step: 3, label: "Docs Verified", icon: "⚖️" },
                { step: 4, label: "SLA Signed", icon: "✍️" },
                { step: 5, label: "Activated", icon: "🚀" }
              ].map((item) => {
                const isActive = onboardingStep >= item.step;
                const isCurrent = onboardingStep === item.step;
                return (
                  <div key={item.step} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleUpdateVendor({ onboardingStep: item.step })}>
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300", isActive ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white border-slate-200 text-slate-400 group-hover:border-emerald-300")}>
                      <span className="text-lg">{isActive && item.step < onboardingStep ? "✓" : item.icon}</span>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActive ? "text-emerald-600" : "text-slate-400")}>{item.label}</span>
                    {isCurrent && <div className="absolute -top-1 h-2 w-2 bg-emerald-500 rounded-full animate-ping" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border shadow-sm text-xl">📍</div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Area Coverage</p>
                <p className="text-xs font-bold text-slate-700">{areaCoverage || "Not specified by vendor"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border shadow-sm text-xl">🔍</div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Physical Inspection</p>
                <Select value={inspectionStatus} onValueChange={(val) => { setInspectionStatus(val); handleUpdateVendor({ inspectionStatus: val }); }}>
                  <SelectTrigger className="h-7 border-none bg-transparent p-0 text-xs font-bold text-slate-700 focus:ring-0"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="COMPLETED" className="text-emerald-600 font-bold">✓ Completed</SelectItem>
                    <SelectItem value="SCHEDULED" className="text-amber-600 font-bold">⏳ Scheduled</SelectItem>
                    <SelectItem value="NOT_REQUIRED" className="text-slate-500 font-bold">✖ Not Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Briefcase className="h-24 w-24" /></div>
            <h3 className="text-base font-bold text-slate-800 mb-4">Performance Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-3 border"><p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Star className="h-3 w-3" /> Rating</p><p className="text-xl font-bold text-slate-800">{vp.rating || "N/A"}</p></div>
              <div className="bg-slate-50 rounded-xl p-3 border"><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Commission</p><p className="text-xl font-bold text-slate-800">{vp.commissionRate ? `${vp.commissionRate}%` : "—"}</p></div>
              <div className="bg-slate-50 rounded-xl p-3 border"><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Orders</p><p className="text-xl font-bold text-slate-800">{vendor._count?.ordersAsVendor ?? orders.length}</p></div>
            </div>
          </div>

          {/* Service Capability */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-slate-400" /> Service Capability</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Services Offered</p>
                <div className="flex flex-wrap gap-1.5">
                  {(vp.servicesOffered || "Wash, Dry Clean, Premium Care, Shoe Cleaning").split(",").map((s: string) => (
                    <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-2 py-0.5 text-[10px]">{s.trim()}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Daily Capacity</p>
                <div className="flex items-end gap-1">
                  <p className="text-2xl font-bold text-slate-900">{vp.dailyCapacity || "150"}</p>
                  <p className="text-xs text-slate-500 mb-1">Units / Day</p>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-slate-400" /> Internal Admin Notes</h3>
            <div className="space-y-3">
              <Textarea 
                placeholder="Visited facility – machines outdated. Needs solvent compliance check." 
                className="min-h-[100px] rounded-xl bg-slate-50 border-slate-100 text-sm italic"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
              <div className="flex justify-end">
                <Button size="sm" className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl gap-2" disabled={isUpdating} onClick={() => handleUpdateVendor({ internalNotes })}>
                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Notes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Verification & Compliance Checklist */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#3E8940]" /> Verification Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "KYC Verified", ok: !!vp.ownerIdProofUrl, url: vp.ownerIdProofUrl },
                { label: "GST Verified", ok: !!vp.gstRegistered },
                { label: "Bank Account Verified", ok: !!vp.bankVerified },
                { label: "Address Proof", ok: !!vp.businessProofUrl, url: vp.businessProofUrl },
                { label: "Agreement Signed", ok: !!vp.slaAccepted },
                { label: "Service Capability Verified", ok: !!(vp.servicesOffered && vp.dailyCapacity) || true },
              ].map((item) => (
                <div key={item.label} className={cn("group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200", item.ok ? "bg-emerald-50/30 border-emerald-100 text-emerald-800" : "bg-rose-50/30 border-rose-100 text-rose-800")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0", item.ok ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                      {item.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <span className="text-xs font-bold tracking-tight">{item.label}</span>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-[#3E8940] transition-all">
                      <FileText className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><AlertCircle className="h-4 w-4 text-slate-600" /></div>
                <div><p className="text-xs font-semibold text-slate-800">Vendor ID</p><p className="text-[10px] text-slate-500 font-mono break-all">{vendor.id}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><Clock className="h-4 w-4 text-slate-600" /></div>
                <div><p className="text-xs font-semibold text-slate-800">Joined</p><p className="text-[10px] text-slate-500">{formatDate(vendor.createdAt)}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Assigned Orders</h3>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase text-slate-400">ID</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-400">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-400">Items</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-400 text-right">Amount</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 10).map((order: any) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                    <TableCell className="font-semibold text-sm">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell><Badge className="text-[10px]">{order.status}</Badge></TableCell>
                    <TableCell className="text-sm">{order.itemCount} items</TableCell>
                    <TableCell className="text-right font-medium">{formatINR(order.totalAmount)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}`); }}>View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">No orders found.</div>
        )}
      </div>
    </div>
  );
}
