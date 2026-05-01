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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, options); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

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

  // Derive outlets from vendors (each vendor is effectively an outlet/store)
  const outlets = useMemo(() => vendors.map((v) => ({
    id: v.id,
    name: v.vendorProfile?.businessName || v.name,
    vendorName: v.vendorProfile?.ownerName || v.name,
    location: v.addresses?.[0]?.city || "—",
    phone: v.phone,
    manager: v.vendorProfile?.ownerName || v.name,
    rating: v.vendorProfile?.rating || 0,
    ordersProcessed: v.vendorProfile?.totalOrders || 0,
    revenueThisMonth: v.vendorProfile?.revenueThisMonth || 0,
    totalRevenue: v.vendorProfile?.totalRevenue || 0,
    avgOrderValue: v.vendorProfile?.totalOrders > 0 ? (v.vendorProfile?.totalRevenue / v.vendorProfile?.totalOrders) : 0,
    refundAmount: v.vendorProfile?.refundAmount || 0,
    commissionEarned: v.vendorProfile?.commissionEarned || 0,
    dailyCapacity: v.vendorProfile?.dailyCapacity || 0,
    currentLoad: v.vendorProfile?.currentLoad || 0,
    outletType: v.vendorProfile?.businessType || "Standard Store",
    isMaintenance: v.vendorProfile?.isMaintenance || false,
    reopenDate: v.vendorProfile?.reopenDate,
    status: v.vendorProfile?.isMaintenance ? "Maintenance" : v.isBlocked ? "Inactive" : v.vendorProfile?.isApproved ? "Active" : "Pending",
  })), [vendors]);

  const filtered = useMemo(() => outlets.filter((o) => {
    const q = searchQuery.toLowerCase();
    const match = !searchQuery || o.name.toLowerCase().includes(q) || o.location.toLowerCase().includes(q) || o.vendorName.toLowerCase().includes(q) || o.outletType.toLowerCase().includes(q);
    if (statusFilter === "all") return match;
    return match && o.status === statusFilter;
  }), [outlets, searchQuery, statusFilter]);

  if (isLoading && vendors.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Loading outlets...</p></div>;

  return (
    <div className="flex flex-col gap-6">
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
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                  <TableCell><div className="text-sm font-semibold text-emerald-600">₹{o.revenueThisMonth.toLocaleString()}</div></TableCell>
                  <TableCell><div className="text-sm text-slate-600">₹{Math.round(o.avgOrderValue).toLocaleString()}</div></TableCell>
                  <TableCell><div className={`text-sm ${o.refundAmount > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>₹{o.refundAmount.toLocaleString()}</div></TableCell>
                  <TableCell><div className="text-sm font-medium text-blue-600">₹{o.commissionEarned.toLocaleString()}</div></TableCell>
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
                          <Badge className={`border-none font-bold text-[10px] tracking-wider px-2 py-0.5 ${o.status === "Active" ? "bg-green-100 text-green-700" : o.status === "Maintenance" ? "bg-amber-100 text-amber-700 animate-pulse" : o.status === "Pending" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                            {o.status === "Maintenance" && <Hammer className="h-2.5 w-2.5 mr-1" />}
                            {o.status.toUpperCase()}
                          </Badge>
                        </TooltipTrigger>
                        {o.status === "Maintenance" && (
                          <TooltipContent className="bg-slate-900 text-white border-none rounded-lg p-3 shadow-xl">
                            <div className="flex flex-col gap-1.5">
                              <p className="font-bold flex items-center gap-2 text-amber-400"><Hammer className="h-3.5 w-3.5" /> Maintenance Mode Active</p>
                              <div className="h-px bg-slate-800 my-1" />
                              <p className="text-[11px] opacity-90 leading-relaxed">• New orders are temporarily <b>blocked</b><br/>• Ongoing orders can still be processed<br/>• Expected reopen: <b>{o.reopenDate ? new Date(o.reopenDate).toLocaleDateString() : 'TBD'}</b></p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right pr-6"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4 text-slate-500" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/vendors/${o.id}`)}>View Details</DropdownMenuItem><DropdownMenuItem className="text-amber-600 font-medium">Toggle Maintenance</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={11} className="text-center py-8 text-slate-500">{error || "No outlets found."}</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-4 border-t text-xs text-slate-500"><p>Showing {filtered.length} outlets</p></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-[600px] relative">
          {/* Mock Interactive Map */}
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
            <div className="w-full h-full bg-[#f8fafc] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3E8940 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              
              {/* Fake Map Markers */}
              {filtered.map((o, idx) => {
                const performance = o.rating >= 4 ? 'high' : o.rating >= 3 ? 'medium' : 'low';
                const color = performance === 'high' ? 'bg-emerald-500' : performance === 'medium' ? 'bg-amber-500' : 'bg-rose-500';
                const shadow = performance === 'high' ? 'shadow-emerald-200' : performance === 'medium' ? 'shadow-amber-200' : 'shadow-rose-200';
                
                // Random positioning for mock map
                const top = `${20 + (idx * 15) % 60}%`;
                const left = `${20 + (idx * 23) % 60}%`;
                
                return (
                  <div key={o.id} className="absolute transition-transform hover:scale-110 cursor-pointer group" style={{ top, left }}>
                    <div className={`relative h-10 w-10 flex items-center justify-center rounded-full ${color} text-white shadow-xl ${shadow} border-4 border-white`}>
                      <Store className="h-4 w-4" />
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white border-2 border-slate-900" />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white p-3 rounded-xl shadow-2xl border w-48 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                      <p className="font-bold text-xs text-slate-900">{o.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{o.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" /><span className="text-[10px] font-bold">{o.rating}</span></div>
                        <Badge className={`text-[9px] px-1.5 ${o.currentLoad >= o.dailyCapacity ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {Math.round((o.currentLoad / (o.dailyCapacity || 1)) * 100)}% Load
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border m-8 max-w-sm text-center">
                <MapPin className="h-10 w-10 text-[#3E8940] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900">Geo Map Perspective</h3>
                <p className="text-sm text-slate-500 mt-2">Visualizing performance density across regions. Markers are color-coded by performance index (Rating + SLA).</p>
                <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-emerald-500" /> High</div>
                  <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-amber-500" /> Medium</div>
                  <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-rose-500" /> Low</div>
                </div>
              </div>
            </div>
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
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outlet Name</label><Input placeholder="e.g. Cleclo Premium - Bandra" className="rounded-xl bg-slate-50 border-none" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manager Assigned</label><Input placeholder="Search user ID..." className="rounded-xl bg-slate-50 border-none" /></div>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location / City</label><Input placeholder="e.g. Mumbai, Maharashtra" className="rounded-xl bg-slate-50 border-none" /></div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outlet Type</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {["Standard Store", "Experience Store", "Processing Hub", "Collection Centre"].map(t => (
                      <div key={t} className="p-3 border rounded-xl flex items-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">{t === "Experience Store" ? "🏢" : t === "Processing Hub" ? "🏭" : t === "Collection Centre" ? "📦" : "🏬"}</div>
                        <span className="text-sm font-medium">{t}</span>
                      </div>
                    ))}
                  </div>
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enabled Services</label>
                  <div className="flex flex-wrap gap-2">
                    {["Wash & Fold", "Premium Laundry", "Dry Clean", "Steam Iron", "Shoe Care"].map(s => (
                      <Badge key={s} variant="outline" className="rounded-full px-4 py-1.5 cursor-pointer hover:bg-[#3E8940] hover:text-white transition-colors">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Capacity (Units)</label><Input type="number" defaultValue={200} className="rounded-xl bg-slate-50 border-none" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target SLA (Hrs)</label><Input type="number" defaultValue={24} className="rounded-xl bg-slate-50 border-none" /></div>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-4">
                <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-10 w-10 animate-spin-slow" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Finalizing Configuration</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Confirming commission rates and service parameters before activating the outlet.</p>
                <div className="p-6 bg-slate-50 rounded-2xl border text-left space-y-3 max-w-md mx-auto mt-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Platform Commission</span><span className="font-bold text-slate-700">18.0%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Security Deposit</span><span className="font-bold text-emerald-600">Verified</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Service Coverage</span><span className="font-bold text-slate-700">5km Radius</span></div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-8 flex items-center justify-between">
              <Button variant="ghost" className="rounded-xl" onClick={() => onboardingStep > 1 ? setOnboardingStep(onboardingStep - 1) : setShowOnboarding(false)}>{onboardingStep === 1 ? 'Cancel' : 'Back'}</Button>
              <Button className="bg-[#3E8940] hover:bg-[#2d662f] text-white rounded-xl px-8" onClick={() => onboardingStep < 3 ? setOnboardingStep(onboardingStep + 1) : setShowOnboarding(false)}>
                {onboardingStep === 3 ? 'Finish & Activate' : 'Next Step'} <ChevronRight className="h-4 w-4 ml-2" />
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
