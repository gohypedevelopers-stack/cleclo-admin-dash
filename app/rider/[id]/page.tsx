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
  Bike,
  FileText,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { USERS } from "@/lib/usersData";
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
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Mock extended data for rider
const RIDER_EXTENDED_DATA = {
  vehicle: {
    type: "Honda Activa 6G",
    plate: "KA-01-EQ-1234",
    color: "Matte Blue",
    category: "Scooter",
  },
  documents: [
    { name: "Driving License", status: "Verified", expiry: "2028-05-20" },
    { name: "Vehicle RC", status: "Verified", expiry: "2030-11-15" },
    { name: "Insurance", status: "Pending Renewal", expiry: "2024-02-10" },
    { name: "Aadhar Card", status: "Verified", expiry: "Lifetime" },
  ],
  metrics: {
    acceptanceRate: "94%",
    cancellationRate: "1.2%",
    totalDistance: "12,450 km",
    avgDeliveryTime: "24 mins",
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Blocked":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const getDocStatusColor = (status: string) => {
  switch (status) {
    case "Verified":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "Pending Renewal":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-slate-700 bg-slate-50 border-slate-200";
  }
};

export default function RiderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;
  const user = USERS.find((u) => u.id === userId);
  const [userData, setUserData] = useState(user);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUserData(user);
    } else if (userId) {
      // Fallback for mock IDs or when user is not found in static list (Demo robustness)
      setUserData({
        id: Array.isArray(userId) ? userId[0] : userId,
        name: "Mock Rider Profile",
        email: "rider@example.com",
        phone: "+91 99999 88888",
        walletBalance: "₹0",
        status: "Pending",
        type: "Regular",
        joinDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [user, userId]);

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-500 font-medium mb-4">
            Loading rider details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {userData.name}
              </h1>
              <Badge
                className={cn(
                  "text-xs border",
                  getStatusColor(userData.status),
                )}
              >
                {userData.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">Rider ID: {userData.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            Edit Profile
          </Button>
          <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90">
            View Analytics
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Profile & Vehicle - Spans 4 */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Profile Card */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 relative">
              <div className="absolute -bottom-10 left-6">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-md">
                  <AvatarFallback className="bg-slate-800 text-white text-xl font-bold">
                    {userData.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-12 pb-6 px-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {userData.name}
                  </h2>
                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <MapPin className="h-3 w-3" /> Bangalore, KA
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-700">4.8</span>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-400 font-medium uppercase">
                      Email
                    </p>
                    <p className="font-medium text-slate-700 truncate">
                      {userData.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">
                      Phone
                    </p>
                    <p className="font-medium text-slate-700">
                      {userData.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">
                      Joined
                    </p>
                    <p className="font-medium text-slate-700">
                      {userData.joinDate}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bike className="h-5 w-5 text-slate-500" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase">
                      Model
                    </p>
                    <p className="font-semibold text-slate-800">
                      {RIDER_EXTENDED_DATA.vehicle.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase">
                      Color
                    </p>
                    <p className="font-semibold text-slate-800">
                      {RIDER_EXTENDED_DATA.vehicle.color}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 font-medium uppercase">
                      Number Plate
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-bold text-base bg-white border px-3 py-1 rounded shadow-sm text-slate-800">
                        {RIDER_EXTENDED_DATA.vehicle.plate}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats, Earnings, Documents - Spans 8 */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-slate-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                  Wallet
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {userData.walletBalance}
                </p>
                <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-medium">
                  <CheckCircle className="h-3 w-3" /> Paid out recently
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Deliveries
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">1,248</p>
                <p className="text-xs text-slate-400 mt-1">Lifetime total</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acceptance
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {RIDER_EXTENDED_DATA.metrics.acceptanceRate}
                </p>
                <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  On-Time
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">98%</p>
                <p className="text-xs text-slate-400 mt-1">
                  {RIDER_EXTENDED_DATA.metrics.avgDeliveryTime} avg
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Documents */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Documents & Verification
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                All Verified
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {RIDER_EXTENDED_DATA.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {doc.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Exp: {doc.expiry}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getDocStatusColor(doc.status))}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Deliveries Table */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Recent Deliveries</CardTitle>
              <CardDescription>
                Latest orders completed by this rider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Earning</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">#ORD-00{i}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs gap-1">
                          <span className="flex items-center gap-1 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>{" "}
                            Indiranagar
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>{" "}
                            Koramangala
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        24 mins
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        ₹45.00
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-[10px]"
                        >
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
