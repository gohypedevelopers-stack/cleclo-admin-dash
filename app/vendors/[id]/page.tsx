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

  const fetchVendor = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${vendorId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Vendor not found");
      setVendor(await res.json());
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
                  <AvatarImage src={vendor.image} className="object-cover" />
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

          {/* Documents */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-slate-400" /> Verification Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "KYC ID Proof", ok: !!vp.ownerIdProofUrl, url: vp.ownerIdProofUrl },
                { label: "Business Proof", ok: !!vp.businessProofUrl, url: vp.businessProofUrl },
                { label: "Bank Verified", ok: !!vp.bankVerified },
                { label: "GST Registered", ok: !!vp.gstRegistered },
                { label: "Terms Accepted", ok: !!vp.termsAccepted },
                { label: "SLA Agreement", ok: !!vp.slaAccepted },
              ].map((doc) => {
                const inner = (
                  <>
                    {doc.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {doc.label}
                  </>
                );
                const className = `flex items-center justify-between gap-2 p-3 rounded-xl border text-xs font-bold ${doc.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`;
                
                if (doc.url) {
                  return (
                    <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer" className={`${className} hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer`}>
                      <span className="flex items-center gap-2">{inner}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link opacity-70"><path d="M15 3h6v6"/><path d="10 14 21-21"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                    </a>
                  );
                }
                return (
                  <div key={doc.label} className={className}>
                    <span className="flex items-center gap-2">{inner}</span>
                  </div>
                );
              })}
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
