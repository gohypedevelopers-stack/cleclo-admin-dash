"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ImageIcon,
  DollarSign,
} from "lucide-react";
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

const items = [
  {
    id: 1,
    name: "Men's T-Shirt",
    category: "Men",
    service: "Wash & Iron",
    price: "₹25",
    image: "/items/tshirt.jpg",
    active: true,
  },
  {
    id: 2,
    name: "Women's Kurti",
    category: "Women",
    service: "Wash & Iron",
    price: "₹35",
    image: "/items/kurti.jpg",
    active: true,
  },
  {
    id: 3,
    name: "Formal Suit",
    category: "Men",
    service: "Dry Clean",
    price: "₹350",
    image: "/items/suit.jpg",
    active: true,
  },
  {
    id: 4,
    name: "Saree (Silk)",
    category: "Women",
    service: "Dry Clean",
    price: "₹250",
    image: "/items/saree.jpg",
    active: true,
  },
  {
    id: 5,
    name: "Bed Sheet (Single)",
    category: "Home",
    service: "Wash & Fold",
    price: "₹60",
    image: "/items/bedsheet.jpg",
    active: true,
  },
  {
    id: 6,
    name: "Curtain (Per Panel)",
    category: "Home",
    service: "Wash & Iron",
    price: "₹80",
    image: "/items/curtain.jpg",
    active: false,
  },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Men":
      return "bg-blue-100 text-blue-700";
    case "Women":
      return "bg-pink-100 text-pink-700";
    case "Home":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function MasterItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Master Items
          </h1>
          <p className="text-slate-500 mt-1">
            Manage service items and pricing
          </p>
        </div>
        <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{items.length}</p>
          <p className="text-sm text-slate-500">Total Items</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {items.filter((i) => i.category === "Men").length}
          </p>
          <p className="text-sm text-slate-500">Men&apos;s Items</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">
            {items.filter((i) => i.category === "Women").length}
          </p>
          <p className="text-sm text-slate-500">Women&apos;s Items</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {items.filter((i) => i.category === "Home").length}
          </p>
          <p className="text-sm text-slate-500">Home Items</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search items..."
            className="pl-10 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 pl-6">
                Image
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Item Name
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Category
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Service
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Price
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 text-right pr-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50">
                <TableCell className="py-4 pl-6">
                  <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-black">
                  {item.name}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getCategoryColor(item.category)} border-none`}
                  >
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600">{item.service}</TableCell>
                <TableCell className="font-bold text-[#3E8940]">
                  {item.price}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      item.active
                        ? "bg-green-100 text-green-700 border-none"
                        : "bg-slate-100 text-slate-600 border-none"
                    }
                  >
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-2">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-slate-500">
            Showing {filteredItems.length} of {items.length} items
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

