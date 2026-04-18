"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ImageIcon,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATALOG_API = process.env.NEXT_PUBLIC_CATALOG_API_URL || "http://localhost:3000/api/admin/catalog";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

export default function MasterItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    subCategoryId: "",
    customerPrice: "",
    vendorShare: "",
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, subsRes] = await Promise.all([
        fetch(`${CATALOG_API}/items`, { headers: getAuthHeaders() }),
        fetch(`${CATALOG_API}/subcategories`, { headers: getAuthHeaders() })
      ]);
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (subsRes.ok) setSubCategories(await subsRes.json());
    } catch (err) {
      toast.error("Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: "", subCategoryId: "", customerPrice: "0", vendorShare: "0", isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      subCategoryId: item.subCategoryId,
      customerPrice: item.customerPrice.toString(),
      vendorShare: item.vendorShare.toString(),
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`${CATALOG_API}/items/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success("Item deleted");
        fetchData();
      } else throw new Error();
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  const handleSubmit = async () => {
    try {
      const isEditing = !!editingItem;
      const url = `${CATALOG_API}/items${isEditing ? `/${editingItem.id}` : ''}`;
      const method = isEditing ? 'PUT' : 'POST';
      
      if (!formData.name.trim() || !formData.subCategoryId || formData.customerPrice === "") {
        toast.error("Please provide a Name, Category, and Customer Price.");
        return;
      }

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(isEditing ? "Item updated" : "Item created");
        setIsModalOpen(false);
        fetchData();
      } else {
         const error = await res.json();
         throw new Error(error.error || "Request failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subCategory?.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Service Catalog Manager
          </h1>
          <p className="text-slate-500 mt-1">
            Manage service items and pricing
          </p>
        </div>
        <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80" onClick={handleOpenAdd}>
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
             {items.filter(i => i.subCategory?.category?.name.toLowerCase().includes("men")).length}
          </p>
          <p className="text-sm text-slate-500">Men&apos;s Items</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">
             {items.filter(i => i.subCategory?.category?.name.toLowerCase().includes("women")).length}
          </p>
          <p className="text-sm text-slate-500">Women&apos;s Items</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
             {items.filter(i => i.subCategory?.category?.name.toLowerCase().includes("home")).length}
          </p>
          <p className="text-sm text-slate-500">Home Items</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search matching items or categories..."
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
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 pl-6">Image</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4">Item Name</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Category</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4">SubCategory</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Cust. Price</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Vendor</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Margin</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-48 text-center text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3E8940] mb-2" />
                  Loading Catalog...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
                <TableRow>
                <TableCell colSpan={9} className="h-48 text-center text-slate-500">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
                filteredItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50">
                <TableCell className="py-4 pl-6">
                  <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="object-cover h-full w-full" /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-black truncate max-w-[120px]">
                  {item.name}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-slate-100 text-slate-600 border-none text-[10px]">
                    {item.subCategory?.category?.name || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 text-xs">{item.subCategory?.name || "N/A"}</TableCell>
                <TableCell className="font-bold text-[#3E8940] text-center text-xs">
                  ₹{item.customerPrice}
                </TableCell>
                <TableCell className="text-center text-xs text-slate-600">
                  ₹{item.vendorShare}
                </TableCell>
                <TableCell className="text-center font-bold text-[#3E8940] text-xs">
                  ₹{(item.customerPrice - item.vendorShare).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      item.isActive
                        ? "bg-green-100 text-green-700 border-none text-[10px]"
                        : "bg-slate-100 text-slate-600 border-none text-[10px]"
                    }
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700" onClick={() => handleOpenEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input className="col-span-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Silk Saree" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Category</Label>
              <Select value={formData.subCategoryId} onValueChange={v => setFormData({...formData, subCategoryId: v})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select subcategory..." />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.category?.name} - {sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Cust. Price</Label>
              <Input className="col-span-3" type="number" value={formData.customerPrice} onChange={e => setFormData({...formData, customerPrice: e.target.value})} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Vendor Share</Label>
              <Input className="col-span-3" type="number" value={formData.vendorShare} onChange={e => setFormData({...formData, vendorShare: e.target.value})} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Active Status</Label>
              <div className="col-span-3 flex items-center">
                 <Switch checked={formData.isActive} onCheckedChange={c => setFormData({...formData, isActive: c})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white" onClick={handleSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
