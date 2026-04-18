"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, Wallet, Calendar, ShieldCheck, Bike, FileText, MapPin, Star, Clock, CheckCircle, AlertTriangle, Loader2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

const formatDate = (dateStr: string) => {
  try { return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return dateStr; }
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export default function RiderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const riderId = params.id as string;

  const [rider, setRider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRider = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users/${riderId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Rider not found");
      setRider(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [riderId]);

  useEffect(() => { fetchRider(); }, [fetchRider]);

  const handleBlock = async () => {
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users/${riderId}/block`, {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ blocked: !rider.isBlocked }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(rider.isBlocked ? "Rider unblocked" : "Rider blocked");
      fetchRider();
    } catch (err: any) { toast.error(err.message); }
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading rider...</p></div>;
  if (error || !rider) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><AlertTriangle className="h-10 w-10 text-red-500" /><p className="text-slate-500">{error || "Not found"}</p><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Go Back</Button></div>;

  const rp = rider.riderProfile || {};
  const status = rider.isBlocked ? "Blocked" : "Active";

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{rider.name}</h1>
              <Badge className={cn("text-xs border", status === "Active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200")}>{status}</Badge>
            </div>
            <p className="text-sm text-slate-500">Rider ID: {rider.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className={`gap-2 rounded-xl ${rider.isBlocked ? "text-emerald-600" : "text-red-600"}`} onClick={handleBlock}>
            {rider.isBlocked ? <><CheckCircle className="h-4 w-4" /> Unblock</> : <><Ban className="h-4 w-4" /> Block</>}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left: Profile & Vehicle */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <Card className="shadow-sm border-slate-200 overflow-hidden rounded-2xl">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 relative">
              <div className="absolute -bottom-10 left-6">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-md">
                  <AvatarFallback className="bg-slate-800 text-white text-xl font-bold">{(rider.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-12 pb-6 px-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{rider.name}</h2>
                  <div className="flex items-center gap-1 text-slate-500 text-sm"><MapPin className="h-3 w-3" /> {rider.addresses?.[0]?.city || "—"}</div>
                </div>
              </div>
              <div className="space-y-3 mt-6">
                {rider.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Mail className="h-4 w-4" /></div>
                    <div><p className="text-xs text-slate-400 uppercase">Email</p><p className="font-medium text-slate-700">{rider.email}</p></div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Phone className="h-4 w-4" /></div>
                  <div><p className="text-xs text-slate-400 uppercase">Phone</p><p className="font-medium text-slate-700">{rider.phone}</p></div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Calendar className="h-4 w-4" /></div>
                  <div><p className="text-xs text-slate-400 uppercase">Joined</p><p className="font-medium text-slate-700">{formatDate(rider.createdAt)}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          {rp.vehicleType && (
            <Card className="shadow-sm border-slate-200 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Bike className="h-5 w-5 text-slate-500" /> Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-xl p-4 border grid grid-cols-2 gap-y-4">
                  <div><p className="text-xs text-slate-500 uppercase">Type</p><p className="font-semibold text-slate-800">{rp.vehicleType}</p></div>
                  {rp.vehiclePlate && <div className="col-span-2"><p className="text-xs text-slate-500 uppercase">Plate</p><span className="font-mono font-bold text-base bg-white border px-3 py-1 rounded shadow-sm text-slate-800">{rp.vehiclePlate}</span></div>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Stats & Documents */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-slate-200 bg-emerald-50/50 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Wallet</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{rider.walletBalance != null ? formatINR(rider.walletBalance) : "₹0"}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deliveries</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{rider.totalOrders ?? "—"}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{rp.isVerified ? "Yes" : "No"}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Role</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 capitalize">{rider.role}</p>
              </CardContent>
            </Card>
          </div>

          {/* Documents */}
          <Card className="shadow-sm border-slate-200 rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5 text-slate-500" /> Documents & Verification</CardTitle>
              <Badge variant="outline" className={rp.isVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                {rp.isVerified ? "Verified" : "Pending"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: "Driving License", url: rp.drivingLicenseUrl },
                  { name: "Aadhar Card", url: rp.aadharUrl },
                  { name: "Vehicle RC", url: rp.vehicleRcUrl },
                  { name: "Profile Photo", url: rp.profilePhotoUrl },
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500"><FileText className="h-5 w-5" /></div>
                      <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", doc.url ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200")}>
                      {doc.url ? "Uploaded" : "Missing"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
