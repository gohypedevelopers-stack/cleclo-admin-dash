"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Clock,
  MapPin,
  Plus,
  Save,
  Search,
  Settings2,
  Zap,
  Loader2,
  CheckCircle2,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminLocationApi, adminCatalogApi } from "@/lib/admin-api";
import { toast } from "sonner";

export default function LocationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [cityList, areaList, slotList, serviceList, rules] = await Promise.all([
        adminLocationApi.getCities(),
        adminLocationApi.getAreas(),
        adminLocationApi.getTimeSlots(),
        adminCatalogApi.getServices(),
        adminCatalogApi.getAvailabilityRules("service"),
      ]);
      setCities(cityList || []);
      setAreas(areaList || []);
      setSlots(slotList || []);
      setServices(serviceList || []);
      setAvailabilityRules(rules || []);
    } catch (e) {
      console.error("Failed to load location data", e);
      toast.error("Failed to load configuration data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCity = async (cityCode: string, isEnabled: boolean) => {
    const city = cities.find(c => c.cityCode === cityCode);
    if (!city) return;
    try {
      await adminLocationApi.updateCity(city.id, { isEnabled });
      setCities(cities.map(c => c.cityCode === cityCode ? { ...c, isEnabled } : c));
      toast.success(`${city.cityName} status updated`);
    } catch (e) {
      toast.error("Failed to update city status");
    }
  };

  const handleUpdateSurge = (areaCode: string, surgePercent: number) => {
    setAreas(areas.map(a => a.areaCode === areaCode ? { ...a, surgePercent } : a));
  };

  const handleToggleArea = (areaCode: string, isEnabled: boolean) => {
    setAreas(areas.map(a => a.areaCode === areaCode ? { ...a, isEnabled } : a));
  };

  const handleToggleService = (cityCode: string, serviceId: string, isVisible: boolean) => {
    const existingRule = availabilityRules.find(r => r.cityCode === cityCode && r.entityId === serviceId);
    if (existingRule) {
      setAvailabilityRules(availabilityRules.map(r => 
        (r.cityCode === cityCode && r.entityId === serviceId) ? { ...r, isVisible } : r
      ));
    } else {
      setAvailabilityRules([...availabilityRules, { cityCode, entityId: serviceId, entityType: "service", isVisible }]);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      // Bulk update areas (surge pricing)
      const areaUpdates = areas.map(a => adminLocationApi.updateArea(a.id, { 
        surgePercent: a.surgePercent, 
        isEnabled: a.isEnabled 
      }));
      
      // Save availability rules
      const ruleUpdate = adminCatalogApi.saveAvailabilityRules(availabilityRules);

      await Promise.all([...areaUpdates, ruleUpdate]);
      toast.success("All changes saved successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save some changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-slate-500 font-medium">Loading Location Intelligence...</p>
      </div>
    );
  }

  const filteredCities = cities.filter(c => 
    c.cityName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.cityCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 gap-2 text-slate-500 hover:text-[#3E8940]">
            <Link href="/app">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-sm">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Location Configuration</h1>
              <p className="text-slate-500">Manage city-wise operations, time slots, and availability.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl px-6 shadow-lg shadow-emerald-900/10 min-w-[160px]"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cities" className="w-full">
        <TabsList className="bg-white border border-slate-100 p-1 h-14 rounded-2xl shadow-sm mb-8 overflow-x-auto justify-start md:justify-center">
          <TabsTrigger value="cities" className="rounded-xl px-8 data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:shadow-none">
            <Building2 className="h-4 w-4 mr-2" />
            Cities & Areas
          </TabsTrigger>
          <TabsTrigger value="slots" className="rounded-xl px-8 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-none">
            <Clock className="h-4 w-4 mr-2" />
            Time Slots
          </TabsTrigger>
          <TabsTrigger value="surge" className="rounded-xl px-8 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-none">
            <Zap className="h-4 w-4 mr-2" />
            Surge Pricing
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-xl px-8 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none">
            <Settings2 className="h-4 w-4 mr-2" />
            Service Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cities" className="mt-0 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search city..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-white border-slate-100 shadow-sm" 
              />
            </div>
            <Button className="h-12 bg-sky-600 hover:bg-sky-700 rounded-xl gap-2 px-6">
              <Plus className="h-4 w-4" />
              Add New City
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCities.map((city) => (
              <div key={city.cityCode} className="group relative flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold">
                      {city.cityName[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{city.cityName}</h3>
                      <p className="text-xs text-slate-500">{city.stateName || "Operational City"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-sky-600">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch 
                      checked={city.isEnabled} 
                      onCheckedChange={(val) => handleToggleCity(city.cityCode, val)}
                      className="data-[state=checked]:bg-sky-500 scale-90" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Code</p>
                    <p className="text-sm font-bold text-slate-700">{city.cityCode}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Timezone</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{city.timezone}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                  <p className="text-[9px] text-slate-400 font-bold italic">
                    Updated by: <span className="text-slate-600 uppercase not-italic">{city.updatedByAdminName || "System"}</span> | {new Date(city.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-rose-500 rounded-full">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="slots" className="mt-0">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-bold text-slate-900">Time Slot Management</h2>
               <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Global Slots</Badge>
               </div>
             </div>
             
             <div className="grid gap-8">
               {["pickup", "delivery"].map(type => (
                 <div key={type} className="space-y-4">
                   <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      {type === "pickup" ? <Zap className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                      {type} Slots
                    </h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-600 hover:bg-amber-50">Add Slot</Button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {slots.filter(s => s.slotType === type).map(slot => (
                        <div key={slot.id} className="group flex flex-col gap-2 p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-200 transition-all shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700">{slot.startTime} - {slot.endTime}</span>
                            <div className="flex items-center gap-1">
                               <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-amber-600">
                                 <Pencil className="h-3 w-3" />
                               </Button>
                               <Switch checked={slot.isActive} className="scale-75 data-[state=checked]:bg-amber-500" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{slot.cityCode}</p>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-blue-500">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </TabsContent>

        <TabsContent value="surge" className="mt-0">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <div>
                 <h2 className="text-xl font-bold text-slate-900">Area-wise Surge Pricing</h2>
                 <p className="text-sm text-slate-500">Apply multiplier to base price for high-demand zones.</p>
               </div>
               <Badge className="bg-rose-100 text-rose-700 border-none font-bold">Dynamic Pricing Active</Badge>
             </div>

             <div className="grid gap-4 md:grid-cols-2">
                {areas.map((area) => (
                  <div key={area.areaCode} className={`group flex flex-col gap-4 p-5 rounded-3xl border-2 transition-all ${area.isEnabled ? 'border-rose-100 bg-white hover:border-rose-300' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${area.isEnabled ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{area.areaName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{area.cityCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-rose-50/50 px-2 py-1 rounded-lg border border-rose-100/50">
                          <Input 
                            type="number" 
                            step="0.1"
                            value={area.surgePercent === 0 ? "" : area.surgePercent} 
                            placeholder="0"
                            onChange={(e) => handleUpdateSurge(area.areaCode, parseFloat(e.target.value) || 0)}
                            className="h-7 w-12 text-center text-xs font-black text-rose-600 border-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 focus-visible:ring-0" 
                          />
                          <span className="text-xs font-bold text-rose-600">%</span>
                        </div>
                        <Switch 
                          checked={area.isEnabled} 
                          onCheckedChange={(val) => handleToggleArea(area.areaCode, val)}
                          className="data-[state=checked]:bg-rose-500 scale-90" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                        <p className="text-[9px] text-slate-400 font-bold italic">
                          Updated by: <span className="text-slate-600 uppercase not-italic">{area.updatedByAdminName || "Arjun"}</span> | {new Date(area.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                        <div className="flex items-center gap-1">
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-blue-500 rounded-full">
                             <Copy className="h-3.5 w-3.5" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-rose-500 rounded-full">
                             <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                        </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-0">
           <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm overflow-hidden">
              <h2 className="text-xl font-bold text-slate-900 px-6 pt-6 mb-6">Service Availability Matrix</h2>
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Service Type</th>
                      {cities.map(city => (
                        <th key={city.cityCode} className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center px-4">
                          {city.cityName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {services.map(service => (
                      <tr key={service.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <Settings2 className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-slate-700">{service.name}</span>
                          </div>
                        </td>
                        {cities.map(city => {
                          const rule = availabilityRules.find(r => r.cityCode === city.cityCode && r.entityId === service.id);
                          const isVisible = rule ? rule.isVisible : true; // Default to true if no rule exists
                          return (
                            <td key={city.cityCode} className="py-4 text-center px-4">
                              <Switch 
                                checked={isVisible} 
                                onCheckedChange={(val) => handleToggleService(city.cityCode, service.id, val)}
                                className="data-[state=checked]:bg-emerald-500" 
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
