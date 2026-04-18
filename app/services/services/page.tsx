"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Save, Sparkles, ChevronRight, X, Trash2, Edit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { adminCatalogApi } from "@/lib/admin-api";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";



const icons = ["👔", "👕", "👖", "👗", "🧥", "👚", "🩳", "🧢", "🧣", "👜", "👟", "🧵"];
const colors = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

const getServiceItemCount = (service: any) => {
  if (!Array.isArray(service?.categories)) return 0;
  return service.categories.reduce((categorySum: number, category: any) => {
    if (!Array.isArray(category?.subCategories)) return categorySum;
    const subCategoryItems = category.subCategories.reduce(
      (subSum: number, subCategory: any) =>
        subSum + (Array.isArray(subCategory?.items) ? subCategory.items.length : 0),
      0,
    );
    return categorySum + subCategoryItems;
  }, 0);
};

export default function ServicesPage() {
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    icon: "👔",
    color: "#3B82F6",
  });

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await adminCatalogApi.getServices();
      setServiceList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const toggleService = async (id: string, current: boolean) => {
    try {
      setServiceList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)),
      );
      await adminCatalogApi.updateService(id, { isActive: !current });
    } catch (e) {
      toast.error("Failed to update status");
      loadServices();
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setNewService({ name: "", description: "", icon: "👔", color: "#3B82F6" });
    setIsDialogOpen(true);
  };

  const openEdit = (service: any) => {
    setEditingId(service.id);
    setNewService({ 
      name: service.name, 
      description: service.description || "", 
      icon: service.icon || "👔", 
      color: service.color || "#3B82F6" 
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adminCatalogApi.deleteService(id);
      setServiceList((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service removed");
    } catch (e) {
      toast.error("Failed to delete service");
    }
  };

  const handleDialogSubmit = async () => {
    if (!newService.name.trim()) return;

    try {
      const payload = {
        name: newService.name,
        description: newService.description,
        icon: newService.icon,
        color: newService.color,
        isActive: true,
      };

      if (editingId) {
        const updated = await adminCatalogApi.updateService(editingId, payload);
        setServiceList((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        toast.success("Service updated");
      } else {
        const created = await adminCatalogApi.createService(payload);
        setServiceList((prev) => [...prev, created]);
        toast.success("Service added");
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast.error("Failed to save service");
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button asChild variant="outline" size="sm" className="mb-3 w-fit gap-2">
              <Link href="/app">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl text-black font-bold tracking-tight">
              Services
            </h1>
            <p className="text-slate-500 mt-1">
              Select a service type to manage its categories
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={openAdd}
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
            <Button
              className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80"
              onClick={loadServices}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-primary">
              {serviceList.length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total Services</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-green-600">
              {serviceList.filter((s) => s.isActive).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Active</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {serviceList.reduce((sum, s) => sum + (s.categories?.length || 0), 0)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Categories</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {serviceList.reduce((sum, s) => sum + getServiceItemCount(s), 0)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total Items</p>
          </div>
        </div>

        {loading ? (
            <div className="text-center p-12 text-slate-500">Loading services...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {serviceList.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden group hover:shadow-lg transition-all ${
                !service.isActive ? "opacity-60" : ""
              }`}
            >
              {/* Card Header with Color */}
              <div
                className="p-6 relative overflow-hidden"
                style={{ backgroundColor: service.color + "15" }}
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2"
                  style={{ backgroundColor: service.color + "20" }}
                />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm"
                      style={{ backgroundColor: "white" }}
                    >
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black">
                        {service.name}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(service)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Switch
                    checked={service.isActive}
                    onCheckedChange={() => toggleService(service.id, service.isActive)}
                  />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 pt-4 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex gap-6">
                    <div>
                      <p
                        className="text-2xl font-bold"
                        style={{ color: service.color }}
                      >
                        {service.categories?.length || 0}
                      </p>
                      <p className="text-xs text-slate-500">Categories</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-600">
                        {getServiceItemCount(service)}
                      </p>
                      <p className="text-xs text-slate-500">Items</p>
                    </div>
                  </div>
                  {(service.categories?.length || 0) === 0 ? (
                    <p className="text-xs text-slate-500">
                      No categories yet. Open View Categories to add data.
                    </p>
                  ) : null}
                </div>

                {/* View Button */}
                <Link
                  href={`/services/categories?serviceId=${service.id}&service=${encodeURIComponent(service.name)}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
                  style={{
                    backgroundColor: service.color + "15",
                    color: service.color,
                  }}
                >
                  View Categories
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Info Box */}
        <div className="bg-linear-to-r from-[#3E8940] to-[#5FAD61] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-bold">Service Hierarchy</h3>
          </div>
          <p className="text-white/80">
            Services → Categories → Sub Categories → Items. Each service can
            have multiple categories (Men, Women, Kids, etc.) with their own
            sub-categories and items.
          </p>
        </div>
      </div>

      {/* Add Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Service Name
              </label>
              <Input
                placeholder="e.g., Premium Care"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>
              <Input
                placeholder="e.g., Special care for delicate items"
                value={newService.description}
                onChange={(e) =>
                  setNewService({ ...newService, description: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Icon</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewService({ ...newService, icon })}
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${
                      newService.icon === icon
                        ? "border-primary bg-primary/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Color
              </label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewService({ ...newService, color })}
                    className={`h-8 w-8 rounded-full transition-all ${
                      newService.color === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleDialogSubmit}
            >
              {editingId ? <><Save className="h-4 w-4 mr-2" />Save Changes</> : <><Plus className="h-4 w-4 mr-2" />Add Service</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
