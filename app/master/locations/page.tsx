"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  ArrowLeft,
  Search,
  Globe,
  Settings,
  AlertCircle
} from "lucide-react";
import { adminLocationApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type City = {
  id: string;
  name: string;
  code: string;
  status: string;
  surcharge: number;
};

type Area = {
  id: string;
  name: string;
  cityCode: string;
  status: string;
  surcharge: number;
};

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  cityCode: string;
  slotType: string;
  surcharge: number;
  isActive: boolean;
};

export default function LocationsPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("cities");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [cityForm, setCityForm] = useState({ name: "", code: "", surcharge: 0, status: "active" });
  const [areaForm, setAreaForm] = useState({ name: "", cityCode: "", surcharge: 0, status: "active" });
  const [slotForm, setSlotForm] = useState({ startTime: "09:00", endTime: "11:00", cityCode: "all", slotType: "regular", surcharge: 0, isActive: true });

  const loadData = async () => {
    try {
      setLoading(true);
      const [c, a, s] = await Promise.all([
        adminLocationApi.getCities(),
        adminLocationApi.getAreas(),
        adminLocationApi.getTimeSlots()
      ]);
      setCities(c);
      setAreas(a);
      setTimeSlots(s);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load location data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- City Handlers ---
  const openAddCity = () => {
    setEditingId(null);
    setCityForm({ name: "", code: "", surcharge: 0, status: "active" });
    setIsCityDialogOpen(true);
  };

  const openEditCity = (city: City) => {
    setEditingId(city.id);
    setCityForm({ name: city.name, code: city.code, surcharge: city.surcharge, status: city.status });
    setIsCityDialogOpen(true);
  };

  const handleCitySubmit = async () => {
    try {
      if (editingId) {
        await adminLocationApi.updateCity(editingId, cityForm);
        toast.success("City updated");
      } else {
        await adminLocationApi.createCity(cityForm);
        toast.success("City created");
      }
      setIsCityDialogOpen(false);
      loadData();
    } catch (e) {
      toast.error("Failed to save city");
    }
  };

  const deleteCity = async (id: string) => {
    if (!confirm("Are you sure? This might affect areas and slots linked to this city.")) return;
    try {
      await adminLocationApi.deleteCity(id);
      toast.success("City deleted");
      loadData();
    } catch (e) {
      toast.error("Failed to delete city");
    }
  };

  // --- Area Handlers ---
  const openAddArea = () => {
    setEditingId(null);
    setAreaForm({ name: "", cityCode: cities[0]?.code || "", surcharge: 0, status: "active" });
    setIsAreaDialogOpen(true);
  };

  const openEditArea = (area: Area) => {
    setEditingId(area.id);
    setAreaForm({ name: area.name, cityCode: area.cityCode, surcharge: area.surcharge, status: area.status });
    setIsAreaDialogOpen(true);
  };

  const handleAreaSubmit = async () => {
    try {
      if (editingId) {
        await adminLocationApi.updateArea(editingId, areaForm);
        toast.success("Area updated");
      } else {
        await adminLocationApi.createArea(areaForm);
        toast.success("Area created");
      }
      setIsAreaDialogOpen(false);
      loadData();
    } catch (e) {
      toast.error("Failed to save area");
    }
  };

  const deleteArea = async (id: string) => {
    try {
      await adminLocationApi.deleteArea(id);
      toast.success("Area deleted");
      loadData();
    } catch (e) {
      toast.error("Failed to delete area");
    }
  };

  // --- Slot Handlers ---
  const openAddSlot = () => {
    setEditingId(null);
    setSlotForm({ startTime: "09:00", endTime: "11:00", cityCode: "all", slotType: "regular", surcharge: 0, isActive: true });
    setIsSlotDialogOpen(true);
  };

  const openEditSlot = (slot: TimeSlot) => {
    setEditingId(slot.id);
    setSlotForm({ 
      startTime: slot.startTime, 
      endTime: slot.endTime, 
      cityCode: slot.cityCode, 
      slotType: slot.slotType, 
      surcharge: slot.surcharge, 
      isActive: slot.isActive 
    });
    setIsSlotDialogOpen(true);
  };

  const handleSlotSubmit = async () => {
    try {
      if (editingId) {
        await adminLocationApi.updateTimeSlot(editingId, slotForm);
        toast.success("Time slot updated");
      } else {
        await adminLocationApi.createTimeSlot(slotForm);
        toast.success("Time slot created");
      }
      setIsSlotDialogOpen(false);
      loadData();
    } catch (e) {
      toast.error("Failed to save time slot");
    }
  };

  const deleteSlot = async (id: string) => {
    try {
      await adminLocationApi.deleteTimeSlot(id);
      toast.success("Time slot deleted");
      loadData();
    } catch (e) {
      toast.error("Failed to delete time slot");
    }
  };

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAreas = areas.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.cityCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSlots = timeSlots.filter(s => 
    s.cityCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.slotType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3 w-fit gap-2">
            <Link href="/master/items">
              <ArrowLeft className="h-4 w-4" />
              Back to Items
            </Link>
          </Button>
          <h1 className="text-3xl text-black font-bold tracking-tight">Location Configuration</h1>
          <p className="text-slate-500 mt-1">Manage cities, delivery areas, and pickup time slots</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search..." 
              className="pl-9 bg-white" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {activeTab === "cities" && (
            <Button className="gap-2 bg-primary" onClick={openAddCity}>
              <Plus className="h-4 w-4" />
              Add City
            </Button>
          )}
          {activeTab === "areas" && (
            <Button className="gap-2 bg-primary" onClick={openAddArea}>
              <Plus className="h-4 w-4" />
              Add Area
            </Button>
          )}
          {activeTab === "slots" && (
            <Button className="gap-2 bg-primary" onClick={openAddSlot}>
              <Plus className="h-4 w-4" />
              Add Slot
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="cities" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 rounded-xl w-fit">
          <TabsTrigger value="cities" className="rounded-lg gap-2 data-[state=active]:bg-white">
            <Globe className="h-4 w-4" />
            Cities
          </TabsTrigger>
          <TabsTrigger value="areas" className="rounded-lg gap-2 data-[state=active]:bg-white">
            <MapPin className="h-4 w-4" />
            Areas
          </TabsTrigger>
          <TabsTrigger value="slots" className="rounded-lg gap-2 data-[state=active]:bg-white">
            <Clock className="h-4 w-4" />
            Time Slots
          </TabsTrigger>
        </TabsList>

        {/* CITIES TAB */}
        <TabsContent value="cities" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCities.map((city) => (
              <div key={city.id} className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCity(city)}>
                      <Edit className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => deleteCity(city.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">{city.name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{city.code}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge className={`${city.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'} border-none`}>
                    {city.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Surcharge</p>
                    <p className="font-bold text-black">₹{city.surcharge}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredCities.length === 0 && !loading && (
               <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed">
                <p className="text-slate-500">No cities found. Click "Add City" to get started.</p>
              </div>
            )}
            {loading && <div className="col-span-full text-center py-12 text-slate-400">Loading cities...</div>}
          </div>
        </TabsContent>

        {/* AREAS TAB */}
        <TabsContent value="areas" className="mt-6">
           <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Area Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">City Code</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Surcharge</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-black">{area.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono">{area.cityCode}</Badge>
                    </td>
                    <td className="px-6 py-4">
                       <Badge className={`${area.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'} border-none`}>
                        {area.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-black">₹{area.surcharge}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditArea(area)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => deleteArea(area.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAreas.length === 0 && !loading && (
               <div className="py-12 text-center text-slate-500">No areas found.</div>
            )}
          </div>
        </TabsContent>

        {/* SLOTS TAB */}
        <TabsContent value="slots" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSlots.map((slot) => (
              <div key={slot.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${!slot.isActive ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                   <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${slot.slotType === 'express' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Clock className="h-5 w-5" />
                  </div>
                   <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSlot(slot)}>
                      <Edit className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => deleteSlot(slot.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-lg font-bold text-black">{slot.startTime} - {slot.endTime}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{slot.slotType} slot</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tight">City</p>
                    <Badge variant="outline" className="text-[10px] py-0">{slot.cityCode}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-tight">Surcharge</p>
                    <p className="font-bold text-green-600">₹{slot.surcharge}</p>
                  </div>
                </div>
              </div>
            ))}
             {filteredSlots.length === 0 && !loading && (
               <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed">
                <p className="text-slate-500">No time slots found.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* CITY DIALOG */}
      <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit City" : "Add New City"}</DialogTitle>
            <DialogDescription>Configure base service city and default surcharge.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City Name</Label>
                <Input placeholder="e.g. Bangalore" value={cityForm.name} onChange={e => setCityForm({...cityForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>City Code</Label>
                <Input placeholder="e.g. BLR" value={cityForm.code} onChange={e => setCityForm({...cityForm, code: e.target.value.toUpperCase()})} disabled={!!editingId} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Base Surcharge (₹)</Label>
              <Input type="number" value={cityForm.surcharge} onChange={e => setCityForm({...cityForm, surcharge: Number(e.target.value)})} />
            </div>
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Service Status</Label>
                <Select value={cityForm.status} onValueChange={v => setCityForm({...cityForm, status: v})}>
                  <SelectTrigger className="w-[120px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCityDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary gap-2" onClick={handleCitySubmit}>
              <Save className="h-4 w-4" />
              {editingId ? "Update City" : "Create City"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AREA DIALOG */}
      <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Area" : "Add New Area"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>City</Label>
                <Select value={areaForm.cityCode} onValueChange={v => setAreaForm({...areaForm, cityCode: v})}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Area Name</Label>
                <Input placeholder="e.g. Indiranagar" value={areaForm.name} onChange={e => setAreaForm({...areaForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Area Specific Surcharge (₹)</Label>
                <Input type="number" value={areaForm.surcharge} onChange={e => setAreaForm({...areaForm, surcharge: Number(e.target.value)})} />
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAreaDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary" onClick={handleAreaSubmit}>
              {editingId ? "Update Area" : "Create Area"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SLOT DIALOG */}
      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Slot" : "Add Time Slot"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={slotForm.startTime} onChange={e => setSlotForm({...slotForm, startTime: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={slotForm.endTime} onChange={e => setSlotForm({...slotForm, endTime: e.target.value})} />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City Scope</Label>
                  <Select value={slotForm.cityCode} onValueChange={v => setSlotForm({...slotForm, cityCode: v})}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slot Type</Label>
                  <Select value={slotForm.slotType} onValueChange={v => setSlotForm({...slotForm, slotType: v})}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="express">Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
             <div className="space-y-2">
                <Label>Slot Surcharge (₹)</Label>
                <Input type="number" value={slotForm.surcharge} onChange={e => setSlotForm({...slotForm, surcharge: Number(e.target.value)})} />
             </div>
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Active Status</Label>
                <Switch checked={slotForm.isActive} onCheckedChange={v => setSlotForm({...slotForm, isActive: v})} />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSlotDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary" onClick={handleSlotSubmit}>
              {editingId ? "Update Slot" : "Create Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
