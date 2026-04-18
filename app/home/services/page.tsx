"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, GripVertical, Save, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminCatalogApi } from "@/lib/admin-api";
import { toast } from "sonner";

type ServiceCategory = {
  id: string;
  name: string;
};

type ServiceRecord = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
  displayOrder?: number;
  categories?: ServiceCategory[];
};

export default function ServicesGridPage() {
  const [serviceList, setServiceList] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    icon: "🧺",
    color: "#3E8940",
  });

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await adminCatalogApi.getServices();
      const normalized = Array.isArray(data) ? (data as ServiceRecord[]) : [];
      const sorted = [...normalized].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setServiceList(sorted);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      setServiceList((prev) =>
        prev.map((service) => (service.id === id ? { ...service, isActive: !current } : service))
      );
      await adminCatalogApi.updateService(id, { isActive: !current });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update visibility");
      loadServices();
    }
  };

  const handleSave = () => {
    toast.success("All service changes are already saved to database");
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    try {
      const maxOrder = serviceList.reduce((max, service) => Math.max(max, service.displayOrder || 0), 0);
      const payload = {
        name: newService.name.trim(),
        icon: newService.icon,
        color: newService.color,
        displayOrder: maxOrder + 1,
        isActive: true,
      };

      const created = await adminCatalogApi.createService(payload);
      setServiceList((prev) => [...prev, created as ServiceRecord]);
      setNewService({ name: "", icon: "🧺", color: "#3E8940" });
      setIsDialogOpen(false);
      toast.success("Service added");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add service");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3 w-fit gap-2">
            <Link href="/app">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Services Grid
          </h1>
          <p className="text-slate-500 mt-1">
            Control which services appear on the home screen
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
          <Button
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            Saved to DB
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-500">Loading services...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {serviceList.map((service) => {
            const serviceColor = service.color || "#3E8940";
            const serviceIcon = service.icon || "🧺";

            return (
              <div key={service.id} className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${serviceColor}20` }}
                >
                  {serviceIcon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-black">{service.name}</h3>
                    {!service.isActive && (
                      <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: serviceColor }}
                      />
                      <span className="text-xs text-slate-500">
                        {serviceColor}
                      </span>
                    </div>
                    <div className="hidden sm:flex gap-1">
                      {(service.categories || []).map((category) => (
                        <Badge
                          key={category.id}
                          variant="outline"
                          className="text-[10px] h-5 px-1.5"
                        >
                          {category.name}
                        </Badge>
                      ))}
                      {(!service.categories || service.categories.length === 0) && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          No categories
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {service.isActive ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    )}
                    <Switch
                      checked={service.isActive}
                      onCheckedChange={() => toggleVisibility(service.id, service.isActive)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {serviceList.length === 0 && (
            <div className="text-center p-8 text-slate-500">No services configured</div>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Service visibility is saved immediately to database</li>
          <li>• New services are created by admin and stored in catalog DB</li>
          <li>• Category tags are fetched live from saved catalog data</li>
        </ul>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Service Name</Label>
              <Input
                placeholder="e.g., Rug Cleaning"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon (Emoji)</Label>
                <Input
                  placeholder="e.g., 🧺"
                  value={newService.icon}
                  onChange={(e) =>
                    setNewService({ ...newService, icon: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Color (Hex)</Label>
                <div className="flex gap-2 mt-1">
                  <div
                    className="w-10 h-10 rounded-md border shadow-sm shrink-0"
                    style={{ backgroundColor: newService.color }}
                  />
                  <Input
                    placeholder="#3E8940"
                    value={newService.color}
                    onChange={(e) =>
                      setNewService({ ...newService, color: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleAddService}
            >
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
