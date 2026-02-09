"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Save, Sparkles, ChevronRight, X } from "lucide-react";
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

const initialServices = [
  {
    id: 1,
    name: "Wash",
    icon: "🧺",
    color: "#3B82F6",
    description: "Machine wash friendly items",
    categoriesCount: 6,
    itemsCount: 14,
    active: true,
  },
  {
    id: 2,
    name: "Wash & Iron",
    icon: "👔",
    color: "#10B981",
    description: "Wash with professional ironing",
    categoriesCount: 6,
    itemsCount: 6,
    active: true,
  },
  {
    id: 3,
    name: "Dry Clean",
    icon: "✨",
    color: "#8B5CF6",
    description: "Delicate & specialty items",
    categoriesCount: 6,
    itemsCount: 18,
    active: true,
  },
  {
    id: 4,
    name: "Iron Only",
    icon: "🔥",
    color: "#F59E0B",
    description: "Quick ironing service",
    categoriesCount: 4,
    itemsCount: 0,
    active: false,
  },
];

const icons = ["🧺", "👔", "✨", "🔥", "🧴", "🧼", "👗", "🧥", "🎽", "🩲"];
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

export default function ServicesPage() {
  const [serviceList, setServiceList] = useState(initialServices);
  const [saved, setSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    icon: "🧺",
    color: "#3B82F6",
  });

  const toggleService = (id: number) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddService = () => {
    if (!newService.name.trim()) return;

    const newId = Math.max(...serviceList.map((s) => s.id)) + 1;
    setServiceList((prev) => [
      ...prev,
      {
        id: newId,
        name: newService.name,
        description: newService.description,
        icon: newService.icon,
        color: newService.color,
        categoriesCount: 0,
        itemsCount: 0,
        active: true,
      },
    ]);
    setNewService({ name: "", description: "", icon: "🧺", color: "#3B82F6" });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
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
              {saved ? "Saved!" : "Save"}
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
              {serviceList.filter((s) => s.active).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Active</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {serviceList.reduce((sum, s) => sum + s.categoriesCount, 0)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Categories</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {serviceList.reduce((sum, s) => sum + s.itemsCount, 0)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total Items</p>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {serviceList.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden group hover:shadow-lg transition-all ${
                !service.active ? "opacity-60" : ""
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
                  <Switch
                    checked={service.active}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 pt-4 flex items-center justify-between">
                <div className="flex gap-6">
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: service.color }}
                    >
                      {service.categoriesCount}
                    </p>
                    <p className="text-xs text-slate-500">Categories</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-600">
                      {service.itemsCount}
                    </p>
                    <p className="text-xs text-slate-500">Items</p>
                  </div>
                </div>

                {/* View Button */}
                <Link
                  href={`/services/categories?service=${service.name}`}
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
            <DialogTitle>Add New Service</DialogTitle>
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
              onClick={handleAddService}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
