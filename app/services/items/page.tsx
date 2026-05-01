"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  Save,
  Filter,
  Package,
  ArrowLeft,
  Upload,
  Settings,
  MoreVertical,
  Percent,
  MapPin,
  Store,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminCatalogApi, adminLocationApi, adminVendorApi } from "@/lib/admin-api";

type CityOption = {
  cityCode: string;
  cityName: string;
  stateCode?: string;
  stateName?: string;
};

type StateOption = {
  code: string;
  name: string;
};

type ServiceRecord = {
  id: string;
  name: string;
  color?: string | null;
};

type CategoryRecord = {
  id: string;
  name: string;
  serviceId: string;
  service?: ServiceRecord;
};

type SubCategoryRecord = {
  id: string;
  name: string;
  categoryId: string;
  category?: CategoryRecord;
};

type ItemRecord = {
  id: string;
  name: string;
  skuCode?: string | null;
  subCategoryId: string;
  isActive: boolean;
  subCategory?: SubCategoryRecord;
  customerPrice?: number;
  vendorShare?: number;
  gstPercent?: number;
};

const serviceColors: Record<string, string> = {
  Wash: "#3B82F6",
  Both: "#F59E0B",
  "Dry Clean": "#8B5CF6",
};

const serviceBadgeColors: Record<string, string> = {
  Wash: "bg-blue-100 text-blue-700",
  Both: "bg-amber-100 text-amber-700",
  "Dry Clean": "bg-purple-100 text-purple-700",
};

const normalizeServiceType = (name?: string | null) => {
  const raw = String(name || "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return "Wash";
  if (lower.includes("dry")) return "Dry Clean";
  if (lower.includes("wash") && lower.includes("iron")) return "Both";
  if (lower.includes("iron")) return "Both";
  if (lower.includes("both")) return "Both";
  if (lower.includes("wash")) return "Wash";

  return raw;
};

function ItemsPageContent() {
  const searchParams = useSearchParams();
  const subCategoryIdFromUrl = searchParams.get("subcategoryId");
  const subCategoryFromUrl = searchParams.get("subcategory");
  const categoryIdFromUrl = searchParams.get("categoryId");
  const categoryFromUrl = searchParams.get("category");
  const serviceIdFromUrl = searchParams.get("serviceId");
  const serviceFromUrl = searchParams.get("service");
  const urlSearchQuery = searchParams.get("search") || "";

  const [itemList, setItemList] = useState<ItemRecord[]>([]);
  const [subCategoryList, setSubCategoryList] = useState<SubCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("all");
  const [saved, setSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    subCategoryId: "",
  });

  // Feature Modal States
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isCityPriceOpen, setIsCityPriceOpen] = useState(false);
  const [isVendorPriceOpen, setIsVendorPriceOpen] = useState(false);
  const [isTaxSettingsOpen, setIsTaxSettingsOpen] = useState(false);

  // Advanced States
  const [states, setStates] = useState<StateOption[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedCityCodes, setSelectedCityCodes] = useState<string[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [cityOverrides, setCityOverrides] = useState<any[]>([]);
  const [vendorOverrides, setVendorOverrides] = useState<any[]>([]);
  
  // Bulk States
  const [bulkPriceUpdateType, setBulkPriceUpdateType] = useState("percentage_increase");
  const [bulkPriceUpdateValue, setBulkPriceUpdateValue] = useState("");
  const [taxSettingValue, setTaxSettingValue] = useState("18");
  const [taxSettingApplyTo, setTaxSettingApplyTo] = useState("none");

  const subCategoryById = useMemo(
    () => new Map(subCategoryList.map((subCategory) => [subCategory.id, subCategory])),
    [subCategoryList],
  );

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const resolveServiceType = (subCategoryId: string) => {
    const subCategory = subCategoryById.get(subCategoryId);
    const serviceName =
      subCategory?.category?.service?.name ||
      serviceFromUrl ||
      "Wash";

    return normalizeServiceType(serviceName);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [categoriesRaw, subCategoriesRaw, itemsRaw] = await Promise.all([
        adminCatalogApi.getCategories(serviceIdFromUrl || undefined),
        adminCatalogApi.getSubCategories(categoryIdFromUrl || undefined),
        adminCatalogApi.getItems(),
      ]);

      let categories: CategoryRecord[] = Array.isArray(categoriesRaw)
        ? categoriesRaw
        : [];

      if (!serviceIdFromUrl && serviceFromUrl) {
        categories = categories.filter(
          (category) => category.service?.name === serviceFromUrl,
        );
      }

      if (categoryIdFromUrl) {
        categories = categories.filter((category) => category.id === categoryIdFromUrl);
      } else if (categoryFromUrl) {
        categories = categories.filter((category) => category.name === categoryFromUrl);
      }

      const categoryById = new Map(categories.map((category) => [category.id, category]));
      const allowedCategoryIds = new Set(categories.map((category) => category.id));

      let subCategories: SubCategoryRecord[] = Array.isArray(subCategoriesRaw)
        ? subCategoriesRaw
        : [];

      if (allowedCategoryIds.size > 0) {
        subCategories = subCategories.filter((subCategory) =>
          allowedCategoryIds.has(subCategory.categoryId),
        );
      } else if (categoryIdFromUrl) {
        subCategories = subCategories.filter(
          (subCategory) => subCategory.categoryId === categoryIdFromUrl,
        );
      } else if (categoryFromUrl) {
        subCategories = subCategories.filter(
          (subCategory) => subCategory.category?.name === categoryFromUrl,
        );
      }

      const normalizedSubCategories = subCategories.map((subCategory) => ({
        ...subCategory,
        category: categoryById.get(subCategory.categoryId) || subCategory.category,
      }));

      const subCategoryMap = new Map(
        normalizedSubCategories.map((subCategory) => [subCategory.id, subCategory]),
      );

      const allowedSubCategoryIds = new Set(normalizedSubCategories.map((subCategory) => subCategory.id));

      const normalizedItems: ItemRecord[] = (Array.isArray(itemsRaw) ? itemsRaw : [])
        .filter((item) => allowedSubCategoryIds.has(item.subCategoryId))
        .map((item) => ({
          ...item,
          isActive: item.isActive !== false,
          subCategory: subCategoryMap.get(item.subCategoryId) || item.subCategory,
        }));

      setSubCategoryList(normalizedSubCategories);
      setItemList(normalizedItems);

      let initialSubCategoryId = "all";
      if (
        subCategoryIdFromUrl &&
        normalizedSubCategories.some((subCategory) => subCategory.id === subCategoryIdFromUrl)
      ) {
        initialSubCategoryId = subCategoryIdFromUrl;
      } else if (subCategoryFromUrl) {
        const matched = normalizedSubCategories.find(
          (subCategory) => subCategory.name === subCategoryFromUrl,
        );
        if (matched) {
          initialSubCategoryId = matched.id;
        }
      }

      setSelectedSubCategoryId(initialSubCategoryId);

      const defaultSubCategoryId =
        initialSubCategoryId !== "all"
          ? initialSubCategoryId
          : normalizedSubCategories[0]?.id || "";

      setNewItem((prev) => ({
        ...prev,
        subCategoryId:
          prev.subCategoryId && subCategoryMap.has(prev.subCategoryId)
            ? prev.subCategoryId
            : defaultSubCategoryId,
      }));

      // Fetch states and vendors in background
      adminLocationApi.getStates().then(setStates).catch(console.error);
      adminVendorApi.getVendors().then(setVendors).catch(console.error);
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    subCategoryIdFromUrl,
    subCategoryFromUrl,
    categoryIdFromUrl,
    categoryFromUrl,
    serviceIdFromUrl,
    serviceFromUrl,
  ]);

  useEffect(() => {
    if (selectedStateCode) {
      adminLocationApi.getCitiesByState(selectedStateCode).then(setCityOptions).catch(console.error);
    } else {
      setCityOptions([]);
    }
  }, [selectedStateCode]);

  useEffect(() => {
    if (selectedCityCodes.length > 0 && isCityPriceOpen) {
      adminCatalogApi.getItemPriceOverrides(selectedCityCodes[0], undefined)
        .then(setCityOverrides)
        .catch(console.error);
    } else {
      setCityOverrides([]);
    }
  }, [selectedCityCodes, isCityPriceOpen]);

  useEffect(() => {
    if (selectedVendorId && isVendorPriceOpen) {
      adminCatalogApi.getItemPriceOverrides(undefined, selectedVendorId)
        .then(setVendorOverrides)
        .catch(console.error);
    }
  }, [selectedVendorId, isVendorPriceOpen]);

  const filteredItems = useMemo(
    () =>
      itemList.filter((item) => {
        const matchesSearch = item.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        const matchesFilter =
          selectedSubCategoryId === "all" ||
          item.subCategoryId === selectedSubCategoryId;

        return matchesSearch && matchesFilter;
      }),
    [itemList, searchQuery, selectedSubCategoryId],
  );

  const generateCode = (subCategoryId: string) => {
    const subCategory = subCategoryById.get(subCategoryId);
    const categoryName =
      subCategory?.category?.name || categoryFromUrl || "GEN";
    const prefix =
      categoryName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3) || "GEN";

    const nextNumber =
      itemList.filter((item) => item.subCategoryId === subCategoryId).length + 1;

    return `CL-${prefix}-${String(nextNumber).padStart(4, "0")}`;
  };

  const openAdd = () => {
    if (subCategoryList.length === 0) {
      toast.error("Please create a sub-category first");
      return;
    }

    const defaultSubCategoryId =
      selectedSubCategoryId !== "all"
        ? selectedSubCategoryId
        : subCategoryList[0]?.id || "";

    setEditingId(null);
    setNewItem({ name: "", subCategoryId: defaultSubCategoryId });
    setIsDialogOpen(true);
  };

  const openEdit = (item: ItemRecord) => {
    setEditingId(item.id);
    setNewItem({
      name: item.name,
      subCategoryId: item.subCategoryId,
    });
    setIsDialogOpen(true);
  };

  const toggleItem = async (id: string, current: boolean) => {
    try {
      setItemList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isActive: !current } : item,
        ),
      );

      await adminCatalogApi.updateItem(id, { isActive: !current });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update item status");
      await loadData();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminCatalogApi.deleteItem(id);
      setItemList((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item");
    }
  };

  const handleDialogSubmit = async () => {
    if (!newItem.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    if (!newItem.subCategoryId) {
      toast.error("Please select sub category");
      return;
    }

    try {
      if (editingId) {
        const existing = itemList.find((item) => item.id === editingId);

        await adminCatalogApi.updateItem(editingId, {
          name: newItem.name.trim(),
          subCategoryId: newItem.subCategoryId,
          skuCode: existing?.skuCode || generateCode(newItem.subCategoryId),
          isActive: existing?.isActive ?? true,
        });

        toast.success("Item updated");
      } else {
        await adminCatalogApi.createItem({
          name: newItem.name.trim(),
          subCategoryId: newItem.subCategoryId,
          skuCode: generateCode(newItem.subCategoryId),
          customerPrice: 0,
          vendorShare: 0,
          isActive: true,
        });

        toast.success("Item added");
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setNewItem({
        name: "",
        subCategoryId: selectedSubCategoryId !== "all"
          ? selectedSubCategoryId
          : subCategoryList[0]?.id || "",
      });

      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save item");
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const categoriesQuery = new URLSearchParams();
  if (serviceIdFromUrl) categoriesQuery.set("serviceId", serviceIdFromUrl);
  if (serviceFromUrl) categoriesQuery.set("service", serviceFromUrl);
  const categoriesHref = categoriesQuery.toString()
    ? `/services/categories?${categoriesQuery.toString()}`
    : "/services/categories";

  const subCategoriesQuery = new URLSearchParams();
  if (categoryIdFromUrl) subCategoriesQuery.set("categoryId", categoryIdFromUrl);
  if (categoryFromUrl) subCategoriesQuery.set("category", categoryFromUrl);
  if (serviceIdFromUrl) subCategoriesQuery.set("serviceId", serviceIdFromUrl);
  if (serviceFromUrl) subCategoriesQuery.set("service", serviceFromUrl);
  const subCategoriesHref = subCategoriesQuery.toString()
    ? `/services/subcategories?${subCategoriesQuery.toString()}`
    : "/services/subcategories";

  const autoServiceType = newItem.subCategoryId
    ? resolveServiceType(newItem.subCategoryId)
    : normalizeServiceType(serviceFromUrl || "Wash");

  const serviceColor =
    subCategoryById.get(newItem.subCategoryId)?.category?.service?.color ||
    serviceColors[autoServiceType] ||
    "#3E8940";

  const washCount = filteredItems.filter(
    (item) => resolveServiceType(item.subCategoryId) === "Wash",
  ).length;

  const bothCount = filteredItems.filter(
    (item) => resolveServiceType(item.subCategoryId) === "Both",
  ).length;

  const dryCleanCount = filteredItems.filter(
    (item) => resolveServiceType(item.subCategoryId) === "Dry Clean",
  ).length;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-5xl space-y-6">
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
          {categoryFromUrl ? (
            <>
              <span className="text-slate-400">/</span>
              <Link
                href={subCategoriesHref}
                className="text-primary hover:underline"
              >
                {categoryFromUrl}
              </Link>
            </>
          ) : null}
          {subCategoryFromUrl ? (
            <>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 font-medium">{subCategoryFromUrl}</span>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl text-black font-bold tracking-tight">
              Items {subCategoryFromUrl ? `- ${subCategoryFromUrl}` : ""}
            </h1>
            <p className="text-slate-500 mt-1">
              {filteredItems.length} items in database
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-slate-50 text-slate-700">
                  <MoreVertical className="h-4 w-4" />
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Data Operations</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsBulkUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2 text-slate-500" />
                  Bulk Upload (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsBulkPriceOpen(true)}>
                  <Percent className="h-4 w-4 mr-2 text-slate-500" />
                  Bulk Price Update
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Pricing Rules</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsCityPriceOpen(true)}>
                  <MapPin className="h-4 w-4 mr-2 text-slate-500" />
                  City-wise Pricing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsVendorPriceOpen(true)}>
                  <Store className="h-4 w-4 mr-2 text-slate-500" />
                  Vendor-wise Override Pricing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Configurations</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsTaxSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2 text-slate-500" />
                  Tax Settings (GST %)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="gap-2"
              onClick={openAdd}
              disabled={subCategoryList.length === 0}
            >
              <Plus className="h-4 w-4" />
              Add Item
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

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filteredItems.length}</p>
            <p className="text-sm text-slate-500">Items</p>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{washCount}</p>
            <p className="text-sm text-slate-500">Wash</p>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{bothCount}</p>
            <p className="text-sm text-slate-500">Both</p>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{dryCleanCount}</p>
            <p className="text-sm text-slate-500">Dry Clean</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search items..."
              className="pl-10 bg-slate-50"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Select
            value={selectedSubCategoryId}
            onValueChange={setSelectedSubCategoryId}
          >
            <SelectTrigger className="w-52">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sub Categories</SelectItem>
              {subCategoryList.map((subCategory) => (
                <SelectItem key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge className="bg-slate-100 text-slate-600 border-none">
            {filteredItems.length} items
          </Badge>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-slate-500">
            Loading items...
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-bold uppercase text-primary py-4 pl-6">
                    Item
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-primary py-4">
                    Sub Category
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-primary py-4">
                    Service
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-primary py-4">
                    Code
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-primary py-4">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-primary py-4 text-right pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const serviceType = resolveServiceType(item.subCategoryId);
                  const subCategoryName =
                    item.subCategory?.name ||
                    subCategoryById.get(item.subCategoryId)?.name ||
                    "Unknown";

                  return (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-slate-50 ${!item.isActive ? "opacity-60" : ""}`}
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${serviceColor}15` }}
                          >
                            <Package className="h-5 w-5" style={{ color: serviceColor }} />
                          </div>
                          <span className="font-semibold text-black">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-700 border-none text-xs">
                          {subCategoryName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-none text-xs ${
                            serviceBadgeColors[serviceType] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-500">
                          {item.skuCode || "--"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={() => toggleItem(item.id, item.isActive)}
                        />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No items found in database</p>
          </div>
        ) : null}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Item Name</label>
              <Input
                placeholder="e.g., Hoodie"
                value={newItem.name}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, name: event.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Sub Category</label>
              <Select
                value={newItem.subCategoryId}
                onValueChange={(value) =>
                  setNewItem((prev) => ({ ...prev, subCategoryId: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subCategoryList.map((subCategory) => (
                    <SelectItem key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Service Type</label>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge
                  className={`border-none text-sm px-3 py-1 ${
                    serviceBadgeColors[autoServiceType] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {autoServiceType}
                </Badge>
                <span className="text-xs text-slate-500">
                  Auto from selected category/sub-category
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Auto-generated code</p>
              <p className="font-mono text-sm font-semibold text-slate-700">
                {editingId
                  ? itemList.find((item) => item.id === editingId)?.skuCode ||
                    generateCode(newItem.subCategoryId)
                  : generateCode(newItem.subCategoryId)}
              </p>
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
              {editingId ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Modals */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload (CSV)</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="h-8 w-8 mb-2" />
              <p className="font-medium text-slate-700">Click to upload or drag and drop</p>
              <p className="text-sm">CSV files only (max 5MB)</p>
            </div>
            <div className="flex justify-between items-center bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
              <span>Need a template?</span>
              <Button variant="link" className="p-0 h-auto text-blue-700 font-semibold">Download CSV Template</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90">Upload and Process</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkPriceOpen} onOpenChange={setIsBulkPriceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Update</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!bulkPriceUpdateValue) return toast.error("Please enter a value");
            
            const value = Number(bulkPriceUpdateValue);
            if (isNaN(value) || value <= 0) return toast.error("Please enter a valid positive number");

            const updates = filteredItems.map(item => {
              let newPrice = item.customerPrice || 0;
              if (bulkPriceUpdateType === "percentage_increase") newPrice += newPrice * (value / 100);
              else if (bulkPriceUpdateType === "percentage_decrease") newPrice -= newPrice * (value / 100);
              else if (bulkPriceUpdateType === "fixed_increase") newPrice += value;
              else if (bulkPriceUpdateType === "fixed_decrease") newPrice -= value;
              
              return { id: item.id, customerPrice: Math.max(0, Math.round(newPrice)) };
            });

            try {
              await adminCatalogApi.bulkPriceUpdate(updates);
              toast.success(`Updated prices for ${updates.length} items`);
              setIsBulkPriceOpen(false);
              loadData();
            } catch (err) {
              toast.error("Failed to apply bulk prices");
            }
          }}>
            <div className="py-4 space-y-4">
              <p className="text-sm text-slate-500">Apply a flat percentage or fixed amount increase/decrease across the currently filtered items ({filteredItems.length} items).</p>
              <div>
                <label className="text-sm font-medium mb-1 block">Update Type</label>
                <Select value={bulkPriceUpdateType} onValueChange={setBulkPriceUpdateType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage_increase">Percentage Increase (%)</SelectItem>
                    <SelectItem value="percentage_decrease">Percentage Decrease (%)</SelectItem>
                    <SelectItem value="fixed_increase">Fixed Amount Increase (₹)</SelectItem>
                    <SelectItem value="fixed_decrease">Fixed Amount Decrease (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Value</label>
                <Input type="number" placeholder="e.g. 10" value={bulkPriceUpdateValue} onChange={e => setBulkPriceUpdateValue(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBulkPriceOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#3E8940] hover:bg-[#3E8940]/90">Apply Prices</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCityPriceOpen} onOpenChange={setIsCityPriceOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>City-wise Pricing Overrides</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (selectedCityCodes.length === 0) return toast.error("Please select at least one city");
            
            const formData = new FormData(e.currentTarget);
            const overrides: any[] = [];
            
            selectedCityCodes.forEach(cityCode => {
              filteredItems.forEach(item => {
                const price = formData.get(`price_${item.id}`);
                if (price && String(price).trim() !== "") {
                  // Only attach ID if it's the primary loaded city to allow updates. 
                  // Other cities will get new rows (acceptable for this iteration).
                  const existing = cityCode === selectedCityCodes[0] 
                    ? cityOverrides.find(o => o.itemId === item.id) 
                    : undefined;
                    
                  overrides.push({
                    id: existing?.id,
                    itemId: item.id,
                    cityCode: cityCode,
                    customerPrice: Number(price)
                  });
                }
              });
            });

            if (overrides.length === 0) return toast.error("No prices entered");

            try {
              await adminCatalogApi.saveItemPriceOverrides(overrides);
              toast.success(`Overrides saved for ${selectedCityCodes.length} cities!`);
              setIsCityPriceOpen(false);
            } catch (err) {
              toast.error("Failed to save overrides");
            }
          }}>
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Select value={selectedStateCode} onValueChange={setSelectedStateCode}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(s => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-64 justify-start text-left font-normal" disabled={!selectedStateCode}>
                      {selectedCityCodes.length > 0 
                        ? `${selectedCityCodes.length} cities selected` 
                        : "Select Cities..."}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
                    {cityOptions.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">No cities found</div>
                    ) : (
                      cityOptions.map(c => (
                        <div 
                          key={c.cityCode} 
                          className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-slate-50"
                          onClick={() => {
                            setSelectedCityCodes(prev => 
                              prev.includes(c.cityCode) 
                                ? prev.filter(code => code !== c.cityCode)
                                : [...prev, c.cityCode]
                            );
                          }}
                        >
                          <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${selectedCityCodes.includes(c.cityCode) ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}>
                            {selectedCityCodes.includes(c.cityCode) && <span className="text-[10px]">✓</span>}
                          </div>
                          <span className="text-sm">{c.cityName}</span>
                        </div>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {selectedCityCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedCityCodes.map(code => {
                    const city = cityOptions.find(c => c.cityCode === code);
                    return (
                      <Badge key={code} variant="secondary" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                        {city?.cityName || code}
                        <button 
                          type="button"
                          className="ml-1 hover:text-red-500 font-bold"
                          onClick={() => setSelectedCityCodes(prev => prev.filter(c => c !== code))}
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              <div className="rounded-lg border max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Default Price</TableHead>
                      <TableHead>City Override Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => {
                      const override = cityOverrides.find(o => o.itemId === item.id);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>₹{item.customerPrice || 0}</TableCell>
                          <TableCell>
                            <Input 
                              name={`price_${item.id}`}
                              className="w-24 h-8" 
                              type="number"
                              placeholder="Override"
                              defaultValue={override?.customerPrice || ""}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCityPriceOpen(false)}>Close</Button>
              <Button type="submit" className="bg-[#3E8940] hover:bg-[#3E8940]/90">Save Overrides</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isVendorPriceOpen} onOpenChange={setIsVendorPriceOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vendor-wise Override Pricing</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedVendorId) return toast.error("Please select a vendor first");
            
            const formData = new FormData(e.currentTarget);
            const overrides: any[] = [];
            filteredItems.forEach(item => {
              const price = formData.get(`price_${item.id}`);
              const share = formData.get(`share_${item.id}`);
              if ((price && String(price).trim() !== "") || (share && String(share).trim() !== "")) {
                const existing = vendorOverrides.find(o => o.itemId === item.id);
                overrides.push({
                  id: existing?.id,
                  itemId: item.id,
                  vendorId: selectedVendorId,
                  customerPrice: price ? Number(price) : existing?.customerPrice || 0,
                  vendorShare: share ? Number(share) : existing?.vendorShare || 0
                });
              }
            });

            if (overrides.length === 0) return toast.error("No overrides entered");

            try {
              await adminCatalogApi.saveItemPriceOverrides(overrides);
              toast.success("Vendor overrides saved!");
              setIsVendorPriceOpen(false);
            } catch (err) {
              toast.error("Failed to save vendor overrides");
            }
          }}>
            <div className="py-4 space-y-4">
              <p className="text-sm text-slate-500">Configure special pricing agreements and commission rates for specific vendors.</p>
              <div className="flex items-center gap-2">
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.businessName || v.contactName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedVendorId ? (
                <div className="rounded-lg border max-h-[60vh] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Default Price</TableHead>
                        <TableHead>Override Price</TableHead>
                        <TableHead>Vendor Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map(item => {
                        const override = vendorOverrides.find(o => o.itemId === item.id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>₹{item.customerPrice || 0}</TableCell>
                            <TableCell>
                              <Input 
                                name={`price_${item.id}`}
                                className="w-24 h-8" 
                                type="number"
                                placeholder="₹ Price"
                                defaultValue={override?.customerPrice || ""}
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                name={`share_${item.id}`}
                                className="w-24 h-8" 
                                type="number"
                                placeholder="₹ Share"
                                defaultValue={override?.vendorShare || ""}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border bg-slate-50 p-8 text-center text-slate-500">
                  Select a vendor to configure their override pricing rules.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsVendorPriceOpen(false)}>Close</Button>
              {selectedVendorId && <Button type="submit" className="bg-[#3E8940] hover:bg-[#3E8940]/90">Save Overrides</Button>}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaxSettingsOpen} onOpenChange={setIsTaxSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tax Settings (GST %)</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Default GST Percentage (%)</label>
              <Input type="number" defaultValue="18" />
              <p className="text-xs text-slate-500 mt-1">This will apply to all newly created items unless specified otherwise.</p>
            </div>
            <div className="p-4 border rounded-lg bg-slate-50">
              <h4 className="font-semibold text-sm mb-2">Apply to existing items</h4>
              <p className="text-sm text-slate-600 mb-3">You can forcefully apply this GST setting to existing items.</p>
              <Select defaultValue="none">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Do not apply to existing items</SelectItem>
                  <SelectItem value="all">Apply to all existing items</SelectItem>
                  <SelectItem value="zero">Apply only to items with 0% GST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaxSettingsOpen(false)}>Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90">Save Tax Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">Loading...</div>
      }
    >
      <ItemsPageContent />
    </Suspense>
  );
}
