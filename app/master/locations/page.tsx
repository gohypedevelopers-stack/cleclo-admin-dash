"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LocationSettingsPage() {
  const [loading, setLoading] = useState(false);

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
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl px-6 shadow-lg shadow-emerald-900/10"
            onClick={() => {}}
            disabled={loading}
          >
            <Save className="h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Tabs for different location management aspects */}
      <Tabs defaultValue="cities" className="w-full">
        <TabsList className="bg-white border border-slate-100 p-1 h-14 rounded-2xl shadow-sm mb-8">
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

        <TabsContent value="cities" className="mt-0">
          <div className="grid gap-6">
            {/* Search & Add */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search city or area..." className="pl-10 h-12 rounded-xl bg-white border-slate-100 shadow-sm" />
              </div>
              <Button className="h-12 bg-sky-600 hover:bg-sky-700 rounded-xl gap-2 px-6">
                <Plus className="h-4 w-4" />
                Add New City
              </Button>
            </div>

            {/* City Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {["Mumbai", "Delhi", "Bangalore", "Pune"].map((city) => (
                <div key={city} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold">
                        {city[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{city}</h3>
                        <p className="text-xs text-slate-500">Maharashtra, India</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-400">Operational</span>
                      <Switch defaultChecked className="data-[state=checked]:bg-sky-500" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <span className="text-sm font-medium text-slate-600">Active Areas</span>
                      <Badge variant="outline" className="bg-white">12 Areas</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <span className="text-sm font-medium text-slate-600">Live Vendors</span>
                      <Badge variant="outline" className="bg-white">45 Vendors</Badge>
                    </div>
                  </div>

                  <Button variant="ghost" className="w-full mt-6 text-sky-600 hover:bg-sky-50 hover:text-sky-700 rounded-xl">
                    Configure Area Settings
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="slots" className="mt-0">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
             <h2 className="text-xl font-bold text-slate-900 mb-6">Pickup & Delivery Time Slots</h2>
             <div className="grid gap-8">
               <div className="space-y-4">
                 <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Morning Slots (08:00 AM - 12:00 PM)</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"].map(slot => (
                      <div key={slot} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50">
                        <span className="text-sm font-bold text-slate-700">{slot}</span>
                        <Switch defaultChecked />
                      </div>
                    ))}
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Evening Slots (04:00 PM - 09:00 PM)</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["04:00 - 05:00", "05:00 - 06:00", "06:00 - 07:00", "07:00 - 08:00"].map(slot => (
                      <div key={slot} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50">
                        <span className="text-sm font-bold text-slate-700">{slot}</span>
                        <Switch defaultChecked />
                      </div>
                    ))}
                 </div>
               </div>
             </div>
             
             <div className="mt-10 p-6 rounded-2xl bg-amber-50 border border-amber-100">
               <h4 className="font-bold text-amber-800 flex items-center gap-2">
                 <Settings2 className="h-4 w-4" />
                 Global Slot Configuration
               </h4>
               <p className="text-sm text-amber-700/70 mt-1">These slots apply to all operational cities by default unless overridden at city level.</p>
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
               <Switch defaultChecked className="data-[state=checked]:bg-rose-500" />
             </div>

             <div className="space-y-4">
               {["Indiranagar (Bangalore)", "Koregaon Park (Pune)", "Bandra West (Mumbai)"].map((area) => (
                 <div key={area} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-rose-100 bg-rose-50/20">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                       <Zap className="h-5 w-5" />
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-800">{area}</h4>
                       <span className="text-[10px] uppercase font-bold text-slate-400">High Demand Zone</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-6">
                     <div className="flex items-center gap-3">
                       <span className="text-xs font-medium text-slate-500">Multiplier</span>
                       <Input type="number" defaultValue="1.5" className="h-10 w-20 rounded-lg text-center font-bold text-rose-600 border-rose-100" />
                       <span className="text-lg font-bold text-rose-600">x</span>
                     </div>
                     <Switch defaultChecked className="data-[state=checked]:bg-rose-500" />
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-0">
           <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Service Availability Matrix</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Service Type</th>
                      <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Mumbai</th>
                      <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Delhi</th>
                      <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Bangalore</th>
                      <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Pune</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {["Dry Clean", "Laundry", "Shoe Cleaning", "Home Textile"].map(service => (
                      <tr key={service} className="group hover:bg-slate-50/50 transition-all">
                        <td className="py-4 font-bold text-slate-700">{service}</td>
                        {[1, 2, 3, 4].map(i => (
                          <td key={i} className="py-4 text-center">
                            <Switch defaultChecked={i !== 4} className="data-[state=checked]:bg-emerald-500" />
                          </td>
                        ))}
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
