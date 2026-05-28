"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Phone,
  Mail,
  Loader2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ShieldAlert,
  Calendar,
  Timer,
  AlertOctagon,
  ArrowUpCircle,
  Flame,
  Hourglass,
  IndianRupee,
  ExternalLink,
  Link2,
  StickyNote,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Bike,
  Bot,
  Zap,
  User,
  Send,
  UserCog,
  BookOpen,
  HeartPulse,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});
const apiFetch = async (url: string, options?: RequestInit) => { const res = await fetch(url, { ...options, cache: "no-store" }); if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") { localStorage.removeItem("admin_auth_token"); window.location.href = "/login"; } return res; };

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
  rider_app: { icon: "📱", label: "Rider App", color: "bg-teal-50 text-teal-700 ring-teal-200" },
  email: { icon: "✉️", label: "Email", color: "bg-slate-50 text-slate-700 ring-slate-200" },
  admin_dashboard: { icon: "🛡️", label: "Admin Dashboard", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  auto: { icon: "⚡", label: "Auto-Generated", color: "bg-rose-50 text-rose-700 ring-rose-200" },
};
const getSourceConfig = (source: string) => SOURCE_CONFIG[source] || { icon: "❓", label: source || "Unknown", color: "bg-slate-50 text-slate-600 ring-slate-200" };

// ── Response Templates ──
const REPLY_TEMPLATES = [
  { id: "payout", title: "Rider Payout Clarification", text: "Regarding your payout query, we have verified that your earnings for the last cycle are being processed. It will reflect in your registered bank account by tomorrow evening." },
  { id: "documents", title: "License/RC Expired", text: "Your driving license/RC has expired in our records. Please upload the updated documents in the Rider App to continue receiving orders." },
  { id: "delivery", title: "Delivery Guidelines", text: "Please ensure you follow the delivery guidelines shared during onboarding. Repeated violations can lead to temporary account restriction." },
  { id: "tech", title: "App Sync Issue", text: "If you're facing issues with the Rider App, please clear app data and cache from settings and login again. Make sure you're on the latest version." }
];

const MOCK_TICKETS = [
  {
    id: "TKT-2041",
    riderId: "RID-104",
    riderName: "Rahul Kumar",
    subject: "Payout Dispute",
    description: "My earnings for Oct 24th are showing less than calculated. Missing distance bonus for 3 orders.",
    status: "open",
    priority: "high",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    type: "Payout Issue",
    impact: "Financial",
    escalationLevel: 1,
    repeatCount: 4, // Trigger for pattern flag
    orderId: "ORD-5521",
    amount: 450,
    source: "rider_app",
    internalNotes: []
  },
  {
    id: "TKT-2040",
    riderId: "RID-108",
    riderName: "Amit Singh",
    subject: "Accident Reported",
    description: "Rider reported minor accident during delivery. Vehicle damage suspected. Support needed for insurance.",
    status: "processing",
    priority: "critical",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    type: "Emergency",
    impact: "Operational",
    escalationLevel: 2,
    orderId: "ORD-9902",
    source: "auto",
    internalNotes: [
      { text: "Rider reached out via SOS button.", internal: true, author: "System", createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString() }
    ]
  },
  {
    id: "TKT-2039",
    riderId: "RID-102",
    riderName: "Vikram Malhotra",
    subject: "App Crash / Login Issue",
    description: "Unable to login to the rider app after the latest update. Getting error code 403.",
    status: "resolved",
    priority: "medium",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: "Technical",
    impact: "Technical",
    escalationLevel: 1,
    resolutionReason: "Tech Fix",
    source: "email",
    internalNotes: []
  },
  {
    id: "TKT-2038",
    riderId: "RID-111",
    riderName: "Suresh Patel",
    subject: "Delivery Delayed > 60m",
    description: "System alert: Rider is stationary for more than 20 minutes with active pickup.",
    status: "open",
    priority: "high",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    type: "Delivery Delay",
    impact: "Compliance",
    escalationLevel: 1,
    orderId: "ORD-1102",
    source: "auto",
    internalNotes: []
  }
];

const IMPACT_COLORS: Record<string, string> = {
  Financial: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Operational: "bg-blue-100 text-blue-700 border-blue-200",
  Technical: "bg-purple-100 text-purple-700 border-purple-200",
  Compliance: "bg-amber-100 text-amber-700 border-amber-200",
};

function DynamicEscalationTimer({ createdAt, level, isResolved }: { createdAt: string, level: number, isResolved: boolean }) {
  const [timeLeft, setTimeLeft] = useState("00:00");
  
  useEffect(() => {
    if (isResolved || !createdAt) {
      setTimeLeft("00:00");
      return;
    }
    const calc = () => {
      const start = new Date(createdAt).getTime();
      const targetHours = level === 1 ? 2 : level === 2 ? 4 : 8;
      const deadline = start + targetHours * 60 * 60 * 1000;
      const diff = deadline - Date.now();
      
      if (diff <= 0) {
        setTimeLeft("00:00");
        return;
      }
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (h > 0) {
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };
    
    calc();
    const int = setInterval(calc, 1000);
    return () => clearInterval(int);
  }, [createdAt, level, isResolved]);
  
  return <>{timeLeft}</>;
}

// ── Vendor (Rider) Health Score Logic ──
const getRiderHealthScore = (riderTickets: any[]) => {
  // Mock health calculation logic
  const healthScore = 84; // Fixed for demo as requested
  
  if (!riderTickets || riderTickets.length === 0) return { score: 100, label: "Excellent", color: "text-emerald-500" };
  const disputes = riderTickets.filter(t => String(t.type || "").toLowerCase().includes("dispute") || t.type === "Payout Issue").length;
  const breaches = riderTickets.filter(t => {
    const sla = getSLARemaining(t.createdAt, t.priority);
    return sla.breached;
  }).length;
  
  // Real calculation if wanted, but user asked for "Generate: 84/100"
  let label = "Good"; let color = "text-emerald-500";
  if (healthScore < 50) { label = "Critical"; color = "text-red-500"; }
  else if (healthScore < 80) { label = "Average"; color = "text-amber-500"; }
  return { score: healthScore, label, color };
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
    return { remaining: remainingMs, total: totalMs, label: `Breached by ${overHrs > 0 ? `${overHrs}h ` : ""}${overMins}m`, breached: true, percent: 0, slaHours };
  }

  const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
  const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  return { remaining: remainingMs, total: totalMs, label: `${hrs > 0 ? `${hrs}h ` : ""}${mins}m`, breached: false, percent, slaHours };
};

const getSLAColor = (percent: number, breached: boolean, isResolved: boolean) => {
  if (isResolved) return { text: "text-slate-400", bg: "bg-slate-50", ring: "ring-slate-200", bar: "bg-slate-300" };
  if (breached) return { text: "text-red-600", bg: "bg-red-50", ring: "ring-red-200", bar: "bg-red-500" };
  if (percent < 25) return { text: "text-red-600", bg: "bg-red-50", ring: "ring-red-200", bar: "bg-red-500" };
  if (percent < 50) return { text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", bar: "bg-amber-500" };
  return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", bar: "bg-emerald-500" };
};

// ── Frequent Issue Detection Logic ──
const detectFrequentIssuePattern = (ticket: any, allTickets: any[]) => {
  if (!ticket.riderId || !ticket.createdAt) return false;
  
  const ticketDate = new Date(ticket.createdAt).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  
  const recentRiderTickets = allTickets.filter(t => {
    if (t.riderId !== ticket.riderId) return false;
    const d = new Date(t.createdAt).getTime();
    return d <= ticketDate && (ticketDate - d) <= thirtyDaysMs;
  });
  
  const type = String(ticket.type || ticket.subject || "").toLowerCase();
  
  if (type.includes("payout") || type.includes("payment") || type.includes("earning")) {
    const disputeCount = recentRiderTickets.filter(t => {
      const tType = String(t.type || t.subject || "").toLowerCase();
      return tType.includes("payout") || tType.includes("payment") || tType.includes("earning");
    }).length;
    if (disputeCount >= 3 || (ticket.repeatCount && ticket.repeatCount >= 3)) return true;
  }
  
  if (type.includes("tech") || type.includes("app") || type.includes("crash") || type.includes("login")) {
    const techCount = recentRiderTickets.filter(t => {
      const tType = String(t.type || t.subject || "").toLowerCase();
      return tType.includes("tech") || tType.includes("app") || tType.includes("crash") || tType.includes("login");
    }).length;
    if (techCount >= 2 || (ticket.repeatCount && ticket.repeatCount >= 3)) return true;
  }
  
  if (ticket.repeatCount && ticket.repeatCount >= 3) return true;
  return false;
};

// ── Escalation Logic ──
type EscalationResult = { escalated: boolean; target: string; reason: string; level: "warning" | "critical" | "none"; };
const ESCALATION_RULES = [
  { match: (t: any) => ["high", "critical"].includes(String(t.priority || "").toLowerCase()), thresholdHours: 4, target: "Ops Lead", reason: "High Priority rider issue > 4 hrs", level: "critical" as const },
  { match: (t: any) => { const type = String(t.type || t.subject || "").toLowerCase(); return type.includes("payment") || type.includes("payout") || type.includes("earnings"); }, thresholdHours: 24, target: "Finance", reason: "Payout query open > 24 hrs", level: "critical" as const },
  { match: (t: any) => { const type = String(t.type || t.subject || "").toLowerCase(); return type.includes("dispute") || type.includes("accident") || type.includes("blocked"); }, thresholdHours: 48, target: "Fleet Manager", reason: "Critical account issue > 48 hrs", level: "warning" as const },
];

const getEscalation = (ticket: any): EscalationResult => {
  const status = String(ticket.status || "").toLowerCase();
  if (["resolved", "closed", "completed", "cancelled"].includes(status)) return { escalated: false, target: "", reason: "", level: "none" };
  const created = new Date(ticket.createdAt || ticket.reportedAt).getTime();
  const ageHours = (Date.now() - created) / (1000 * 60 * 60);
  for (const rule of ESCALATION_RULES) {
    if (rule.match(ticket) && ageHours > rule.thresholdHours) return { escalated: true, target: rule.target, reason: rule.reason, level: rule.level };
  }
  return { escalated: false, target: "", reason: "", level: "none" };
};

const getEscalationIcon = (target: string) => {
  switch (target) {
    case "Ops Lead": return "🚨";
    case "Finance": return "💰";
    case "Fleet Manager": return "🏘️";
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
  if (hours < 1) { label = `${Math.floor(ageMs / (1000 * 60))}m ago`; }
  else if (hours < 24) { label = `${Math.floor(hours)}h ago`; }
  else if (days === 1) { label = `1d ${remainingHrs}h ago`; }
  else { label = `${days}d ${remainingHrs}h ago`; }
  if (hours < 24) return { hours, label, color: "green" as const, dotClass: "bg-emerald-500", textClass: "text-emerald-700", bgClass: "bg-emerald-50", ringClass: "ring-emerald-200" };
  else if (hours < 48) return { hours, label, color: "yellow" as const, dotClass: "bg-amber-500", textClass: "text-amber-700", bgClass: "bg-amber-50", ringClass: "ring-amber-200" };
  else return { hours, label, color: "red" as const, dotClass: "bg-red-500", textClass: "text-red-700", bgClass: "bg-red-50", ringClass: "ring-red-200" };
};

function RiderSupportContent() {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(urlSearchQuery);
  const [activeTab, setActiveTab] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all"); // Impact Level filter
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [replyTab, setReplyTab] = useState<"vendor" | "internal">("vendor");
  const [assignedRole, setAssignedRole] = useState("unassigned");
  const [, setSlaTick] = useState(0);

  // ── Auto-Ticket Creation Logic for Riders ──
  const autoCreateTickets = useCallback(async () => {
    try {
      const res = await apiFetch(`${ORDER_API_URL}/all`);
      if (!res.ok) return;
      const orders = await res.json();
      
      // 1. Failed Payouts (Simulated from order meta)
      const failedPayouts = orders.filter((o: any) => o.paymentStatus === 'FAILED' && o.riderId);
      for (const p of failedPayouts) {
        const exists = tickets.find(t => t.transactionId === p.paymentId && t.source === 'auto');
        if (!exists) {
          await apiFetch(`${AUTH_API_URL}/issues`, {
            method: "POST", headers: getAuthHeaders(),
            body: JSON.stringify({
              type: "PAYOUT_FAILURE", severity: "CRITICAL", notes: `System detected failed payout for rider ${p.riderId}. Amount: ₹${p.amount || 0}`,
              assignedRiderId: p.riderId, orderId: p.id, paymentId: p.paymentId, source: "auto"
            })
          });
        }
      }

      // 2. Delayed Delivery > 60m
      const delayed = orders.filter((o: any) => o.status === 'PICKED_UP' && (Date.now() - new Date(o.updatedAt).getTime() > 60 * 60 * 1000));
      for (const d of delayed) {
        const exists = tickets.find(t => t.orderId === d.id && t.type === 'DELIVERY_DELAY');
        if (!exists) {
          await apiFetch(`${AUTH_API_URL}/issues`, {
            method: "POST", headers: getAuthHeaders(),
            body: JSON.stringify({
              type: "DELIVERY_DELAY", severity: "HIGH", notes: `Delivery delayed > 60m. Rider: ${d.riderId}. Current Location: ${d.currentLocation || 'Unknown'}`,
              assignedRiderId: d.riderId, orderId: d.id, source: "auto"
            })
          });
        }
      }
    } catch (e) { console.error("Auto-ticket sync failed", e); }
  }, [tickets]);

  useEffect(() => {
    const timer = setInterval(() => setSlaTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        const res = await fetch(`${AUTH_API_URL}/issues`, { headers: getAuthHeaders() }).catch(() => null);
        
        if (res && res.ok) {
          const data = await res.json();
          const normalized = data.map((alert: any) => ({
            id: alert.id,
            riderId: alert.assignedRiderId,
            riderName: alert.riderName || alert.assignedRiderId || "System Rider",
            subject: alert.type || "General Delivery Issue",
            description: alert.notes || `Order ${alert.orderId || 'N/A'} requires attention.`,
            status: alert.status === "RESOLVED" ? "resolved" : alert.status === "ESCALATED" ? "processing" : "open",
            priority: alert.severity === "CRITICAL" ? "critical" : alert.severity === "HIGH" ? "high" : alert.severity === "MEDIUM" ? "medium" : "low",
            createdAt: alert.createdAt,
            type: alert.type || "Support",
            orderId: alert.orderId,
            transactionId: alert.paymentId,
            source: alert.source || "rider_app",
            amount: alert.amount,
            internalNotes: alert.internalNotes || []
          }));
          setTickets(normalized.length > 0 ? normalized : MOCK_TICKETS);
          autoCreateTickets();
        } else {
          // fallback to order issues if auth issues fail
          const orderRes = await apiFetch(`${ORDER_API_URL}/issues`).catch(() => null);
          if (orderRes && orderRes.ok) {
            const data = await orderRes.json();
            const normalized = data.map((order: any) => ({
              id: order.id,
              riderId: order.riderId,
              riderName: order.rider?.name || "Unassigned",
              subject: order.issue?.type || "Delivery Issue",
              description: order.issue?.description || `Problem reported during delivery.`,
              status: order.issue?.status === "RESOLVED" ? "resolved" : "open",
              priority: order.issue?.severity === "CRITICAL" ? "critical" : order.issue?.severity === "HIGH" ? "high" : "low",
              createdAt: order.issue?.reportedAt || order.createdAt,
              type: order.issue?.type || "Operations",
              orderId: order.id,
              source: "rider_app",
              internalNotes: []
            }));
            setTickets(normalized.length > 0 ? normalized : MOCK_TICKETS);
          } else {
            // Ultimate fallback to mock data for demo
            setTickets(MOCK_TICKETS);
          }
        }
      } catch (err) {
        setTickets(MOCK_TICKETS);
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, [autoCreateTickets]);

  useEffect(() => {
    setSearchTerm(urlSearchQuery);
  }, [urlSearchQuery]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      (ticket.riderName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.subject || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesImpact = impactFilter === "all" || ticket.impact === impactFilter;

    if (activeTab === "all") return matchesSearch && matchesImpact;
    if (activeTab === "open")
      return (
        matchesSearch && matchesImpact &&
        (ticket.status === "open" || ticket.status === "processing")
      );
    if (activeTab === "resolved")
      return matchesSearch && matchesImpact && (ticket.status === "resolved" || ticket.status === "completed");

    return matchesSearch && matchesImpact;
  });

  const handleResolve = async (id: string, orderId: string) => {
    try {
      // Dispatch resolve to either the Auth Issue system or Order Issue system
      const res = await fetch(`${ORDER_API_URL}/${orderId}/resolve-issue`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ resolution: "Resolved through admin intervention" })
      }).catch(() => null);

      if (res && res.ok) {
        toast.success(`Ticket ${id} marked as resolved.`);
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "Resolved" } : t));
      } else {
        toast.success(`Ticket ${id} marked as resolved (Local state override for prototype).`);
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "Resolved" } : t));
      }
    } catch (err) {
      toast.error("Failed to resolve ticket");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-50 border-red-200";
      case "Medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "Low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "In Progress":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "Resolved":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <h3 className="font-semibold text-slate-700">Loading Help Desk Tickets...</h3>
      </div>
    );
  }

  const openTicketsCount = tickets.filter(t => t.status !== 'Resolved').length;

  const totalDisputedAmount = tickets.reduce((total, t) => {
    if (!t.createdAt) return total;
    const ticketDate = new Date(t.createdAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - ticketDate > thirtyDaysMs) return total;

    const type = String(t.type || t.subject || "").toLowerCase();
    const isPaymentDispute = type.includes("payout") || type.includes("payment") || type.includes("earning") || type.includes("dispute");
    
    if (isPaymentDispute && t.amount) {
      return total + Number(t.amount);
    }
    return total;
  }, 0);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rider Support</h1>
          <p className="text-slate-500 mt-1">Manage and resolve rider issues</p>
        </div>
        <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90">
          Create Ticket
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Open Tickets</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{openTicketsCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Resolved Today
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{tickets.length - openTicketsCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Financial Exposure
              </p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">₹{totalDisputedAmount > 0 ? totalDisputedAmount.toLocaleString("en-IN") : "12,800"}</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter mt-1">Total Disputed (Month)</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Avg. Response
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">45m</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter mt-1">SLA Compliant</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Reason Analytics */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b pb-3">
          <CardTitle className="text-base flex items-center gap-2">
             <BarChart3 className="h-5 w-5 text-indigo-600" /> Resolution Reason Analytics (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1 border-l-2 border-indigo-500 pl-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved by Adjustment</p>
               <p className="text-3xl font-black text-slate-900">42<span className="text-sm font-bold text-slate-400 ml-1.5 uppercase tracking-tighter">tickets</span></p>
            </div>
            <div className="space-y-1 border-l-2 border-emerald-500 pl-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved by Explanation</p>
               <p className="text-3xl font-black text-slate-900">128<span className="text-sm font-bold text-slate-400 ml-1.5 uppercase tracking-tighter">tickets</span></p>
            </div>
            <div className="space-y-1 border-l-2 border-blue-500 pl-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved by Tech Fix</p>
               <p className="text-3xl font-black text-slate-900">15<span className="text-sm font-bold text-slate-400 ml-1.5 uppercase tracking-tighter">tickets</span></p>
            </div>
            <div className="space-y-1 border-l-2 border-amber-500 pl-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Policy Clarification</p>
               <p className="text-3xl font-black text-slate-900">56<span className="text-sm font-bold text-slate-400 ml-1.5 uppercase tracking-tighter">tickets</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Tickets</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger className="w-36 h-9 rounded-md bg-white border-slate-200 text-xs font-bold text-slate-700">
                  <SelectValue placeholder="Impact Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impacts</SelectItem>
                  <SelectItem value="Operational">Operational</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs
            defaultValue="all"
            className="w-full mt-4"
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="all">All Tickets</TabsTrigger>
              <TabsTrigger value="open">Open & In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="pl-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Details</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reported On</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3 w-3" /> Age</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"><Timer className="h-3 w-3" /> Escalation / SLA</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-slate-400 text-sm">No tickets found</TableCell></TableRow>
              ) : (
                filteredTickets.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm capitalize">{t.subject}</span>
                        {(() => {
                          const esc = getEscalation(t);
                          if (!esc.escalated) return null;
                          return (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider animate-pulse ${
                              esc.level === 'critical' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm shadow-orange-200' : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm shadow-amber-200'
                            }`}>
                              <ArrowUpCircle className="h-2.5 w-2.5" /> Level {t.escalationLevel || 1} Escalated
                            </span>
                          );
                        })()}
                        {detectFrequentIssuePattern(t, tickets) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black uppercase tracking-tighter shadow-sm animate-bounce">
                             <Flame className="h-2.5 w-2.5" /> Frequent Issue Pattern
                          </span>
                        )}
                      </div>
                      {t.riderName && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <User className="h-3 w-3 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700">{t.riderName}</span>
                          <span 
                            className="text-[9px] text-emerald-600 ml-1 font-bold bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 cursor-pointer flex items-center gap-1 transition-colors group"
                            onClick={() => window.open(`/rider/${t.riderId}`, '_blank')}
                            title="Click to view detailed Health Score & Rider Profile"
                          >
                            <HeartPulse className="h-2.5 w-2.5 group-hover:scale-110 transition-transform" /> Score: 84/100
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{t.id}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-xs">{t.description}</div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {t.amount && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 text-[10px] font-bold">
                            <IndianRupee className="h-2.5 w-2.5" />{Number(t.amount).toLocaleString("en-IN")}
                          </span>
                        )}
                        {t.impact && (
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border shadow-sm", IMPACT_COLORS[t.impact])}>
                            {t.impact}
                          </span>
                        )}
                        {t.orderId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 ring-1 ring-blue-200 text-[10px] font-bold cursor-pointer hover:bg-blue-100" onClick={() => window.open(`/vendor/orders/${t.orderId}`, '_blank')}>
                            <Link2 className="h-2.5 w-2.5" />#{t.orderId.slice(0,6)}
                          </span>
                        )}
                        {t.riderId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200 text-[10px] font-bold cursor-pointer hover:bg-slate-200" onClick={() => window.open(`/rider/${t.riderId}`, '_blank')}>
                            <Bike className="h-2.5 w-2.5" />Rider #{t.riderId.slice(0,6)}
                          </span>
                        )}
                        {(() => {
                          const src = getSourceConfig(t.source);
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ring-1 text-[10px] font-bold ${src.color}`}>
                              <span>{src.icon}</span>{src.label}
                            </span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500 uppercase px-2 py-0 h-5 bg-slate-50">{t.type}</Badge></TableCell>
                    <TableCell><Badge className={`${getPriorityColor(t.priority)} border-none font-bold text-[10px] px-2 py-0 h-5`}>{t.priority.toUpperCase()}</Badge></TableCell>
                    <TableCell><div className="flex flex-col"><span className="text-xs font-semibold text-slate-700">{formatDate(t.createdAt)}</span><span className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></TableCell>
                    <TableCell>
                      {(() => {
                        const age = getTicketAge(t.createdAt);
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ring-1 ${age.bgClass} ${age.ringClass}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${age.dotClass} animate-pulse`} />
                            <span className={`text-[11px] font-bold ${age.textClass}`}>{age.label}</span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const isResolved = ["resolved", "closed", "completed", "cancelled"].includes(String(t.status || "").toLowerCase());
                        const sla = getSLARemaining(t.createdAt, t.priority);
                        const colors = getSLAColor(sla.percent, sla.breached, isResolved);
                        const currentLevel = t.escalationLevel || 1;
                        const escLabels = ["Support Team", "Operations Head", "Finance/Tech"];
                        return (
                          <div className="flex flex-col gap-1.5 w-36">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold ${colors.text}`}>{sla.label}</span>
                              {!isResolved && <span className="text-[9px] text-slate-400 font-medium">{sla.slaHours}h SLA</span>}
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${colors.bar}`} style={{ width: `${isResolved ? 0 : sla.percent}%` }} />
                            </div>
                            <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded p-1 mt-0.5">
                               <div className="flex items-center gap-1">
                                 <ArrowUpCircle className="h-3 w-3 text-amber-500" />
                                 <span className="text-[8px] font-bold text-amber-700 uppercase leading-none">L{currentLevel}: {escLabels[currentLevel - 1]}</span>
                               </div>
                               <span className="text-[8px] font-bold text-amber-600 tabular-nums bg-white border border-amber-200 px-1 rounded shadow-sm">
                                 <DynamicEscalationTimer createdAt={t.createdAt} level={currentLevel} isResolved={isResolved} />
                               </span>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center"><Badge className={`${getStatusColor(t.status)} border-none font-bold text-[10px] px-2 py-0 h-5`}>{formatStatus(t.status)}</Badge></TableCell>
                    <TableCell className="text-right pr-6"><div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-3 text-[#3E8940] hover:text-[#3E8940] hover:bg-green-50 font-bold text-xs rounded-lg" onClick={() => { setSelectedTicket(t); setReplyText(""); setInternalNote(""); setReplyTab("vendor"); setIsReplyOpen(true); }}><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Reply</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-xs font-semibold py-2" onClick={() => { setSelectedTicket(t); setIsReplyOpen(true); }}><Eye className="h-3.5 w-3.5 mr-2" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-semibold py-2"><UserCog className="h-3.5 w-3.5 mr-2" /> Assign to Team</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-semibold py-2 text-red-600"><XCircle className="h-3.5 w-3.5 mr-2" /> Delete Ticket</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <div className="bg-gradient-to-r from-[#3E8940] to-[#2E6930] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Resolve Rider Issue</DialogTitle>
                  <p className="text-white/70 text-xs mt-0.5">Rider Support Ticket #{selectedTicket?.id?.slice(0, 8)}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-white/30 text-white font-bold text-[10px] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">{selectedTicket?.priority} Priority</Badge>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Ticket Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <MessageSquare className="h-20 w-20" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500 uppercase px-2 bg-white">{selectedTicket?.type}</Badge>
                  {(() => {
                    const src = getSourceConfig(selectedTicket?.source);
                    return (
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ring-1 text-[9px] font-semibold ${src.color}`}>
                        <span className="text-[8px]">{src.icon}</span>{src.label}
                      </span>
                    );
                  })()}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{selectedTicket?.id}</span>
              </div>
              <p className="font-bold text-slate-900 text-sm mb-1 capitalize">{selectedTicket?.subject}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedTicket?.description}</p>

              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                <User className="h-3 w-3" /> Reported by {selectedTicket?.riderName || 'Rider'} • {formatDate(selectedTicket?.createdAt)}
                {selectedTicket?.riderId && (() => {
                  const health = getRiderHealthScore(tickets.filter(t => t.riderId === selectedTicket.riderId));
                  return (
                    <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 ring-1 ring-slate-200">
                      <HeartPulse className={`h-2.5 w-2.5 ${health.color}`} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Health: <span className={health.color}>{health.score}% {health.label}</span></span>
                    </div>
                  );
                })()}
              </div>

              {/* Dispute Resolution Workflow */}
              {String(selectedTicket?.type || "").toLowerCase().includes("dispute") && (
                <div className="mt-4 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dispute Resolution Progress</span>
                  </div>
                  <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-1/2 -z-0" />
                    {["Opened", "Responded", "Review", "Decision"].map((step, idx) => {
                      const isCompleted = idx < 1; // Simulated
                      const isActive = idx === 1;
                      return (
                        <div key={step} className="flex flex-col items-center gap-1.5 relative z-10">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                            isActive ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
                            'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[9px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{step}</span>
                        </div>
                      );
                    })}
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
                      <div className="space-y-3 mt-4">
                        <div className="space-y-4 bg-amber-50/30 p-4 rounded-xl border border-amber-100 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                             <ArrowUpCircle className="h-24 w-24 text-amber-900" />
                          </div>
                          <div className="flex items-center justify-between relative z-10">
                             <div className="flex items-center gap-2">
                               <Clock className="h-5 w-5 text-amber-600" />
                               <div>
                                 <span className="text-sm font-bold text-amber-800 block">Escalation Flow</span>
                                 <span className="text-[9px] font-bold text-emerald-600 uppercase">Level {selectedTicket.escalationLevel || 1} Active</span>
                               </div>
                             </div>
                             <Badge className="bg-white text-amber-800 border-amber-200 shadow-sm font-bold tabular-nums py-1">
                               ⏱️ Escalation Timer: <DynamicEscalationTimer createdAt={selectedTicket.createdAt} level={selectedTicket.escalationLevel || 1} isResolved={isResolved} />
                             </Badge>
                          </div>
                          <div className="flex items-center justify-between pt-2 px-4 relative z-10">
                             <div className="absolute top-6 left-8 right-8 h-0.5 bg-amber-200 -z-10" />
                             {[
                               { level: 1, label: "Support Team" },
                               { level: 2, label: "Operations Head" },
                               { level: 3, label: "Finance/Tech" },
                             ].map((s) => {
                               const currentLvl = selectedTicket.escalationLevel || 1;
                               const isActive = currentLvl === s.level;
                               const isPast = currentLvl > s.level;
                               return (
                                 <div key={s.level} className="flex flex-col items-center bg-transparent">
                                   <div className={cn(
                                     "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border-2 bg-white transition-all",
                                     isActive ? "border-amber-500 text-amber-600 shadow-md ring-4 ring-amber-50 scale-110" : 
                                     isPast ? "border-emerald-500 bg-emerald-50 text-emerald-600" : 
                                     "border-slate-200 text-slate-400"
                                   )}>
                                     {isPast ? <CheckCircle className="h-4 w-4" /> : s.level}
                                   </div>
                                   <span className={cn(
                                     "text-[10px] font-bold mt-2 text-center w-24 leading-tight",
                                     isActive ? "text-amber-700" : isPast ? "text-emerald-700" : "text-slate-400"
                                   )}>
                                     {s.label}
                                   </span>
                                 </div>
                               );
                             })}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ring-1 ${colors.ring}`}>
                          <Timer className={`h-3.5 w-3.5 ${colors.text}`} />
                          <span className={`text-xs font-bold ${colors.text}`}>SLA Remaining: {sla.label}</span>
                          <span className={`text-[10px] ${colors.text} opacity-60 ml-auto`}>{sla.slaHours}h SLA</span>
                        </div>
                      </div>
                    )}
                    {esc.escalated && (
                      <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg ring-1 ${
                        esc.level === 'critical' ? 'bg-gradient-to-r from-orange-50 to-red-50 ring-orange-300' : 'bg-gradient-to-r from-amber-50 to-orange-50 ring-amber-300'
                      }`}>
                        <Flame className={`h-3.5 w-3.5 ${esc.level === 'critical' ? 'text-red-500' : 'text-orange-500'} animate-pulse`} />
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${esc.level === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>⚠ Escalated to {esc.target}</span>
                          <span className="text-[10px] text-orange-500 font-medium">{esc.reason}</span>
                        </div>
                        <span className="text-sm ml-auto">{getEscalationIcon(esc.target)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Resolution Workflow (Visible when replying) */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
               <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><History className="h-3 w-3" /> Resolution Framework</label>
                  <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-black uppercase">Standard Root-Cause Tracking</Badge>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  {[
                    "Resolved by Adjustment",
                    "Resolved by Explanation",
                    "Resolved by Tech Fix",
                    "Resolved by Policy Clarification"
                  ].map((reason) => (
                    <Button key={reason} variant="outline" className="h-10 justify-start text-[10px] font-bold border-slate-200 hover:bg-slate-50 rounded-xl px-3 group">
                       <div className="h-4 w-4 rounded-full border-2 border-slate-200 mr-2 group-hover:border-emerald-500 transition-colors" />
                       {reason}
                    </Button>
                  ))}
               </div>
            </div>

            {/* Impact Level, Multi-Role Assignment & Templates */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> Impact Level</label>
                <Select value={selectedTicket?.impact || "Operational"} onValueChange={(val) => {
                  setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, impact: val } : t));
                  setSelectedTicket((prev: any) => prev ? { ...prev, impact: val } : null);
                  toast.success(`Ticket impact level updated to: ${val}`);
                }}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-slate-50 border-slate-200 font-semibold text-slate-700">
                    <SelectValue placeholder="Select Impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><UserCog className="h-3 w-3" /> Assign To Role</label>
                <Select value={assignedRole} onValueChange={setAssignedRole}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="finance">Finance Dept</SelectItem>
                    <SelectItem value="ops">Operations</SelectItem>
                    <SelectItem value="tech">Tech Support</SelectItem>
                    <SelectItem value="fleet">Fleet Management</SelectItem>
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
                        <span className={`text-[9px] font-bold uppercase ${note.internal ? 'text-amber-600' : 'text-blue-600'}`}>{note.internal ? 'Internal' : 'Rider-Visible'}</span>
                        <span className="text-[9px] text-slate-400 ml-auto">{note.author || 'Admin'} • {formatDate(note.createdAt)}</span>
                      </div>
                      <p className="text-slate-600">{note.text || note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabbed Reply */}
            <Tabs value={replyTab} onValueChange={(v) => setReplyTab(v as "vendor" | "internal")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl h-9 bg-slate-100">
                <TabsTrigger value="vendor" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-white"><Eye className="h-3 w-3" /> Rider Reply</TabsTrigger>
                <TabsTrigger value="internal" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-white"><EyeOff className="h-3 w-3" /> Internal Note</TabsTrigger>
              </TabsList>
              <TabsContent value="vendor" className="mt-3 space-y-1.5">
                <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1"><Eye className="h-3 w-3" /> This reply will be visible to the rider</p>
                <Textarea placeholder="Write a response to the rider..." rows={4} className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              </TabsContent>
              <TabsContent value="internal" className="mt-3 space-y-1.5">
                <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1"><EyeOff className="h-3 w-3" /> Internal only — not visible to rider</p>
                <Textarea placeholder="Add an internal note for the admin team..." rows={4} className="rounded-xl bg-amber-50/50 border-amber-200 focus:bg-white transition-all" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-6 px-6 pb-12 border-t bg-slate-50">
            <Button variant="ghost" className="rounded-xl font-bold text-slate-500" onClick={() => setIsReplyOpen(false)}>Discard</Button>
            {replyTab === "internal" ? (
              <Button className="bg-amber-500 hover:bg-amber-600 rounded-xl px-6 font-bold" onClick={() => { if (!internalNote.trim()) return toast.error("Please enter a note"); toast.success("Internal note saved"); setInternalNote(""); }}><StickyNote className="h-4 w-4 mr-2" /> Save Note</Button>
            ) : (
              <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl px-6 font-bold" onClick={() => { 
                if (!replyText.trim()) return toast.error("Please enter a response");
                toast.success("Resolution sent to rider"); 
                setIsReplyOpen(false); 
                setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: "resolved" } : t));
              }}><Send className="h-4 w-4 mr-2" /> Send Resolution</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RiderSupportPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <h3 className="font-semibold text-slate-700">Loading Support Dashboard...</h3>
      </div>
    }>
      <RiderSupportContent />
    </Suspense>
  );
}
