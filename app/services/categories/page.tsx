"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Save,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { adminCatalogApi, adminLocationApi, adminVendorApi } from "@/lib/admin-api";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type ServiceOption = {
  id: string;
  name: string;
  color?: string | null;
  isActive?: boolean;
};

type CategoryRecord = {
  id: string;
  serviceId: string;
  name: string;
  icon?: string | null;
  isActive: boolean;
  subCategories?: Array<{ id: string }>;
  service?: ServiceOption;
  targetCityCodes?: string[];
  targetVendorIds?: string[];
  availableFrom?: string | null;
  availableUntil?: string | null;
};

type CityOption = {
  cityCode: string;
  cityName: string;
};

type VendorOption = {
  id: string;
  label: string;
};

const icons = ["👔", "👕", "👖", "👗", "🧥", "👚", "🩳", "🧢", "🧣", "👜", "👟", "🧵"];

function CategoriesPageContent() {
  const searchParams = useSearchParams();
  const serviceFromUrl = searchParams.get("service");
  const serviceIdFromUrl = searchParams.get("serviceId");

  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("all");
  const [quickAddName, setQuickAddName] = useState("");

  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "👔",
    serviceId: "",
    targetCityCodes: [] as string[],
    targetVendorIds: [] as string[],
    availableFrom: "",
    availableUntil: "",
  });

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [states, setStates] = useState<{code: string, name: string}[]>([]);

  const loadCategories = async (serviceId?: string) => {
    const categories = await adminCatalogApi.getCategories(serviceId);
    setCategoryList(Array.isArray(categories) ? categories : []);
  };

  const initialize = async () => {
    try {
      setLoading(true);
      const [services, statesData, vendorsData] = await Promise.all([
        adminCatalogApi.getServices(),
        adminCatalogApi.getStates ? adminCatalogApi.getStates() : Promise.resolve([]), // Fallback if not in catalog api
        adminCatalogApi.getVendors ? adminCatalogApi.getVendors() : Promise.resolve([])
      ]);

      // Actually let's use the correct APIs
      const [allStates, allVendors] = await Promise.all([
        adminLocationApi.getStates(),
        adminVendorApi.getVendors()
      ]);

      const normalizedServices: ServiceOption[] = Array.isArray(services)
        ? services.map((service: any) => ({
            id: String(service.id),
            name: String(service.name || ""),
            color: service.color || null,
            isActive: Boolean(service.isActive),
          }))
        : [];
      setServiceOptions(normalizedServices);
      setStates(Array.isArray(allStates) ? allStates : []);
      
      const vList = Array.isArray(allVendors) ? allVendors : (allVendors as any)?.vendors || [];
      setVendors(vList.map((v: any) => ({
        id: v.id,
        label: v.vendorProfile?.businessName || v.name || v.phone || "Unnamed"
      })));

      let initialServiceId = "all";
      if (
        serviceIdFromUrl &&
        normalizedServices.some((service) => service.id === serviceIdFromUrl)
      ) {
        initialServiceId = serviceIdFromUrl;
      } else if (serviceFromUrl) {
        const matchedService = normalizedServices.find(
          (service) => service.name === serviceFromUrl,
        );
        if (matchedService) {
          initialServiceId = matchedService.id;
        }
      }

      setSelectedServiceId(initialServiceId);
      await loadCategories(initialServiceId === "all" ? undefined : initialServiceId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, [serviceIdFromUrl, serviceFromUrl]);

  useEffect(() => {
    if (selectedStateCode) {
      adminLocationApi.getCitiesByState(selectedStateCode)
        .then(data => {
          const list = Array.isArray(data) ? data : (data as any)?.cities || [];
          setCityOptions(list.map((c: any) => ({
            cityCode: c.cityCode || c.code,
            cityName: c.cityName || c.name
          })));
        })
        .catch(console.error);
    }
  }, [selectedStateCode]);

  const selectedService =
    selectedServiceId === "all"
      ? null
      : serviceOptions.find((service) => service.id === selectedServiceId) || null;

  const selectedServiceColor = selectedService?.color || "#3E8940";

  const visibleCategories =
    selectedServiceId === "all"
      ? categoryList
      : categoryList.filter((category) => category.serviceId === selectedServiceId);

  const handleServiceFilterChange = async (serviceId: string) => {
    setSelectedServiceId(serviceId);
    try {
      setLoading(true);
      await loadCategories(serviceId === "all" ? undefined : serviceId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to filter categories");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    const defaultServiceId =
      selectedServiceId !== "all" ? selectedServiceId : serviceOptions[0]?.id || "";

    if (!defaultServiceId) {
      toast.error("Please create a service first");
      return;
    }

    setEditingId(null);
    setNewCategory({ 
      name: "", 
      icon: "👔", 
      serviceId: defaultServiceId,
      targetCityCodes: [],
      targetVendorIds: [],
      availableFrom: "",
      availableUntil: "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (category: CategoryRecord) => {
    setEditingId(category.id);
    setNewCategory({
      name: category.name,
      icon: category.icon || "👔",
      serviceId: category.serviceId,
      targetCityCodes: category.targetCityCodes || [],
      targetVendorIds: category.targetVendorIds || [],
      availableFrom: category.availableFrom ? new Date(category.availableFrom).toISOString().slice(0, 16) : "",
      availableUntil: category.availableUntil ? new Date(category.availableUntil).toISOString().slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const handleDialogSubmit = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!newCategory.serviceId) {
      toast.error("Please select a service");
      return;
    }

    try {
      if (editingId) {
        const currentCategory = categoryList.find((category) => category.id === editingId);
        await adminCatalogApi.updateCategory(editingId, {
          name: newCategory.name.trim(),
          icon: newCategory.icon,
          isActive: currentCategory?.isActive ?? true,
          targetCityCodes: newCategory.targetCityCodes,
          targetVendorIds: newCategory.targetVendorIds,
          availableFrom: newCategory.availableFrom || null,
          availableUntil: newCategory.availableUntil || null,
        });
        toast.success("Category updated");
      } else {
        const serviceCategoryCount = categoryList.filter(
          (category) => category.serviceId === newCategory.serviceId,
        ).length;

        await adminCatalogApi.createCategory({
          serviceId: newCategory.serviceId,
          name: newCategory.name.trim(),
          icon: newCategory.icon,
          isActive: true,
          displayOrder: serviceCategoryCount + 1,
          targetCityCodes: newCategory.targetCityCodes,
          targetVendorIds: newCategory.targetVendorIds,
          availableFrom: newCategory.availableFrom || null,
          availableUntil: newCategory.availableUntil || null,
        });
        toast.success("Category added");
      }

      setIsDialogOpen(false);
      await loadCategories(selectedServiceId === "all" ? undefined : selectedServiceId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category");
    }
  };

  const toggleCategory = async (id: string, current: boolean) => {
    try {
      setCategoryList((prev) =>
        prev.map((category) =>
          category.id === id ? { ...category, isActive: !current } : category,
        ),
      );
      await adminCatalogApi.updateCategory(id, { isActive: !current });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update category status");
      await loadCategories(selectedServiceId === "all" ? undefined : selectedServiceId);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminCatalogApi.deleteCategory(id);
      setCategoryList((prev) => prev.filter((category) => category.id !== id));
      toast.success("Category removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category");
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddName.trim()) return;

    if (selectedServiceId === "all") {
      toast.error("Select one service in the filter for quick add");
      return;
    }

    const targetServiceId =
      selectedServiceId !== "all" ? selectedServiceId : serviceOptions[0]?.id || "";

    if (!targetServiceId) {
      toast.error("Please create a service first");
      return;
    }

    try {
      const serviceCategoryCount = categoryList.filter(
        (category) => category.serviceId === targetServiceId,
      ).length;

      await adminCatalogApi.createCategory({
        serviceId: targetServiceId,
        name: quickAddName.trim(),
        icon: "👕",
        isActive: true,
        displayOrder: serviceCategoryCount + 1,
      });
      setQuickAddName("");
      toast.success("Category added");
      await loadCategories(selectedServiceId === "all" ? undefined : selectedServiceId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add category");
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link
            href="/services/services"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Services
          </Link>
          {selectedService?.name ? (
            <>
              <span className="text-slate-400">/</span>
              <Badge
                className="border-none text-xs"
                style={{
                  backgroundColor: `${selectedServiceColor}20`,
                  color: selectedServiceColor,
                }}
              >
                {selectedService.name}
              </Badge>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl text-black font-bold tracking-tight">
              Categories {selectedService?.name ? `- ${selectedService.name}` : ""}
            </h1>
            <p className="text-slate-500 mt-1">
              Manage categories for the selected service
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Category
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

        <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Filter by Service:</span>
          <Select value={selectedServiceId} onValueChange={handleServiceFilterChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceOptions.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Badge className="bg-slate-100 text-slate-600 border-none">
            {visibleCategories.length} categories
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-primary">{visibleCategories.length}</p>
            <p className="text-sm text-slate-500 mt-1">Total Categories</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-green-600">
              {visibleCategories.filter((category) => category.isActive).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Active</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <p className="text-3xl font-bold text-slate-400">
              {visibleCategories.filter((category) => !category.isActive).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Inactive</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-10 text-slate-500">Loading categories...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border divide-y">
            {visibleCategories.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No categories found. Click "Add Category" to create the first one.
              </div>
            ) : (
              visibleCategories.map((category) => {
                const categoryService =
                  serviceOptions.find((service) => service.id === category.serviceId) ||
                  category.service ||
                  null;
                const categoryColor = categoryService?.color || "#3E8940";
                const subCategoriesCount = Array.isArray(category.subCategories)
                  ? category.subCategories.length
                  : 0;

                return (
                  <div
                    key={category.id}
                    className={`flex items-center ${!category.isActive ? "opacity-60" : ""}`}
                  >
                    <div className="p-5 flex items-center gap-4 flex-1">
                      <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

                      <div
                        className="h-14 w-14 rounded-xl flex items-center justify-center text-3xl"
                        style={{ backgroundColor: `${categoryColor}15` }}
                      >
                        {category.icon || "👕"}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-black text-lg">{category.name}</h3>
                          {!category.isActive ? (
                            <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                              Hidden
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            className="border-none text-xs"
                            style={{
                              backgroundColor: `${categoryColor}20`,
                              color: categoryColor,
                            }}
                          >
                            {categoryService?.name || "Unknown Service"}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {subCategoriesCount} sub-categories
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => toggleCategory(category.id, category.isActive)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Link
                      href={`/services/subcategories?categoryId=${category.id}&category=${encodeURIComponent(category.name)}&serviceId=${category.serviceId}&service=${encodeURIComponent(categoryService?.name || "")}`}
                      className="px-6 py-5 border-l hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
                      style={{ color: categoryColor }}
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-bold text-black mb-4">Quick Add Category</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Category name"
              className="flex-1"
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
            />
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90 gap-2"
              onClick={handleQuickAdd}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4 md:grid-cols-2">
            <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Service</label>
              <Select
                value={newCategory.serviceId}
                onValueChange={(value) =>
                  setNewCategory((prev) => ({ ...prev, serviceId: value }))
                }
                disabled={Boolean(editingId)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Category Name</label>
              <Input
                placeholder="e.g., Men"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, name: e.target.value }))
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
                    onClick={() => setNewCategory((prev) => ({ ...prev, icon }))}
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${
                      newCategory.icon === icon
                        ? "border-primary bg-primary/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            </div>

            <div className="space-y-4 border-l pl-6">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                Visibility & Targeting
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">City-based visibility</label>
                <div className="space-y-2">
                  <Select value={selectedStateCode} onValueChange={setSelectedStateCode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {states.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(val) => {
                    if (val && !newCategory.targetCityCodes.includes(val)) {
                      setNewCategory(prev => ({ ...prev, targetCityCodes: [...prev.targetCityCodes, val] }));
                    }
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Add City" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {cityOptions.map(c => <SelectItem key={c.cityCode} value={c.cityCode}>{c.cityName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {newCategory.targetCityCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newCategory.targetCityCodes.map(code => (
                      <Badge key={code} variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-100">
                        {code}
                        <button onClick={() => setNewCategory(prev => ({ ...prev, targetCityCodes: prev.targetCityCodes.filter(c => c !== code) }))}>
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Vendor-based availability</label>
                <Select onValueChange={(val) => {
                  if (val && !newCategory.targetVendorIds.includes(val)) {
                    setNewCategory(prev => ({ ...prev, targetVendorIds: [...prev.targetVendorIds, val] }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {newCategory.targetVendorIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newCategory.targetVendorIds.map(id => (
                      <Badge key={id} variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-100">
                        {vendors.find(v => v.id === id)?.label || id}
                        <button onClick={() => setNewCategory(prev => ({ ...prev, targetVendorIds: prev.targetVendorIds.filter(v => v !== id) }))}>
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-tight">Available From</label>
                  <DateTimePicker 
                    value={newCategory.availableFrom} 
                    onChange={val => setNewCategory(prev => ({ ...prev, availableFrom: val }))}
                    placeholder="Pick start time"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-tight">Available Until</label>
                  <DateTimePicker 
                    value={newCategory.availableUntil} 
                    onChange={val => setNewCategory(prev => ({ ...prev, availableUntil: val }))}
                    placeholder="Pick end time"
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
              onClick={handleDialogSubmit}
            >
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center p-8">Loading...</div>}
    >
      <CategoriesPageContent />
    </Suspense>
  );
}
