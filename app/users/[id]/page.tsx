"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, Wallet, Calendar, ShieldCheck, MoreVertical, Loader2, AlertTriangle, RefreshCw, Ban, CheckCircle, Camera } from "lucide-react";
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
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-emerald-100 text-emerald-700 border-emerald-200/50";
    case "Blocked": return "bg-rose-100 text-rose-700 border-rose-200/50";
    default: return "bg-slate-100 text-slate-600 border-slate-200/50";
  }
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users/${userId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("User not found");
      setUser(await res.json());

      // Try to fetch user orders
      try {
        const ordRes = await apiFetch(`${ORDER_API_URL}?userId=${userId}`, { headers: getAuthHeaders() });
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(Array.isArray(ordData) ? ordData : ordData.orders || []);
        }
      } catch {}
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Image size must be less than 2MB");
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await apiFetch(`${AUTH_API_URL}/users/${userId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ ...user, image: base64 }),
          });
          if (!res.ok) throw new Error("Failed to update profile picture");
          toast.success("Profile picture updated");
          fetchUser();
        } catch (err: any) {
          toast.error(err.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlock = async () => {
    try {
      const isCurrentlyBlocked = user.status === 'blocked';
      const res = await apiFetch(`${AUTH_API_URL}/users/${userId}/block`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ blocked: !isCurrentlyBlocked }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(isCurrentlyBlocked ? "User unblocked" : "User blocked");
      fetchUser();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResetPassword = async () => {
    const newPassword = prompt("Enter new password for " + user.name, "Password123!");
    if (!newPassword) return;
    
    setIsLoading(true);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/users/${userId}/reset-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      toast.success("Password reset successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm text-slate-500">Loading user...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-slate-500">{error || "User not found"}</p>
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Go Back</Button>
      </div>
    );
  }

  const status = user.status === 'blocked' ? "Blocked" : "Active";

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Button>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest bg-slate-100/50 px-2 py-0.5 rounded-full border">User Details</span>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">{user.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 font-semibold border shadow-none rounded-full h-8", getStatusColor(status))}>
            {status}
          </Badge>
          <Button variant="outline" className="gap-1.5 rounded-full shadow-none bg-white h-10 px-4 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleResetPassword}>
            <RefreshCw className="h-4 w-4" /> Reset Password
          </Button>
          <Button variant="outline" className={`gap-1.5 rounded-full shadow-none bg-white h-8 text-xs sm:text-sm sm:h-10 px-3 sm:px-4 ${user.status === 'blocked' ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200" : "text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"}`} onClick={handleBlock}>
            {user.status === 'blocked' ? <><CheckCircle className="h-3.5 w-3.5" /> Unblock</> : <><Ban className="h-3.5 w-3.5" /> Block</>}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-12">
        {/* Profile Card */}
        <div className="md:col-span-4">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50" />
            <div className="px-6 pb-6 -mt-10 relative z-10">
              <div className="relative group w-20 h-20">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                  <AvatarImage src={user.image || null} className="object-cover" />
                  <AvatarFallback className="bg-slate-800 text-white text-xl font-bold">
                    {(user.name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 h-8 w-8 bg-[#3E8940] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                  <Camera className="h-4 w-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="mt-3 mb-5">
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <p className="text-xs text-slate-500">Member since {formatDate(user.createdAt)}</p>
              </div>
              <div className="space-y-3">
                {user.email && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Mail className="h-4 w-4" /></div>
                    <div><span className="text-[10px] text-slate-400 uppercase block">Email</span><p className="text-xs font-semibold text-slate-700">{user.email}</p></div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Phone className="h-4 w-4" /></div>
                  <div><span className="text-[10px] text-slate-400 uppercase block">Phone</span><p className="text-xs font-semibold text-slate-700">{user.phone}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-8 flex flex-col gap-4">
          {/* Wallet & Stats */}
          <div className="bg-white rounded-2xl border shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Wallet className="h-24 w-24" /></div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Wallet Balance</h3>
            <p className="text-4xl font-extrabold text-emerald-600">{user.walletBalance != null ? formatINR(user.walletBalance) : "₹0"}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 rounded-xl p-3 border">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Orders</p>
                <p className="text-xl font-bold text-slate-800">{user.totalOrders ?? orders.length ?? 0}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Role</p>
                <p className="text-xl font-bold text-slate-800 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">Account Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><ShieldCheck className="h-4 w-4" /></div>
                <div><p className="text-xs font-semibold text-slate-800">{user.isBlocked ? "Blocked" : "Verified"}</p><p className="text-[10px] text-slate-500">Account status</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                <div><p className="text-xs font-semibold text-slate-800">Since {formatDate(user.createdAt)}</p><p className="text-[10px] text-slate-500">Member</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Orders</h3>
        {orders.length > 0 ? (
          <Table>
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
                  <TableCell className="font-semibold text-slate-700 text-sm">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell><Badge className="text-[10px]">{order.status}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-600">{order.itemCount} items</TableCell>
                  <TableCell className="text-right font-medium">{formatINR(order.totalAmount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">No orders found for this user.</div>
        )}
      </div>
    </div>
  );
}
