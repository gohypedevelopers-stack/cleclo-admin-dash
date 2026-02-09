"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const tabs = [
  { id: 1, name: "Men", order: 1, active: true, itemCount: 24 },
  { id: 2, name: "Women", order: 2, active: true, itemCount: 32 },
  { id: 3, name: "Kids", order: 3, active: true, itemCount: 18 },
  { id: 4, name: "Home", order: 4, active: true, itemCount: 15 },
  { id: 5, name: "Winter Wear", order: 5, active: false, itemCount: 8 },
];

export default function TabsPage() {
  const [tabList, setTabList] = useState(tabs);
  const [newTab, setNewTab] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleTab = (id: number) => {
    setTabList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  const addTab = () => {
    if (!newTab.trim()) return;
    setTabList((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: newTab,
        order: prev.length + 1,
        active: true,
        itemCount: 0,
      },
    ]);
    setNewTab("");
  };

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
            Service Tabs
          </h1>
          <p className="text-slate-500 mt-1">
            Manage main category tabs (Men, Women, etc.)
          </p>
        </div>
        <Button
          className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Add New Tab */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex gap-3">
          <Input
            placeholder="New tab name (e.g., Accessories)"
            value={newTab}
            onChange={(e) => setNewTab(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={addTab}
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90"
          >
            <Plus className="h-4 w-4" />
            Add Tab
          </Button>
        </div>
      </div>

      {/* Tabs List */}
      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {tabList.map((tab) => (
          <div
            key={tab.id}
            className={`p-4 flex items-center gap-4 ${
              !tab.active ? "opacity-60" : ""
            }`}
          >
            <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              {tab.order}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-black">{tab.name}</h3>
                {!tab.active && (
                  <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                    Hidden
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500">{tab.itemCount} items</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {tab.active ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                )}
                <Switch
                  checked={tab.active}
                  onCheckedChange={() => toggleTab(tab.id)}
                />
              </div>
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

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Drag tabs to reorder them in the app</li>
          <li>• Hidden tabs won&apos;t appear to users</li>
          <li>• Each tab shows items assigned to it</li>
        </ul>
      </div>
    </div>
  );
}

