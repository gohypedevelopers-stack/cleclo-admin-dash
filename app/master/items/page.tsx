"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  Download,
  Edit,
  ImageIcon,
  Loader2,
  Percent,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  Settings2,
  Tag,
  CheckCircle,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { adminCatalogApi, adminLocationApi, adminVendorApi } from "@/lib/admin-api";

type ServiceSummary = {
  id: string;
  name: string;
};

type CategorySummary = {
  id: string;
  name: string;
  service?: ServiceSummary | null;
};

type SubCategorySummary = {
  id: string;
  name: string;
  categoryId?: string;
  category?: CategorySummary | null;
};

type CatalogItem = {
  id: string;
  name: string;
  skuCode?: string | null;
  subCategoryId: string;
  imageUrl?: string | null;
  customerPrice: number;
  vendorShare: number;
  gstPercent: number;
  isActive: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  updatedByAdminName?: string | null;
  updatedAt?: string | null;
  subCategory?: SubCategorySummary | null;
};

type ItemForm = {
  name: string;
  skuCode: string;
  subCategoryId: string;
  imageUrl: string;
  customerPrice: string;
  vendorShare: string;
  gstPercent: string;
  availableFrom: string;
  availableUntil: string;
  isActive: boolean;
};

const emptyForm: ItemForm = {
  name: "",
  skuCode: "",
  subCategoryId: "",
  imageUrl: "",
  customerPrice: "0",
  vendorShare: "0",
  gstPercent: "18",
  availableFrom: "",
  availableUntil: "",
  isActive: true,
};

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const formatCurrency = (value: number) =>
  `Rs. ${Math.round(value).toLocaleString("en-IN")}`;

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

const computeFinancials = (item: {
  customerPrice: string | number;
  vendorShare: string | number;
  gstPercent: string | number;
}) => {
  const customerPrice = toNumber(item.customerPrice);
  const vendorShare = toNumber(item.vendorShare);
  const gstPercent = toNumber(item.gstPercent);
  const platformCommission = customerPrice - vendorShare;
  const commissionPercent =
    customerPrice > 0 ? Math.round((platformCommission / customerPrice) * 100) : 0;
  const gstAmount = platformCommission * (gstPercent / 100);
  const netPlatformMargin = platformCommission - gstAmount;
  const isLoss = customerPrice > 0 && vendorShare >= customerPrice;

  return {
    customerPrice,
    vendorShare,
    gstPercent,
    platformCommission,
    commissionPercent,
    marginPct: commissionPercent,
    gstAmount,
    netPlatformMargin,
    isLoss,
  };
};

const getServiceName = (item: CatalogItem) =>
  item.subCategory?.category?.service?.name || "No service";

const getCategoryName = (item: CatalogItem) =>
  item.subCategory?.category?.name || "No category";

const getSubCategoryName = (item: CatalogItem) =>
  item.subCategory?.name || "No subcategory";

export default function MasterItemsPage() {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkCategoryOpen, setIsBulkCategoryOpen] = useState(false);
  const [bulkSubCategoryId, setBulkSubCategoryId] = useState("");
  const [isCityPriceOpen, setIsCityPriceOpen] = useState(false);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [bulkPricePercent, setBulkPricePercent] = useState("5");
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<ItemForm>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // City Pricing State
  const [states, setStates] = useState<{code: string; name: string}[]>([]);
  const [cityOptions, setCityOptions] = useState<{cityCode: string; cityName: string}[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedCityCodes, setSelectedCityCodes] = useState<string[]>([]);
  const [cityOverrides, setCityOverrides] = useState<any[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum size is 5MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData((prev) => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [itemsRes, subsRes] = await Promise.all([
        adminCatalogApi.getItems(),
        adminCatalogApi.getSubCategories(),
      ]);

      setItems(Array.isArray(itemsRes) ? itemsRes : []);
      setSubCategories(Array.isArray(subsRes) ? subsRes : []);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to load service catalog data";
      setLoadError(message);
      toast.error("Failed to load service catalog data", { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    fetchData();
  }, []);

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

  // Load states on mount
  useEffect(() => {
    adminLocationApi.getStates().then(setStates).catch(console.error);
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [
        item.name,
        item.skuCode,
        getServiceName(item),
        getCategoryName(item),
        getSubCategoryName(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [items, searchQuery]);

  const totalCommission = items.reduce(
    (sum, item) => sum + computeFinancials(item).platformCommission,
    0,
  );
  const avgMarginPct =
    items.length > 0
      ? Math.round(
          items.reduce(
            (sum, item) => sum + computeFinancials(item).commissionPercent,
            0,
          ) / items.length,
        )
      : 0;
  const averageGst =
    items.length > 0
      ? Math.round(
          items.reduce((sum, item) => sum + toNumber(item.gstPercent), 0) /
            items.length,
        )
      : 0;
  const lossItems = items.filter((item) => computeFinancials(item).isLoss).length;
  const activeItems = items.filter((item) => item.isActive).length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      ...emptyForm,
      subCategoryId: subCategories[0]?.id || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      skuCode: item.skuCode || "",
      subCategoryId: item.subCategoryId || "",
      imageUrl: item.imageUrl || "",
      customerPrice: String(item.customerPrice ?? 0),
      vendorShare: String(item.vendorShare ?? 0),
      gstPercent: String(item.gstPercent ?? 0),
      availableFrom: toDateInputValue(item.availableFrom),
      availableUntil: toDateInputValue(item.availableUntil),
      isActive: item.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (item: CatalogItem) => {
    try {
      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? { ...current, isActive: !item.isActive }
            : current,
        ),
      );
      await adminCatalogApi.updateItem(item.id, { isActive: !item.isActive });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update item status");
      fetchData();
    }
  };

  const handleArchive = async (id: string) => {
    if (
      !confirm(
        "Move this item to Archive? It will be hidden from customers but remain in the database for records.",
      )
    ) {
      return;
    }

    try {
      // Use soft-delete (isActive: false) for archiving
      await adminCatalogApi.updateItem(id, { isActive: false });
      toast.success("Item moved to Archive");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to archive item");
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    if (!formData.subCategoryId) {
      toast.error("Please select a subcategory");
      return;
    }

    const financials = computeFinancials(formData);
    if (financials.isLoss) {
      const shouldContinue = confirm(
        "⚠️ Vendor payout exceeds platform margin. This will result in a loss-making item. Continue anyway?",
      );
      if (!shouldContinue) return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        skuCode: formData.skuCode.trim() || null,
        subCategoryId: formData.subCategoryId,
        imageUrl: formData.imageUrl.trim() || null,
        customerPrice: financials.customerPrice,
        vendorShare: financials.vendorShare,
        gstPercent: financials.gstPercent,
        availableFrom: formData.availableFrom || null,
        availableUntil: formData.availableUntil || null,
        isActive: formData.isActive,
      };

      if (editingItem) {
        await adminCatalogApi.updateItem(editingItem.id, payload);
      } else {
        await adminCatalogApi.createItem(payload);
      }

      toast.success(editingItem ? "Item updated" : "Item created");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkIncrease = () => {
    if (filteredItems.length === 0) return;
    setIsBulkPriceOpen(true);
  };

  const applyBulkIncrease = async () => {
    const percent = parseFloat(bulkPricePercent);
    if (isNaN(percent) || percent <= 0) {
      toast.error("Please enter a valid percentage");
      return;
    }

    setBulkApplying(true);
    try {
      const multiplier = 1 + (percent / 100);
      await adminCatalogApi.bulkPriceUpdate(
        filteredItems.map((item) => ({
          id: item.id,
          customerPrice: Math.round(toNumber(item.customerPrice) * multiplier),
          vendorShare: Math.round(toNumber(item.vendorShare) * multiplier),
        })),
      );
      toast.success(`Bulk price increase of ${percent}% applied`);
      setIsBulkPriceOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Bulk price update failed");
    } finally {
      setBulkApplying(false);
    }
  };

  const handleBulkToggleStatus = () => {
    if (filteredItems.length === 0) return;
    setIsBulkStatusOpen(true);
  };

  const applyBulkToggleStatus = async () => {
    const allActive = filteredItems.every(i => i.isActive);
    setBulkApplying(true);
    try {
      setItems(prev => prev.map(item =>
        filteredItems.find(fi => fi.id === item.id)
          ? { ...item, isActive: !allActive }
          : item
      ));
      await Promise.all(filteredItems.map(item =>
        adminCatalogApi.updateItem(item.id, { isActive: !allActive })
      ));
      const action = allActive ? "Deactivated" : "Activated";
      toast.success(`${action} ${filteredItems.length} items`);
      setIsBulkStatusOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update item status");
      fetchData();
    } finally {
      setBulkApplying(false);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      [
        "item_name",
        "sku_code",
        "service",
        "category",
        "subcategory",
        "customer_price",
        "vendor_share",
        "platform_commission",
        "gst_percent",
        "net_platform_margin",
        "status",
      ],
      ...filteredItems.map((item) => {
        const financials = computeFinancials(item);
        return [
          item.name,
          item.skuCode || "",
          getServiceName(item),
          getCategoryName(item),
          getSubCategoryName(item),
          financials.customerPrice,
          financials.vendorShare,
          financials.platformCommission,
          financials.gstPercent,
          Math.round(financials.netPlatformMargin),
          item.isActive ? "active" : "inactive",
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "service-catalog-items.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length === 0) return;

      // Better CSV splitting regex that handles quoted values with commas
      const splitCsvLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            result.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        return result;
      };

      const headers = splitCsvLine(lines[0]);
      
      const itemsToUpload = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = splitCsvLine(line);
        const item: any = {};
        headers.forEach((header, index) => {
          if (header) item[header.toLowerCase().replace(/\s/g, '_')] = values[index];
        });

        if (item.item_name && item.customer_price) {
          // Find subcategory ID by name
          let resolvedSubCategoryId = "";
          if (item.subcategory) {
            const match = subCategories.find(s => s.name.toLowerCase() === item.subcategory.toLowerCase());
            if (match) resolvedSubCategoryId = match.id;
          }
          
          // Fallback to first subcategory if not found
          if (!resolvedSubCategoryId && subCategories.length > 0) {
            resolvedSubCategoryId = subCategories[0].id;
          }

          if (!resolvedSubCategoryId) {
            console.warn(`Skipping item "${item.item_name}" - No subcategory found`);
            continue;
          }

          const cleanNumber = (val: string) => {
            if (!val) return 0;
            return Number(val.replace(/[^\d.]/g, '')) || 0;
          };

          itemsToUpload.push({
            name: item.item_name,
            skuCode: item.sku_code || null,
            subCategoryId: resolvedSubCategoryId,
            customerPrice: cleanNumber(item.customer_price),
            vendorShare: cleanNumber(item.vendor_share),
            gstPercent: cleanNumber(item.gst_percent),
            isActive: item.status?.toLowerCase() !== "inactive",
          });
        }
      }

      if (itemsToUpload.length === 0) {
        toast.error("No valid items found in CSV");
        return;
      }

      const confirmUpload = confirm(`Import ${itemsToUpload.length} items from CSV?`);
      if (!confirmUpload) return;

      setBulkApplying(true);
      let createdCount = 0;
      let updatedCount = 0;
      let failCount = 0;

      try {
        for (const itemData of itemsToUpload) {
          try {
            const existingItem = itemData.skuCode ? items.find(i => i.skuCode === itemData.skuCode) : null;
            
            if (existingItem) {
              await adminCatalogApi.updateItem(existingItem.id, itemData);
              updatedCount++;
            } else {
              await adminCatalogApi.createItem(itemData);
              createdCount++;
            }
          } catch (itemError) {
            console.error(`Failed to process item "${itemData.name}":`, itemError);
            failCount++;
          }
        }

        if (createdCount > 0 || updatedCount > 0) {
          toast.success(`Import complete: ${createdCount} created, ${updatedCount} updated.`);
        }
        if (failCount > 0) {
          toast.error(`Failed to process ${failCount} items. Check console.`);
        }
        fetchData();
      } catch (error) {
        console.error("Bulk upload crashed:", error);
        toast.error("CSV Import process failed");
      } finally {
        setBulkApplying(false);
        if (event.target) event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = ["item_name", "sku_code", "customer_price", "vendor_share", "gst_percent", "status"];
    const csv = headers.join(",") + "\n" + "Example Item,SKU001,500,350,18,active";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "catalog-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const formFinancials = computeFinancials(formData);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl text-black font-bold tracking-tight">
            Service Catalog Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage item pricing, vendor share, GST, margin and archive status.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleBulkUpload}
              disabled={bulkApplying}
            />
            <Button
              variant="outline"
              className="gap-2 w-full"
              disabled={bulkApplying}
            >
              {bulkApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-[#3E8940]" />}
              Import CSV
            </Button>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={filteredItems.length === 0}
              >
                <Settings2 className="h-4 w-4" />
                Bulk Actions
                <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Pricing & Config</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleBulkIncrease}>
                <Percent className="h-4 w-4 mr-2 text-slate-500" />
                Bulk Price Increase (%)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCityPriceOpen(true)}>
                <MapPin className="h-4 w-4 mr-2 text-slate-500" />
                City-Based Pricing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Management</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsBulkCategoryOpen(true)}>
                <Tag className="h-4 w-4 mr-2 text-slate-500" />
                Bulk Category Change
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkToggleStatus}>
                <CheckCircle className="h-4 w-4 mr-2 text-slate-500" />
                Bulk Activate/Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80"
            onClick={handleOpenAdd}
            disabled={subCategories.length === 0}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-slate-700">{items.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Total Items
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{activeItems} active</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalCommission)}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Commission Per Unit
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-blue-600">{avgMarginPct}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Avg Commission
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-amber-600">{averageGst}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Avg GST
          </p>
          <p className="text-xs text-slate-500 mt-0.5">From item config</p>
        </div>
        <div
          className={`rounded-xl border p-4 ${
            lossItems > 0 ? "bg-red-50 border-red-200" : "bg-white"
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              lossItems > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {lossItems}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Margin Warnings
          </p>
          {lossItems > 0 ? (
            <p className="text-[10px] text-red-500 font-bold mt-0.5">
              Vendor payout is not protected
            </p>
          ) : null}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search item, SKU, service, category or subcategory..."
            className="pl-10 bg-slate-50"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <Table className="min-w-[1300px]">
            <TableHeader className="bg-[#fbfbfb]">
              <TableRow className="border-none">
                <TableHead className="w-[60px] text-[10px] font-bold uppercase text-[#4FA851] py-4 pl-6">
                  IMAGE
                </TableHead>
                <TableHead className="w-[170px] text-[10px] font-bold uppercase text-[#4FA851] py-4">
                  ITEM NAME
                </TableHead>
                <TableHead className="w-[100px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  CATEGORY
                </TableHead>
                <TableHead className="w-[80px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  SERVICE
                </TableHead>
                <TableHead className="w-[130px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  CUSTOMER PRICE (APP PRICE)
                </TableHead>
                <TableHead className="w-[90px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  VENDOR SHARE
                </TableHead>
                <TableHead className="w-[120px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  PLATFORM COMMISSION
                </TableHead>
                <TableHead className="w-[90px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  TAX (GST)
                </TableHead>
                <TableHead className="w-[130px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  NET PLATFORM MARGIN
                </TableHead>
                <TableHead className="w-[130px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  LAST UPDATED
                </TableHead>
                <TableHead className="w-[100px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  STATUS
                </TableHead>
                <TableHead className="w-[80px] text-[10px] font-bold uppercase text-[#4FA851] py-4 text-right pr-6">
                  ACTIONS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-48 text-center text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3E8940] mb-2" />
                    Loading catalog...
                  </TableCell>
                </TableRow>
              ) : loadError ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-48 text-center text-slate-500">
                    <p className="mb-3 font-medium text-red-600">{loadError}</p>
                    <Button variant="outline" onClick={fetchData}>
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const financials = computeFinancials(item);

                  return (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-slate-50 ${
                        financials.isLoss ? "bg-red-50/40" : ""
                      }`}
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <div
                              aria-label={item.name}
                              className="h-full w-full bg-cover bg-center"
                              role="img"
                              style={{ backgroundImage: `url(${item.imageUrl})` }}
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="font-semibold text-black truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.skuCode || getSubCategoryName(item)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-slate-100 text-slate-600 border-none text-[10px]">
                          {getCategoryName(item)}
                        </Badge>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {getSubCategoryName(item)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">
                          {getServiceName(item)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="text-sm font-bold text-slate-800 font-mono">
                          {formatCurrency(item.customerPrice)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="text-xs text-slate-500 font-mono">
                          {formatCurrency(item.vendorShare)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <p
                            className={`text-sm font-bold ${
                              financials.isLoss ? "text-red-600" : "text-[#3E8940]"
                            } font-mono`}
                          >
                            {formatCurrency(financials.platformCommission)}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            {financials.marginPct}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <p className="text-xs text-slate-500 font-mono">
                            {formatCurrency(financials.gstAmount)}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            {item.gstPercent || 0}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <p
                            className={`text-sm font-bold ${
                              financials.isLoss ? "text-red-600" : "text-[#3E8940]"
                            } font-mono`}
                          >
                            {formatCurrency(financials.netPlatformMargin)}
                          </p>
                          {financials.isLoss ? (
                            <p className="text-[9px] text-red-600 font-bold uppercase tracking-tight">
                              LOSS
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-0.5 text-[10px]">
                          <span className="font-bold text-slate-600">
                            {item.updatedByAdminName || "Admin"}
                          </span>
                          <span className="text-slate-400">
                            {formatDate(item.updatedAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => handleToggleStatus(item)}
                            className="data-[state=checked]:bg-[#3E8940]"
                          />
                          <Badge
                            className={
                              item.isActive
                                ? "bg-green-100 text-green-700 border-none text-[10px]"
                                : "bg-slate-100 text-slate-600 border-none text-[10px]"
                            }
                          >
                            {item.isActive ? "Active" : "Archived"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-700"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleArchive(item.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="h-32 text-center text-slate-500">
                    No matching items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {editingItem ? "Edit Service Item" : "Add New Service Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Item Name
              </Label>
              <Input
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
                placeholder="e.g. Formal Suit"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                SKU Code
              </Label>
              <Input
                value={formData.skuCode}
                onChange={(event) =>
                  setFormData({ ...formData, skuCode: event.target.value })
                }
                placeholder="e.g. CL-FOR-0001"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Subcategory
              </Label>
              <Select
                value={formData.subCategoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, subCategoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory..." />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCategory) => (
                    <SelectItem key={subCategory.id} value={subCategory.id}>
                      {subCategory.category?.service?.name
                        ? `${subCategory.category.service.name} / `
                        : ""}
                      {subCategory.category?.name || "Category"} / {subCategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Item Image
              </Label>
              <div 
                className="mt-1 border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.imageUrl ? (
                    <div className="relative">
                        <img src={formData.imageUrl} alt="Preview" className="h-24 object-contain rounded shadow-sm border bg-white" />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, imageUrl: "" }));
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <>
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                        <span className="text-xs text-slate-500">Click to upload image</span>
                    </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Customer Price App Price
              </Label>
              <Input
                type="number"
                value={formData.customerPrice}
                onChange={(event) =>
                  setFormData({ ...formData, customerPrice: event.target.value })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Vendor Share
              </Label>
              <Input
                type="number"
                value={formData.vendorShare}
                onChange={(event) =>
                  setFormData({ ...formData, vendorShare: event.target.value })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                GST Percent
              </Label>
              <Input
                type="number"
                value={formData.gstPercent}
                onChange={(event) =>
                  setFormData({ ...formData, gstPercent: event.target.value })
                }
                placeholder="18"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 p-3">
              <div>
                <Label className="text-sm font-bold text-slate-700">Active Status</Label>
                <p className="text-[10px] text-slate-500">Visible if active</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                className="data-[state=checked]:bg-[#3E8940]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Available From
              </Label>
              <Input
                type="date"
                value={formData.availableFrom}
                onChange={(event) =>
                  setFormData({ ...formData, availableFrom: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Available Until
              </Label>
              <Input
                type="date"
                value={formData.availableUntil}
                onChange={(event) =>
                  setFormData({ ...formData, availableUntil: event.target.value })
                }
              />
            </div>

            <div
              className={`md:col-span-2 rounded-xl border-2 p-4 ${
                formFinancials.isLoss
                  ? "bg-red-50 border-red-200"
                  : "bg-[#3E8940]/5 border-[#3E8940]/10"
              }`}
            >
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Real-time Margin Preview
              </p>
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {formatCurrency(formFinancials.customerPrice)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    App Price
                  </p>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {formatCurrency(formFinancials.vendorShare)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    Vendor Share
                  </p>
                </div>
                <div>
                  <p
                    className={`text-base font-bold ${
                      formFinancials.isLoss ? "text-red-600" : "text-[#3E8940]"
                    }`}
                  >
                    {formatCurrency(formFinancials.platformCommission)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    Commission
                  </p>
                </div>
                <div>
                  <p
                    className={`text-base font-bold ${
                      formFinancials.isLoss ? "text-red-600" : "text-[#3E8940]"
                    }`}
                  >
                    {formatCurrency(formFinancials.netPlatformMargin)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    Net Margin
                  </p>
                </div>
              </div>
              {formFinancials.isLoss ? (
                <div className="mt-3 flex items-start gap-2 rounded bg-red-100/50 p-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-[10px] text-red-600 font-bold leading-tight uppercase tracking-tight">
                    ⚠️ Vendor payout exceeds platform margin.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="flex items-center gap-3 sm:justify-end">
            <Button
              variant="ghost"
              className="text-slate-500"
              onClick={() => setIsModalOpen(false)}
            >
              Discard
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white font-bold px-8 shadow-lg shadow-green-200"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving
                </>
              ) : editingItem ? (
                "Update Item"
              ) : (
                "Create Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkPriceOpen} onOpenChange={setIsBulkPriceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Bulk Price Increase (%)</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border">
              <div className="flex-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Increase Percentage (%)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={bulkPricePercent}
                    onChange={(e) => setBulkPricePercent(e.target.value)}
                    className="pl-8"
                    placeholder="e.g. 5"
                  />
                  <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="w-1/2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                ⚠️ This will increase <strong>App Price</strong> and <strong>Vendor Share</strong> for <strong>{filteredItems.length} items</strong>.
              </div>
            </div>

            <div className="rounded-xl border shadow-sm max-h-[45vh] overflow-auto bg-white">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[40%] font-bold text-slate-600 uppercase text-[10px] tracking-wider">Item Name</TableHead>
                    <TableHead className="w-[20%] text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider">Current</TableHead>
                    <TableHead className="w-[20%] text-center font-bold text-[#3E8940] uppercase text-[10px] tracking-wider">New (+{bulkPricePercent}%)</TableHead>
                    <TableHead className="w-[20%] text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider">New Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const percent = parseFloat(bulkPricePercent) || 0;
                    const multiplier = 1 + (percent / 100);
                    const newPrice = Math.round(toNumber(item.customerPrice) * multiplier);
                    const newVendor = Math.round(toNumber(item.vendorShare) * multiplier);
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-sm text-slate-700 py-3">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-500 font-mono">
                          {formatCurrency(item.customerPrice)}
                        </TableCell>
                        <TableCell className="text-center font-bold text-[#3E8940] text-sm font-mono">
                          {formatCurrency(newPrice)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-500 font-mono">
                          {formatCurrency(newVendor)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkPriceOpen(false)}>Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90" disabled={bulkApplying || !bulkPricePercent} onClick={applyBulkIncrease}>
              {bulkApplying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Applying...</> : `Apply +${bulkPricePercent}% Increase`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Activate/Deactivate Preview Modal */}
      <Dialog open={isBulkStatusOpen} onOpenChange={setIsBulkStatusOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {filteredItems.every(i => i.isActive) ? "Deactivate" : "Activate"} Items
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className={`mb-3 p-3 rounded-lg border text-sm ${filteredItems.every(i => i.isActive) ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}>
              {filteredItems.every(i => i.isActive)
                ? `⚠️ This will DEACTIVATE all ${filteredItems.length} items. They will no longer appear in the app.`
                : `✅ This will ACTIVATE all ${filteredItems.length} items. They will become visible in the app.`}
            </div>
            <div className="rounded-lg border max-h-[50vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Current Status</TableHead>
                    <TableHead className="text-center font-bold">Will Become</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={item.isActive ? "bg-green-100 text-green-700 border-none" : "bg-slate-100 text-slate-600 border-none"}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={!item.isActive ? "bg-green-100 text-green-700 border-none" : "bg-slate-100 text-slate-600 border-none"}>
                          {!item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkStatusOpen(false)}>Cancel</Button>
            <Button
              className={filteredItems.every(i => i.isActive) ? "bg-red-600 hover:bg-red-700" : "bg-[#3E8940] hover:bg-[#3E8940]/90"}
              disabled={bulkApplying}
              onClick={applyBulkToggleStatus}
            >
              {bulkApplying
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Applying...</>
                : `${filteredItems.every(i => i.isActive) ? "Deactivate" : "Activate"} ${filteredItems.length} Items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkCategoryOpen} onOpenChange={setIsBulkCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Category Change</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-500">Move all {filteredItems.length} filtered items to a new sub-category.</p>
            <Select value={bulkSubCategoryId} onValueChange={setBulkSubCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select new Sub-Category" />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map(sc => (
                  <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkCategoryOpen(false)}>Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90" disabled={!bulkSubCategoryId} onClick={async () => {
              try {
                await Promise.all(filteredItems.map(item => 
                  adminCatalogApi.updateItem(item.id, { subCategoryId: bulkSubCategoryId })
                ));
                toast.success(`Moved ${filteredItems.length} items`);
                setIsBulkCategoryOpen(false);
                fetchData();
              } catch(e) {
                toast.error("Failed to move items");
              }
            }}>Move Items</Button>
          </DialogFooter>
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

            const fd = new FormData(e.currentTarget);
            const overrides: any[] = [];

            selectedCityCodes.forEach(cityCode => {
              filteredItems.forEach(item => {
                const price = fd.get(`price_${item.id}`);
                if (price && String(price).trim() !== "") {
                  const existing = cityCode === selectedCityCodes[0]
                    ? cityOverrides.find(o => o.itemId === item.id)
                    : undefined;
                  overrides.push({
                    id: existing?.id,
                    itemId: item.id,
                    cityCode,
                    customerPrice: Number(price)
                  });
                }
              });
            });

            if (overrides.length === 0) return toast.error("No prices entered");

            try {
              await adminCatalogApi.saveItemPriceOverrides(overrides);
              toast.success(`Overrides saved for ${selectedCityCodes.length} ${selectedCityCodes.length === 1 ? 'city' : 'cities'}!`);
              setIsCityPriceOpen(false);
            } catch (err) {
              toast.error("Failed to save overrides");
            }
          }}>
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
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
                        ? `${selectedCityCodes.length} ${selectedCityCodes.length === 1 ? 'city' : 'cities'} selected`
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
                <div className="flex flex-wrap gap-2">
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

              <div className="rounded-lg border max-h-[50vh] overflow-auto">
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
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-slate-500">{formatCurrency(item.customerPrice)}</TableCell>
                          <TableCell>
                            <Input
                              name={`price_${item.id}`}
                              className="w-28 h-8"
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
              <Button type="button" variant="outline" onClick={() => { setIsCityPriceOpen(false); setSelectedCityCodes([]); setSelectedStateCode(""); }}>Close</Button>
              <Button type="submit" className="bg-[#3E8940] hover:bg-[#3E8940]/90">Save Overrides</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
