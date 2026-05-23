"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, MapPin, Store, Phone, User, Star, MoreVertical, Loader2, AlertTriangle, RefreshCw, LayoutList, Map as MapIcon, Hammer, Plus, CheckCircle2, ChevronRight, Settings, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

type PerformanceLevel = "high" | "medium" | "underperforming";

const formatCurrency = (value: number) => `₹${Math.round(Number(value) || 0).toLocaleString()}`;

const formatReopenDate = (date?: string | Date | null) => {
  if (!date) return "TBD";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "TBD";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const getPerformance = (outlet: any): { level: PerformanceLevel; label: string; marker: string; text: string; ring: string; soft: string } => {
  const ratingScore = Math.min((Number(outlet.rating) || 0) / 5, 1) * 40;
  const slaScore = Math.min(Number(outlet.slaScore) || 0, 100) * 0.35;
  const orderScore = Math.min((Number(outlet.ordersProcessed) || 0) / 250, 1) * 20;
  const issuePenalty = Math.min(Number(outlet.issueRate) || 0, 20) * 1.2;
  const score = ratingScore + slaScore + orderScore - issuePenalty;

  if (score >= 78) {
    return { level: "high", label: "High performing", marker: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-200", soft: "bg-emerald-50" };
  }
  if (score >= 52) {
    return { level: "medium", label: "Medium", marker: "bg-amber-400", text: "text-amber-700", ring: "ring-amber-200", soft: "bg-amber-50" };
  }
  return { level: "underperforming", label: "Underperforming", marker: "bg-red-500", text: "text-red-700", ring: "ring-red-200", soft: "bg-red-50" };
};

const getMarkerPosition = (outlet: any, index: number, allOutlets: any[]) => {
  const outletsWithCoords = allOutlets.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  if (!Number.isFinite(outlet.lat) || !Number.isFinite(outlet.lng) || outletsWithCoords.length === 0) {
    return { top: `${24 + (index * 17) % 56}%`, left: `${18 + (index * 23) % 64}%` };
  }
  if (outletsWithCoords.length === 1) {
    return { top: "50%", left: "50%" };
  }

  const latValues = outletsWithCoords.map((item) => item.lat);
  const lngValues = outletsWithCoords.map((item) => item.lng);
  const minLat = Math.min(...latValues);
  const maxLat = Math.max(...latValues);
  const minLng = Math.min(...lngValues);
  const maxLng = Math.max(...lngValues);
  const latRange = Math.max(maxLat - minLat, 0.01);
  const lngRange = Math.max(maxLng - minLng, 0.01);
  const left = 12 + ((outlet.lng - minLng) / lngRange) * 76;
  const top = 88 - ((outlet.lat - minLat) / latRange) * 76;

  return {
    left: `${Math.min(Math.max(left, 8), 88)}%`,
    top: `${Math.min(Math.max(top, 10), 88)}%`,
  };
};

function OutletsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [maintenanceActionId, setMaintenanceActionId] = useState<string | null>(null);

  // Onboarding Form States
  const [outletName, setOutletName] = useState("");
  const [location, setLocation] = useState("");
  const [outletType, setOutletType] = useState("Standard Store");
  const [enabledServices, setEnabledServices] = useState<string[]>(["Wash & Fold"]);
  const [dailyCapacity, setDailyCapacity] = useState(200);
  const [targetSla, setTargetSla] = useState(24);
  const [commissionRate, setCommissionRate] = useState(18.0);
  const [securityDeposit, setSecurityDeposit] = useState("Verified");
  const [serviceCoverage, setServiceCoverage] = useState("5km Radius");

  // Manager Assignment States
  const [managerOption, setManagerOption] = useState<"existing" | "new">("existing");
  const [searchManagerQuery, setSearchManagerQuery] = useState("");
  const [managerSearchResults, setManagerSearchResults] = useState<any[]>([]);
  const [isSearchingManagers, setIsSearchingManagers] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any | null>(null);

  // New Manager Details
  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [newManagerPhone, setNewManagerPhone] = useState("");
  const [newManagerPassword, setNewManagerPassword] = useState("password123");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); const data = await res.json();
      setVendors(Array.isArray(data) ? data : data.vendors || []);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Dynamic manager search
  useEffect(() => {
    if (managerOption !== "existing" || !searchManagerQuery.trim()) {
      setManagerSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearchingManagers(true);
      try {
        const res = await apiFetch(`${AUTH_API_URL}/users?search=${encodeURIComponent(searchManagerQuery)}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const usersList = Array.isArray(data) ? data : data.users || [];
          setManagerSearchResults(usersList.filter((u: any) => u.role === "customer" || u.role === "vendor"));
        }
      } catch (err) {
        console.error("Failed to search managers", err);
      } finally {
        setIsSearchingManagers(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchManagerQuery, managerOption]);

  const toggleService = (service: string) => {
    if (enabledServices.includes(service)) {
      setEnabledServices(enabledServices.filter(item => item !== service));
    } else {
      setEnabledServices([...enabledServices, service]);
    }
  };

  const handleOnboardOutlet = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: outletName,
        location,
        outletType,
        servicesOffered: enabledServices,
        dailyCapacity,
        targetSla,
        commissionRate,
        managerOption,
        managerId: selectedManager?.id,
        managerName: newManagerName,
        managerEmail: newManagerEmail,
        managerPhone: newManagerPhone,
        managerPassword: newManagerPassword,
        lat: 19.0760,
        lng: 72.8777,
      };

      const res = await apiFetch(`${AUTH_API_URL}/outlets/onboard`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to onboard outlet");
      }

      toast.success("Outlet registered successfully", {
        description: `New outlet ${outletName} is now active.`,
      });

      // Reset
      setOutletName("");
      setLocation("");
      setOutletType("Standard Store");
      setEnabledServices(["Wash & Fold"]);
      setDailyCapacity(200);
      setTargetSla(24);
      setCommissionRate(18.0);
      setManagerOption("existing");
      setSelectedManager(null);
      setSearchManagerQuery("");
      setNewManagerName("");
      setNewManagerEmail("");
      setNewManagerPhone("");
      setNewManagerPassword("password123");
      setShowOnboarding(false);
      setOnboardingStep(1);

      fetchVendors();
    } catch (err: any) {
      toast.error("Registration failed", {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = outletName.trim() !== "" && location.trim() !== "" && (
    (managerOption === "existing" && selectedManager !== null) ||
    (managerOption === "new" && newManagerName.trim() !== "" && newManagerEmail.trim() !== "" && newManagerPhone.trim() !== "")
  );

  const isStep2Valid = dailyCapacity > 0 && targetSla > 0 && enabledServices.length > 0;

  const handleToggleMaintenance = async (outlet: any) => {
    const nextMaintenanceState = !outlet.isMaintenance;
    const defaultReopenDate = new Date();
    defaultReopenDate.setDate(defaultReopenDate.getDate() + 3);
    defaultReopenDate.setHours(10, 0, 0, 0);

    setMaintenanceActionId(outlet.id);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/vendors/${outlet.id}/maintenance`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          isMaintenance: nextMaintenanceState,
          reopenDate: nextMaintenanceState ? (outlet.reopenDate || defaultReopenDate.toISOString()) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update maintenance mode");
      toast.success(nextMaintenanceState ? "Maintenance mode enabled" : "Maintenance mode disabled", {
        description: nextMaintenanceState
          ? `New orders blocked until ${formatReopenDate(data.vendor?.vendorProfile?.reopenDate || outlet.reopenDate || defaultReopenDate)}.`
          : "New orders can be accepted again.",
      });
      fetchVendors();
    } catch (err: any) {
      toast.error("Maintenance update failed", { description: err.message });
    } finally {
      setMaintenanceActionId(null);
    }
  };

  // Derive outlets from vendors (each vendor is effectively an outlet/store)
  const outlets = useMemo(() => vendors.map((v) => {
    const profile = v.vendorProfile || {};
    const primaryOutlet = v.outlets?.[0] || {};
    const location = [profile.area, profile.city].filter(Boolean).join(", ") || primaryOutlet.address || "—";
    const totalOrders = Number(profile.totalOrders) || Number(profile.ordersThisMonth) || 0;
    const totalRevenue = Number(profile.totalRevenue) || Number(profile.revenueThisMonth) || 0;
    const isInactive = v.isBlocked || ["blocked", "suspended", "rejected"].includes(String(v.status || "").toLowerCase());

    return {
      id: v.id,
      name: profile.businessName || primaryOutlet.name || v.name,
      vendorName: profile.ownerName || v.name,
      location,
      address: primaryOutlet.address || location,
      phone: v.phone,
      manager: profile.ownerName || v.name,
      rating: Number(profile.rating) || 0,
      slaScore: Number(profile.slaScore) || 0,
      issueRate: Number(profile.issueRate) || 0,
      ordersProcessed: totalOrders,
      revenueThisMonth: Number(profile.revenueThisMonth) || 0,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders) : 0,
      refundAmount: Number(profile.refundAmount) || 0,
      commissionEarned: Number(profile.commissionEarned) || 0,
      dailyCapacity: Number(profile.dailyCapacity) || 0,
      currentLoad: Number(profile.currentLoad) || 0,
      targetSla: Number(profile.targetSla) || 24,
      outletType: profile.businessType || "Standard Store",
      isMaintenance: profile.isMaintenance || false,
      reopenDate: profile.reopenDate,
      lat: Number(primaryOutlet.lat ?? v.addresses?.[0]?.lat),
      lng: Number(primaryOutlet.lng ?? v.addresses?.[0]?.lng),
      status: profile.isMaintenance ? "Maintenance" : isInactive ? "Inactive" : profile.isApproved ? "Active" : "Pending",
    };
  }), [vendors]);

  const filtered = useMemo(() => outlets.filter((o) => {
    const q = searchQuery.toLowerCase();
    const match = !searchQuery || o.name.toLowerCase().includes(q) || o.location.toLowerCase().includes(q) || o.vendorName.toLowerCase().includes(q) || o.outletType.toLowerCase().includes(q);
    if (statusFilter === "all") return match;
    return match && o.status === statusFilter;
  }), [outlets, searchQuery, statusFilter]);

  const performanceCounts = useMemo(() => filtered.reduce((acc, outlet) => {
    const performance = getPerformance(outlet);
    acc[performance.level] += 1;
    return acc;
  }, { high: 0, medium: 0, underperforming: 0 } as Record<PerformanceLevel, number>), [filtered]);

  if (isLoading && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading outlets...</p></div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-full min-w-0">
      <div><h1 className="text-3xl text-black font-bold tracking-tight">Outlets</h1><p className="text-slate-500 mt-1">Manage and monitor all vendor outlet locations.</p></div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search outlets, vendors, or locations..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <Button variant="ghost" size="sm" className={`rounded-lg px-3 ${viewMode === "list" ? "shadow-sm bg-white text-[#3E8940]" : "text-slate-500"}`} onClick={() => setViewMode("list")}><LayoutList className="h-4 w-4 mr-2" /> List</Button>
            <Button variant="ghost" size="sm" className={`rounded-lg px-3 ${viewMode === "map" ? "shadow-sm bg-white text-[#3E8940]" : "text-slate-500"}`} onClick={() => setViewMode("map")}><MapIcon className="h-4 w-4 mr-2" /> Map</Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40 rounded-xl bg-white"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Maintenance">Maintenance</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select>
          <Button className="bg-[#3E8940] hover:bg-[#2d662f] text-white rounded-xl" onClick={() => setShowOnboarding(true)}><Plus className="h-4 w-4 mr-2" /> Add Outlet</Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden w-full max-w-full">
          <Table>
            <TableHeader><TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6">Outlet Name</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Type</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Orders</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Revenue This Month</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Avg Order Value</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Refund Amount</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Commission Earned</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Capacity Load</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Rating</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Status</TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map((o) => (
                <TableRow key={o.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/vendors/${o.id}`)}>
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-[#3E8940]" />
                      <div>
                        <div className="font-semibold text-black text-sm">{o.name}</div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                            <User className="h-2.5 w-2.5 text-slate-400" /> {o.manager}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 text-slate-400" /> {o.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const type = o.outletType;
                      const config: Record<string, { label: string; icon: string; color: string }> = {
                        "Experience Store": { label: "Experience", icon: "🏢", color: "bg-purple-50 text-purple-600 border-purple-100" },
                        "Standard Store": { label: "Standard", icon: "🏬", color: "bg-blue-50 text-blue-600 border-blue-100" },
                        "Processing Hub": { label: "Processing", icon: "🏭", color: "bg-orange-50 text-orange-600 border-orange-100" },
                        "Collection Centre": { label: "Collection", icon: "📦", color: "bg-slate-50 text-slate-600 border-slate-100" },
                      };
                      const item = config[type] || config["Standard Store"];
                      return (
                        <Badge variant="outline" className={`${item.color} border font-black text-[9px] px-2 py-0.5 gap-1 shadow-sm`}>
                          <span>{item.icon}</span>
                          <span>{item.label.toUpperCase()}</span>
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell><div className="text-sm font-medium">{o.ordersProcessed}</div></TableCell>
                  <TableCell><div className="text-sm font-semibold text-emerald-600">{formatCurrency(o.revenueThisMonth)}</div></TableCell>
                  <TableCell><div className="text-sm text-slate-600">{formatCurrency(o.avgOrderValue)}</div></TableCell>
                  <TableCell><div className={`text-sm ${o.refundAmount > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>{formatCurrency(o.refundAmount)}</div></TableCell>
                  <TableCell><div className="text-sm font-medium text-blue-600">{formatCurrency(o.commissionEarned)}</div></TableCell>
                  <TableCell>
                    {o.dailyCapacity > 0 ? (
                      <div className="flex flex-col gap-1.5 min-w-[100px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700">{o.currentLoad}/{o.dailyCapacity}</span>
                          <span className={`text-[10px] font-bold ${o.currentLoad >= o.dailyCapacity ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
                            {Math.round((o.currentLoad / o.dailyCapacity) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className={`h-full transition-all duration-500 ${o.currentLoad >= o.dailyCapacity ? 'bg-rose-500' : o.currentLoad >= o.dailyCapacity * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min((o.currentLoad / o.dailyCapacity) * 100, 100)}%` }} 
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">SLA: {o.targetSla}h</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Not Set</span>
                    )}
                  </TableCell>
                  <TableCell>{o.rating > 0 ? <div className="flex items-center gap-1"><div className="bg-amber-50 p-1 rounded-md"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /></div><span className="font-semibold text-sm">{o.rating}</span></div> : <span className="text-slate-400 text-sm italic">New</span>}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-flex flex-col items-start gap-1">
                            <Badge className={`border-none font-bold text-[10px] tracking-wider px-2 py-0.5 ${o.status === "Active" ? "bg-green-100 text-green-700" : o.status === "Maintenance" ? "bg-amber-100 text-amber-700 animate-pulse" : o.status === "Pending" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                              {o.status === "Maintenance" && <Hammer className="h-2.5 w-2.5 mr-1" />}
                              {o.status.toUpperCase()}
                            </Badge>
                            {o.status === "Maintenance" && (
                              <span className="text-[10px] font-semibold text-amber-700 whitespace-nowrap">Reopens {formatReopenDate(o.reopenDate)}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        {o.status === "Maintenance" && (
                          <TooltipContent className="bg-slate-900 text-white border-none rounded-lg p-3 shadow-xl">
                            <div className="flex flex-col gap-1.5">
                              <p className="font-bold flex items-center gap-2 text-amber-400"><Hammer className="h-3.5 w-3.5" /> Maintenance Mode Active</p>
                              <div className="h-px bg-slate-800 my-1" />
                              <p className="text-[11px] opacity-90 leading-relaxed">• New orders are temporarily <b>blocked</b><br/>• Ongoing orders can still be processed<br/>• Expected reopen: <b>{formatReopenDate(o.reopenDate)}</b></p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right pr-6"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4 text-slate-500" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/vendors/${o.id}`)}>View Details</DropdownMenuItem><DropdownMenuItem className="text-amber-600 font-medium" disabled={maintenanceActionId === o.id} onClick={(e) => { e.stopPropagation(); handleToggleMaintenance(o); }}>{maintenanceActionId === o.id ? "Updating..." : o.isMaintenance ? "End Maintenance" : "Start Maintenance"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={11} className="text-center py-8 text-slate-500">{error || "No outlets found."}</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-4 border-t text-xs text-slate-500"><p>Showing {filtered.length} outlets</p></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden w-full max-w-full">
          <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Geo Map View</h2>
              <p className="text-xs text-slate-500">Outlet markers use saved latitude/longitude and performance metrics from the backend.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-emerald-500" /> High ({performanceCounts.high})</div>
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-amber-400" /> Medium ({performanceCounts.medium})</div>
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-red-500" /> Underperforming ({performanceCounts.underperforming})</div>
            </div>
          </div>
          <div className="relative h-[620px] overflow-hidden bg-[#edf4ef]">
            <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(rgba(62,137,64,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(62,137,64,0.12) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
            <div className="absolute inset-x-0 top-1/3 h-10 -rotate-6 bg-white/45" />
            <div className="absolute inset-y-0 left-1/2 w-12 rotate-12 bg-white/35" />
            <div className="absolute left-6 top-6 z-10 rounded-xl border bg-white/95 p-4 shadow-sm backdrop-blur max-w-[260px]">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#3E8940]" />
                <p className="text-xs font-black uppercase text-slate-800">Outlet Coverage</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <p className="text-lg font-black text-emerald-700">{performanceCounts.high}</p>
                  <p className="text-[9px] font-bold text-emerald-700">High</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2">
                  <p className="text-lg font-black text-amber-700">{performanceCounts.medium}</p>
                  <p className="text-[9px] font-bold text-amber-700">Medium</p>
                </div>
                <div className="rounded-lg bg-red-50 p-2">
                  <p className="text-lg font-black text-red-700">{performanceCounts.underperforming}</p>
                  <p className="text-[9px] font-bold text-red-700">Low</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Maintenance outlets remain visible, but their new order intake is blocked until the reopen date.</p>
            </div>

            {filtered.map((o, idx) => {
              const performance = getPerformance(o);
              const position = getMarkerPosition(o, idx, filtered);
              const loadPercent = o.dailyCapacity > 0 ? Math.round((o.currentLoad / o.dailyCapacity) * 100) : 0;

              return (
                <button
                  key={o.id}
                  type="button"
                  className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer text-left transition-transform hover:scale-110 focus:outline-none"
                  style={position}
                  onClick={() => router.push(`/vendors/${o.id}`)}
                >
                  <div className={`relative flex h-11 w-11 items-center justify-center rounded-full ${performance.marker} text-white shadow-xl ring-4 ${performance.ring} border-4 border-white`}>
                    <Store className="h-4 w-4" />
                    {o.isMaintenance && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-2 ring-white">
                        <Hammer className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="pointer-events-none absolute left-1/2 top-14 z-50 w-64 -translate-x-1/2 rounded-xl border bg-white p-3 opacity-0 shadow-2xl transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-950">{o.name}</p>
                        <p className="mt-1 text-[10px] font-medium text-slate-500">{o.location}</p>
                      </div>
                      <Badge className={`${performance.soft} ${performance.text} border-none text-[9px] font-black uppercase`}>
                        {performance.label}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-black text-slate-800">{o.rating ? o.rating.toFixed(1) : "New"}</p>
                        <p className="font-semibold text-slate-400">Rating</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-black text-slate-800">{Math.round(o.slaScore)}%</p>
                        <p className="font-semibold text-slate-400">SLA</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-black text-slate-800">{loadPercent}%</p>
                        <p className="font-semibold text-slate-400">Load</p>
                      </div>
                    </div>
                    {o.isMaintenance && (
                      <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-2 text-[10px] font-semibold text-amber-800">
                        New orders blocked. Existing orders continue. Reopens {formatReopenDate(o.reopenDate)}.
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No outlets match the current filters.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={(val) => { setShowOnboarding(val); if(!val) setOnboardingStep(1); }}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Store className="h-32 w-32" /></div>
            <DialogHeader>
              <div className="flex items-center gap-2 text-emerald-100 mb-2"><CheckCircle2 className="h-4 w-4" /> Step {onboardingStep} of 3</div>
              <DialogTitle className="text-2xl font-bold">Register New Outlet</DialogTitle>
              <p className="text-emerald-100 mt-1 opacity-90">Expand Cleclo network by adding a strategic outlet location.</p>
            </DialogHeader>
            {/* Stepper */}
            <div className="flex items-center gap-4 mt-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`h-1.5 flex-1 rounded-full ${onboardingStep >= s ? 'bg-white' : 'bg-emerald-400/50'}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            {onboardingStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outlet Name</label>
                    <Input 
                      placeholder="e.g. Cleclo Premium - Bandra" 
                      value={outletName}
                      onChange={e => setOutletName(e.target.value)}
                      className="rounded-xl bg-slate-50 border-none" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outlet Type</label>
                    <Select value={outletType} onValueChange={setOutletType}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard Store">Standard Store</SelectItem>
                        <SelectItem value="Experience Store">Experience Store</SelectItem>
                        <SelectItem value="Processing Hub">Processing Hub</SelectItem>
                        <SelectItem value="Collection Centre">Collection Centre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location / City</label>
                  <Input 
                    placeholder="e.g. Bandra, Mumbai" 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="rounded-xl bg-slate-50 border-none" 
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`flex-1 rounded-lg text-xs py-1.5 ${managerOption === "existing" ? "bg-white text-slate-800 shadow-sm font-bold" : "text-slate-500"}`}
                      onClick={() => setManagerOption("existing")}
                    >
                      Assign Existing User
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`flex-1 rounded-lg text-xs py-1.5 ${managerOption === "new" ? "bg-white text-slate-800 shadow-sm font-bold" : "text-slate-500"}`}
                      onClick={() => setManagerOption("new")}
                    >
                      Create New Manager
                    </Button>
                  </div>

                  {managerOption === "existing" ? (
                    <div className="space-y-2 relative">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Manager User</label>
                      {selectedManager ? (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{selectedManager.name}</p>
                            <p className="text-xs text-slate-500">{selectedManager.email || selectedManager.phone}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedManager(null)} className="text-slate-400 hover:text-red-500 hover:bg-transparent">Clear</Button>
                        </div>
                      ) : (
                        <>
                          <Input 
                            placeholder="Type name, email, or phone to search..." 
                            value={searchManagerQuery} 
                            onChange={(e) => setSearchManagerQuery(e.target.value)} 
                            className="rounded-xl bg-slate-50 border-none"
                          />
                          {isSearchingManagers && (
                            <div className="absolute right-3 top-9 flex items-center"><Loader2 className="h-4 w-4 animate-spin text-emerald-600" /></div>
                          )}
                          {managerSearchResults.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border rounded-xl shadow-lg p-2 space-y-1">
                              {managerSearchResults.map((u) => (
                                <div 
                                  key={u.id} 
                                  onClick={() => { setSelectedManager(u); setManagerSearchResults([]); setSearchManagerQuery(""); }}
                                  className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-left transition-colors"
                                >
                                  <p className="text-xs font-bold text-slate-900">{u.name}</p>
                                  <p className="text-[10px] text-slate-500">{u.email || u.phone} ({u.role.toUpperCase()})</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Manager Name</label>
                          <Input placeholder="e.g. John Doe" value={newManagerName} onChange={e => setNewManagerName(e.target.value)} className="rounded-xl bg-slate-50 border-none h-9 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Manager Email</label>
                          <Input placeholder="e.g. john@example.com" value={newManagerEmail} onChange={e => setNewManagerEmail(e.target.value)} className="rounded-xl bg-slate-50 border-none h-9 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Manager Phone</label>
                          <Input placeholder="e.g. 9876543210" value={newManagerPhone} onChange={e => setNewManagerPhone(e.target.value)} className="rounded-xl bg-slate-50 border-none h-9 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Temp Password</label>
                          <Input type="password" placeholder="password123" value={newManagerPassword} onChange={e => setNewManagerPassword(e.target.value)} className="rounded-xl bg-slate-50 border-none h-9 text-xs" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
                  <Info className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">Configure services and capacity to ensure the dispatch engine correctly routes orders to this hub.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-semibold block">Enabled Services</label>
                  <div className="flex flex-wrap gap-2">
                    {["Wash & Fold", "Premium Laundry", "Dry Clean", "Steam Iron", "Shoe Care"].map(s => {
                      const isSelected = enabledServices.includes(s);
                      return (
                        <Badge 
                          key={s} 
                          variant={isSelected ? "default" : "outline"} 
                          className={`rounded-full px-4 py-1.5 cursor-pointer transition-all ${isSelected ? 'bg-[#3E8940] text-white border-transparent' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                          onClick={() => toggleService(s)}
                        >
                          {s}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Capacity (Units)</label>
                    <Input 
                      type="number" 
                      value={dailyCapacity}
                      onChange={e => setDailyCapacity(parseInt(e.target.value) || 0)}
                      className="rounded-xl bg-slate-50 border-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target SLA (Hrs)</label>
                    <Input 
                      type="number" 
                      value={targetSla}
                      onChange={e => setTargetSla(parseInt(e.target.value) || 0)}
                      className="rounded-xl bg-slate-50 border-none" 
                    />
                  </div>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-4">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Settings className="h-8 w-8 animate-spin-slow" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Finalizing Configuration</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">Confirming commission rates and service parameters before activating the outlet.</p>
                <div className="p-5 bg-slate-50 rounded-2xl border text-left space-y-4 max-w-md mx-auto mt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Platform Commission (%)</label>
                    <Input 
                      type="number" 
                      value={commissionRate}
                      onChange={e => setCommissionRate(parseFloat(e.target.value) || 0)}
                      className="rounded-xl bg-white border-slate-200 h-9 text-xs" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Security Deposit</label>
                      <Select value={securityDeposit} onValueChange={setSecurityDeposit}>
                        <SelectTrigger className="rounded-xl bg-white border-slate-200 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Verified">Verified</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Waived">Waived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Coverage Radius</label>
                      <Select value={serviceCoverage} onValueChange={setServiceCoverage}>
                        <SelectTrigger className="rounded-xl bg-white border-slate-200 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3km Radius">3km Radius</SelectItem>
                          <SelectItem value="5km Radius">5km Radius</SelectItem>
                          <SelectItem value="8km Radius">8km Radius</SelectItem>
                          <SelectItem value="10km Radius">10km Radius</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-8 flex items-center justify-between">
              <Button 
                variant="ghost" 
                className="rounded-xl text-xs" 
                onClick={() => onboardingStep > 1 ? setOnboardingStep(onboardingStep - 1) : setShowOnboarding(false)}
              >
                {onboardingStep === 1 ? 'Cancel' : 'Back'}
              </Button>
              <Button 
                className="bg-[#3E8940] hover:bg-[#2d662f] text-white rounded-xl px-8 text-xs" 
                disabled={
                  (onboardingStep === 1 && !isStep1Valid) ||
                  (onboardingStep === 2 && !isStep2Valid) ||
                  (onboardingStep === 3 && isSubmitting)
                }
                onClick={() => {
                  if (onboardingStep < 3) {
                    setOnboardingStep(onboardingStep + 1);
                  } else {
                    handleOnboardOutlet();
                  }
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Registering...</span>
                ) : (
                  <>
                    {onboardingStep === 3 ? 'Finish & Activate' : 'Next Step'} 
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OutletsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm text-slate-500">Loading outlets dashboard...</p>
      </div>
    }>
      <OutletsContent />
    </Suspense>
  );
}
