"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { adminCatalogApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ItemRecord = {
  id: string;
};

type SubCategoryRecord = {
  id: string;
  items?: ItemRecord[];
};

type CategoryRecord = {
  id: string;
  subCategories?: SubCategoryRecord[];
};

type ServiceRecord = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number | null;
  isActive: boolean;
  defaultProcessingHours?: number | null;
  expressOptionAllowed?: boolean | null;
  surgePricingAllowed?: boolean | null;
  defaultCommissionPercent?: number | null;
  updatedByAdminName?: string | null;
  updatedAt?: string | null;
  categories?: CategoryRecord[];
};

type ServiceForm = {
  name: string;
  description: string;
  icon: string;
  color: string;
  displayOrder: string;
  defaultProcessingHours: string;
  defaultCommissionPercent: string;
  expressOptionAllowed: boolean;
  surgePricingAllowed: boolean;
};

const iconOptions = ["S", "W", "D", "I", "P", "B"];
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

const emptyServiceForm: ServiceForm = {
  name: "",
  description: "",
  icon: "S",
  color: "#3B82F6",
  displayOrder: "0",
  defaultProcessingHours: "72",
  defaultCommissionPercent: "18",
  expressOptionAllowed: true,
  surgePricingAllowed: true,
};

const toNumber = (value: string | number | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not updated";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not updated";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const getServiceItemCount = (service: ServiceRecord) => {
  if (!Array.isArray(service.categories)) return 0;

  return service.categories.reduce((categorySum, category) => {
    if (!Array.isArray(category.subCategories)) return categorySum;

    const subCategoryItems = category.subCategories.reduce(
      (subSum, subCategory) =>
        subSum + (Array.isArray(subCategory.items) ? subCategory.items.length : 0),
      0,
    );

    return categorySum + subCategoryItems;
  }, 0);
};

export default function ServicesPage() {
  const [serviceList, setServiceList] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyServiceForm);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await adminCatalogApi.getServices();
      setServiceList(Array.isArray(data) ? data : []);
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

  const toggleService = async (id: string, current: boolean) => {
    try {
      setServiceList((prev) =>
        prev.map((service) =>
          service.id === id ? { ...service, isActive: !current } : service,
        ),
      );
      await adminCatalogApi.updateService(id, { isActive: !current });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update service status");
      loadServices();
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setServiceForm({
      ...emptyServiceForm,
      displayOrder: String(serviceList.length + 1),
    });
    setIsDialogOpen(true);
  };

  const openEdit = (service: ServiceRecord) => {
    setEditingId(service.id);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      icon: service.icon || "S",
      color: service.color || "#3B82F6",
      displayOrder: String(service.displayOrder ?? 0),
      defaultProcessingHours: String(service.defaultProcessingHours ?? 72),
      defaultCommissionPercent: String(service.defaultCommissionPercent ?? 18),
      expressOptionAllowed: service.expressOptionAllowed !== false,
      surgePricingAllowed: service.surgePricingAllowed !== false,
    });
    setIsDialogOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (
      !confirm(
        "Archive this service? It will become inactive instead of being permanently deleted.",
      )
    ) {
      return;
    }

    try {
      await adminCatalogApi.deleteService(id);
      toast.success("Service archived");
      loadServices();
    } catch (error) {
      console.error(error);
      toast.error("Failed to archive service");
    }
  };

  const handleDialogSubmit = async () => {
    if (!serviceForm.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        icon: serviceForm.icon,
        color: serviceForm.color,
        displayOrder: toNumber(serviceForm.displayOrder, 0),
        defaultProcessingHours: toNumber(serviceForm.defaultProcessingHours, 72),
        defaultCommissionPercent: toNumber(
          serviceForm.defaultCommissionPercent,
          18,
        ),
        expressOptionAllowed: serviceForm.expressOptionAllowed,
        surgePricingAllowed: serviceForm.surgePricingAllowed,
        isActive: true,
      };

      if (editingId) {
        await adminCatalogApi.updateService(editingId, payload);
        toast.success("Service updated");
      } else {
        await adminCatalogApi.createService(payload);
        toast.success("Service added");
      }

      setIsDialogOpen(false);
      loadServices();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-5xl space-y-6">
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
              Manage service type, SLA, express options, surge permission and
              default commission.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={openAdd}>
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

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-primary">{serviceList.length}</p>
            <p className="text-sm text-slate-500 mt-1">Total Services</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-green-600">
              {serviceList.filter((service) => service.isActive).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Active</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {serviceList.reduce(
                (sum, service) => sum + (service.categories?.length || 0),
                0,
              )}
            </p>
            <p className="text-sm text-slate-500 mt-1">Categories</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {serviceList.reduce(
                (sum, service) => sum + getServiceItemCount(service),
                0,
              )}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total Items</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3E8940] mb-2" />
            Loading services...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serviceList.map((service) => {
              const serviceColor = service.color || "#3E8940";

              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden group hover:shadow-lg transition-all ${
                    !service.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className="p-6 relative overflow-hidden"
                    style={{ backgroundColor: `${serviceColor}15` }}
                  >
                    <div
                      className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2"
                      style={{ backgroundColor: `${serviceColor}20` }}
                    />
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm bg-white">
                          {service.icon || "S"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-bold text-black">
                              {service.name}
                            </h3>
                            <Badge
                              className={
                                service.isActive
                                  ? "bg-green-100 text-green-700 border-none"
                                  : "bg-slate-100 text-slate-600 border-none"
                              }
                            >
                              {service.isActive ? "Active" : "Archived"}
                            </Badge>
                          </div>
                          <p className="text-slate-600 text-sm mt-1">
                            {service.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => handleArchive(service.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() =>
                            toggleService(service.id, service.isActive)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-4 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 border p-3">
                        <p className="text-xl font-bold" style={{ color: serviceColor }}>
                          {service.categories?.length || 0}
                        </p>
                        <p className="text-xs text-slate-500">Categories</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border p-3">
                        <p className="text-xl font-bold text-slate-700">
                          {getServiceItemCount(service)}
                        </p>
                        <p className="text-xs text-slate-500">Items</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border p-3">
                        <p className="text-xl font-bold text-blue-700">
                          {service.defaultProcessingHours ?? 72}h
                        </p>
                        <p className="text-xs text-slate-500">Default SLA</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border p-3">
                        <p className="text-xl font-bold text-emerald-700">
                          {service.defaultCommissionPercent ?? 18}%
                        </p>
                        <p className="text-xs text-slate-500">Commission</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-100 text-blue-700 border-none">
                        Express {service.expressOptionAllowed === false ? "Off" : "On"}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-700 border-none">
                        Surge {service.surgePricingAllowed === false ? "Off" : "On"}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-600 border-none">
                        Updated by {service.updatedByAdminName || "Admin"} on{" "}
                        {formatDate(service.updatedAt)}
                      </Badge>
                    </div>

                    <Link
                      href={`/services/categories?serviceId=${service.id}&service=${encodeURIComponent(service.name)}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
                      style={{
                        backgroundColor: `${serviceColor}15`,
                        color: serviceColor,
                      }}
                    >
                      View Categories
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-linear-to-r from-[#3E8940] to-[#5FAD61] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-bold">Service Hierarchy</h3>
          </div>
          <p className="text-white/80">
            Services to Categories to Sub Categories to Items. SLA, express
            permission, surge permission and default commission are now saved in
            the catalog backend.
          </p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                placeholder="e.g. Premium Care"
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={serviceForm.displayOrder}
                onChange={(event) =>
                  setServiceForm({
                    ...serviceForm,
                    displayOrder: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Special care for delicate items"
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm({
                    ...serviceForm,
                    description: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Default Processing Hours</Label>
              <Input
                type="number"
                value={serviceForm.defaultProcessingHours}
                onChange={(event) =>
                  setServiceForm({
                    ...serviceForm,
                    defaultProcessingHours: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Default Commission Percent</Label>
              <Input
                type="number"
                value={serviceForm.defaultCommissionPercent}
                onChange={(event) =>
                  setServiceForm({
                    ...serviceForm,
                    defaultCommissionPercent: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setServiceForm({ ...serviceForm, icon })}
                    className={`h-10 w-10 rounded-lg text-lg font-black flex items-center justify-center border-2 transition-all ${
                      serviceForm.icon === icon
                        ? "border-primary bg-primary/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setServiceForm({ ...serviceForm, color })}
                    className={`h-8 w-8 rounded-full transition-all ${
                      serviceForm.color === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border p-3">
              <div>
                <Label>Express Option</Label>
                <p className="text-xs text-slate-500">Allow express booking</p>
              </div>
              <Switch
                checked={serviceForm.expressOptionAllowed}
                onCheckedChange={(checked) =>
                  setServiceForm({
                    ...serviceForm,
                    expressOptionAllowed: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border p-3">
              <div>
                <Label>Surge Pricing</Label>
                <p className="text-xs text-slate-500">Allow area surge rules</p>
              </div>
              <Switch
                checked={serviceForm.surgePricingAllowed}
                onCheckedChange={(checked) =>
                  setServiceForm({
                    ...serviceForm,
                    surgePricingAllowed: checked,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleDialogSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving
                </>
              ) : editingId ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
