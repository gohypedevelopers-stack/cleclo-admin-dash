"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
import { adminCatalogApi } from "@/lib/admin-api";

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
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<ItemForm>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    fetchData();
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
        "Archive this item? It will become inactive instead of being permanently deleted.",
      )
    ) {
      return;
    }

    try {
      await adminCatalogApi.deleteItem(id);
      toast.success("Item archived");
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
        "Vendor share is greater than or equal to app price. Continue anyway?",
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

  const handleBulkIncrease = async () => {
    if (filteredItems.length === 0) return;
    const shouldContinue = confirm(
      `Increase app price and vendor share by 5% for ${filteredItems.length} visible items?`,
    );
    if (!shouldContinue) return;

    try {
      await adminCatalogApi.bulkPriceUpdate(
        filteredItems.map((item) => ({
          id: item.id,
          customerPrice: Math.round(toNumber(item.customerPrice) * 1.05),
          vendorShare: Math.round(toNumber(item.vendorShare) * 1.05),
        })),
      );
      toast.success("Bulk price update applied");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Bulk price update failed");
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
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleBulkIncrease}
            disabled={filteredItems.length === 0}
          >
            <Percent className="h-4 w-4" />
            Bulk +5%
          </Button>
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
        <div className="overflow-x-auto">
          <Table className="min-w-[1500px]">
            <TableHeader>
              <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 pl-6">
                  Image
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4">
                  Item Name
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Category
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Service
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Customer Price
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Vendor Share
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Platform Commission
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Tax GST
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Net Margin
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Updated
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-right pr-6">
                  Actions
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
                      <TableCell className="max-w-[180px]">
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
                      <TableCell className="font-bold text-slate-900 text-center text-xs">
                        {formatCurrency(financials.customerPrice)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-600">
                        {formatCurrency(financials.vendorShare)}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-bold ${
                              financials.isLoss ? "text-red-600" : "text-[#3E8940]"
                            }`}
                          >
                            {formatCurrency(financials.platformCommission)}
                          </span>
                          <span
                            className={`text-[9px] font-bold ${
                              financials.isLoss ? "text-red-500" : "text-slate-400"
                            }`}
                          >
                            {financials.commissionPercent}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-500">
                        <span>{formatCurrency(financials.gstAmount)}</span>
                        <p className="text-[9px] text-slate-400">
                          {financials.gstPercent}%
                        </p>
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {financials.isLoss ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-red-600">
                              -{formatCurrency(Math.abs(financials.netPlatformMargin))}
                            </span>
                            <span className="text-[9px] text-red-500 font-bold">
                              LOSS
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(financials.netPlatformMargin)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-500">
                        <p>{item.updatedByAdminName || "Admin"}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(item.updatedAt)}
                        </p>
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
                className="mt-1 border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="h-24 object-contain rounded" />
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
                  <p className="text-[10px] text-red-600 font-bold leading-tight">
                    Vendor payout exceeds or equals app price. This can create a
                    loss-making item.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
    </div>
  );
}
