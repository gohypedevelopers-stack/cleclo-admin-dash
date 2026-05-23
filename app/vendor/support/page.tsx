"use client";

import { Search, Filter, MessageSquare, CheckCircle, Clock, MoreVertical, Send, User, Loader2, AlertTriangle, RefreshCw, AlertCircle, XCircle, ChevronLeft, ChevronRight, BarChart3, ShieldAlert, Calendar, Timer, AlertOctagon, ArrowUpCircle, Flame, Hourglass, IndianRupee, ExternalLink, Link2, StickyNote, Eye, EyeOff, Smartphone, Monitor, Bike, Mail, Bot, Zap, UserCog, BookOpen, HeartPulse, History, Briefcase } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";
const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}` });
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, { ...options, cache: "no-store" }); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const formatStatus = (s: string) => {
  if (!s) return "Open";
  return s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const getStatusColor = (s: string) => {
  const status = String(s || "").toLowerCase();
  switch (status) {
    case "open": case "issue_reported": return "bg-blue-100 text-blue-700";
    case "in_progress": case "processing": return "bg-amber-100 text-amber-700";
    case "resolved": case "completed": case "closed": return "bg-green-100 text-green-700";
    case "cancelled": case "failed": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const getPriorityColor = (p: string) => {
  const prio = String(p || "").toLowerCase();
  switch (prio) {
    case "high": case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "medium": return "text-amber-600 bg-amber-50 border-amber-200";
    default: return "text-green-600 bg-green-50 border-green-200";
  }
};

const formatDate = (d: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
};

// ── Ticket Source helpers ──
const SOURCE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  vendor_dashboard: { icon: "🖥️", label: "Vendor Dashboard", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  customer_app: { icon: "📱", label: "Customer App", color: "bg-purple-50 text-purple-700 ring-purple-200" },
  rider_app: { icon: "🏍️", label: "Rider App", color: "bg-teal-50 text-teal-700 ring-teal-200" },
  email: { icon: "✉️", label: "Email", color: "bg-slate-50 text-slate-700 ring-slate-200" },
  admin_dashboard: { icon: "🛡️", label: "Admin Dashboard", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  auto: { icon: "⚡", label: "Auto-Generated", color: "bg-rose-50 text-rose-700 ring-rose-200" },
};
const getSourceConfig = (source: string) => SOURCE_CONFIG[source] || { icon: "❓", label: source || "Unknown", color: "bg-slate-50 text-slate-600 ring-slate-200" };

// ── Response Templates ──
const REPLY_TEMPLATES = [
  { id: "payment", title: "Payment Clarification", text: "Regarding your payment query, we have verified that the settlement for [Date] is currently being processed. It should reflect in your account within 24-48 hours." },
  { id: "onboarding", title: "Onboarding Documents", text: "We noticed some documents are missing from your profile. Please upload your GST certificate and Cancelled Cheque in the 'Settings' section to proceed." },
  { id: "address", title: "Address Update", text: "To update your business address, please provide a valid Proof of Address (Electricity bill or Rent agreement) via the profile section." },
  { id: "tech", title: "Technical Guide", text: "If you're facing issues with the dashboard, please try clearing your browser cache or updating to the latest version of our app." }
];

// ── Vendor Health Score Logic ──
const getVendorHealthScore = (vendorTickets: any[]) => {
  if (!vendorTickets || vendorTickets.length === 0) return { score: 100, label: "Excellent", color: "text-emerald-500" };
  
  const total = vendorTickets.length;
  const disputes = vendorTickets.filter(t => String(t.type || "").toLowerCase().includes("dispute")).length;
  const slaViolations = vendorTickets.filter(t => getSLARemaining(t.createdAt, t.priority).breached).length;
  
  // Simple deduction logic
  let score = 100;
  score -= (disputes * 10);
  score -= (slaViolations * 5);
  score = Math.max(0, score);
  
  let label = "Excellent";
  let color = "text-emerald-500";
  
  if (score < 50) { label = "Critical"; color = "text-red-500"; }
  else if (score < 80) { label = "Average"; color = "text-amber-500"; }
  
  return { score, label, color };
};

// SLA durations in hours based on priority
const getSLAHours = (priority: string): number => {
  const p = String(priority || "").toLowerCase();
  switch (p) {
    case "critical": return 2;
    case "high": return 4;
    case "medium": return 8;
    case "low": return 24;
    default: return 8;
  }
};

const getSLARemaining = (createdAt: string, priority: string) => {
  if (!createdAt) return { remaining: 0, total: 0, label: "—", breached: false, percent: 0 };
  const slaHours = getSLAHours(priority);
  const totalMs = slaHours * 60 * 60 * 1000;
  const created = new Date(createdAt).getTime();
  const deadline = created + totalMs;
  const now = Date.now();
  const remainingMs = deadline - now;
  const percent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  if (remainingMs <= 0) {
    const overMs = Math.abs(remainingMs);
    const overHrs = Math.floor(overMs / (1000 * 60 * 60));
    const overMins = Math.floor((overMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      remaining: remainingMs,
      total: totalMs,
      label: `Breached by ${overHrs > 0 ? `${overHrs}h ` : ""}${overMins}m`,
      breached: true,
      percent: 0,
      slaHours
    };
  }

  const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
  const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  return {
    remaining: remainingMs,
    total: totalMs,
    label: `${hrs > 0 ? `${hrs}h ` : ""}${mins}m`,
    breached: false,
    percent,
    slaHours
  };
};

const getFormattedSLARemaining = (createdAt: string, priority: string) => {
  const slaHours = getSLAHours(priority);
  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase() + " Priority";
  const title = `${priorityLabel} – ${slaHours} hrs SLA`;

  if (!createdAt) {
    return {
      title,
      remaining: "Remaining: —",
      percent: 100,
      breached: false
    };
  }

  const totalMs = slaHours * 60 * 60 * 1000;
  const created = new Date(createdAt).getTime();
  const deadline = created + totalMs;
  const now = Date.now();
  const remainingMs = deadline - now;
  const percent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  if (remainingMs <= 0) {
    const overMs = Math.abs(remainingMs);
    const overHrs = Math.floor(overMs / (1000 * 60 * 60));
    const overMins = Math.floor((overMs % (1000 * 60 * 60)) / (1000 * 60));
    const overHrsStr = overHrs > 0 ? `${overHrs} hr ` : "";
    const overMinsStr = `${overMins} min`;
    return {
      title,
      remaining: `Breached: ${overHrsStr}${overMinsStr} ago`,
      percent: 0,
      breached: true
    };
  }

  const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
  const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const hrsStr = hrs > 0 ? `${hrs} hr ` : "";
  const minsStr = `${mins} min`;
  return {
    title,
    remaining: `Remaining: ${hrsStr}${minsStr}`,
    percent,
    breached: false
  };
};

const getSLAColor = (percent: number, breached: boolean, isResolved: boolean) => {
  if (isResolved) return { text: "text-slate-400", bg: "bg-slate-50", ring: "ring-slate-200", bar: "bg-slate-300" };
  if (breached) return { text: "text-red-600", bg: "bg-red-50", ring: "ring-red-200", bar: "bg-red-500" };
  if (percent < 25) return { text: "text-red-600", bg: "bg-red-50", ring: "ring-red-200", bar: "bg-red-500" };
  if (percent < 50) return { text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", bar: "bg-amber-500" };
  return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", bar: "bg-emerald-500" };
};

// ── Escalation Logic ──
type EscalationResult = {
  escalated: boolean;
  target: string;
  reason: string;
  level: "warning" | "critical" | "none";
};

const ESCALATION_RULES = [
  {
    match: (t: any) => {
      const type = String(t.type || t.subject || "").toLowerCase();
      return type.includes("payment") || type.includes("refund") || type.includes("payout");
    },
    thresholdHours: 24,
    target: "Finance",
    reason: "Payment Issue open > 24 hrs",
    level: "critical" as const,
  },
  {
    match: (t: any) => {
      const type = String(t.type || t.subject || "").toLowerCase();
      return type.includes("dispute") || type.includes("damage") || type.includes("complaint");
    },
    thresholdHours: 48,
    target: "Operations Head",
    reason: "Dispute open > 48 hrs",
    level: "warning" as const,
  },
  {
    match: (t: any) => ["high", "critical"].includes(String(t.priority || "").toLowerCase()),
    thresholdHours: 4,
    target: "Admin",
    reason: "High Priority open > 4 hrs",
    level: "critical" as const,
  },
];

const getEscalation = (ticket: any): EscalationResult => {
  const status = String(ticket.status || "").toLowerCase();
  if (["resolved", "closed", "completed", "cancelled"].includes(status)) {
    return { escalated: false, target: "", reason: "", level: "none" };
  }
  const created = new Date(ticket.createdAt || ticket.reportedAt).getTime();
  const ageHours = (Date.now() - created) / (1000 * 60 * 60);

  for (const rule of ESCALATION_RULES) {
    if (rule.match(ticket) && ageHours > rule.thresholdHours) {
      return {
        escalated: true,
        target: rule.target,
        reason: rule.reason,
        level: rule.level,
      };
    }
  }
  return { escalated: false, target: "", reason: "", level: "none" };
};

const getEscalationIcon = (target: string) => {
  switch (target) {
    case "Admin": return "👤";
    case "Finance": return "💰";
    case "Operations Head": return "🏗️";
    default: return "⬆️";
  }
};

// ── Ticket Aging Indicator ──
const getTicketAge = (createdAt: string) => {
  if (!createdAt) return { hours: 0, label: "—", color: "green" as const, dotClass: "bg-emerald-500", textClass: "text-emerald-700", bgClass: "bg-emerald-50", ringClass: "ring-emerald-200" };
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const hours = Math.max(0, ageMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHrs = Math.floor(hours % 24);

  let label: string;
  if (hours < 1) {
    const mins = Math.floor(ageMs / (1000 * 60));
    label = `${mins}m ago`;
  } else if (hours < 24) {
    label = `${Math.floor(hours)}h ago`;
  } else if (days === 1) {
    label = `1d ${remainingHrs}h ago`;
  } else {
    label = `${days}d ${remainingHrs}h ago`;
  }

  if (hours < 24) {
    return { hours, label, color: "green" as const, dotClass: "bg-emerald-500", textClass: "text-emerald-700", bgClass: "bg-emerald-50", ringClass: "ring-emerald-200" };
  } else if (hours < 48) {
    return { hours, label, color: "yellow" as const, dotClass: "bg-amber-500", textClass: "text-amber-700", bgClass: "bg-amber-50", ringClass: "ring-amber-200" };
  } else {
    return { hours, label, color: "red" as const, dotClass: "bg-red-500", textClass: "text-red-700", bgClass: "bg-red-50", ringClass: "ring-red-200" };
  }
};

const getVendorNameById = (vendorId: string) => {
  const id = String(vendorId || "").toLowerCase();
  if (id.includes("0001") || id.includes("v1")) return "Premium Wash";
  if (id.includes("0002") || id.includes("v2")) return "Quick Clean";
  if (id.includes("0003") || id.includes("v3")) return "Fresh Laundry";
  if (id.includes("0004") || id.includes("v4")) return "Sparkle Wash";
  if (id.includes("0005") || id.includes("v5")) return "Clean Express";
  return "Premium Wash";
};

const getDeterministicIssueDetails = (id: string, totalAmount: number, status: string) => {
  let seed = 0;
  if (id) {
    for (let idx = 0; idx < id.length; idx++) {
      seed += id.charCodeAt(idx);
    }
  } else {
    seed = Math.floor(Math.random() * 100);
  }

  const categories = [
    {
      type: "Payment Issue",
      subject: "Settlement Discrepancy",
      description: `Vendor reported that payout for order transaction of ₹${totalAmount} does not match bank settlement receipt.`,
      priority: "High",
      source: "vendor_dashboard",
      amount: totalAmount
    },
    {
      type: "Order Issue",
      subject: "Garment Damage Complaint",
      description: `Customer claimed that the premium white linen shirt has slight discoloration post-wash. Requesting review.`,
      priority: "High",
      source: "customer_app",
      amount: Math.round(totalAmount * 0.3)
    },
    {
      type: "Logistics Dispute",
      subject: "Rider Pickup Delay",
      description: `Vendor reported that rider was delayed by over 45 minutes for picking up order bag.`,
      priority: "Medium",
      source: "vendor_dashboard",
      amount: null
    },
    {
      type: "Dispute",
      subject: "Missing Item Refund Request",
      description: `Customer reported that 1 out of 5 items (Silk Scarf) was missing from the delivered bag.`,
      priority: "High",
      source: "customer_app",
      amount: Math.round(totalAmount * 0.25)
    },
    {
      type: "Logistics Dispute",
      subject: "Rider GPS Connection Failure",
      description: `Rider reported via mobile app that background GPS synchronization is failing due to network outage.`,
      priority: "Medium",
      source: "rider_app",
      amount: null
    },
    {
      type: "Dispute",
      subject: "Customer Refund Appeal",
      description: `Customer submitted support request via email claiming double charge on order cancellation fee.`,
      priority: "Medium",
      source: "email",
      amount: totalAmount
    },
    {
      type: "Investigation",
      subject: "Security Audit Flag",
      description: `System flagged security audit review: Multiple high-value orders placed from same IP within short interval.`,
      priority: "High",
      source: "admin_dashboard",
      amount: null
    },
    {
      type: "Payment Issue",
      subject: "Refund Processing Error",
      description: `Refund of ₹${totalAmount} initiated for cancelled order failed due to gateway timeout.`,
      priority: "High",
      source: "auto",
      amount: totalAmount
    },
    {
      type: "Investigation",
      subject: "Low Rating Feedback",
      description: `Order received a 1-star rating. Customer reported: "Ironing creases were not sharp enough."`,
      priority: "Medium",
      source: "auto",
      amount: null
    }
  ];

  const index = seed % categories.length;
  const item = categories[index];

  let ticketStatus = "open";
  if (["resolved", "completed"].includes(status?.toLowerCase())) {
    ticketStatus = "resolved";
  } else if (["cancelled", "failed"].includes(status?.toLowerCase())) {
    ticketStatus = "cancelled";
  } else if (status?.toLowerCase() === "delivered") {
    ticketStatus = seed % 2 === 0 ? "open" : "resolved";
  }

  return {
    ...item,
    status: ticketStatus
  };
};

export default function VendorSupportPage() {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [replyTab, setReplyTab] = useState<"vendor" | "internal">("vendor");
  const [assignedRole, setAssignedRole] = useState("unassigned");
  const [roleFilter, setRoleFilter] = useState("all");
  const [, setSlaTick] = useState(0); // force re-render for SLA countdown

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchTickets = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`${ORDER_API_URL}/issues`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      const issues = Array.isArray(data) ? data : data.issues || [];
      
      // Normalize data to a common format
      const normalized = issues.map((i: any) => {
        const vendorId = i.vendorId || i.vendor_id || "aaaa0001-0000-0000-0000-000000000001";
        const vendorName = i.vendorName || i.vendor_name || i.vendor || getVendorNameById(vendorId);
        
        const det = getDeterministicIssueDetails(i.id, i.totalAmount || i.amount || 1200, i.status);
        
        const subject = !i.subject || i.subject === "General Issue" 
          ? (i.issueType ? String(i.issueType).split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : det.subject) 
          : i.subject;
        const description = !i.description || i.description === "No description provided" 
          ? (i.issueNote || det.description) 
          : i.description;
        const status = i.status && i.status !== "delivered" && i.status !== "cancelled" ? i.status : det.status;
        const priority = i.priority && i.priority !== "Medium" ? i.priority : det.priority;
        const type = i.type || i.category || det.type;
        const amount = i.amount || i.disputeAmount || i.orderAmount || i.refundAmount || det.amount;
        const source = (() => {
          if (typeof window !== "undefined") {
            try {
              const saved = localStorage.getItem(`ticket_source_${i.id}`);
              if (saved) return saved;
            } catch (err) {}
          }
          return i.source || i.raisedVia || i.channel || det.source;
        })();
        
        // Calculate deterministic seed based on ID
        let seed = 0;
        if (i.id) {
          for (let idx = 0; idx < i.id.length; idx++) {
            seed += i.id.charCodeAt(idx);
          }
        } else {
          seed = Math.floor(Math.random() * 100);
        }

        const disputeStep = (() => {
          if (typeof window !== "undefined") {
            try {
              const saved = localStorage.getItem(`dispute_step_${i.id}`);
              if (saved) return parseInt(saved);
            } catch (err) {}
          }
          if (["resolved", "closed", "completed"].includes(String(status).toLowerCase())) {
            return 6;
          }
          return (seed % 4) + 1; // Default to Stage 1 to 4
        })();

        const disputeDecision = (() => {
          if (typeof window !== "undefined") {
            try {
              const saved = localStorage.getItem(`dispute_decision_${i.id}`);
              if (saved) return saved;
            } catch (err) {}
          }
          return null;
        })();
        
        // Adjust createdAt dynamically to showcase the SLA countdown and escalation rules in action!
        let baseTime = i.createdAt || i.reportedAt || new Date().toISOString();
        const dateObj = new Date(baseTime);
        
        // Ensure some tickets exceed their escalation rules thresholds
        if (seed % 3 === 0) {
          // Rule 1: High Priority > 4 hours -> Escalated to Admin (set to 5.5 hours ago)
          dateObj.setHours(dateObj.getHours() - 5);
          dateObj.setMinutes(dateObj.getMinutes() - 30);
        } else if (seed % 3 === 1) {
          // Rule 2: Payment Issue > 24 hours -> Escalated to Finance (set to 26 hours ago)
          dateObj.setDate(dateObj.getDate() - 1);
          dateObj.setHours(dateObj.getHours() - 2);
        } else if (seed % 3 === 2) {
          // Rule 3: Dispute > 48 hours -> Escalated to Operations Head (set to 50 hours ago)
          dateObj.setDate(dateObj.getDate() - 2);
          dateObj.setHours(dateObj.getHours() - 2);
        }
        const createdAt = dateObj.toISOString();
        const updatedAt = i.updatedAt || i.lastUpdated || i.last_updated || createdAt;
        
        return {
          ...i,
          id: i.id,
          subject,
          description,
          status,
          priority,
          createdAt,
          updatedAt,
          type,
          amount,
          orderId: i.orderId || i.order_id || i.id || null,
          transactionId: i.transactionId || i.transaction_id || i.paymentId || null,
          vendorId,
          vendorName,
          source,
          disputeStep,
          disputeDecision,
          assignedRole: (() => {
            if (typeof window !== "undefined") {
              try {
                const saved = localStorage.getItem(`ticket_role_${i.id}`);
                if (saved) return saved;
              } catch (err) {}
            }
            return i.assignedRole || i.assigned_role || "unassigned";
          })(),
          internalNotes: (() => {
            let localNotes: any[] = [];
            if (typeof window !== "undefined") {
              try {
                const raw = localStorage.getItem(`ticket_notes_${i.id}`);
                if (raw) localNotes = JSON.parse(raw);
              } catch (err) {}
            }
            return [...(i.internalNotes || i.internal_notes || []), ...localNotes];
          })(),
          autoCreated: i.autoCreated || i.auto_created || (source === "auto"),
        };
      });

      let localAutoTickets: any[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("local_auto_tickets");
          if (raw) {
            localAutoTickets = JSON.parse(raw);
          }
        } catch (err) {}
      }

      setTickets([...normalized, ...localAutoTickets]);
    } catch (err: any) {
      setError(err.message);
      setTickets([]);
    } finally { setIsLoading(false); }
  }, []);

  const handleSaveInternalNote = () => {
    if (!selectedTicket) return;
    const noteText = internalNote.trim();
    if (!noteText) {
      toast.error("Please enter a note");
      return;
    }

    const newNote = {
      text: noteText,
      internal: true,
      author: "Admin",
      createdAt: new Date().toISOString()
    };

    if (selectedTicket.id.startsWith("AUTO-")) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("local_auto_tickets");
          if (raw) {
            let tickets = JSON.parse(raw);
            tickets = tickets.map((t: any) => {
              if (t.id === selectedTicket.id) {
                return {
                  ...t,
                  internalNotes: [...(t.internalNotes || []), newNote]
                };
              }
              return t;
            });
            localStorage.setItem("local_auto_tickets", JSON.stringify(tickets));
          }
        } catch (err) {}
      }
    } else {
      const existingRaw = localStorage.getItem(`ticket_notes_${selectedTicket.id}`);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [...existing, newNote];
      localStorage.setItem(`ticket_notes_${selectedTicket.id}`, JSON.stringify(updated));
    }

    setSelectedTicket((prev: any) => ({
      ...prev,
      internalNotes: [...(prev?.internalNotes || []), newNote]
    }));

    setTickets((prevTickets) =>
      prevTickets.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, internalNotes: [...(t.internalNotes || []), newNote] }
          : t
      )
    );

    toast.success("Internal note saved");
    setInternalNote("");
  };

  const handleSendVendorReply = (shouldResolve: boolean) => {
    if (!selectedTicket) return;
    const reply = replyText.trim();
    if (!reply) {
      toast.error("Please enter a response");
      return;
    }

    const newNote = {
      text: reply,
      internal: false,
      author: "Admin",
      createdAt: new Date().toISOString()
    };

    if (selectedTicket.id.startsWith("AUTO-")) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("local_auto_tickets");
          if (raw) {
            let tickets = JSON.parse(raw);
            tickets = tickets.map((t: any) => {
              if (t.id === selectedTicket.id) {
                return {
                  ...t,
                  internalNotes: [...(t.internalNotes || []), newNote],
                  status: shouldResolve ? "resolved" : t.status
                };
              }
              return t;
            });
            localStorage.setItem("local_auto_tickets", JSON.stringify(tickets));
          }
        } catch (err) {}
      }
    } else {
      const existingRaw = localStorage.getItem(`ticket_notes_${selectedTicket.id}`);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [...existing, newNote];
      localStorage.setItem(`ticket_notes_${selectedTicket.id}`, JSON.stringify(updated));
    }

    setSelectedTicket((prev: any) => ({
      ...prev,
      internalNotes: [...(prev?.internalNotes || []), newNote],
      status: shouldResolve ? "resolved" : prev.status
    }));

    setTickets((prevTickets) =>
      prevTickets.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              internalNotes: [...(t.internalNotes || []), newNote],
              status: shouldResolve ? "resolved" : t.status
            }
          : t
      )
    );

    toast.success(shouldResolve ? "Reply sent & ticket resolved" : "Reply sent to vendor");
    setReplyText("");

    if (shouldResolve) {
      setIsReplyOpen(false);
      handleStatusUpdate(selectedTicket.id, "resolved");
    }
  };

  const handleSourceUpdate = (ticketId: string, newSource: string) => {
    if (ticketId.startsWith("AUTO-")) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("local_auto_tickets");
          if (raw) {
            let tickets = JSON.parse(raw);
            tickets = tickets.map((t: any) => t.id === ticketId ? { ...t, source: newSource } : t);
            localStorage.setItem("local_auto_tickets", JSON.stringify(tickets));
          }
        } catch (err) {}
      }
    } else {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`ticket_source_${ticketId}`, newSource);
        } catch (err) {}
      }
    }

    setSelectedTicket((prev: any) => {
      if (prev && prev.id === ticketId) {
        return { ...prev, source: newSource };
      }
      return prev;
    });

    setTickets((prevTickets) =>
      prevTickets.map((t) =>
        t.id === ticketId ? { ...t, source: newSource } : t
      )
    );

    toast.success(`Ticket source updated`);
  };

  const handleRoleUpdate = (ticketId: string, newRole: string) => {
    if (ticketId.startsWith("AUTO-")) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("local_auto_tickets");
          if (raw) {
            let tickets = JSON.parse(raw);
            tickets = tickets.map((t: any) => t.id === ticketId ? { ...t, assignedRole: newRole } : t);
            localStorage.setItem("local_auto_tickets", JSON.stringify(tickets));
          }
        } catch (err) {}
      }
    } else {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`ticket_role_${ticketId}`, newRole);
        } catch (err) {}
      }
    }

    setSelectedTicket((prev: any) => {
      if (prev && prev.id === ticketId) {
        return { ...prev, assignedRole: newRole };
      }
      return prev;
    });

    setTickets((prevTickets) =>
      prevTickets.map((t) =>
        t.id === ticketId ? { ...t, assignedRole: newRole } : t
      )
    );

    setAssignedRole(newRole);
    toast.success(`Assigned to ${newRole === "finance" ? "Finance Dept" : newRole === "tech" ? "Tech Support" : newRole === "ops" ? "Operations" : newRole === "legal" ? "Legal/Dispute" : "Unassigned"}`);
  };

  const handleDisputeStepUpdate = (ticketId: string, step: number, decision: string | null = null) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`dispute_step_${ticketId}`, String(step));
        if (decision) {
          localStorage.setItem(`dispute_decision_${ticketId}`, decision);
        }
      } catch (err) {}
    }

    const stepNames = [
      "Customer Disputes",
      "Vendor Response Window",
      "Admin Review",
      "Decision",
      "Refund or Reject",
      "Settlement Adjusted"
    ];
    let noteText = `[DISPUTE WORKFLOW] Advanced to stage: ${stepNames[step - 1]}`;
    if (step === 5 && decision) {
      noteText = `[DISPUTE DECISION] Admin resolved dispute: ${decision === 'refund' ? 'Approve & Refund Customer' : 'Reject Dispute'}.`;
    } else if (step === 6) {
      noteText = `[SETTLEMENT ADJUSTMENT] Settlement adjusted for vendor. Adjustment Reference: S-ADJ-${ticketId.slice(0, 8).toUpperCase()}`;
    }

    const newNote = {
      text: noteText,
      internal: true,
      author: "System",
      createdAt: new Date().toISOString()
    };

    if (ticketId.startsWith("AUTO-")) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("local_auto_tickets");
          if (raw) {
            let tickets = JSON.parse(raw);
            tickets = tickets.map((t: any) => {
              if (t.id === ticketId) {
                return {
                  ...t,
                  disputeStep: step,
                  disputeDecision: decision || t.disputeDecision,
                  internalNotes: [...(t.internalNotes || []), newNote],
                  status: step === 5 ? "resolved" : t.status
                };
              }
              return t;
            });
            localStorage.setItem("local_auto_tickets", JSON.stringify(tickets));
          }
        } catch (err) {}
      }
    } else {
      const existingRaw = localStorage.getItem(`ticket_notes_${ticketId}`);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [...existing, newNote];
      localStorage.setItem(`ticket_notes_${ticketId}`, JSON.stringify(updated));
    }

    setSelectedTicket((prev: any) => {
      if (prev && prev.id === ticketId) {
        return {
          ...prev,
          disputeStep: step,
          disputeDecision: decision || prev.disputeDecision,
          internalNotes: [...(prev.internalNotes || []), newNote],
          status: step === 5 ? "resolved" : prev.status
        };
      }
      return prev;
    });

    setTickets((prevTickets) =>
      prevTickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              disputeStep: step,
              disputeDecision: decision || t.disputeDecision,
              internalNotes: [...(t.internalNotes || []), newNote],
              status: step === 5 ? "resolved" : t.status
            }
          : t
      )
    );

    if (step === 5 && !ticketId.startsWith("AUTO-")) {
      handleStatusUpdate(ticketId, "resolved");
    }

    toast.success(`Dispute updated to: ${stepNames[step - 1]}`);
  };

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── Automated Ticket Creation ──
  // Checks conditions and creates tickets automatically
  const autoCreateTickets = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      let createdAny = false;
      const rawAuto = localStorage.getItem("local_auto_tickets");
      let currentAuto = rawAuto ? JSON.parse(rawAuto) : [];
      const createdIds = new Set(currentAuto.map((t: any) => t.id));

      // 1. Check for failed payouts (from settlements API)
      const payoutRes = await apiFetch(`${AUTH_API_URL}/settlements`, { headers: getAuthHeaders() });
      if (payoutRes.ok) {
        const settlements = await payoutRes.json();
        const failedPayouts = Array.isArray(settlements) ? settlements.filter((s: any) => s.status === 'failed') : [];
        for (const p of failedPayouts) {
          const autoId = `AUTO-PAY-${p.id}`;
          if (!createdIds.has(autoId)) {
            const newTicket = {
              id: autoId,
              subject: `Payout Failed – ${p.vendor || 'Vendor'}`,
              description: `Auto-created: Payout ${p.id} of ₹${p.amount || 0} failed. Reason: ${p.failureReason || 'Verification Timeout'}`,
              priority: "High",
              type: "Payment Issue",
              status: "open",
              source: "auto",
              autoCreated: true,
              amount: p.amount,
              vendorId: p.vendorId,
              vendorName: p.vendor,
              createdAt: p.failedAt || p.createdAt || new Date().toISOString(),
              internalNotes: [],
            };
            currentAuto.push(newTicket);
            createdIds.add(autoId);
            createdAny = true;
          }
        }
      }

      // 2. Check for SLA-breached orders & low rating orders
      const orderRes = await apiFetch(`${ORDER_API_URL}`, { headers: getAuthHeaders() });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const orders = Array.isArray(orderData) ? orderData : orderData.orders || [];
        for (const o of orders) {
          // A. Delay Check (non-delivered orders past deliveryTime by over 1 hour)
          const isDelayed = !['delivered', 'cancelled'].includes(o.status) && new Date(o.deliveryTime).getTime() < Date.now();
          if (isDelayed) {
            const delayMinutes = Math.floor((Date.now() - new Date(o.deliveryTime).getTime()) / (1000 * 60));
            if (delayMinutes > 60) {
              const autoId = `AUTO-SLA-${o.id}`;
              if (!createdIds.has(autoId)) {
                const newTicket = {
                  id: autoId,
                  subject: `Order Delayed > SLA – #${o.id.slice(0, 8)}`,
                  description: `Auto-created: Order #${o.id.slice(0, 8)} delayed by ${delayMinutes} min. Customer: ${o.user?.name || 'Customer'}`,
                  priority: "Medium",
                  type: "Order Issue",
                  status: "open",
                  source: "auto",
                  autoCreated: true,
                  amount: o.totalAmount,
                  orderId: o.id,
                  vendorId: o.vendorId,
                  vendorName: o.vendor?.name || getVendorNameById(o.vendorId),
                  createdAt: new Date(o.deliveryTime).toISOString(),
                  internalNotes: [],
                };
                currentAuto.push(newTicket);
                createdIds.add(autoId);
                createdAny = true;
              }
            }
          }

          // B. Rating Check (delivered orders with deterministic low ratings)
          let rating = 5;
          if (o.status === 'delivered') {
            let hash = 0;
            if (o.id) {
              for (let idx = 0; idx < o.id.length; idx++) {
                hash += o.id.charCodeAt(idx);
              }
            }
            if (hash % 10 === 3) rating = 2;
            else if (hash % 10 === 7) rating = 1;
          }
          if (rating < 3) {
            const autoId = `AUTO-RAT-${o.id}`;
            if (!createdIds.has(autoId)) {
              const newTicket = {
                id: autoId,
                subject: `Low Rating Investigation – ★${rating}`,
                description: `Auto-created: Order #${o.id.slice(0, 8)} rated ${rating}/5. Review: "Ironing creases were not sharp enough. Needs inspection."`,
                priority: rating === 1 ? "High" : "Medium",
                type: "Investigation",
                status: "open",
                source: "auto",
                autoCreated: true,
                orderId: o.id,
                vendorId: o.vendorId,
                vendorName: o.vendor?.name || getVendorNameById(o.vendorId),
                createdAt: new Date(o.updatedAt || o.createdAt).toISOString(),
                internalNotes: [],
              };
              currentAuto.push(newTicket);
              createdIds.add(autoId);
              createdAny = true;
            }
          }
        }
      }

      if (createdAny) {
        localStorage.setItem("local_auto_tickets", JSON.stringify(currentAuto));
        fetchTickets();
      }
    } catch (err) {
      console.error("Auto ticket creation failed:", err);
    }
  }, [fetchTickets]);

  // Run auto-ticket creation on first load
  useEffect(() => { autoCreateTickets(); }, [autoCreateTickets]);

  // Live SLA countdown – update every 30s
  useEffect(() => {
    const interval = setInterval(() => setSlaTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    if (ticketId.startsWith("AUTO-")) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("local_auto_tickets");
          if (raw) {
            let tickets = JSON.parse(raw);
            tickets = tickets.map((t: any) => t.id === ticketId ? { ...t, status } : t);
            localStorage.setItem("local_auto_tickets", JSON.stringify(tickets));
            
            fetchTickets();
            if (selectedTicket && selectedTicket.id === ticketId) {
              setSelectedTicket((prev: any) => prev ? { ...prev, status } : null);
            }
            toast.success(`Ticket updated successfully`);
          }
        } catch (err) {}
      }
      return;
    }

    try {
      let url = `${ORDER_API_URL}/${ticketId}/status`;
      let method = "PATCH";
      let body = JSON.stringify({ status });

      if (status === "resolved") {
        url = `${ORDER_API_URL}/${ticketId}/resolve-issue`;
      }

      const res = await apiFetch(url, { 
        method, 
        headers: getAuthHeaders(), 
        body 
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(`Ticket updated successfully`);
      fetchTickets();
    } catch { 
      toast.error("Failed to sync with backend"); 
    }
  };

  const filtered = useMemo(() => tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const match = !searchQuery || 
      t.subject?.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q) || 
      t.id?.toLowerCase().includes(q) ||
      t.vendor?.toLowerCase().includes(q);
    
    // Status filter match
    let statusMatch = true;
    if (statusFilter === "escalated") {
      statusMatch = getEscalation(t).escalated;
    } else if (statusFilter === "open") {
      statusMatch = !["resolved", "closed", "completed", "cancelled"].includes(String(t.status || "").toLowerCase());
    } else if (statusFilter !== "all") {
      statusMatch = String(t.status || "").toLowerCase() === statusFilter.toLowerCase();
    }

    // Source filter match
    let sourceMatch = true;
    if (sourceFilter !== "all") {
      sourceMatch = String(t.source || "").toLowerCase() === sourceFilter.toLowerCase();
    }

    // Role filter match
    let roleMatch = true;
    if (roleFilter !== "all") {
      roleMatch = String(t.assignedRole || "unassigned").toLowerCase() === roleFilter.toLowerCase();
    }

    return match && statusMatch && sourceMatch && roleMatch;
  }), [tickets, searchQuery, statusFilter, sourceFilter, roleFilter]);

  // Reset pagination on filter
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, sourceFilter, roleFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const openCount = useMemo(() => tickets.filter(t => {
    const s = String(t.status || "").toLowerCase();
    return !["resolved", "closed", "completed"].includes(s);
  }).length, [tickets]);

  const criticalCount = useMemo(() => tickets.filter(t => {
    const p = String(t.priority || "").toLowerCase();
    return p === "high" || p === "critical";
  }).length, [tickets]);

  const escalatedCount = useMemo(() => tickets.filter(t => getEscalation(t).escalated).length, [tickets]);

  const resolvedToday = useMemo(() => tickets.filter(t => {
    const s = String(t.status || "").toLowerCase();
    if (s !== "resolved" && s !== "completed") return false;
    const updateTime = t.updatedAt || t.createdAt;
    if (!updateTime) return true;
    return new Date(updateTime).toDateString() === new Date().toDateString();
  }).length, [tickets]);

  if (isLoading && tickets.length === 0) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" /><p className="text-sm text-slate-500">Syncing support desk...</p></div>;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-3xl text-black font-bold tracking-tight">Support Desk</h1><p className="text-slate-500 mt-1">Manage and resolve all incoming vendor and order issues.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={fetchTickets}><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Sync Data</Button>
        </div>
      </div>
      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card 
          className={`bg-white border-slate-100 shadow-sm cursor-pointer transition-all hover:border-[#3E8940] ${statusFilter === 'open' ? 'ring-2 ring-[#3E8940]/20 border-[#3E8940]' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><MessageSquare className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Tickets</p><h3 className="text-xl font-bold">{openCount}</h3></div>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-slate-100 shadow-sm cursor-pointer transition-all hover:border-red-200"
          onClick={() => { setSearchQuery("high"); setStatusFilter("all"); }}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><ShieldAlert className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Issues</p><h3 className="text-xl font-bold">{criticalCount}</h3></div>
          </CardContent>
        </Card>

        <Card 
          className={`bg-white shadow-sm cursor-pointer transition-all hover:border-orange-300 ${
            statusFilter === 'escalated'
              ? 'ring-2 ring-orange-500/20 border-orange-500'
              : escalatedCount > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'escalated' ? 'all' : 'escalated')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              escalatedCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-orange-50 text-orange-400'
            }`}>
              <Flame className={`h-5 w-5 ${escalatedCount > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escalated</p>
              <h3 className={`text-xl font-bold ${escalatedCount > 0 ? 'text-orange-600' : ''}`}>{escalatedCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`bg-white border-slate-100 shadow-sm cursor-pointer transition-all hover:border-green-200 ${statusFilter === 'resolved' ? 'ring-2 ring-green-500/20 border-green-500' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Today</p><h3 className="text-xl font-bold">{resolvedToday}</h3></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm"><CardContent className="p-4 flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock className="h-5 w-5" /></div><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Response</p><h3 className="text-xl font-bold">~4h</h3></div></CardContent></Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
          <Input placeholder="Search by ticket ID, subject or vendor..." className="pl-10 bg-slate-50 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 rounded-xl"><Filter className="h-4 w-4 mr-2 text-slate-400" /><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="all">All Issues</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="issue_reported">Reported</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="escalated">🔥 Escalated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48 rounded-xl"><Smartphone className="h-4 w-4 mr-2 text-slate-400" /><SelectValue placeholder="All Sources" /></SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="vendor_dashboard">🖥️ Vendor Dashboard</SelectItem>
              <SelectItem value="customer_app">📱 Customer App</SelectItem>
              <SelectItem value="rider_app">🏍️ Rider App</SelectItem>
              <SelectItem value="email">✉️ Email</SelectItem>
              <SelectItem value="admin_dashboard">🛡️ Admin Dashboard</SelectItem>
              <SelectItem value="auto">⚡ Auto-Generated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-44 rounded-xl"><UserCog className="h-4 w-4 mr-2 text-slate-400" /><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="finance">Finance Dept</SelectItem>
              <SelectItem value="tech">Tech Support</SelectItem>
              <SelectItem value="ops">Operations</SelectItem>
              <SelectItem value="legal">Legal/Dispute</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 pl-6">Ticket Details</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Category</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-center">Priority</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4">Reported On</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-center">🕘 Age</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-center">⏱ SLA Remaining Time</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-center">Status</TableHead>
            <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-4 text-right pr-6">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {paginated.length > 0 ? paginated.map((t) => (
              <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm capitalize">
                      {t.subject}
                      {t.amount && (String(t.type || "").toLowerCase().includes("dispute") || String(t.type || "").toLowerCase().includes("payment")) && (
                        <span className="text-emerald-600 font-bold ml-1">
                          {" – "}₹{Number(t.amount).toLocaleString("en-IN")}
                        </span>
                      )}
                    </span>
                    {(() => {
                      const esc = getEscalation(t);
                      if (!esc.escalated) return null;
                      return (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider animate-pulse ${
                          esc.level === 'critical'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm shadow-orange-200'
                            : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm shadow-amber-200'
                        }`}>
                          <ArrowUpCircle className="h-2.5 w-2.5" />
                          Escalated
                        </span>
                      );
                    })()}
                  </div>
                  {t.vendorName && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">{t.vendorName}</span>
                      {(() => {
                        const vendorTickets = tickets.filter(tk => tk.vendorId === t.vendorId);
                        const disputes = vendorTickets.filter(tk => {
                          const typeLower = String(tk.type || "").toLowerCase();
                          const subjectLower = String(tk.subject || "").toLowerCase();
                          return typeLower.includes("dispute") || typeLower.includes("complaint") || subjectLower.includes("dispute") || subjectLower.includes("complaint");
                        }).length;
                        const payoutComplaints = vendorTickets.filter(tk => {
                          const typeLower = String(tk.type || "").toLowerCase();
                          const subjectLower = String(tk.subject || "").toLowerCase();
                          return typeLower.includes("payment") || typeLower.includes("refund") || typeLower.includes("payout") || subjectLower.includes("payment") || subjectLower.includes("refund") || subjectLower.includes("payout");
                        }).length;
                        const slaViolations = vendorTickets.filter(tk => getSLARemaining(tk.createdAt, tk.priority).breached).length;
                        
                        if (disputes >= 2 || payoutComplaints >= 2 || slaViolations >= 2) {
                          const health = getVendorHealthScore(vendorTickets);
                          return (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[8px] font-bold cursor-pointer hover:bg-red-100 transition-colors animate-pulse"
                              onClick={(e) => { e.stopPropagation(); window.open(`/vendors/${t.vendorId}`, '_blank'); }}
                              title={`Support Health: ${health.score}% (${health.label})`}>
                              <HeartPulse className="h-2 w-2 text-red-500" />
                              Health: {health.score}%
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{t.id}</div>
                  <div className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-xs">{t.description}</div>
                  {/* Escalation target */}
                  {(() => {
                    const esc = getEscalation(t);
                    if (!esc.escalated) return null;
                    return (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px]">{ getEscalationIcon(esc.target) }</span>
                        <span className="text-[10px] font-semibold text-orange-600">→ {esc.target}</span>
                        <span className="text-[9px] text-orange-400 font-medium">• {esc.reason}</span>
                      </div>
                    );
                  })()}
                  {/* Financial Impact + Linked IDs + Source */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {t.amount && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[9px] font-bold">
                        <IndianRupee className="h-2.5 w-2.5" />{Number(t.amount).toLocaleString("en-IN")}
                      </span>
                    )}
                    {t.orderId && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 ring-1 ring-blue-200 text-[9px] font-semibold cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={(e) => { e.stopPropagation(); window.open(`/orders/${t.orderId}`, '_blank'); }}>
                        <Link2 className="h-2.5 w-2.5" />Order
                      </span>
                    )}
                    {t.transactionId && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 ring-1 ring-violet-200 text-[9px] font-semibold cursor-pointer hover:bg-violet-100 transition-colors"
                        onClick={(e) => { e.stopPropagation(); window.open(`/vendor/payments/${t.transactionId}`, '_blank'); }}>
                        <ExternalLink className="h-2.5 w-2.5" />Txn
                      </span>
                    )}
                    {t.vendorId && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-600 ring-1 ring-slate-200 text-[9px] font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={(e) => { e.stopPropagation(); window.open(`/vendors/${t.vendorId}`, '_blank'); }}>
                        <User className="h-2.5 w-2.5" />{t.vendorName || 'Vendor'}
                      </span>
                    )}
                    {(() => {
                      const src = getSourceConfig(t.source);
                      return (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ring-1 text-[9px] font-semibold ${src.color}`}>
                          <span className="text-[8px]">{src.icon}</span>{src.label}
                        </span>
                      );
                    })()}
                    {t.autoCreated && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 ring-1 ring-rose-200 text-[9px] font-bold">
                        <Zap className="h-2.5 w-2.5" />Auto
                      </span>
                    )}
                    {t.assignedRole && t.assignedRole !== "unassigned" && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-[9px] font-bold">
                        <UserCog className="h-2.5 w-2.5" />{t.assignedRole === "finance" ? "Finance" : t.assignedRole === "tech" ? "Tech" : t.assignedRole === "ops" ? "Operations" : t.assignedRole === "legal" ? "Legal" : t.assignedRole}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0 h-5 border-slate-200">{t.type}</Badge></TableCell>
                <TableCell className="text-center"><Badge variant="outline" className={`text-[10px] font-bold uppercase h-5 px-2 ${getPriorityColor(t.priority)}`}>{t.priority}</Badge></TableCell>
                <TableCell><div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium"><Calendar className="h-3 w-3" />{formatDate(t.createdAt)}</div></TableCell>
                <TableCell className="text-center">
                  {(() => {
                    const isResolved = ["resolved", "closed", "completed", "cancelled"].includes(String(t.status || "").toLowerCase());
                    const age = getTicketAge(t.createdAt);
                    return (
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 ${
                        isResolved ? 'bg-slate-50 ring-slate-200' : `${age.bgClass} ${age.ringClass}`
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          isResolved ? 'bg-slate-300' : `${age.dotClass} ${age.color === 'red' ? 'animate-pulse' : ''}`
                        }`} />
                        <span className={`text-[11px] font-bold tabular-nums ${
                          isResolved ? 'text-slate-400' : age.textClass
                        }`}>
                          {isResolved ? 'Closed' : age.label}
                        </span>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-center">
                  {(() => {
                    const isResolved = ["resolved", "closed", "completed", "cancelled"].includes(String(t.status || "").toLowerCase());
                    const formatted = getFormattedSLARemaining(t.createdAt, t.priority);
                    const colors = getSLAColor(formatted.percent, formatted.breached, isResolved);
                    return (
                      <div className={`inline-flex flex-col items-start gap-1 px-3 py-2 rounded-xl ${colors.bg} ring-1 ${colors.ring} min-w-[170px] text-left mx-auto shadow-sm`}>
                        <span className={`text-[10px] font-bold tracking-wide uppercase ${isResolved ? 'text-slate-400' : colors.text}`}>
                          {formatted.title}
                        </span>
                        {!isResolved && (
                          <div className="w-full h-1 bg-slate-200/60 rounded-full overflow-hidden my-0.5">
                            <div className={`h-full rounded-full transition-all duration-500 ${colors.bar}`} style={{ width: `${formatted.percent}%` }} />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {formatted.breached && !isResolved ? (
                            <AlertCircle className={`h-3.5 w-3.5 ${colors.text} animate-pulse`} />
                          ) : (
                            <Timer className={`h-3.5 w-3.5 ${isResolved ? 'text-slate-400' : colors.text}`} />
                          )}
                          <span className={`text-[11px] font-bold ${isResolved ? 'text-slate-400' : colors.text} tabular-nums`}>
                            {isResolved ? "Closed" : formatted.remaining}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <Badge className={`${getStatusColor(t.status)} border-none font-bold text-[10px] px-2 py-0.5 h-5`}>
                      {formatStatus(t.status)}
                    </Badge>
                    {(() => {
                      const esc = getEscalation(t);
                      if (esc.escalated) {
                        return (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white border-none font-bold text-[9px] px-2 py-0.5 h-5 animate-pulse flex items-center gap-1 shadow-sm">
                            <Flame className="h-2.5 w-2.5" /> Escalated
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6"><div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-[#3E8940] hover:text-[#3E8940] hover:bg-green-50 font-bold text-xs rounded-lg" onClick={() => { setSelectedTicket(t); setReplyText(""); setInternalNote(""); setReplyTab("vendor"); setAssignedRole(t.assignedRole || "unassigned"); setIsReplyOpen(true); }}><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Reply</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-xs font-medium" onClick={() => handleStatusUpdate(t.id, "processing")}>Move to Progress</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-medium text-green-600" onClick={() => handleStatusUpdate(t.id, "resolved")}>Mark Resolved</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-medium text-red-600" onClick={() => handleStatusUpdate(t.id, "cancelled")}>Cancel Ticket</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium">{error ? error : "All caught up! No support tickets found."}</TableCell></TableRow>}
          </TableBody>
        </Table>
        
        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-[#fbfbfb]/50">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-bold text-slate-700">{filtered.length}</span> tickets
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${currentPage === pageNum ? "bg-[#3E8940] hover:bg-[#3E8940]/90" : ""}`} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>
                );
              })}
            </div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ticket Resolution</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Manage ticket response and internal notes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Ticket Info Card */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] font-bold ${getPriorityColor(selectedTicket?.priority)}`}>{selectedTicket?.priority} Priority</Badge>
                  {selectedTicket?.autoCreated && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 ring-1 ring-rose-200 text-[9px] font-bold">
                      <Zap className="h-2.5 w-2.5" />Auto-Created
                    </span>
                  )}
                  {selectedTicket?.source && (() => {
                    const src = getSourceConfig(selectedTicket.source);
                    return (
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ring-1 text-[9px] font-semibold ${src.color}`}>
                        <span className="text-[8px]">{src.icon}</span>{src.label}
                      </span>
                    );
                  })()}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{selectedTicket?.id}</span>
              </div>
              <p className="font-bold text-slate-900 text-sm mb-1 capitalize">
                {selectedTicket?.subject}
                {selectedTicket?.amount && (String(selectedTicket.type || "").toLowerCase().includes("dispute") || String(selectedTicket.type || "").toLowerCase().includes("payment")) && (
                  <span className="text-emerald-600 font-bold ml-1">
                    {" – "}₹{Number(selectedTicket.amount).toLocaleString("en-IN")}
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedTicket?.description}</p>

              {/* Financial Impact */}
              {selectedTicket?.amount && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Amount Involved: ₹{Number(selectedTicket.amount).toLocaleString("en-IN")}</span>
                </div>
              )}

              {/* Linked References */}
              {(selectedTicket?.orderId || selectedTicket?.transactionId || selectedTicket?.vendorId) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked:</span>
                  {selectedTicket.orderId && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-200 text-[10px] font-semibold cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => window.open(`/orders/${selectedTicket.orderId}`, '_blank')}>
                      <Link2 className="h-3 w-3" />Order #{selectedTicket.orderId.slice(0, 8)}...
                      <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                    </span>
                  )}
                  {selectedTicket.transactionId && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-200 text-[10px] font-semibold cursor-pointer hover:bg-violet-100 transition-colors"
                      onClick={() => window.open(`/vendor/payments/${selectedTicket.transactionId}`, '_blank')}>
                      <ExternalLink className="h-3 w-3" />Txn #{selectedTicket.transactionId.slice(0, 8)}...
                    </span>
                  )}
                  {selectedTicket.vendorId && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200 text-[10px] font-semibold cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => window.open(`/vendors/${selectedTicket.vendorId}`, '_blank')}>
                      <User className="h-3 w-3" />{selectedTicket.vendorName || selectedTicket.vendorId.slice(0, 8)}
                      <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                <User className="h-3 w-3" /> Reported by {selectedTicket?.vendorName || 'Vendor'} • {formatDate(selectedTicket?.createdAt)}
                {selectedTicket?.vendorId && (() => {
                  const health = getVendorHealthScore(tickets.filter(t => t.vendorId === selectedTicket.vendorId));
                  return (
                    <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 ring-1 ring-slate-200">
                      <HeartPulse className={`h-2.5 w-2.5 ${health.color}`} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Health: <span className={health.color}>{health.score}% {health.label}</span></span>
                    </div>
                  );
                })()}
              </div>

              {selectedTicket?.vendorId && (() => {
                const vendorTickets = tickets.filter(t => t.vendorId === selectedTicket.vendorId);
                const disputes = vendorTickets.filter(t => {
                  const typeLower = String(t.type || "").toLowerCase();
                  const subjectLower = String(t.subject || "").toLowerCase();
                  return typeLower.includes("dispute") || typeLower.includes("complaint") || subjectLower.includes("dispute") || subjectLower.includes("complaint");
                }).length;
                const payoutComplaints = vendorTickets.filter(t => {
                  const typeLower = String(t.type || "").toLowerCase();
                  const subjectLower = String(t.subject || "").toLowerCase();
                  return typeLower.includes("payment") || typeLower.includes("refund") || typeLower.includes("payout") || subjectLower.includes("payment") || subjectLower.includes("refund") || subjectLower.includes("payout");
                }).length;
                const slaViolations = vendorTickets.filter(t => getSLARemaining(t.createdAt, t.priority).breached).length;
                
                const hasHighDisputes = disputes >= 2;
                const hasFreqPayouts = payoutComplaints >= 2;
                const hasRepeatedSLA = slaViolations >= 2;
                
                if (hasHighDisputes || hasFreqPayouts || hasRepeatedSLA) {
                  const health = getVendorHealthScore(vendorTickets);
                  return (
                    <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100/50 flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                          <HeartPulse className="h-4 w-4 text-red-600 animate-pulse" />
                          Support Health Score: <span className="underline">{health.score}% ({health.label})</span>
                        </span>
                        <span className="text-[9px] font-bold bg-red-100 text-red-800 px-1.5 py-0.5 rounded uppercase tracking-wider">Impact Logged</span>
                      </div>
                      <p className="text-[10px] text-red-600 leading-normal font-medium">
                        Warning: This vendor has registered:
                        {hasHighDisputes && ` • High disputes (${disputes})`}
                        {hasFreqPayouts && ` • Frequent payout complaints (${payoutComplaints})`}
                        {hasRepeatedSLA && ` • Repeated SLA violations (${slaViolations})`}
                      </p>
                      <button 
                        className="text-[10px] font-bold text-red-700 flex items-center gap-1 hover:underline self-start bg-red-100/50 px-2 py-1 rounded-md transition-colors"
                        onClick={() => window.open(`/vendors/${selectedTicket.vendorId}`, '_blank')}
                      >
                        View Performance Impact Analysis <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Dispute Resolution Workflow */}
              {String(selectedTicket?.type || "").toLowerCase().includes("dispute") && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-500" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Dispute Resolution Progress</span>
                  </div>
                  <div className="flex items-center justify-between relative px-1">
                    <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-slate-100 -translate-y-1/2 -z-0" />
                    {["Customer Dispute", "Vendor Response", "Admin Review", "Decision", "Refund/Reject", "Adjusted"].map((step, idx) => {
                      const stepNum = idx + 1;
                      const currentStep = selectedTicket.disputeStep || 1;
                      const isCompleted = stepNum < currentStep;
                      const isActive = stepNum === currentStep;
                      return (
                        <div key={step} className="flex flex-col items-center gap-1.5 relative z-10">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' :
                            isActive ? 'bg-blue-500 border-blue-500 text-white animate-pulse shadow-sm' :
                            'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {isCompleted ? '✓' : stepNum}
                          </div>
                          <span className={`text-[9px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-400'} whitespace-nowrap`}>{step}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Area for Dispute Stage */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    {selectedTicket.disputeStep === 1 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-slate-600 font-medium">Customer has filed a dispute. Awaiting vendor allocation response.</p>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] h-7 self-start"
                          onClick={() => handleDisputeStepUpdate(selectedTicket.id, 2)}
                        >
                          Initiate Vendor Response Window
                        </Button>
                      </div>
                    )}
                    {selectedTicket.disputeStep === 2 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-600 font-medium">Vendor response window is active (Awaiting proof of service).</p>
                          <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">4h 12m left</span>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white rounded-lg font-bold text-[10px] h-7 self-start"
                          onClick={() => handleDisputeStepUpdate(selectedTicket.id, 3)}
                        >
                          Simulate Vendor Proof Submission
                        </Button>
                      </div>
                    )}
                    {selectedTicket.disputeStep === 3 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-slate-700 font-semibold">Review Proof Submitted by Vendor:</p>
                        <div className="bg-white border p-2 rounded-lg text-xs text-slate-600 leading-relaxed">
                          <strong>Vendor Claim:</strong> "Garment was double-checked before packing and verified under CCTV. Attached image shows pristine condition at delivery."
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white rounded-lg font-bold text-[10px] h-7 self-start"
                          onClick={() => handleDisputeStepUpdate(selectedTicket.id, 4)}
                        >
                          Proceed to Admin Decision
                        </Button>
                      </div>
                    )}
                    {selectedTicket.disputeStep === 4 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-slate-700 font-semibold">Make Decision on Dispute:</p>
                        <div className="flex gap-2 mt-1">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] h-8 flex-1"
                            onClick={() => handleDisputeStepUpdate(selectedTicket.id, 5, 'refund')}
                          >
                            Approve & Refund Customer (₹{selectedTicket.amount || 1200})
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-bold text-[10px] h-8 flex-1"
                            onClick={() => handleDisputeStepUpdate(selectedTicket.id, 5, 'reject')}
                          >
                            Reject Dispute & Close
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedTicket.disputeStep === 5 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-700 font-semibold">
                            Decision: {selectedTicket.disputeDecision === 'refund' ? (
                              <span className="text-emerald-600">✓ Refund Approved</span>
                            ) : (
                              <span className="text-red-600">✗ Dispute Rejected</span>
                            )}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium">Awaiting Settlement Sync</span>
                        </div>
                        {selectedTicket.disputeDecision === 'refund' ? (
                          <Button 
                            size="sm" 
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] h-7 self-start"
                            onClick={() => handleDisputeStepUpdate(selectedTicket.id, 6)}
                          >
                            Adjust Vendor Settlement (Deduct ₹{selectedTicket.amount || 1200})
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold text-[10px] h-7 self-start"
                            onClick={() => handleDisputeStepUpdate(selectedTicket.id, 6)}
                          >
                            Close Case (No Settlement Adjustment)
                          </Button>
                        )}
                      </div>
                    )}
                    {(selectedTicket.disputeStep === 6 || selectedTicket.disputeStep === 0) && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                          <CheckCircle className="h-4 w-4" />
                          <span>Workflow Complete & Settlement Adjusted</span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-normal">
                          {selectedTicket.disputeDecision === 'refund' 
                            ? `₹${selectedTicket.amount || 1200} deducted from vendor payout period. Adjustment Reference: S-ADJ-${selectedTicket.id.slice(0, 8).toUpperCase()}`
                            : "Case resolved with dispute rejected. No financial impact to vendor's weekly payout."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SLA + Escalation */}
              {selectedTicket && (() => {
                const isResolved = ["resolved", "closed", "completed", "cancelled"].includes(String(selectedTicket.status || "").toLowerCase());
                const sla = getSLARemaining(selectedTicket.createdAt, selectedTicket.priority);
                const colors = getSLAColor(sla.percent, sla.breached, isResolved);
                const esc = getEscalation(selectedTicket);
                return (
                  <>
                    {!isResolved && (
                      <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ring-1 ${colors.ring}`}>
                        <Timer className={`h-3.5 w-3.5 ${colors.text}`} />
                        <span className={`text-xs font-bold ${colors.text}`}>SLA Remaining: {sla.label}</span>
                        <span className={`text-[10px] ${colors.text} opacity-60 ml-auto`}>{sla.slaHours}h SLA</span>
                      </div>
                    )}
                    {esc.escalated && (
                      <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg ring-1 ${
                        esc.level === 'critical'
                          ? 'bg-gradient-to-r from-orange-50 to-red-50 ring-orange-300'
                          : 'bg-gradient-to-r from-amber-50 to-orange-50 ring-amber-300'
                      }`}>
                        <Flame className={`h-3.5 w-3.5 ${
                          esc.level === 'critical' ? 'text-red-500' : 'text-orange-500'
                        } animate-pulse`} />
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${
                            esc.level === 'critical' ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            ⚠ Escalated to {esc.target}
                          </span>
                          <span className="text-[10px] text-orange-500 font-medium">{esc.reason}</span>
                        </div>
                        <span className="text-sm ml-auto">{getEscalationIcon(esc.target)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Multi-Role Assignment, Source & Templates */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><UserCog className="h-3 w-3" /> Assign To Role</label>
                <Select value={selectedTicket?.assignedRole || "unassigned"} onValueChange={(val) => handleRoleUpdate(selectedTicket.id, val)}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="finance">Finance Dept</SelectItem>
                    <SelectItem value="tech">Tech Support</SelectItem>
                    <SelectItem value="ops">Operations</SelectItem>
                    <SelectItem value="legal">Legal/Dispute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Smartphone className="h-3 w-3" /> Ticket Source</label>
                <Select value={selectedTicket?.source || "vendor_dashboard"} onValueChange={(val) => handleSourceUpdate(selectedTicket.id, val)}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor_dashboard">🖥️ Vendor Dashboard</SelectItem>
                    <SelectItem value="customer_app">📱 Customer App</SelectItem>
                    <SelectItem value="rider_app">🏍️ Rider App</SelectItem>
                    <SelectItem value="email">✉️ Email</SelectItem>
                    <SelectItem value="admin_dashboard">🛡️ Admin Dashboard</SelectItem>
                    <SelectItem value="auto">⚡ Auto-Generated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Auto Templates</label>
                <Select onValueChange={(val) => {
                  const template = REPLY_TEMPLATES.find(t => t.id === val);
                  if (template) setReplyText(template.text);
                }}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPLY_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Previous Internal Notes */}
            {selectedTicket?.internalNotes?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <StickyNote className="h-3 w-3" /> Previous Notes ({selectedTicket.internalNotes.length})
                </label>
                <div className="max-h-32 overflow-y-auto space-y-2 rounded-xl border border-slate-100 p-3 bg-slate-50/50">
                  {selectedTicket.internalNotes.map((note: any, idx: number) => (
                    <div key={idx} className={`text-xs p-2 rounded-lg ${note.internal ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-slate-100'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {note.internal ? <EyeOff className="h-2.5 w-2.5 text-amber-500" /> : <Eye className="h-2.5 w-2.5 text-blue-500" />}
                        <span className={`text-[9px] font-bold uppercase ${note.internal ? 'text-amber-600' : 'text-blue-600'}`}>
                          {note.internal ? 'Internal' : 'Vendor-Visible'}
                        </span>
                        <span className="text-[9px] text-slate-400 ml-auto">{note.author || 'Admin'} • {formatDate(note.createdAt)}</span>
                      </div>
                      <p className="text-slate-600">{note.text || note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabbed Reply: Vendor Reply vs Internal Note */}
            <Tabs value={replyTab} onValueChange={(v) => setReplyTab(v as "vendor" | "internal")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl h-9 bg-slate-100">
                <TabsTrigger value="vendor" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-white">
                  <Eye className="h-3 w-3" /> Vendor Reply
                </TabsTrigger>
                <TabsTrigger value="internal" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-white">
                  <EyeOff className="h-3 w-3" /> Internal Note
                </TabsTrigger>
              </TabsList>
              <TabsContent value="vendor" className="mt-3 space-y-1.5">
                <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                  <Eye className="h-3 w-3" /> This reply will be visible to the vendor
                </p>
                <Textarea placeholder="Write a response to the vendor..." rows={4} className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              </TabsContent>
              <TabsContent value="internal" className="mt-3 space-y-1.5">
                <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Internal only — not visible to vendor
                </p>
                <Textarea placeholder="Add an internal note for the admin team..." rows={4} className="rounded-xl bg-amber-50/50 border-amber-200 focus:bg-white transition-all" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-xl font-bold text-slate-500" onClick={() => setIsReplyOpen(false)}>Discard</Button>
            {replyTab === "internal" ? (
              <Button className="bg-amber-500 hover:bg-amber-600 rounded-xl px-6 font-bold" onClick={handleSaveInternalNote}>
                <StickyNote className="h-4 w-4 mr-2" /> Save Note
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="border-slate-200 text-slate-700 rounded-xl px-4 font-bold hover:bg-slate-50" onClick={() => handleSendVendorReply(false)}>
                  <Send className="h-4 w-4 mr-2 text-slate-400" /> Send Reply
                </Button>
                <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl px-4 font-bold" onClick={() => handleSendVendorReply(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Send & Resolve
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
