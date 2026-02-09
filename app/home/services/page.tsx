"use client";

import { useState } from "react";
import { Eye, EyeOff, Palette, GripVertical, Save, Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

const services = [
  {
    id: 1,
    name: "Wash & Fold",
    icon: "🧺",
    color: "#3E8940",
    visible: true,
    order: 1,
    types: ["Wash"],
  },
  {
    id: 2,
    name: "Wash & Iron",
    icon: "👔",
    color: "#4A90D9",
    visible: true,
    order: 2,
    types: ["Wash", "Iron"],
  },
  {
    id: 3,
    name: "Dry Clean",
    icon: "🧥",
    color: "#9B59B6",
    visible: true,
    order: 3,
    types: ["Dry Clean"],
  },
  {
    id: 4,
    name: "Iron Only",
    icon: "🔥",
    color: "#E67E22",
    visible: true,
    order: 4,
    types: ["Iron"],
  },
  {
    id: 5,
    name: "Premium Care",
    icon: "✨",
    color: "#F1C40F",
    visible: false,
    order: 5,
    types: ["Wash", "Dry Clean", "Iron"],
  },
  {
    id: 6,
    name: "Shoe Cleaning",
    icon: "👟",
    color: "#1ABC9C",
    visible: false,
    order: 6,
    types: ["Wash"],
  },
];

export default function ServicesGridPage() {
  const [serviceList, setServiceList] = useState(services);
  const [saved, setSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    icon: "🧺",
    color: "#3E8940",
    types: [] as string[],
  });

  const toggleVisibility = (id: number) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddService = () => {
    if (!newService.name) return;

    const newId = Math.max(...serviceList.map((s) => s.id)) + 1;
    const newOrder = Math.max(...serviceList.map((s) => s.order)) + 1;

    setServiceList((prev) => [
      ...prev,
      {
        id: newId,
        name: newService.name,
        icon: newService.icon,
        color: newService.color,
        visible: true,
        order: newOrder,
        types: newService.types,
      },
    ]);

    setNewService({
      name: "",
      icon: "🧺",
      color: "#3E8940",
      types: [],
    });
    setIsDialogOpen(false);
  };

  const toggleServiceType = (type: string) => {
    setNewService((prev) => {
      const types = prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type];
      return { ...prev, types };
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
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
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {serviceList.map((service) => (
          <div key={service.id} className="p-4 flex items-center gap-4">
            <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

            {/* Icon Preview */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: service.color + "20" }}
            >
              {service.icon}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-black">{service.name}</h3>
                {!service.visible && (
                  <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                    Hidden
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: service.color }}
                  />
                  <span className="text-xs text-slate-500">
                    {service.color}
                  </span>
                </div>
                <div className="hidden sm:flex gap-1">
                  {service.types?.map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-[10px] h-5 px-1.5"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {service.visible ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                )}
                <Switch
                  checked={service.visible}
                  onCheckedChange={() => toggleVisibility(service.id)}
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Palette className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Drag services to reorder them on the home screen</li>
          <li>• Hidden services won&apos;t appear to users</li>
          <li>• Click Edit to change icon and color</li>
        </ul>
      </div>

      {/* Add Service Dialog */}
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

            <div>
              <Label className="mb-2 block">Service Types</Label>
              <div className="flex gap-4">
                {["Wash", "Iron", "Dry Clean"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={newService.types.includes(type)}
                      onCheckedChange={() => toggleServiceType(type)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type}
                    </label>
                  </div>
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
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
