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
    title: "FREESHIP25",
    description: "Free pickup and delivery on orders above ₹299",
    type: "Free Pickup Campaign",
    discount: "FREE SHIP",
    active: true,
    validUntil: "Mar 31, 2026",
  },
  {
    id: 2,
    title: "COUPON20",
    description: "20% off on all dry cleaning services",
    type: "Coupon-based Campaigns",
    discount: "20% OFF",
    active: true,
    validUntil: "Ongoing",
  },
  {
    id: 3,
    title: "CLEANEX15",
    description: "15% off sponsored by Clean Express",
    type: "Vendor-sponsored Offers",
    discount: "15% OFF",
    active: true,
    validUntil: "Ongoing",
  },
  {
    id: 4,
    title: "PLATFORM50",
    description: "Flat ₹50 off on all services - funded by Cleclo",
    type: "Platform-Funded Offers",
    discount: "₹50 OFF",
    active: false,
    validUntil: "Expired",
  },
  {
    id: 5,
    title: "EXPRESS2X",
    description: "Get express delivery at 50% extra instead of 2x",
    type: "Express Delivery Upsell",
    discount: "50% EXTRA",
    active: true,
    validUntil: "Ongoing",
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "Coupon-based Campaigns":
      return "bg-blue-100 text-blue-700";
    case "Vendor-sponsored Offers":
      return "bg-purple-100 text-purple-700";
    case "Platform-Funded Offers":
      return "bg-amber-100 text-amber-700";
    case "Free Pickup Campaign":
      return "bg-emerald-100 text-emerald-700";
    case "Express Delivery Upsell":
      return "bg-orange-100 text-orange-700";
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
            Campaign Manager
          </h1>
          <p className="text-slate-500 mt-1">
            Create and monitor coupons, vendor offers, and marketing campaigns
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
                  <SelectItem value="Coupon-based Campaigns">Coupon-based</SelectItem>
                  <SelectItem value="Vendor-sponsored Offers">Vendor-sponsored</SelectItem>
                  <SelectItem value="Platform-Funded Offers">Platform-Funded</SelectItem>
                  <SelectItem value="Free Pickup Campaign">Free Pickup</SelectItem>
                  <SelectItem value="Express Delivery Upsell">Express Delivery</SelectItem>
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
