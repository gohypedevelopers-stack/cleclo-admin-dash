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
import { adminCatalogApi } from "@/lib/admin-api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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
        adminCatalogApi.getItems(),
        adminCatalogApi.getSubCategories()
      ]);
      setItems(itemsRes || []);
      setSubCategories(subsRes || []);
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
      await adminCatalogApi.deleteItem(id);
      toast.success("Item deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  const handleSubmit = async () => {
    try {
      const isEditing = !!editingItem;
      
      if (!formData.name.trim() || !formData.subCategoryId || formData.customerPrice === "") {
        toast.error("Please provide a Name, Category, and Customer Price.");
        return;
      }

      const payload = {
        ...formData,
        customerPrice: parseFloat(formData.customerPrice),
        vendorShare: parseFloat(formData.vendorShare)
      };

      if (isEditing) {
        await adminCatalogApi.updateItem(editingItem.id, payload);
      } else {
        await adminCatalogApi.createItem(payload);
      }
      
      toast.success(isEditing ? "Item updated" : "Item created");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subCategory?.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Financial computations
  const GST_RATE = 0.18;
  const computeFinancials = (item: any) => {
    const cp = Number(item.customerPrice) || 0;
    const vs = Number(item.vendorShare) || 0;
    const commission = cp - vs;
    const commissionPct = cp > 0 ? Math.round((commission / cp) * 100) : 0;
    const gst = Math.round(commission * GST_RATE);
    const netMargin = commission - gst;
    const isLoss = vs >= cp;
    return { cp, vs, commission, commissionPct, gst, netMargin, isLoss };
  };

  // Summary KPIs
  const totalCommission = items.reduce((s, i) => s + computeFinancials(i).commission, 0);
  const avgMarginPct = items.length > 0 ? Math.round(items.reduce((s, i) => s + computeFinancials(i).commissionPct, 0) / items.length) : 0;
  const lossItems = items.filter(i => computeFinancials(i).isLoss).length;
  const activeItems = items.filter(i => i.isActive).length;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl text-black font-bold tracking-tight">
            Service Catalog Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage service items, pricing and commission transparency
          </p>
        </div>
        <Button className="w-full md:w-auto gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-slate-700">{items.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Items</p>
          <p className="text-xs text-slate-500 mt-0.5">{activeItems} active</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-emerald-600">₹{totalCommission.toLocaleString("en-IN")}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Commission (per unit)</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-blue-600">{avgMarginPct}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Avg Commission Rate</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-amber-600">18%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">GST Rate</p>
          <p className="text-xs text-slate-500 mt-0.5">On platform commission</p>
        </div>
        <div className={`rounded-xl border p-4 ${lossItems > 0 ? "bg-red-50 border-red-200" : "bg-white"}`}>
          <p className={`text-2xl font-bold ${lossItems > 0 ? "text-red-600" : "text-emerald-600"}`}>{lossItems}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Margin Warnings</p>
          {lossItems > 0 && <p className="text-[10px] text-red-500 font-bold mt-0.5">⚠️ Vendor payout ≥ price</p>}
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
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 pl-6">Image</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4">Item Name</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Category</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Customer Price</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Vendor Share</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Platform Commission</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">GST (18%)</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Net Margin</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-center">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-[#4FA851] py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-48 text-center text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3E8940] mb-2" />
                  Loading Catalog...
                </TableCell>
              </TableRow>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const fin = computeFinancials(item);
                return (
                  <TableRow key={item.id} className={`hover:bg-slate-50 ${fin.isLoss ? "bg-red-50/40" : ""}`}>
                    <TableCell className="py-4 pl-6">
                      <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="object-cover h-full w-full" /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[140px]">
                      <p className="font-semibold text-black truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.subCategory?.name || ""}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-slate-100 text-slate-600 border-none text-[10px]">
                        {item.subCategory?.category?.name || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-center text-xs">
                      ₹{fin.cp}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-600">
                      ₹{fin.vs}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${fin.isLoss ? "text-red-600" : "text-[#3E8940]"}`}>₹{fin.commission}</span>
                        <span className={`text-[9px] font-bold ${fin.isLoss ? "text-red-500" : "text-slate-400"}`}>{fin.commissionPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-500">
                      ₹{fin.gst}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {fin.isLoss ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-red-600">-₹{Math.abs(fin.netMargin)}</span>
                          <span className="text-[9px] text-red-500 font-bold">⚠️ LOSS</span>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-600">₹{fin.netMargin}</span>
                      )}
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
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                  No matching items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {editingItem ? 'Edit Service Item' : 'Add New Service Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</Label>
              <Input 
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. T-Shirt (Loungewear)" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category Selection</Label>
              <Select value={formData.subCategoryId} onValueChange={v => setFormData({...formData, subCategoryId: v})}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select subcategory..." />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.category?.name} — {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cust. Price (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <Input 
                    className="h-11 pl-7 bg-slate-50 border-slate-200 focus:bg-white" 
                    type="number" 
                    value={formData.customerPrice} 
                    onChange={e => setFormData({...formData, customerPrice: e.target.value})} 
                    placeholder="0" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Share (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <Input 
                    className="h-11 pl-7 bg-slate-50 border-slate-200 focus:bg-white" 
                    type="number" 
                    value={formData.vendorShare} 
                    onChange={e => setFormData({...formData, vendorShare: e.target.value})} 
                    placeholder="0" 
                  />
                </div>
              </div>
            </div>

            {/* Live Margin Preview */}
            {(formData.customerPrice || formData.vendorShare) && (() => {
              const cp = Number(formData.customerPrice) || 0;
              const vs = Number(formData.vendorShare) || 0;
              const commission = cp - vs;
              const commPct = cp > 0 ? Math.round((commission / cp) * 100) : 0;
              const gst = Math.round(commission * 0.18);
              const net = commission - gst;
              const isLoss = vs >= cp && cp > 0;
              
              return (
                <div className={`p-4 rounded-xl border-2 transition-all ${isLoss ? "bg-red-50 border-red-200" : "bg-[#3E8940]/5 border-[#3E8940]/10"}`}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Real-time Margin Preview</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={`text-base font-bold ${isLoss ? "text-red-600" : "text-[#3E8940]"}`}>₹{commission}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Comm ({commPct}%)</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-700">₹{gst}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">GST (18%)</p>
                    </div>
                    <div>
                      <p className={`text-base font-bold ${isLoss ? "text-red-600" : "text-[#3E8940]"}`}>₹{net}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Net Margin</p>
                    </div>
                  </div>
                  {isLoss && (
                    <div className="mt-3 flex items-start gap-2 p-2 rounded bg-red-100/50">
                      <p className="text-[10px] text-red-600 font-bold leading-tight">
                        ⚠️ ALERT: Vendor payout exceeds price. This item will result in a LOSS for the platform.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-700">Active Status</Label>
                <p className="text-[10px] text-slate-500">Visible to customers if active</p>
              </div>
              <Switch 
                checked={formData.isActive} 
                onCheckedChange={c => setFormData({...formData, isActive: c})}
                className="data-[state=checked]:bg-[#3E8940]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="text-slate-500" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white font-bold px-8 shadow-lg shadow-green-200" onClick={handleSubmit}>
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
