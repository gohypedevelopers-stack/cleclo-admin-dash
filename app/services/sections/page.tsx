"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Save,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sections = [
  { id: 1, name: "Top Services", tab: "Men", itemCount: 6, order: 1 },
  { id: 2, name: "Everyday Essentials", tab: "Men", itemCount: 8, order: 2 },
  { id: 3, name: "Formal Wear", tab: "Men", itemCount: 5, order: 3 },
  { id: 4, name: "Top Services", tab: "Women", itemCount: 8, order: 1 },
  { id: 5, name: "Traditional Wear", tab: "Women", itemCount: 10, order: 2 },
  { id: 6, name: "Linens & Bedding", tab: "Home", itemCount: 6, order: 1 },
];

const tabs = ["Men", "Women", "Kids", "Home"];

export default function SectionsPage() {
  const [sectionList, setSectionList] = useState(sections);
  const [selectedTab, setSelectedTab] = useState("all");
  const [saved, setSaved] = useState(false);

  const filteredSections =
    selectedTab === "all"
      ? sectionList
      : sectionList.filter((s) => s.tab === selectedTab);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Sections
          </h1>
          <p className="text-slate-500 mt-1">
            Organize sections within each tab
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Section
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

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">
            Filter by Tab:
          </span>
          <Select value={selectedTab} onValueChange={setSelectedTab}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Tabs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tabs</SelectItem>
              {tabs.map((tab) => (
                <SelectItem key={tab} value={tab}>
                  {tab}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sections List */}
      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {filteredSections.map((section) => (
          <div key={section.id} className="p-4 flex items-center gap-4">
            <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-black">{section.name}</h3>
                <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                  {section.tab}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                {section.itemCount} items • Position {section.order}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500"
              >
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
          </div>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="bg-slate-50 rounded-xl p-8 text-center">
          <p className="text-slate-500">No sections found for this tab</p>
        </div>
      )}
    </div>
  );
}

