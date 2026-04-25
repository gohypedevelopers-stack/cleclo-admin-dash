"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Paperclip,
  Smile,
  ChevronRight,
  Shield,
  IndianRupee,
  RefreshCw,
  Terminal,
  Zap,
  Star,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "customer" | "agent";
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface Chat {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  timestamp: string;
  status: "active" | "pending" | "resolved";
  orderId: string;
  avatar?: string;
  ltv: number;
  isVip: boolean;
}

const MOCK_CHATS: Chat[] = [
  { id: "1", customerName: "Aniket Sharma", customerPhone: "9876543210", lastMessage: "Where is my laundry pick-up?", timestamp: "2m ago", status: "active", orderId: "ORD-8821", ltv: 12500, isVip: true },
  { id: "2", customerName: "Priya Gupta", customerPhone: "9988776655", lastMessage: "I need to change my delivery address.", timestamp: "15m ago", status: "pending", orderId: "ORD-8750", ltv: 3200, isVip: false },
  { id: "3", customerName: "Rahul Verma", customerPhone: "9123456789", lastMessage: "The service was great, thank you!", timestamp: "1h ago", status: "resolved", orderId: "ORD-8612", ltv: 8500, isVip: false },
];

const MOCK_MESSAGES: Message[] = [
  { id: "1", sender: "customer", text: "Hello, I have an issue with my order ORD-8821.", timestamp: "10:30 AM", status: "read" },
  { id: "2", sender: "agent", text: "Hi Aniket! I can certainly help with that. What's the problem?", timestamp: "10:31 AM", status: "read" },
  { id: "3", sender: "customer", text: "The rider was supposed to be here at 10 AM for pickup, but no one has arrived yet.", timestamp: "10:32 AM", status: "read" },
  { id: "4", sender: "agent", text: "I apologize for the delay. Let me check the rider's current location for you.", timestamp: "10:33 AM", status: "read" },
];

export default function SupportHub() {
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [activeChat, setActiveChat] = useState<Chat | null>(MOCK_CHATS[0]);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    if (inputText.startsWith("/")) {
      handleReplCommand(inputText);
      setInputText("");
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "agent",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent"
    };

    setMessages([...messages, newMessage]);
    setInputText("");
    
    // Simulate auto-response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: "customer",
        text: "Thank you for looking into this.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "read"
      };
      setMessages(prev => [...prev, response]);
    }, 1500);
  };

  const handleReplCommand = (cmd: string) => {
    const parts = cmd.toLowerCase().split(" ");
    const action = parts[0];

    switch (action) {
      case "/refund":
        toast.success("Refund Processed", { description: "Refund of ₹250 initiated for ORD-8821" });
        break;
      case "/call":
        toast.info("Calling Rider...", { description: "Connecting you to Ravi Kumar (Rider)" });
        break;
      case "/resolve":
        toast.success("Chat Resolved", { description: "Support ticket marked as completed" });
        break;
      case "/transfer":
        toast.info("Transferring Chat", { description: "Connecting to Finance Admin for payment issue" });
        break;
      default:
        toast.error("Unknown Command", { description: "Available: /refund, /call, /resolve, /transfer" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 p-2">
      {/* Sidebar: Chat List */}
      <div className="w-80 flex flex-col bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Support Hub</h2>
            <Badge variant="outline" className="bg-[#3E8940]/10 text-[#3E8940] border-[#3E8940]/20 text-[10px] font-bold">
              12 ONLINE
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search chats..." className="pl-10 h-10 bg-white border-slate-200 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`p-4 border-b cursor-pointer transition-colors hover:bg-slate-50 ${activeChat?.id === chat.id ? 'bg-[#3E8940]/5 border-l-4 border-l-[#3E8940]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                    {chat.customerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-slate-900 truncate">{chat.customerName}</span>
                    <span className="text-[10px] text-slate-400">{chat.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 truncate">{chat.lastMessage}</p>
                    {chat.status === 'active' && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border shadow-sm overflow-hidden">
        {activeChat ? (
          <>
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#3E8940]/10 text-[#3E8940] font-bold">
                    {activeChat.customerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{activeChat.customerName}</h3>
                    {activeChat.isVip && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[8px] h-4 py-0 font-bold uppercase"><Star className="h-2 w-2 mr-0.5 fill-amber-700" /> VIP</Badge>}
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Active Session • {activeChat.orderId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 text-[#3E8940] border-emerald-100 hover:bg-emerald-50"><Phone className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 text-blue-600 border-blue-100 hover:bg-blue-50"><ExternalLink className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${msg.sender === 'agent' ? 'bg-[#3E8940] text-white rounded-tr-none' : 'bg-white text-slate-900 border rounded-tl-none'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'agent' ? 'justify-end text-white/70' : 'text-slate-400'}`}>
                      <span className="text-[9px]">{msg.timestamp}</span>
                      {msg.sender === 'agent' && <CheckCircle className="h-2.5 w-2.5" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-slate-500 hover:text-[#3E8940] rounded-lg" onClick={() => setInputText("/refund ")}>Refund Order</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-slate-500 hover:text-blue-600 rounded-lg" onClick={() => setInputText("/call ")}>Call Rider</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-slate-500 hover:text-emerald-600 rounded-lg" onClick={() => setInputText("/resolve")}>Mark Resolved</Button>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Terminal className={`h-4 w-4 transition-colors ${inputText.startsWith('/') ? 'text-[#3E8940]' : 'text-slate-400'}`} />
                </div>
                <Input 
                  placeholder={inputText.startsWith('/') ? "Type REPL command..." : "Type a message or '/' for commands..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className={`pl-10 pr-24 h-12 rounded-2xl border-slate-200 transition-all ${inputText.startsWith('/') ? 'bg-slate-900 text-emerald-400 font-mono text-xs border-emerald-500/30' : 'bg-slate-50'}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600"><Paperclip className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600"><Smile className="h-4 w-4" /></Button>
                  <Button 
                    onClick={handleSendMessage}
                    className="h-8 px-3 bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl flex items-center gap-2 ml-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-2 italic flex items-center gap-1 px-1">
                <Zap className="h-2.5 w-2.5" /> REPL Enabled: Use /refund, /call, /resolve, /transfer to trigger platform actions.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Chat Selected</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-2">Select a conversation from the left to start helping customers and resolving issues.</p>
          </div>
        )}
      </div>

      {/* Sidebar: Customer Intelligence */}
      <div className="w-80 space-y-4 overflow-y-auto">
        <Card className="rounded-3xl border shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#3E8940]" />
              Customer Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-3 border-4 border-[#3E8940]/10">
                <AvatarFallback className="bg-[#3E8940]/5 text-[#3E8940] text-2xl font-bold">AS</AvatarFallback>
              </Avatar>
              <h4 className="text-lg font-bold text-slate-900">Aniket Sharma</h4>
              <p className="text-xs text-slate-500 mb-2">9876543210 • New Delhi</p>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none px-3 font-bold">TRUSTED CUSTOMER</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Lifetime Value</span>
                <span className="text-sm font-extrabold text-slate-900">₹12,500</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Orders</span>
                <span className="text-sm font-extrabold text-slate-900">28</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Service Rating</span>
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="h-3 w-3 fill-amber-500" />
                  <Star className="h-3 w-3 fill-amber-500" />
                  <Star className="h-3 w-3 fill-amber-500" />
                  <Star className="h-3 w-3 fill-amber-500" />
                  <Star className="h-3 w-3 fill-slate-200 text-slate-200" />
                  <span className="text-xs font-bold ml-1 text-slate-900">4.2</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Issue Rate</span>
                <span className="text-xs font-bold text-emerald-600">3.5% (Low)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Active Order
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-900">ORD-8821</span>
                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-none text-[9px] font-bold">PICKUP PENDING</Badge>
              </div>
              <p className="text-[10px] text-slate-500">Scheduled: 25 Apr, 10:00 AM</p>
            </div>
            
            <div className="space-y-3 py-3 border-y border-slate-100">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-[#3E8940] flex items-center justify-center text-[10px] text-white shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Laundry Basket (Mixed)</p>
                  <p className="text-[10px] text-slate-500">Wash & Fold • 5.5 kg</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-xs font-bold text-slate-400 italic">Processing at facility</p>
                  <p className="text-[10px] text-slate-400">Waiting for arrival</p>
                </div>
              </div>
            </div>

            <Button className="w-full bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl h-10 gap-2 text-xs font-bold">
              View Order Details <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
