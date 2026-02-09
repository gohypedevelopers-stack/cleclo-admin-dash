"use client";

import { useState } from "react";
import { Plus, Trash2, Edit, GripVertical, Tag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const promotions = [
  {
    id: 1,
    title: "First Order Free Delivery",
    description: "Free pickup and delivery on your first order",
    type: "New User",
    discount: "Free Delivery",
    active: true,
    validUntil: "Mar 31, 2026",
  },
  {
    id: 2,
    title: "Weekend Special",
    description: "20% off on all dry cleaning services",
    type: "Weekend",
    discount: "20% OFF",
    active: true,
    validUntil: "Ongoing",
  },
  {
    id: 3,
    title: "Bulk Order Discount",
    description: "Order 10kg+ and get 15% discount",
    type: "Bulk",
    discount: "15% OFF",
    active: true,
    validUntil: "Ongoing",
  },
  {
    id: 4,
    title: "Summer Sale",
    description: "Flat ₹100 off on orders above ₹500",
    type: "Seasonal",
    discount: "₹100 OFF",
    active: false,
    validUntil: "Expired",
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "New User":
      return "bg-blue-100 text-blue-700";
    case "Weekend":
      return "bg-purple-100 text-purple-700";
    case "Bulk":
      return "bg-amber-100 text-amber-700";
    case "Seasonal":
      return "bg-pink-100 text-pink-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function PromotionsPage() {
  const [promoList, setPromoList] = useState(promotions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({
    title: "",
    description: "",
    discount: "",
    type: "Seasonal",
    validUntil: "",
  });

  const togglePromo = (id: number) => {
    setPromoList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
    );
  };

  const handleAddPromo = () => {
    if (!newPromo.title || !newPromo.discount) return;

    const newId = Math.max(...promoList.map((p) => p.id)) + 1;
    setPromoList((prev) => [
      ...prev,
      {
        id: newId,
        title: newPromo.title,
        description: newPromo.description || "No description",
        type: newPromo.type,
        discount: newPromo.discount,
        active: true,
        validUntil: newPromo.validUntil || "Ongoing",
      },
    ]);
    setNewPromo({
      title: "",
      description: "",
      discount: "",
      type: "Seasonal",
      validUntil: "",
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Promotions
          </h1>
          <p className="text-slate-500 mt-1">
            Manage promotional cards on the home screen
          </p>
        </div>
        <Button
          className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Promotion
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {promoList.filter((p) => p.active).length}
          </p>
          <p className="text-sm text-slate-500">Active Promotions</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-slate-600">
            {promoList.filter((p) => !p.active).length}
          </p>
          <p className="text-sm text-slate-500">Inactive</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{promoList.length}</p>
          <p className="text-sm text-slate-500">Total</p>
        </div>
      </div>

      {/* Promotions List */}
      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {promoList.map((promo) => (
          <div
            key={promo.id}
            className={`p-4 flex items-center gap-4 ${
              !promo.active ? "opacity-60" : ""
            }`}
          >
            <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

            {/* Discount Badge */}
            <div className="w-20 h-16 bg-gradient-to-br from-[#3E8940] to-[#5FAD61] rounded-lg flex items-center justify-center text-white font-bold text-sm text-center px-1">
              {promo.discount}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-black">{promo.title}</h3>
                <Badge
                  className={`${getTypeColor(promo.type)} border-none text-xs`}
                >
                  {promo.type}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mb-1">{promo.description}</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                {promo.validUntil}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Switch
                checked={promo.active}
                onCheckedChange={() => togglePromo(promo.id)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-700"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Promotion Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="e.g., Winter Sale"
                value={newPromo.title}
                onChange={(e) =>
                  setNewPromo({ ...newPromo, title: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="e.g., Flat 10% off on all orders"
                value={newPromo.description}
                onChange={(e) =>
                  setNewPromo({ ...newPromo, description: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Text</Label>
                <Input
                  placeholder="e.g., 10% OFF"
                  value={newPromo.discount}
                  onChange={(e) =>
                    setNewPromo({ ...newPromo, discount: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  placeholder="e.g., Mar 31"
                  value={newPromo.validUntil}
                  onChange={(e) =>
                    setNewPromo({ ...newPromo, validUntil: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Promotion Type</Label>
              <Select
                value={newPromo.type}
                onValueChange={(value) =>
                  setNewPromo({ ...newPromo, type: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seasonal">Seasonal</SelectItem>
                  <SelectItem value="New User">New User</SelectItem>
                  <SelectItem value="Weekend">Weekend</SelectItem>
                  <SelectItem value="Bulk">Bulk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleAddPromo}
            >
              Add Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
