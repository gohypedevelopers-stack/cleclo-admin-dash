"use client";

import { useState, Suspense } from "react";
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

const initialSubCategories = [
  { id: 1, name: "Casual", category: "Men", itemsCount: 5, active: true },
  { id: 2, name: "Nightwear", category: "Men", itemsCount: 1, active: true },
  { id: 3, name: "Active", category: "Men", itemsCount: 4, active: true },
  { id: 4, name: "Home", category: "Men", itemsCount: 2, active: true },
  { id: 5, name: "Innerwear", category: "Men", itemsCount: 1, active: true },
  { id: 6, name: "Swim", category: "Men", itemsCount: 1, active: true },
  { id: 7, name: "Formal", category: "Men", itemsCount: 12, active: true },
  { id: 8, name: "Ethnic", category: "Men", itemsCount: 3, active: true },
  { id: 9, name: "Knitwear", category: "Men", itemsCount: 2, active: true },
  { id: 10, name: "Outerwear", category: "Men", itemsCount: 5, active: true },
  { id: 11, name: "Accessories", category: "Men", itemsCount: 2, active: true },
  { id: 12, name: "Sports", category: "Men", itemsCount: 1, active: true },
];

const categoryOptions = [
  "All Categories",
  "Men",
  "Women",
  "Kids",
  "Household",
  "Institutions",
  "Others",
];

const serviceColors: Record<string, string> = {
  Wash: "#3B82F6",
  "Wash & Iron": "#10B981",
  "Dry Clean": "#8B5CF6",
  "Iron Only": "#F59E0B",
};

function SubCategoriesPageContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const serviceFromUrl = searchParams.get("service");

  const [subCategoryList, setSubCategoryList] = useState(initialSubCategories);
  const [selectedCategory, setSelectedCategory] = useState(
    categoryFromUrl || "All Categories",
  );
  const [saved, setSaved] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSubCategory, setNewSubCategory] = useState({
    name: "",
    category: categoryFromUrl || "Men",
  });
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddCategory, setQuickAddCategory] = useState(
    categoryFromUrl || "Men",
  );

  const filteredSubCategories =
    selectedCategory === "All Categories"
      ? subCategoryList
      : subCategoryList.filter((sc) => sc.category === selectedCategory);

  const toggleSubCategory = (id: number) => {
    setSubCategoryList((prev) =>
      prev.map((sc) => (sc.id === id ? { ...sc, active: !sc.active } : sc)),
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddSubCategory = (name: string, category: string) => {
    if (!name.trim()) return;

    const newId = Math.max(...subCategoryList.map((sc) => sc.id)) + 1;
    setSubCategoryList((prev) => [
      ...prev,
      {
        id: newId,
        name: name,
        category: category,
        itemsCount: 0,
        active: true,
      },
    ]);
  };

  const handleDialogAdd = () => {
    handleAddSubCategory(newSubCategory.name, newSubCategory.category);
    setNewSubCategory({ name: "", category: categoryFromUrl || "Men" });
    setIsDialogOpen(false);
  };

  const handleQuickAdd = () => {
    handleAddSubCategory(quickAddName, quickAddCategory);
    setQuickAddName("");
  };

  const serviceColor = serviceFromUrl
    ? serviceColors[serviceFromUrl] || "#3E8940"
    : "#3E8940";

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-4xl space-y-6">
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
              <span className="text-slate-600 font-medium">
                {categoryFromUrl}
              </span>
            </>
          )}
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl text-black font-bold tracking-tight">
              Sub Categories {categoryFromUrl && `- ${categoryFromUrl}`}
            </h1>
            <p className="text-slate-500 mt-1">
              Click on a sub-category to view its items
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsDialogOpen(true)}
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

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-4">
          <Filter className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            Filter by Category:
          </span>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Badge className="bg-slate-100 text-slate-600 border-none">
            {filteredSubCategories.length} sub-categories
          </Badge>
        </div>

        {/* Sub Categories List */}
        <div className="bg-white rounded-2xl shadow-sm border divide-y">
          {filteredSubCategories.map((subCategory) => (
            <div
              key={subCategory.id}
              className={`flex items-center ${
                !subCategory.active ? "opacity-60" : ""
              }`}
            >
              <div className="p-5 flex items-center gap-4 flex-1">
                <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: serviceColor + "15" }}
                >
                  <Layers className="h-6 w-6" style={{ color: serviceColor }} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-black">{subCategory.name}</h3>
                    {!subCategory.active && (
                      <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className="bg-blue-100 text-blue-700 border-none text-xs">
                      {subCategory.category}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {subCategory.itemsCount} items
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={subCategory.active}
                    onCheckedChange={() => toggleSubCategory(subCategory.id)}
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Link
                href={`/services/items?subcategory=${
                  subCategory.name
                }&category=${subCategory.category}${
                  serviceFromUrl ? `&service=${serviceFromUrl}` : ""
                }`}
                className="px-6 py-5 border-l hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
                style={{ color: serviceColor }}
              >
                View Items
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        {filteredSubCategories.length === 0 && (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Layers className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              No sub-categories found for this category
            </p>
          </div>
        )}

        {/* Quick Add */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-bold text-black mb-4">Quick Add Sub Category</h3>
          <div className="flex gap-3 flex-wrap">
            <Select
              value={quickAddCategory}
              onValueChange={setQuickAddCategory}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.slice(1).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Sub category name"
              className="flex-1 min-w-[200px]"
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

      {/* Add Sub Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Sub Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <Select
                value={newSubCategory.category}
                onValueChange={(value) =>
                  setNewSubCategory({ ...newSubCategory, category: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.slice(1).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
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
                onChange={(e) =>
                  setNewSubCategory({ ...newSubCategory, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleDialogAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sub Category
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
      fallback={
        <div className="flex items-center justify-center p-8">Loading...</div>
      }
    >
      <SubCategoriesPageContent />
    </Suspense>
  );
}
