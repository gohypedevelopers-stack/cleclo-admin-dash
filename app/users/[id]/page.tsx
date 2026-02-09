"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Phone,
  Wallet,
  Calendar,
  ShieldCheck,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { USERS } from "@/lib/usersData";
import { ORDERS } from "@/lib/ordersData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200/50";
    case "Blocked":
      return "bg-rose-100 text-rose-700 border-rose-200/50";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200/50";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "VIP":
      return "bg-purple-100/50 text-purple-700 border-purple-200/50";
    case "Top Spender":
      return "bg-amber-100/50 text-amber-700 border-amber-200/50";
    case "New":
      return "bg-blue-100/50 text-blue-700 border-blue-200/50";
    default:
      return "bg-slate-100/50 text-slate-600 border-slate-200/50";
  }
};

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case "Processing":
      return "bg-yellow-100 text-yellow-600 border-yellow-200/50";
    case "Assigned":
      return "bg-blue-100 text-blue-600 border-blue-200/50";
    case "Ready":
      return "bg-green-100 text-green-600 border-green-200/50";
    case "Pending Pickup":
      return "bg-orange-100 text-orange-600 border-orange-200/50";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200/50";
  }
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;
  const user = USERS.find((u) => u.id === userId);
  const [userData, setUserData] = useState(user);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    walletBalance: "",
  });

  useEffect(() => {
    if (user) {
      setUserData(user);
    }
  }, [user]);

  // Filter orders for this specific customer
  const userOrders = ORDERS.filter(
    (order) => order.customer === userData?.name,
  );

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/40 text-center">
          <p className="text-slate-500 font-medium">User not found</p>
          <Button
            variant="outline"
            className="mt-4 bg-white/80 hover:bg-white border-slate-200"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/50 hover:bg-white border border-white/40 shadow-sm transition-all duration-300 hover:scale-105"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest bg-slate-100/50 px-2 py-0.5 rounded-full border border-slate-200/50">
                User Details
              </span>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-900 via-slate-800 to-slate-700">
              {userData.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-2 border-slate-200"
            onClick={() => {
              setEditForm({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                walletBalance: userData.walletBalance,
              });
              setIsEditOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
          <Badge
            className={cn(
              "text-xs px-3 py-1 font-semibold backdrop-blur-md shadow-sm border",
              getStatusColor(userData.status),
            )}
          >
            {userData.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Main Profile Card - Spans 4 columns (Reduced from 5) */}
        <div className="md:col-span-4 flex flex-col">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden h-full transform transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] duration-500">
            <div className="h-24 bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center relative overlow-hidden">
              <div className="absolute inset-0 opacity-30 pattern-grid-lg" />
            </div>
            <div className="px-6 pb-6 -mt-10 relative z-10">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                <AvatarFallback className="bg-linear-to-br from-slate-800 to-slate-950 text-white text-xl font-bold">
                  {userData.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="mt-3 mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  {userData.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Member since {userData.joinDate}
                </p>
              </div>

              <div className="space-y-3">
                <div className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                      Email
                    </span>
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {userData.email}
                    </p>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                      Phone
                    </span>
                    <p className="text-xs font-semibold text-slate-700">
                      {userData.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Spans 8 columns (Increased from 7) */}
        <div className="md:col-span-8 flex flex-col gap-4">
          {/* Wallet Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
              <Wallet className="h-24 w-24" />
            </div>

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  Wallet Balance
                </h3>
                <p className="text-slate-500 text-xs">Available for use</p>
              </div>
              <Badge
                className={cn(
                  "border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm",
                  getTypeColor(userData.type),
                )}
              >
                {userData.type}
              </Badge>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-emerald-600 to-emerald-400">
                {userData.walletBalance}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 rounded-xl p-3 border border-white/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Total Orders
                </p>
                <p className="text-xl font-bold text-slate-800">24</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3 border border-white/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Average Order
                </p>
                <p className="text-xl font-bold text-slate-800">₹45.00</p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 flex-1">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Account Status
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Verified Member
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Identity verified
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Active Member
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Since {userData.joinDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/50">
              <Button
                variant="ghost"
                onClick={() => router.push("/users")}
                className="w-full justify-between h-8 text-xs group hover:bg-slate-100/50 text-slate-600"
              >
                <span className="font-medium">View all users</span>
                <ArrowLeft className="h-3 w-3 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Orders</h3>
        {userOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-200/60">
                <TableHead className="w-[100px] text-xs font-bold uppercase text-slate-400">
                  ID
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">
                  Items
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">
                  Due Date
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400 text-right">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                >
                  <TableCell className="font-semibold text-slate-700 text-sm">
                    {order.id}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {order.itemCount} Items ({order.orderItems[0]?.name}
                    {order.itemCount > 1 ? ` +${order.itemCount - 1} more` : ""}
                    )
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[10px] px-2 py-0.5 border font-medium shadow-sm",
                        getOrderStatusColor(order.status),
                      )}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {order.dueDate}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-800 text-sm">
                    {order.amount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-700"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            No recent orders found for this user.
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="wallet" className="text-sm font-medium">
                  Wallet Balance
                </label>
                <Input
                  id="wallet"
                  value={editForm.walletBalance}
                  onChange={(e) =>
                    setEditForm({ ...editForm, walletBalance: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={() => {
                if (userData) {
                  setUserData({
                    ...userData,
                    name: editForm.name,
                    email: editForm.email,
                    phone: editForm.phone,
                    walletBalance: editForm.walletBalance,
                  });
                  setIsEditOpen(false);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
