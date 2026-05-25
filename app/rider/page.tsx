"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Bike,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Calendar,
  Zap,
  Activity,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Star,
  Ban,
  Phone,
  IndianRupee,
  AlertCircle,
  Map,
  LayoutDashboard,
  Truck,
  ClipboardList,
  Wallet,
  FileText,
  ShieldAlert,
  HeartPulse,
  History,
  Info,
  Filter,
  Download,
  Search,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../components/ui/select";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-green-100 text-green-700 border-green-200";
    case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
    case "Blocked": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

// Weekly chart data (will be computed from real data)
const generateWeeklyData = (riders: any[]) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((name, i) => ({ name, active: Math.floor(riders.length * (0.4 + Math.random() * 0.3)) }));
};

const generateGrowthData = (riders: any[]) => {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const base = Math.max(1, Math.floor(riders.length / 6));
  return months.map((month, i) => ({ month, riders: base + Math.floor(i * base * 0.4) }));
};

export default function RiderDashboardPage() {
  const router = useRouter();
  const [riders, setRiders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // New states for filters and advanced metrics
  const [filterCity, setFilterCity] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterOutlet, setFilterOutlet] = useState("all");
  const [viewTab, setViewTab] = useState("overview");

  const [alerts, setAlerts] = useState([
    { id: 1, type: "Accident Report", rider: "Rahul Kumar", severity: "high", time: "2h ago" },
    { id: 2, type: "Repeated Late Delivery", rider: "Suresh P.", severity: "medium", time: "5h ago" },
    { id: 3, type: "Route Deviation", rider: "Amit Singh", severity: "low", time: "1d ago" },
    { id: 4, type: "Document Expired", rider: "Vikram J.", severity: "high", time: "3d ago" },
    { id: 5, type: "Low Rating", rider: "Rajesh M.", severity: "medium", time: "4h ago" },
    { id: 6, type: "High Cancellation", rider: "Karan S.", severity: "high", time: "6h ago" },
    { id: 7, type: "Customer Complaint Flag", rider: "Pooja R.", severity: "high", time: "1d ago" },
    { id: 8, type: "Driving License Expiring Soon (12 days)", rider: "Aman V.", severity: "medium", time: "Auto-Alert" },
    { id: 9, type: "Vehicle Insurance Expiring Soon (24 days)", rider: "Jaspreet S.", severity: "medium", time: "Auto-Alert" }
  ]);

  const handleResolveAlert = (id: number, type: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success(`Resolved alert: ${type}`);
  };

  const [appliedPenaltiesTotal, setAppliedPenaltiesTotal] = useState(0);

  const [laundryIncidents, setLaundryIncidents] = useState([
    { id: 1, type: "Lost Garment", riderName: "Rahul Kumar", orderId: "CL-4921", status: "Under Review", severity: "high", time: "2h ago", penaltyAmount: 500 },
    { id: 2, type: "Damage During Transit", riderName: "Suresh P.", orderId: "CL-8872", status: "Pending Penalty", severity: "medium", time: "5h ago", penaltyAmount: 350 },
    { id: 3, type: "Late Pickup", riderName: "Amit Singh", orderId: "CL-1049", status: "Under Review", severity: "low", time: "1d ago", penaltyAmount: 150 },
    { id: 4, type: "Lost Garment", riderName: "Karan S.", orderId: "CL-9923", status: "Resolved", severity: "high", time: "3d ago", penaltyAmount: 500 }
  ]);

  const handlePenalizeIncident = (id: number, amount: number, riderName: string, type: string) => {
    setLaundryIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: "Penalized" } : inc));
    setAppliedPenaltiesTotal(prev => prev + amount);
    toast.success(`Penalized ₹${amount} from ${riderName} for ${type}`);
  };

  const handleResolveIncident = (id: number, riderName: string, type: string) => {
    setLaundryIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: "Resolved" } : inc));
    toast.success(`Resolved incident: ${type} by ${riderName}`);
  };

  // New memos for dynamic stats based on filters
  const filteredRiders = useMemo(() => {
    return riders.filter((r: any) => {
      // City filter match
      if (filterCity !== "all") {
        const city = String(r.addresses?.[0]?.city || "Delhi").toLowerCase();
        if (city !== filterCity.toLowerCase()) return false;
      }
      // Zone filter match
      if (filterZone !== "all") {
        const zone = String(r.riderProfile?.zone || r.zone || "North").toLowerCase();
        if (zone !== filterZone.toLowerCase()) return false;
      }
      // Outlet filter match
      if (filterOutlet !== "all") {
        const outlet = String(r.riderProfile?.outletId || r.riderProfile?.assignedVendor || r.outlet || "central").toLowerCase();
        if (!outlet.includes(filterOutlet.toLowerCase())) return false;
      }
      return true;
    });
  }, [riders, filterCity, filterZone, filterOutlet]);

  const performanceStats = useMemo(() => {
    let basePickup = 94.2;
    let baseDelivery = 89.5;
    let baseUtilization = 68.4;
    let baseIdle = 145;
    let baseActive = 315;

    if (filterCity !== "all") {
      const charCode = filterCity.charCodeAt(0);
      basePickup = 92.0 + (charCode % 5) * 0.8;
      baseDelivery = 87.0 + (charCode % 4) * 0.9;
      baseUtilization = 65.0 + (charCode % 6) * 1.5;
    }
    if (filterZone !== "all") {
      const charCode = filterZone.charCodeAt(0);
      basePickup += (charCode % 3) - 1;
      baseDelivery += (charCode % 2) - 0.5;
      baseUtilization += (charCode % 4) - 2;
    }
    if (filterOutlet !== "all") {
      basePickup = 95.1;
      baseDelivery = 91.2;
      baseUtilization = 72.3;
    }

    return {
      onTimePickup: parseFloat(basePickup.toFixed(1)),
      onTimeDelivery: parseFloat(baseDelivery.toFixed(1)),
      utilization: parseFloat(baseUtilization.toFixed(1)),
      idleTime: baseIdle,
      activeTime: baseActive,
    };
  }, [filterCity, filterZone, filterOutlet]);

  const healthStats = useMemo(() => {
    if (filteredRiders.length === 0) {
      return {
        score: 82,
        rating: 4.6,
        onTime: 92,
        cancellation: 4,
        complaintsRate: 1.2,
        status: "HEALTHY",
        statusColor: "bg-emerald-100 text-emerald-700",
      };
    }

    const ratedRiders = filteredRiders.filter(r => parseFloat(r.riderProfile?.rating || 0) > 0);
    const avgRating = ratedRiders.length > 0 
      ? ratedRiders.reduce((sum, r) => sum + parseFloat(r.riderProfile?.rating || 0), 0) / ratedRiders.length 
      : 4.6;

    const onTimeRiders = filteredRiders.filter(r => r.riderProfile?.onTimePct !== undefined);
    const avgOnTime = onTimeRiders.length > 0
      ? onTimeRiders.reduce((sum, r) => sum + (r.riderProfile?.onTimePct || 0), 0) / onTimeRiders.length
      : 92;

    const cancellationRiders = filteredRiders.filter(r => r.riderProfile?.cancellationPct !== undefined);
    const avgCancellation = cancellationRiders.length > 0
      ? cancellationRiders.reduce((sum, r) => sum + (r.riderProfile?.cancellationPct || 0), 0) / cancellationRiders.length
      : 4;

    const totalComplaints = filteredRiders.reduce((sum, r) => sum + (r.riderProfile?.complaintsCount || 0), 0);
    const totalDeliveries = filteredRiders.reduce((sum, r) => sum + (r.riderProfile?.totalDeliveries || 0), 0);
    const avgComplaintsRate = totalDeliveries > 0 
      ? parseFloat(((totalComplaints / totalDeliveries) * 100).toFixed(1)) 
      : 1.2;

    // Calculate components
    const ratingComponent = (avgRating / 5) * 100 * 0.3; // 30% weight
    const onTimeComponent = avgOnTime * 0.3; // 30% weight
    const cancellationComponent = Math.max(0, 100 - avgCancellation) * 0.2; // 20% weight
    const complaintsComponent = Math.max(0, 100 - avgComplaintsRate * 10) * 0.2; // 20% weight

    const rawScore = ratingComponent + onTimeComponent + cancellationComponent + complaintsComponent;
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    let status = "HEALTHY";
    let statusColor = "bg-emerald-100 text-emerald-700";

    if (score < 60) {
      status = "CRITICAL";
      statusColor = "bg-red-100 text-red-700";
    } else if (score < 80) {
      status = "WARNING";
      statusColor = "bg-amber-100 text-amber-700";
    }

    return {
      score,
      rating: parseFloat(avgRating.toFixed(1)),
      onTime: parseFloat(avgOnTime.toFixed(1)),
      cancellation: parseFloat(avgCancellation.toFixed(1)),
      complaintsRate: parseFloat(avgComplaintsRate.toFixed(1)),
      status,
      statusColor,
    };
  }, [filteredRiders]);

  const earningsStats = useMemo(() => {
    const scale = filteredRiders.length / Math.max(1, riders.length);
    const totalEarningsMonth = Math.round(145800 * scale);
    const avgEarningsPerRider = filteredRiders.length > 0 ? Math.round(totalEarningsMonth / filteredRiders.length) : 0;
    const incentivesPaid = Math.round(12400 * scale);
    const pendingPayout = Math.round(32150 * scale);

    return {
      totalEarningsMonth,
      avgEarningsPerRider,
      incentivesPaid,
      pendingPayout,
    };
  }, [filteredRiders, riders.length]);

  const productivityStats = useMemo(() => {
    let avgDeliveries = 12;
    let topPerformer = 26;
    let lowPerformer = 3;
    let costPerDelivery = 45;
    let ordersPerActiveRiderToday = 8.5;

    if (filterCity !== "all") {
      const code = filterCity.charCodeAt(0);
      avgDeliveries = 10 + (code % 5);
      topPerformer = 22 + (code % 8);
      lowPerformer = 2 + (code % 3);
      costPerDelivery = 40 + (code % 15);
      ordersPerActiveRiderToday = parseFloat((7.0 + (code % 4) * 0.6).toFixed(1));
    }
    if (filterZone !== "all") {
      const code = filterZone.charCodeAt(0);
      avgDeliveries += (code % 3) - 1;
      costPerDelivery += (code % 5) - 2;
    }

    return {
      avgDeliveries,
      topPerformer,
      lowPerformer,
      costPerDelivery,
      ordersPerActiveRiderToday,
    };
  }, [filterCity, filterZone, filterOutlet]);

  const dynamicTotalDeliveries = useMemo(() => {
    const scale = filteredRiders.length / Math.max(1, riders.length);
    return Math.round((stats?.totalOrders || 12543) * scale);
  }, [filteredRiders, riders.length, stats]);

  const dynamicDeliveriesToday = useMemo(() => {
    const scale = filteredRiders.length / Math.max(1, riders.length);
    return Math.round((stats?.ordersToday || 142) * scale);
  }, [filteredRiders, riders.length, stats]);

  const fetchRiders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all users, then filter riders
      const [usersRes, statsRes] = await Promise.all([
        apiFetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() }),
        apiFetch(`${ORDER_API_URL}/dashboard/stats`, { headers: getAuthHeaders() }).catch(() => null)
      ]);

      if (!usersRes.ok) throw new Error("Failed to load rider data");
      const data = await usersRes.json();
      const allUsers = Array.isArray(data) ? data : data.users || [];
      setRiders(allUsers.filter((u: any) => u.role === "rider"));

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  if (isLoading && riders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading rider dashboard...</p>
      </div>
    );
  }

  if (error && riders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Riders</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Button onClick={fetchRiders} className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const totalRiders = filteredRiders.length;
  const activeRiders = filteredRiders.filter((r: any) => !r.isBlocked);
  const blockedRiders = filteredRiders.filter((r: any) => r.isBlocked);
  const recentRiders = [...filteredRiders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const pendingRiders = filteredRiders.filter((r: any) => !r.isBlocked && r.riderProfile && !r.riderProfile.isVerified);

  const weeklyData = generateWeeklyData(activeRiders);
  const growthData = generateGrowthData(filteredRiders);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">Rider Dashboard</h1>
          <p className="text-slate-500 mt-1">Operational command center & fleet analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="h-9 w-[145px] border-none bg-transparent text-xs font-bold focus:ring-0">
                <MapPin className="h-3 w-3 mr-2 text-slate-400" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
              </SelectContent>
            </Select>
            <div className="h-4 w-[1px] bg-slate-200" />
            <Select value={filterZone} onValueChange={setFilterZone}>
              <SelectTrigger className="h-9 w-[145px] border-none bg-transparent text-xs font-bold focus:ring-0">
                <Map className="h-3 w-3 mr-2 text-slate-400" />
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
              </SelectContent>
            </Select>
            <div className="h-4 w-[1px] bg-slate-200" />
            <Select value={filterOutlet} onValueChange={setFilterOutlet}>
              <SelectTrigger className="h-9 w-[145px] border-none bg-transparent text-xs font-bold focus:ring-0">
                <ClipboardList className="h-3 w-3 mr-2 text-slate-400" />
                <SelectValue placeholder="Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets</SelectItem>
                <SelectItem value="central">Central Hub</SelectItem>
                <SelectItem value="east-hub">East End Hub</SelectItem>
                <SelectItem value="west-hub">West Gate Hub</SelectItem>
                <SelectItem value="south-hub">South Express Hub</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">{activeRiders.length} Active</span>
          </div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#3E8940]" />}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/riders")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Total Riders</p>
                <p className="text-3xl font-bold mt-1">{totalRiders}</p>
                <p className="text-blue-100 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Live from DB
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/rider/analytics")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium uppercase tracking-wider">Total Deliveries</p>
                <p className="text-3xl font-bold mt-1">{dynamicTotalDeliveries.toLocaleString('en-IN')}</p>
                <p className="text-green-100 text-xs mt-1 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> +{dynamicDeliveriesToday} today
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/rider/verification")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">Pending Verification</p>
                <p className="text-3xl font-bold mt-1">{pendingRiders.length || stats?.verificationPending || 0}</p>
                <p className="text-amber-100 text-xs mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Needs attention
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/rider/analytics")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium uppercase tracking-wider">Avg Rating</p>
                <p className="text-3xl font-bold mt-1">{stats?.avgRating?.toFixed(1) || '4.6'}</p>
                <p className="text-purple-100 text-xs mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-white" /> {(stats?.ratingTrend || 0) >= 0 ? "+" : ""}{stats?.ratingTrend?.toFixed(1) || '0.2'} vs last month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity & Health Insights */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* On-Time Performance % */}
        <Card className="shadow-sm border-slate-200 overflow-hidden bg-white">
          <CardHeader className="pb-2 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-sm font-bold text-slate-800">On-Time Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pickup %</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{performanceStats.onTimePickup}%</span>
                  <span className="text-[10px] text-green-600 font-bold">↑ 2%</span>
                </div>
                <Progress value={performanceStats.onTimePickup} className="h-1 bg-slate-100" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Delivery %</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{performanceStats.onTimeDelivery}%</span>
                  <span className="text-[10px] text-rose-600 font-bold">↓ 1%</span>
                </div>
                <Progress value={performanceStats.onTimeDelivery} className="h-1 bg-slate-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rider Health Score (Composite) */}
        <Card className="shadow-sm border-slate-200 overflow-hidden bg-white">
          <CardHeader className="pb-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-sm font-bold text-slate-800">Rider Health Score</CardTitle>
              </div>
              <Badge className={`${healthStats.statusColor} border-none font-bold text-[10px]`}>{healthStats.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative h-20 w-20">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-slate-100"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-[#3E8940]"
                    strokeWidth="3"
                    strokeDasharray={`${healthStats.score}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-black text-slate-800 leading-none">{healthStats.score}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">/ 100</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-medium">Rating (30%)</span>
                  <span className="font-bold text-slate-800">{healthStats.rating}/5</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-medium">On-Time % (30%)</span>
                  <span className="font-bold text-slate-800">{healthStats.onTime}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-medium">Cancellation (20%)</span>
                  <span className={cn("font-bold", healthStats.cancellation > 8 ? "text-rose-600" : "text-emerald-600")}>{healthStats.cancellation}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-medium">Complaints (20%)</span>
                  <span className={cn("font-bold", healthStats.complaintsRate > 3 ? "text-rose-600" : "text-emerald-600")}>{healthStats.complaintsRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rider Utilization % */}
        <Card className="shadow-sm border-slate-200 overflow-hidden bg-white">
          <CardHeader className="pb-2 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-bold text-slate-800">Rider Utilization</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Utilization</p>
                  <p className="text-2xl font-black text-slate-900">{performanceStats.utilization}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rider Active Time</p>
                  <p className="text-sm font-bold text-slate-800">{Math.floor(performanceStats.activeTime / 60)}h {performanceStats.activeTime % 60}m</p>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  style={{ width: `${performanceStats.utilization}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                <span>Idle Time: {Math.floor(performanceStats.idleTime / 60)}h {performanceStats.idleTime % 60}m</span>
                <span>Goal: 75%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rider Productivity Metrics Card */}
        <Card className="shadow-sm border-slate-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold text-slate-800">Rider Productivity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Deliveries / Rider</p>
                <p className="text-2xl font-black text-slate-900">{productivityStats.avgDeliveries}/Day</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cost / Delivery</p>
                <p className="text-sm font-bold text-slate-800">₹{productivityStats.costPerDelivery}</p>
              </div>
            </div>
            
            <div className="space-y-1.5 border-t border-slate-100 pt-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Top Performer</span>
                <span className="font-bold text-emerald-600">{productivityStats.topPerformer}/Day</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Low Performer</span>
                <span className="font-bold text-rose-500">{productivityStats.lowPerformer}/Day</span>
              </div>
              <div className="flex justify-between text-[10px] border-t border-slate-100/50 pt-1.5">
                <span className="text-slate-500 font-medium">Orders / Active Rider (Today)</span>
                <span className="font-bold text-blue-600">{productivityStats.ordersPerActiveRiderToday}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings & Reconciliation Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {/* Rider Earnings Panel */}
          <Card className="shadow-sm border-slate-200 bg-white overflow-hidden h-full">
            <CardHeader className="border-b bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#3E8940]" />
                  <CardTitle className="text-lg font-bold text-slate-800">Rider Earnings Panel</CardTitle>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                  <FileText className="h-3 w-3" /> Reconciliation Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 h-full">
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Earnings (Month)</p>
                  <p className="text-2xl font-black text-slate-900">₹{earningsStats.totalEarningsMonth.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-green-600 font-bold mt-2">↑ 12.5% vs last month</p>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Earnings / Rider</p>
                  <p className="text-2xl font-black text-slate-900">₹{earningsStats.avgEarningsPerRider.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-2">Target: ₹6,000</p>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Incentives Paid</p>
                  <p className="text-2xl font-black text-indigo-600">₹{earningsStats.incentivesPaid.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-indigo-500 font-bold mt-2">High performance bonuses</p>
                </div>
                <div className="p-6 bg-amber-50/30">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Pending Payout</p>
                  <p className="text-2xl font-black text-amber-700">₹{earningsStats.pendingPayout.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-amber-500 font-bold mt-2">Scheduled for next cycle</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          {/* Rider Payment Reconciliation */}
          <Card className="shadow-sm border-slate-200 bg-white overflow-hidden h-full flex flex-col justify-between">
            <CardHeader className="border-b bg-indigo-50/30 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-indigo-900">Rider Payment Reconciliation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-slate-100">
                {[
                  { label: "Deliveries Done", value: `${dynamicTotalDeliveries.toLocaleString('en-IN')} orders`, icon: Truck, color: "text-blue-600" },
                  { label: "Incentives", value: `₹${earningsStats.incentivesPaid.toLocaleString('en-IN')}`, icon: Zap, color: "text-amber-600" },
                  { label: "Penalties", value: `-₹${(Math.round(8500 * (filteredRiders.length / Math.max(1, riders.length))) + appliedPenaltiesTotal).toLocaleString('en-IN')}`, icon: AlertCircle, color: "text-rose-600" },
                  { label: "Net Payout", value: `₹${(earningsStats.totalEarningsMonth - (Math.round(8500 * (filteredRiders.length / Math.max(1, riders.length))) + appliedPenaltiesTotal)).toLocaleString('en-IN')}`, icon: Wallet, color: "text-emerald-600", bold: true },
                ].map((item, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                    </div>
                    <span className={cn("text-xs font-bold text-slate-900", item.bold && "text-emerald-700 font-black text-sm")}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expiry Tracker & Cancellation Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Document Expiry Dashboard */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-bold text-slate-800">Document Expiry Dashboard</CardTitle>
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[10px]">8 EXPIRED / 12 NEAR</Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-4">
              {[
                { label: "Driving License Expiry", expired: 3, nearing: 5, color: "bg-rose-500" },
                { label: "Vehicle Insurance Expiry", expired: 5, nearing: 4, color: "bg-amber-500" },
                { label: "RC Expiry", expired: 0, nearing: 3, color: "bg-blue-500" },
              ].map((doc, i) => (
                <div key={i} className="space-y-1.5 border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">{doc.label}</span>
                    <span className="text-rose-600">{doc.expired} Expired / {doc.nearing} Near</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    <div className={doc.color} style={{ width: `${(doc.expired / 20) * 100}%` }} />
                    <div className="bg-amber-400" style={{ width: `${(doc.nearing / 20) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Total {doc.expired + doc.nearing} riders need updates</p>
                </div>
              ))}
            </div>
            <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
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

        {/* Cancellation Analytics */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800">Cancellation Analytics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-8">
              <div className="flex-1 space-y-4">
                {[
                  { label: "Customer Cancellation %", value: 4.2, color: "bg-blue-500" },
                  { label: "Rider Cancellation %", value: 2.1, color: "bg-rose-500" },
                  { label: "Vendor Cancellation %", value: 1.5, color: "bg-amber-500" },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500 uppercase tracking-tighter">{item.label}</span>
                      <span className="text-slate-800">{item.value}%</span>
                    </div>
                    <Progress value={item.value * 10} className="h-1.5" style={{ backgroundColor: '#f1f5f9' }} />
                  </div>
                ))}
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-2xl border">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Loss/Order</p>
                <p className="text-2xl font-black text-rose-600">₹84.50</p>
                <p className="text-[9px] text-rose-400 font-bold mt-1">Due to cancellations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Weekly Active Riders</CardTitle>
              <p className="text-xs text-slate-500">Estimated active riders in the last 7 days</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">Live</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3E8940" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3E8940" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="active" stroke="#3E8940" strokeWidth={2} fill="url(#colorActive)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Rider Growth</CardTitle>
              <p className="text-xs text-slate-500">Monthly rider registrations</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-none">Trend</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="riders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Operational Monitoring */}
      <Tabs defaultValue="ops" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="ops" className="rounded-lg font-bold text-xs">Ops Alerts & Incidents</TabsTrigger>
          <TabsTrigger value="registry" className="rounded-lg font-bold text-xs">Fleet Registry</TabsTrigger>
          <TabsTrigger value="verification" className="rounded-lg font-bold text-xs">Verification & Expiry</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg font-bold text-xs">Friction Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registry" className="mt-0">
          <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
            <CardHeader className="p-4 border-b bg-slate-50/30 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Full Rider Fleet</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Search fleet..." className="h-8 pl-8 w-48 text-xs bg-white rounded-lg border-slate-200" />
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1">
                  <Download className="h-3 w-3" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3 pl-4">Rider</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3">City/Zone</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3 text-center">Category</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3 text-center">Deliveries</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3 text-center">Rating</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3 text-center">Health</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-400 uppercase py-3 text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRiders.slice(0, 10).map((r: any, i: number) => {
                      const health = 70 + Math.floor(Math.random() * 25);
                      const isNew = i < 2;
                      const isElite = health > 92;
                      return (
                        <TableRow key={r.id} className="group hover:bg-slate-50 transition-colors cursor-pointer border-slate-50">
                          <TableCell className="py-3 pl-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 ring-1 ring-slate-100">
                                <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-700 font-bold">
                                  {(r.name || "?").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{r.name}</p>
                                <p className="text-[9px] text-slate-400 font-medium">{r.phone}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-medium">
                            {r.addresses?.[0]?.city || "New Delhi"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 rounded-md border-none ${
                              isElite ? "bg-purple-100 text-purple-700" :
                              isNew ? "bg-blue-100 text-blue-700" :
                              health > 85 ? "bg-emerald-100 text-emerald-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {isElite ? "Elite" : isNew ? "New Joiner" : health > 85 ? "Top Performer" : "Regular"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold text-slate-700">
                            {100 + Math.floor(Math.random() * 400)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                              <span className="text-xs font-bold text-slate-700">4.{(i % 8) + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] font-bold ${health > 90 ? "text-emerald-600 border-emerald-100" : "text-amber-600 border-amber-100"}`}>
                              {health}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600" onClick={() => router.push(`/rider/${r.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="p-3 border-t bg-slate-50/50 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-bold">Total {filteredRiders.length} riders found</p>
                <Button variant="link" className="h-auto p-0 text-[10px] font-bold text-emerald-600" onClick={() => router.push("/riders")}>
                  OPEN FULL FLEET INTELLIGENCE <ArrowRight className="ml-1 h-2.5 w-2.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ops" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Real-time Alerts */}
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <CardTitle className="text-sm font-bold text-slate-800">Rider Alerts</CardTitle>
                </div>
                <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-[10px]">{alerts.length} ACTIVE</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${alert.severity === 'high' ? 'bg-rose-500 animate-pulse' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{alert.type}</p>
                            <p className="text-xs text-slate-500 font-medium">Rider: {alert.rider} • {alert.time}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50"
                          onClick={() => handleResolveAlert(alert.id, alert.type)}
                        >
                          RESOLVE
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No active alerts.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Incident Tracking (Laundry Specific) */}
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                  <CardTitle className="text-sm font-bold text-slate-800">Incident Tracking (Laundry)</CardTitle>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[10px]">
                  {laundryIncidents.filter(inc => inc.status !== "Resolved" && inc.status !== "Penalized").length} ACTIVE
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {laundryIncidents.map((incident) => {
                    const isCompleted = incident.status === "Resolved" || incident.status === "Penalized";
                    return (
                      <div key={incident.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            incident.severity === 'high' ? 'bg-rose-50 text-rose-600' :
                            incident.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">{incident.type}</p>
                              <Badge variant="outline" className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{incident.orderId}</Badge>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 mt-1">
                              Rider: <span className="text-[#3E8940]">{incident.riderName}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400">{incident.time}</span>
                              <div className="h-1 w-1 rounded-full bg-slate-300" />
                              <Badge className={`text-[9px] px-1 font-bold ${
                                incident.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                incident.status === 'Penalized' ? 'bg-rose-100 text-rose-700' :
                                incident.status === 'Pending Penalty' ? 'bg-amber-100 text-amber-700' :
                                'bg-indigo-100 text-indigo-700'
                              }`}>
                                {incident.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {!isCompleted && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 hover:!bg-rose-600 hover:!text-white hover:!border-rose-600 transition-colors"
                              onClick={() => handlePenalizeIncident(incident.id, incident.penaltyAmount, incident.riderName, incident.type)}
                            >
                              PENALIZE (₹{incident.penaltyAmount})
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-[10px] font-bold text-indigo-600 hover:!bg-indigo-50 hover:!text-indigo-700 transition-colors"
                              onClick={() => handleResolveIncident(incident.id, incident.riderName, incident.type)}
                            >
                              RESOLVE
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Expiry Dashboard */}
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-sm font-bold text-slate-800">Document Expiry Dashboard</CardTitle>
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[10px]">8 EXPIRED / 12 NEAR</Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-4">
                  {[
                    { label: "Driving License Expiry", expired: 3, nearing: 5, color: "bg-rose-500" },
                    { label: "Vehicle Insurance Expiry", expired: 5, nearing: 4, color: "bg-amber-500" },
                    { label: "RC Expiry", expired: 0, nearing: 3, color: "bg-blue-500" },
                  ].map((doc, i) => (
                    <div key={i} className="space-y-1.5 border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">{doc.label}</span>
                        <span className="text-rose-600">{doc.expired} Expired / {doc.nearing} Near</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
                        <div className={doc.color} style={{ width: `${(doc.expired / 20) * 100}%` }} />
                        <div className="bg-amber-400" style={{ width: `${(doc.nearing / 20) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Total {doc.expired + doc.nearing} riders need updates</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
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

            {/* Pending Verification (Original Section ported here) */}
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <CardTitle className="text-sm font-bold text-slate-800">Verification Queue</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="space-y-3">
                  {pendingRiders.length > 0 ? pendingRiders.slice(0, 3).map((rider: any) => (
                    <div key={rider.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all border border-amber-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 ring-2 ring-amber-200">
                          <AvatarFallback className="text-[10px] bg-amber-100 text-amber-700 font-bold">{(rider.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{rider.name}</p>
                          <p className="text-[10px] text-slate-500">{rider.phone}</p>
                        </div>
                      </div>
                      <Button size="sm" className="h-7 text-[10px] bg-amber-500 hover:bg-amber-600">Verify</Button>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-500 text-center py-4">No pending verifications.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cancellation Analytics */}
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold text-slate-800">Cancellation Analytics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-8">
                  <div className="flex-1 space-y-4">
                    {[
                      { label: "Customer Cancellation %", value: 4.2, color: "bg-blue-500" },
                      { label: "Rider Cancellation %", value: 2.1, color: "bg-rose-500" },
                      { label: "Vendor Cancellation %", value: 1.5, color: "bg-amber-500" },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-500 uppercase tracking-tighter">{item.label}</span>
                          <span className="text-slate-800">{item.value}%</span>
                        </div>
                        <Progress value={item.value * 10} className={`h-1.5 ${item.color}`} />
                      </div>
                    ))}
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Loss/Order</p>
                    <p className="text-2xl font-black text-rose-600">₹84.50</p>
                    <p className="text-[9px] text-rose-400 font-bold mt-1">Due to cancellations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reconciliation Snapshot */}
            <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
              <CardHeader className="p-4 border-b bg-indigo-50/30">
                <CardTitle className="text-sm font-bold text-indigo-900">Payment Reconciliation (Today)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {[
                    { label: "Deliveries Done", value: "142", icon: Truck, color: "text-blue-600" },
                    { label: "Incentives Earned", value: "₹4,250", icon: Zap, color: "text-amber-600" },
                    { label: "Penalties Deducted", value: "-₹850", icon: AlertCircle, color: "text-rose-600" },
                    { label: "Net Payout Queue", value: "₹18,420", icon: Wallet, color: "text-emerald-600", bold: true },
                  ].map((item, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                        <span className="text-xs font-medium text-slate-600">{item.label}</span>
                      </div>
                      <span className={cn("text-sm font-bold text-slate-900", item.bold && "text-emerald-700 font-black")}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Joiners & Feed - Optional cleanup here if needed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Joiners */}
        <Card className={`shadow-sm transition-all duration-300 ${hoveredCard === "riders" ? "shadow-lg ring-2 ring-blue-200" : ""}`}
          onMouseEnter={() => setHoveredCard("riders")}
          onMouseLeave={() => setHoveredCard(null)}>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bike className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">Recent Joiners</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-[#3E8940] hover:bg-green-50" onClick={() => router.push("/riders")}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {recentRiders.length > 0 ? recentRiders.map((rider: any) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200 group border border-transparent hover:border-slate-100"
                  onClick={() => router.push(`/rider/${rider.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-bold">
                        {(rider.name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors">{rider.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone className="h-3 w-3" /> {rider.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`${getStatusColor(rider.isBlocked ? "Blocked" : "Active")} text-xs`}>
                      {rider.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> {formatDate(rider.createdAt)}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-6">No riders found.</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Quick System Health */}
        <Card className="shadow-sm border-slate-200 bg-[#3E8940] text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg font-bold">Fleet Optimization Status</CardTitle>
            <p className="text-green-100 text-xs">AI-driven fleet distribution & efficiency</p>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-green-200 uppercase tracking-widest">Global Efficiency</p>
                  <p className="text-3xl font-black">94.8%</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Current Load Distribution</span>
                  <span>Optimal</span>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '85%' }} />
                </div>
                <p className="text-[10px] text-green-100 italic">85% of riders are currently within 2km of active hubs</p>
              </div>

              <Button className="w-full bg-white text-[#3E8940] hover:bg-green-50 font-bold border-none rounded-xl">
                Open Fleet Map <MapPin className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
