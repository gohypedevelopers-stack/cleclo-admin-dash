"use client";

import { useState, Suspense } from "react";
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
} from "lucide-react";
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

const initialItems = [
  {
    id: 1,
    name: "T-Shirt",
    subCategory: "Casual",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0001",
    active: true,
  },
  {
    id: 2,
    name: "Jeans",
    subCategory: "Casual",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0002",
    active: true,
  },
  {
    id: 3,
    name: "Shorts",
    subCategory: "Casual",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0003",
    active: true,
  },
  {
    id: 4,
    name: "Pyjama",
    subCategory: "Nightwear",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0004",
    active: true,
  },
  {
    id: 5,
    name: "Sweatpants",
    subCategory: "Active",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0005",
    active: true,
  },
  {
    id: 6,
    name: "Trackpants",
    subCategory: "Active",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0006",
    active: true,
  },
  {
    id: 7,
    name: "Capri",
    subCategory: "Casual",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0007",
    active: true,
  },
  {
    id: 8,
    name: "Bathrobe",
    subCategory: "Home",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0008",
    active: true,
  },
  {
    id: 9,
    name: "Undershirt",
    subCategory: "Innerwear",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0009",
    active: true,
  },
  {
    id: 10,
    name: "Napkin",
    subCategory: "Home",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0010",
    active: true,
  },
  {
    id: 11,
    name: "Swimming Costume",
    subCategory: "Swim",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0011",
    active: true,
  },
  {
    id: 12,
    name: "Cargo Pants",
    subCategory: "Casual",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0012",
    active: true,
  },
  {
    id: 13,
    name: "Sweatshirt",
    subCategory: "Active",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0013",
    active: true,
  },
  {
    id: 14,
    name: "Track Suit",
    subCategory: "Active",
    category: "Men",
    service: "Wash",
    code: "CL-MEN-0014",
    active: true,
  },
  {
    id: 15,
    name: "Pants / Trouser",
    subCategory: "Formal",
    category: "Men",
    service: "Both",
    code: "CL-MEN-0015",
    active: true,
  },
  {
    id: 16,
    name: "Shirt",
    subCategory: "Formal",
    category: "Men",
    service: "Both",
    code: "CL-MEN-0016",
    active: true,
  },
  {
    id: 17,
    name: "Kurta",
    subCategory: "Ethnic",
    category: "Men",
    service: "Both",
    code: "CL-MEN-0017",
    active: true,
  },
  {
    id: 18,
    name: "Dhoti Kurta",
    subCategory: "Ethnic",
    category: "Men",
    service: "Both",
    code: "CL-MEN-0018",
    active: true,
  },
  {
    id: 19,
    name: "Kurta Pyjama",
    subCategory: "Ethnic",
    category: "Men",
    service: "Both",
    code: "CL-MEN-0019",
    active: true,
  },
  {
    id: 20,
    name: "Pullover",
    subCategory: "Knitwear",
    category: "Men",
    service: "Both",
    code: "CL-MEN-0020",
    active: true,
  },
  {
    id: 21,
    name: "Sweater",
    subCategory: "Knitwear",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0021",
    active: true,
  },
  {
    id: 22,
    name: "Coat",
    subCategory: "Outerwear",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0022",
    active: true,
  },
  {
    id: 23,
    name: "Jacket Half",
    subCategory: "Outerwear",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0023",
    active: true,
  },
  {
    id: 24,
    name: "Jacket",
    subCategory: "Outerwear",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0024",
    active: true,
  },
  {
    id: 25,
    name: "Blazer",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0025",
    active: true,
  },
  {
    id: 26,
    name: "Suit (2 Pc)",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0026",
    active: true,
  },
  {
    id: 27,
    name: "Suit (3 Pc)",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0027",
    active: true,
  },
  {
    id: 28,
    name: "Overcoat",
    subCategory: "Outerwear",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0028",
    active: true,
  },
  {
    id: 29,
    name: "Safari Suit",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0029",
    active: true,
  },
  {
    id: 30,
    name: "Waist Coat",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0030",
    active: true,
  },
  {
    id: 31,
    name: "Long Coat",
    subCategory: "Outerwear",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0031",
    active: true,
  },
  {
    id: 32,
    name: "Achkan",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0032",
    active: true,
  },
  {
    id: 33,
    name: "Sherwani",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0033",
    active: true,
  },
  {
    id: 34,
    name: "Pathani Suit",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0034",
    active: true,
  },
  {
    id: 35,
    name: "Tuxedo",
    subCategory: "Formal",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0035",
    active: true,
  },
  {
    id: 36,
    name: "Pocket Square",
    subCategory: "Accessories",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0036",
    active: true,
  },
  {
    id: 37,
    name: "Tie",
    subCategory: "Accessories",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0037",
    active: true,
  },
  {
    id: 38,
    name: "Sports Jacket",
    subCategory: "Sports",
    category: "Men",
    service: "Dry Clean",
    code: "CL-MEN-0038",
    active: true,
  },
];

const subCategoryOptions = [
  "All Sub Categories",
  "Casual",
  "Nightwear",
  "Active",
  "Home",
  "Innerwear",
  "Swim",
  "Formal",
  "Ethnic",
  "Knitwear",
  "Outerwear",
  "Accessories",
  "Sports",
];

const serviceOptions = ["Wash", "Both", "Dry Clean"];

const serviceColors: Record<string, string> = {
  Wash: "#3B82F6",
  "Wash & Iron": "#10B981",
  Both: "#F59E0B",
  "Dry Clean": "#8B5CF6",
};

const serviceBadgeColors: Record<string, string> = {
  Wash: "bg-blue-100 text-blue-700",
  Both: "bg-amber-100 text-amber-700",
  "Dry Clean": "bg-purple-100 text-purple-700",
};

function ItemsPageContent() {
  const searchParams = useSearchParams();
  const subCategoryFromUrl = searchParams.get("subcategory");
  const categoryFromUrl = searchParams.get("category");
  const serviceFromUrl = searchParams.get("service");

  const [itemList, setItemList] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState(
    subCategoryFromUrl || "All Sub Categories",
  );
  const [saved, setSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    subCategory: subCategoryFromUrl || "Casual",
    service: "Wash",
  });

  const filteredItems = itemList.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedSubCategory === "All Sub Categories" ||
      item.subCategory === selectedSubCategory;
    return matchesSearch && matchesFilter;
  });

  const toggleItem = (id: number) => {
    setItemList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item,
      ),
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateCode = () => {
    const prefix = categoryFromUrl
      ? `CL-${categoryFromUrl.toUpperCase().slice(0, 3)}`
      : "CL-MEN";
    const num = String(itemList.length + 1).padStart(4, "0");
    return `${prefix}-${num}`;
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;

    const newId = Math.max(...itemList.map((i) => i.id)) + 1;
    setItemList((prev) => [
      ...prev,
      {
        id: newId,
        name: newItem.name,
        subCategory: newItem.subCategory,
        category: categoryFromUrl || "Men",
        service: newItem.service,
        code: generateCode(),
        active: true,
      },
    ]);
    setNewItem({
      name: "",
      subCategory: subCategoryFromUrl || "Casual",
      service: "Wash",
    });
    setIsDialogOpen(false);
  };

  const serviceColor = serviceFromUrl
    ? serviceColors[serviceFromUrl] || "#3E8940"
    : "#3E8940";

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-5xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link
            href="/services/services"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Services
          </Link>
          {serviceFromUrl && (
            <>
              <span className="text-slate-400">/</span>
              <Link
                href={`/services/categories?service=${serviceFromUrl}`}
                className="hover:underline"
                style={{ color: serviceColor }}
              >
                {serviceFromUrl}
              </Link>
            </>
          )}
          {categoryFromUrl && (
            <>
              <span className="text-slate-400">/</span>
              <Link
                href={`/services/subcategories?category=${categoryFromUrl}${
                  serviceFromUrl ? `&service=${serviceFromUrl}` : ""
                }`}
                className="text-primary hover:underline"
              >
                {categoryFromUrl}
              </Link>
            </>
          )}
          {subCategoryFromUrl && (
            <>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 font-medium">
                {subCategoryFromUrl}
              </span>
            </>
          )}
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl text-black font-bold tracking-tight">
              Items {subCategoryFromUrl && `- ${subCategoryFromUrl}`}
            </h1>
            <p className="text-slate-500 mt-1">
              {filteredItems.length} items{" "}
              {subCategoryFromUrl ? `in ${subCategoryFromUrl}` : "total"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsDialogOpen(true)}
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {filteredItems.length}
            </p>
            <p className="text-sm text-slate-500">Items</p>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {filteredItems.filter((i) => i.service === "Wash").length}
            </p>
            <p className="text-sm text-slate-500">Wash</p>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {filteredItems.filter((i) => i.service === "Both").length}
            </p>
            <p className="text-sm text-slate-500">Both</p>
          </div>
          <div className="bg-white rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {filteredItems.filter((i) => i.service === "Dry Clean").length}
            </p>
            <p className="text-sm text-slate-500">Dry Clean</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search items..."
              className="pl-10 bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedSubCategory}
            onValueChange={setSelectedSubCategory}
          >
            <SelectTrigger className="w-52">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subCategoryOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge className="bg-slate-100 text-slate-600 border-none">
            {filteredItems.length} items
          </Badge>
        </div>

        {/* Items Table */}
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
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className={`hover:bg-slate-50 ${
                    !item.active ? "opacity-60" : ""
                  }`}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: serviceColor + "15" }}
                      >
                        <Package
                          className="h-5 w-5"
                          style={{ color: serviceColor }}
                        />
                      </div>
                      <span className="font-semibold text-black">
                        {item.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-purple-100 text-purple-700 border-none text-xs">
                      {item.subCategory}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`border-none text-xs ${
                        serviceBadgeColors[item.service] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.service}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-500">
                      {item.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.active}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredItems.length === 0 && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No items found</p>
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Item Name
              </label>
              <Input
                placeholder="e.g., Hoodie"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Sub Category
              </label>
              <Select
                value={newItem.subCategory}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, subCategory: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subCategoryOptions.slice(1).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Service Type
              </label>
              <div className="flex gap-2 mt-2">
                {serviceOptions.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => setNewItem({ ...newItem, service })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      newItem.service === service
                        ? serviceBadgeColors[service] + " ring-2 ring-offset-1"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    style={
                      newItem.service === service
                        ? { boxShadow: `0 0 0 2px ${serviceColors[service]}` }
                        : {}
                    }
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Auto-generated code</p>
              <p className="font-mono text-sm font-semibold text-slate-700">
                {generateCode()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleAddItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
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
