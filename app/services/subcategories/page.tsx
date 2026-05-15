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
  Filter,
  Layers,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminCatalogApi, adminLocationApi, adminVendorApi } from "@/lib/admin-api";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type CategoryOption = {
  id: string;
  name: string;
  serviceId: string;
  service?: {
    id: string;
    name: string;
    color?: string | null;
  };
};

type SubCategoryRecord = {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
  items?: Array<{ id: string }>;
  category?: {
    id: string;
    name: string;
    serviceId?: string;
  };
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

function SubCategoriesPageContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const categoryIdFromUrl = searchParams.get("categoryId");
  const serviceFromUrl = searchParams.get("service");
  const serviceIdFromUrl = searchParams.get("serviceId");

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [subCategoryList, setSubCategoryList] = useState<SubCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [saved, setSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [newSubCategory, setNewSubCategory] = useState({
    name: "",
    categoryId: "",
    targetCityCodes: [] as string[],
    targetVendorIds: [] as string[],
    availableFrom: "",
    availableUntil: "",
  });

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [states, setStates] = useState<{code: string, name: string}[]>([]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [categoriesResponse, subCategoriesResponse, allStates, allVendors] = await Promise.all([
        adminCatalogApi.getCategories(serviceIdFromUrl || undefined),
        adminCatalogApi.getSubCategories(),
        adminLocationApi.getStates(),
        adminVendorApi.getVendors()
      ]);

      let categories: CategoryOption[] = Array.isArray(categoriesResponse)
        ? categoriesResponse
        : [];

      // Fallback for older links that pass only service name and not serviceId.
      if (!serviceIdFromUrl && serviceFromUrl) {
        categories = categories.filter(
          (category) => category.service?.name === serviceFromUrl,
        );
      }

      setCategoryOptions(categories);
      setStates(Array.isArray(allStates) ? allStates : []);
      
      const vList = Array.isArray(allVendors) ? allVendors : (allVendors as any)?.vendors || [];
      setVendors(vList.map((v: any) => ({
        id: v.id,
        label: v.vendorProfile?.businessName || v.name || v.phone || "Unnamed"
      })));

      const isUrlCategoryValid =
        Boolean(categoryIdFromUrl) &&
        categories.some((category) => category.id === categoryIdFromUrl);

      const initialCategoryId = isUrlCategoryValid
        ? String(categoryIdFromUrl)
        : categories[0]?.id || "";

      setSelectedCategoryId(isUrlCategoryValid ? String(categoryIdFromUrl) : "all");
      setNewSubCategory({ 
        name: "", 
        categoryId: initialCategoryId,
        targetCityCodes: [],
        targetVendorIds: [],
        availableFrom: "",
        availableUntil: "",
      });

      setSubCategoryList(
        Array.isArray(subCategoriesResponse) ? subCategoriesResponse : [],
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load sub categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [categoryIdFromUrl, serviceIdFromUrl, serviceFromUrl]);

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

  const handleCategoryFilterChange = (value: string) => {
    setSelectedCategoryId(value);
  };

  const allowedCategoryIds = new Set(categoryOptions.map((category) => category.id));

  const visibleSubCategories =
    allowedCategoryIds.size === 0
      ? []
      : subCategoryList.filter((subCategory) =>
          allowedCategoryIds.has(subCategory.categoryId),
        );

  const filteredSubCategories =
    selectedCategoryId === "all"
      ? visibleSubCategories
      : visibleSubCategories.filter(
          (subCategory) => subCategory.categoryId === selectedCategoryId,
        );

  const resolveCategoryName = (subCategory: SubCategoryRecord) => {
    return (
      subCategory.category?.name ||
      categoryOptions.find((category) => category.id === subCategory.categoryId)?.name ||
      "Unknown Category"
    );
  };

  const toggleSubCategory = async (id: string, currentStatus: boolean) => {
    try {
      setSubCategoryList((prev) =>
        prev.map((subCategory) =>
          subCategory.id === id
            ? { ...subCategory, isActive: !currentStatus }
            : subCategory,
        ),
      );
      await adminCatalogApi.updateSubCategory(id, { isActive: !currentStatus });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
      loadInitialData();
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getDefaultCategoryId = () => {
    return selectedCategoryId !== "all" ? selectedCategoryId : categoryOptions[0]?.id || "";
  };

  const openAddDialog = () => {
    setEditingSubCategoryId(null);
    setNewSubCategory({
      name: "",
      categoryId: getDefaultCategoryId(),
      targetCityCodes: [],
      targetVendorIds: [],
      availableFrom: "",
      availableUntil: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (subCategory: SubCategoryRecord) => {
    setEditingSubCategoryId(subCategory.id);
    setNewSubCategory({
      name: subCategory.name,
      categoryId: subCategory.categoryId,
      targetCityCodes: subCategory.targetCityCodes || [],
      targetVendorIds: subCategory.targetVendorIds || [],
      availableFrom: subCategory.availableFrom ? new Date(subCategory.availableFrom).toISOString().slice(0, 16) : "",
      availableUntil: subCategory.availableUntil ? new Date(subCategory.availableUntil).toISOString().slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const handleAddSubCategory = async (name: string, categoryId: string) => {
    if (!name.trim()) {
      toast.error("Sub category name is required");
      return false;
    }

    if (!categoryId) {
      toast.error("Please select category");
      return false;
    }

    try {
      const displayOrder =
        subCategoryList.filter((subCategory) => subCategory.categoryId === categoryId)
          .length + 1;

      const created = await adminCatalogApi.createSubCategory({
        name: name.trim(),
        categoryId,
        isActive: true,
        displayOrder,
        targetCityCodes: newSubCategory.targetCityCodes,
        targetVendorIds: newSubCategory.targetVendorIds,
        availableFrom: newSubCategory.availableFrom || null,
        availableUntil: newSubCategory.availableUntil || null,
      });

      const selectedCategory = categoryOptions.find(
        (category) => category.id === categoryId,
      );

      const normalizedCreated: SubCategoryRecord = {
        ...created,
        isActive: created?.isActive ?? true,
        items: Array.isArray(created?.items) ? created.items : [],
        category:
          created?.category ||
          (selectedCategory
            ? { id: selectedCategory.id, name: selectedCategory.name }
            : undefined),
      };

      setSubCategoryList((prev) => [...prev, normalizedCreated]);
      toast.success("Sub category added");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to add sub category");
      return false;
    }
  };

  const handleDialogSubmit = async () => {
    if (editingSubCategoryId) {
      if (!newSubCategory.name.trim()) {
        toast.error("Sub category name is required");
        return;
      }

      try {
        const updated = await adminCatalogApi.updateSubCategory(editingSubCategoryId, {
          name: newSubCategory.name.trim(),
          targetCityCodes: newSubCategory.targetCityCodes,
          targetVendorIds: newSubCategory.targetVendorIds,
          availableFrom: newSubCategory.availableFrom || null,
          availableUntil: newSubCategory.availableUntil || null,
        });

        setSubCategoryList((prev) =>
          prev.map((subCategory) =>
            subCategory.id === editingSubCategoryId
              ? {
                  ...subCategory,
                  name: updated?.name ?? newSubCategory.name.trim(),
                  targetCityCodes: newSubCategory.targetCityCodes,
                  targetVendorIds: newSubCategory.targetVendorIds,
                  availableFrom: newSubCategory.availableFrom || null,
                  availableUntil: newSubCategory.availableUntil || null,
                }
              : subCategory,
          ),
        );

        toast.success("Sub category updated");
        setIsDialogOpen(false);
        setEditingSubCategoryId(null);
        setNewSubCategory({ 
          name: "", 
          categoryId: getDefaultCategoryId(),
          targetCityCodes: [],
          targetVendorIds: [],
          availableFrom: "",
          availableUntil: "",
        });
        return;
      } catch (error) {
        console.error(error);
        toast.error("Failed to update sub category");
        return;
      }
    }

    const created = await handleAddSubCategory(
      newSubCategory.name,
      newSubCategory.categoryId,
    );

    if (!created) return;

    setNewSubCategory({ 
      name: "", 
      categoryId: getDefaultCategoryId(),
      targetCityCodes: [],
      targetVendorIds: [],
      availableFrom: "",
      availableUntil: "",
    });
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      setSubCategoryList((prev) => prev.filter((subCategory) => subCategory.id !== id));
      await adminCatalogApi.deleteSubCategory(id);
      toast.success("Sub category removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete sub category");
      loadInitialData();
    }
  };

  const selectedCategory = categoryOptions.find(
    (category) => category.id === selectedCategoryId,
  );

  const serviceColor =
    selectedCategory?.service?.color || categoryOptions[0]?.service?.color || "#3E8940";

  const breadcrumbServiceParams = new URLSearchParams();
  if (serviceIdFromUrl) breadcrumbServiceParams.set("serviceId", serviceIdFromUrl);
  if (serviceFromUrl) breadcrumbServiceParams.set("service", serviceFromUrl);
  const categoriesHref = breadcrumbServiceParams.toString()
    ? `/services/categories?${breadcrumbServiceParams.toString()}`
    : "/services/categories";

  const headerCategoryName =
    categoryOptions.find((category) => category.id === categoryIdFromUrl)?.name ||
    categoryFromUrl;

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
          {serviceFromUrl ? (
            <>
              <span className="text-slate-400">/</span>
              <Link
                href={categoriesHref}
                className="hover:underline"
                style={{ color: serviceColor }}
              >
                {serviceFromUrl}
              </Link>
            </>
          ) : null}
          {headerCategoryName ? (
            <>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 font-medium">{headerCategoryName}</span>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl text-black font-bold tracking-tight">
              Sub Categories {headerCategoryName ? `- ${headerCategoryName}` : ""}
            </h1>
            <p className="text-slate-500 mt-1">
              Click on a sub-category to view its items
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={openAddDialog}
              disabled={categoryOptions.length === 0}
            >
              <Plus className="h-4 w-4" />
              Add Sub Category
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

        <div className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-4 flex-wrap">
          <Filter className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filter by Category:</span>
          <Select
            value={selectedCategoryId}
            onValueChange={handleCategoryFilterChange}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Badge className="bg-slate-100 text-slate-600 border-none">
            {filteredSubCategories.length} sub-categories
          </Badge>
          {categoryOptions.length === 0 ? (
            <p className="w-full text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No categories available yet. Please add categories first.
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-slate-500">
            Loading sub-categories...
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border divide-y">
            {filteredSubCategories.map((subCategory) => {
              const categoryName = resolveCategoryName(subCategory);
              const itemCount = Array.isArray(subCategory.items)
                ? subCategory.items.length
                : 0;

              const itemParams = new URLSearchParams();
              itemParams.set("subcategoryId", subCategory.id);
              itemParams.set("subcategory", subCategory.name);
              itemParams.set("categoryId", subCategory.categoryId);
              itemParams.set("category", categoryName);
              if (serviceIdFromUrl) itemParams.set("serviceId", serviceIdFromUrl);
              if (serviceFromUrl) itemParams.set("service", serviceFromUrl);

              return (
                <div
                  key={subCategory.id}
                  className={`flex items-center ${
                    !subCategory.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="p-5 flex items-center gap-4 flex-1">
                    <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${serviceColor}15` }}
                    >
                      <Layers className="h-6 w-6" style={{ color: serviceColor }} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-black">{subCategory.name}</h3>
                        {!subCategory.isActive ? (
                          <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                            Hidden
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className="bg-blue-100 text-blue-700 border-none text-xs">
                          {categoryName}
                        </Badge>
                        <span className="text-sm text-slate-500">{itemCount} items</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={subCategory.isActive}
                        onCheckedChange={() =>
                          toggleSubCategory(subCategory.id, subCategory.isActive)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => openEditDialog(subCategory)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(subCategory.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Link
                    href={`/services/items?${itemParams.toString()}`}
                    className="px-6 py-5 border-l hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
                    style={{ color: serviceColor }}
                  >
                    View Items
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredSubCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Layers className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No sub-categories found for this category</p>
          </div>
        ) : null}

      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingSubCategoryId(null);
            setNewSubCategory({ 
              name: "", 
              categoryId: getDefaultCategoryId(),
              targetCityCodes: [],
              targetVendorIds: [],
              availableFrom: "",
              availableUntil: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubCategoryId ? "Edit Sub Category" : "Add New Sub Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4 md:grid-cols-2">
            <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Category</label>
              <Select
                value={newSubCategory.categoryId}
                onValueChange={(value) =>
                  setNewSubCategory((prev) => ({ ...prev, categoryId: value }))
                }
                disabled={Boolean(editingSubCategoryId)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Sub Category Name
              </label>
              <Input
                placeholder="e.g., Loungewear"
                value={newSubCategory.name}
                onChange={(event) =>
                  setNewSubCategory((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="mt-1"
              />
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
                    if (val && !newSubCategory.targetCityCodes.includes(val)) {
                      setNewSubCategory(prev => ({ ...prev, targetCityCodes: [...prev.targetCityCodes, val] }));
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
                {newSubCategory.targetCityCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newSubCategory.targetCityCodes.map(code => (
                      <Badge key={code} variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-100">
                        {code}
                        <button onClick={() => setNewSubCategory(prev => ({ ...prev, targetCityCodes: prev.targetCityCodes.filter(c => c !== code) }))}>
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
                  if (val && !newSubCategory.targetVendorIds.includes(val)) {
                    setNewSubCategory(prev => ({ ...prev, targetVendorIds: [...prev.targetVendorIds, val] }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {newSubCategory.targetVendorIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newSubCategory.targetVendorIds.map(id => (
                      <Badge key={id} variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-100">
                        {vendors.find(v => v.id === id)?.label || id}
                        <button onClick={() => setNewSubCategory(prev => ({ ...prev, targetVendorIds: prev.targetVendorIds.filter(v => v !== id) }))}>
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
                    value={newSubCategory.availableFrom} 
                    onChange={val => setNewSubCategory(prev => ({ ...prev, availableFrom: val }))}
                    placeholder="Pick start time"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-tight">Available Until</label>
                  <DateTimePicker 
                    value={newSubCategory.availableUntil} 
                    onChange={val => setNewSubCategory(prev => ({ ...prev, availableUntil: val }))}
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
              {editingSubCategoryId ? "Save Changes" : "Add Sub Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SubCategoriesPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center p-8">Loading...</div>}
    >
      <SubCategoriesPageContent />
    </Suspense>
  );
}
