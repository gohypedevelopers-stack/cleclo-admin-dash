"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ArrowUpAZ,
  Shield,
  Store,
  Wallet,
  Mail,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

const AUTH_URL = "http://localhost:3001";

type Step = "credentials" | "otp";

const ADMIN_ROLES = [
  { value: "super_admin", label: "Super Admin", description: "Full platform oversight with vendor, finance and growth controls.", icon: ShieldCheck },
  { value: "operations_admin", label: "Operations Admin", description: "Operational control across orders, vendors, riders and platform support.", icon: Store },
  { value: "finance_admin", label: "Finance Admin", description: "Finance first access for settlements, payouts, balances and payment visibility.", icon: Wallet },
];

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("credentials");
  const [showPassword, setShowPassword] = React.useState(false);
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("super_admin");
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deliveryChannel, setDeliveryChannel] = React.useState<"email" | "whatsapp">("email");

  // Caps Lock detection
  const [capsLockOn, setCapsLockOn] = React.useState(false);

  // Inline error state
  const [passwordError, setPasswordError] = React.useState("");
  const [identifierError, setIdentifierError] = React.useState("");

  // Captcha state
  const [captchaRequired, setCaptchaRequired] = React.useState(false);
  const [captchaPrompt, setCaptchaPrompt] = React.useState("");
  const [captchaChallengeId, setCaptchaChallengeId] = React.useState("");
  const [captchaAnswer, setCaptchaAnswer] = React.useState("");
  const [failedAttempts, setFailedAttempts] = React.useState(0);

  // OTP step state
  const [otpCode, setOtpCode] = React.useState("");
  const [challengeId, setChallengeId] = React.useState("");
  const [maskedTarget, setMaskedTarget] = React.useState("");
  const [debugOtp, setDebugOtp] = React.useState<string | undefined>(undefined);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  // Last login info
  const [lastLogin, setLastLogin] = React.useState<{
    locationLabel?: string;
    createdAt?: string;
    ipAddress?: string;
  } | null>(null);

  const roleDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close role dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cooldown timer for resend
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Caps lock detection handler
  const handlePasswordKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
    if (e.key === "Enter") handleLogin();
  };

  const selectedRoleInfo = ADMIN_ROLES.find((r) => r.value === selectedRole) || ADMIN_ROLES[0];

  // ─── Step 1: Send credentials, receive OTP challenge ───────────────────────
  async function handleLogin() {
    setPasswordError("");
    setIdentifierError("");

    if (!identifier.trim()) {
      setIdentifierError("Please enter your email or phone number.");
      return;
    }
    if (!password) {
      setPasswordError("Please enter your password.");
      return;
    }

    if (captchaRequired && !captchaAnswer.trim()) {
      toast.error("Security Check", { description: "Please answer the security question." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${AUTH_URL}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          requestedRole: selectedRole,
          deliveryChannel,
          captchaChallengeId: captchaRequired ? captchaChallengeId : undefined,
          captchaAnswer: captchaRequired ? captchaAnswer : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle Captcha Required (403 or specific fields)
        if (data.captchaRequired) {
          setCaptchaRequired(true);
          setCaptchaPrompt(data.captcha.prompt);
          setCaptchaChallengeId(data.captcha.challengeId);
          setFailedAttempts(data.failedAttempts || 0);
          setCaptchaAnswer("");
          toast.info("Security verification required due to multiple failed attempts.");
          return;
        }

        // Inline error messages based on field
        if (data.field === "password") {
          setPasswordError(data.message || "Incorrect password. Please try again.");
        } else if (data.field === "identifier") {
          setIdentifierError(data.message || "Account not found.");
        } else if (data.field === "requestedRole") {
          toast.error("Role Mismatch", { description: data.message });
        } else if (response.status === 429) {
          toast.error("Account Locked", {
            description: data.message || "Too many failed attempts. Try again later.",
          });
        } else {
          setPasswordError(data.message || "Login failed. Check your credentials.");
        }

        if (data.failedAttempts) {
          setFailedAttempts(data.failedAttempts);
        }
        return;
      }

      // Success — OTP was sent
      if (data.requiresOtp) {
        setChallengeId(data.challengeId);
        setMaskedTarget(data.maskedTarget || "your email");
        setDebugOtp(data.debugOtp);
        setResendCooldown(30);

        if (data.previousLogin) {
          setLastLogin(data.previousLogin);
        }

        setStep("otp");
        toast.success("OTP Sent", {
          description: `A verification code was sent to ${data.maskedTarget || "your email"}.`,
        });
      }
    } catch {
      toast.error("Service Unavailable", {
        description: "Cannot reach auth service. Please ensure backend is running.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Step 2: Verify OTP, receive JWT ───────────────────────────────────────
  async function handleVerifyOtp() {
    if (!otpCode.trim()) {
      toast.error("Missing OTP", { description: "Please enter the verification code." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${AUTH_URL}/auth/admin/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, otpCode: otpCode.trim(), rememberMe }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error("Verification Failed", {
          description: data?.message || "Invalid or expired OTP.",
        });
        return;
      }

      // Store token and user info
      localStorage.setItem("admin_auth_token", data.token);
      localStorage.setItem(
        "admin_user",
        JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          adminRole: data.user.adminRole || selectedRole,
        })
      );

      if (data.permissions) {
        localStorage.setItem("admin_permissions", JSON.stringify(data.permissions));
      }

      if (data.security) {
        localStorage.setItem("admin_security", JSON.stringify(data.security));
      }

      toast.success("Login Successful", {
        description: `Welcome back, ${data.user.name || "Admin"}.`,
      });

      // Redirect based on role
      const defaultRoute = data.permissions?.defaultRoute || "/";
      router.push(defaultRoute);
    } catch {
      toast.error("Service Unavailable", {
        description: "Cannot reach auth service. Please ensure backend is running.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setOtpCode("");
    setStep("credentials");
    await handleLogin();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === "credentials") handleLogin();
      else handleVerifyOtp();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <div className="bg-white/95 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
        <div className="relative z-10">
          {/* Header with Cleclo Logo */}
          <div className="text-center space-y-3 mb-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="mx-auto mb-6"
            >
              {step === "otp" ? (
                <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center shadow-sm border border-green-100">
                  <ShieldCheck className="w-10 h-10 text-[#3E8940]" />
                </div>
              ) : (
                <div className="mx-auto w-fit bg-white px-10 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Cleclo"
                    width={160}
                    height={55}
                    className="h-10 w-auto object-contain"
                    priority
                  />
                </div>
              )}
            </motion.div>

            <h2 className="text-[11px] font-bold text-[#3E8940] uppercase tracking-[0.25em]">
              {step === "otp" ? "SECURITY VERIFICATION" : "ADMIN DASHBOARD"}
            </h2>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-quicksand mt-2">
              {step === "otp" ? "Verify Identity" : "Welcome Back"}
            </h1>
            <p className="text-[13px] text-slate-500 max-w-md mx-auto leading-relaxed font-medium mt-3">
              {step === "otp"
                ? `Enter the 6-digit code sent to ${maskedTarget}`
                : "Securely access your Cleclo Admin Dashboard to manage vendors, services and platform operations."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* ─── Role Selector Grid ──────────────────────────────── */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3E8940]">
                    Access Role
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ADMIN_ROLES.map((role) => {
                      const isSelected = selectedRole === role.value;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setSelectedRole(role.value)}
                          className={`flex flex-col items-start text-left p-4 rounded-2xl border transition-all duration-300 ${
                            isSelected
                              ? "border-[#3E8940] bg-[#3E8940]/5 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 transition-colors ${
                              isSelected ? "bg-[#3E8940]/10" : "bg-slate-100"
                            }`}
                          >
                            <role.icon
                              className={`w-4 h-4 ${isSelected ? "text-[#3E8940]" : "text-slate-400"}`}
                            />
                          </div>
                          <p className="text-sm font-semibold text-slate-900 mb-1">{role.label}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed pr-2">
                            {role.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── Email ──────────────────────────────── */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3E8940]">
                    Mobile or Email
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-4 text-slate-400 group-focus-within:text-[#3E8940] transition-colors duration-300 h-5 w-5" />
                    <Input
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setIdentifierError("");
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="admin@cleclo.com"
                      className={`pl-12 h-14 bg-white border-slate-200 focus:border-[#3E8940] focus:ring-4 focus:ring-[#3E8940]/5 transition-all duration-300 rounded-2xl text-sm ${
                        identifierError ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""
                      }`}
                    />
                  </div>
                  {identifierError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 font-medium flex items-center gap-1.5"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {identifierError}
                    </motion.p>
                  )}
                </div>

                {/* ─── Password ──────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3E8940]">
                      Password
                    </Label>
                    <a href="#" className="text-[11px] font-bold text-[#3E8940]/80 hover:text-[#3E8940]">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-[#3E8940] transition-colors duration-300 h-5 w-5" />
                    <Input
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError("");
                      }}
                      onKeyDown={handlePasswordKeyEvent}
                      onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className={`pl-12 pr-12 h-14 bg-white border-slate-200 focus:border-[#3E8940] focus:ring-4 focus:ring-[#3E8940]/5 transition-all duration-300 rounded-2xl text-sm ${
                        passwordError ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-[#3E8940]"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Caps Lock Warning */}
                  <AnimatePresence>
                    {capsLockOn && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-1.5"
                      >
                        <ArrowUpAZ className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-[11px] text-amber-600 font-bold uppercase">Caps Lock is ON</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inline Password Error */}
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 font-medium flex items-center gap-1.5"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {passwordError}
                    </motion.p>
                  )}

                  {/* Attempts remaining warning */}
                  {failedAttempts > 0 && failedAttempts < 5 && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      ⚠ {5 - failedAttempts} attempt{5 - failedAttempts !== 1 ? "s" : ""} remaining before lockout
                    </p>
                  )}
                </div>

                {/* ─── Captcha Section ──────────────────────────────── */}
                <AnimatePresence>
                  {captchaRequired && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-1"
                    >
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1">
                          <p className="text-sm font-bold text-amber-800 uppercase tracking-wider leading-none">
                            Security Verification
                          </p>
                          <p className="text-sm text-amber-700 font-medium leading-relaxed">{captchaPrompt}</p>
                          <Input
                            placeholder="Type your answer here..."
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500/20 h-10 rounded-xl placeholder:text-amber-200 font-bold text-amber-900"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Two-Factor Verification ──────────────────────────────── */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3E8940]">
                    Two-Factor Verification
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryChannel("email")}
                      className={`flex flex-col items-start text-left p-4 rounded-2xl border transition-all duration-300 ${
                        deliveryChannel === "email"
                          ? "border-[#3E8940] bg-[#3E8940]/5 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 transition-colors ${
                          deliveryChannel === "email" ? "bg-[#3E8940]/10" : "bg-slate-100"
                        }`}
                      >
                        <Mail
                          className={`w-4 h-4 ${deliveryChannel === "email" ? "text-[#3E8940]" : "text-slate-400"}`}
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">OTP on Email</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed pr-2">
                        Send the verification code to your admin email.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryChannel("whatsapp")}
                      className={`flex flex-col items-start text-left p-4 rounded-2xl border transition-all duration-300 ${
                        deliveryChannel === "whatsapp"
                          ? "border-[#3E8940] bg-[#3E8940]/5 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 transition-colors ${
                          deliveryChannel === "whatsapp" ? "bg-[#3E8940]/10" : "bg-slate-100"
                        }`}
                      >
                        <MessageCircle
                          className={`w-4 h-4 ${deliveryChannel === "whatsapp" ? "text-[#3E8940]" : "text-slate-400"}`}
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">OTP on WhatsApp</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed pr-2">
                        Deliver the code to the registered WhatsApp number.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 cursor-pointer">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="border-slate-300 data-[state=checked]:bg-[#3E8940] data-[state=checked]:border-[#3E8940] w-5 h-5 rounded-md"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-semibold text-slate-700 hover:text-[#3E8940] cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                </div>

                <div className="pt-2">
                  <motion.div whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: 0.985 }} className="w-full">
                    <Button
                      type="button"
                      onClick={handleLogin}
                      disabled={isLoading}
                      className="w-full h-14 text-base font-bold bg-[#3E8940] hover:bg-[#327333] text-white rounded-2xl transition-all duration-300 shadow-sm"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2.5">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </div>
                      ) : (
                        "Secure Login"
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Last Login Info */}
                {lastLogin?.createdAt && (
                  <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 text-center space-y-1">
                    <p className="text-[11px] text-blue-500 font-bold uppercase tracking-widest">Last Login</p>
                    <p className="text-sm text-blue-800 font-semibold">
                      {new Date(lastLogin.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {lastLogin.locationLabel && (
                      <p className="text-xs text-blue-600">{lastLogin.locationLabel}</p>
                    )}
                  </div>
                )}

                {debugOtp && (
                  <div className="bg-[#3E8940]/10 border border-[#3E8940]/20 rounded-2xl p-4 text-center">
                    <p className="text-xs text-[#3E8940] font-bold uppercase tracking-widest mb-1">
                      Development Mode OTP
                    </p>
                    <p className="text-3xl font-black text-[#3E8940] tracking-[0.2em]">{debugOtp}</p>
                  </div>
                )}

                <div className="space-y-3 text-center">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-[#3E8940] block mb-2">
                    Code Verification
                  </Label>
                  <Input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={handleKeyDown}
                    placeholder="000 000"
                    maxLength={6}
                    className="h-16 bg-white border-slate-200 focus:border-[#3E8940] focus:ring-4 focus:ring-[#3E8940]/5 transition-all rounded-2xl text-3xl text-center font-bold tracking-[0.5em] placeholder:text-slate-200"
                  />
                </div>

                <div className="pt-2 space-y-4">
                  <motion.div whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: 0.985 }}>
                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isLoading || otpCode.length < 4}
                      className="w-full h-14 text-base font-bold bg-[#3E8940] hover:bg-[#327333] text-white rounded-2xl transition-all duration-300 shadow-sm"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2.5">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        "Verify Identity"
                      )}
                    </Button>
                  </motion.div>

                  <div className="flex items-center justify-between text-sm px-2">
                    <button
                      type="button"
                      onClick={() => setStep("credentials")}
                      className="text-slate-500 font-bold hover:text-slate-800 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="flex items-center gap-2 text-[#3E8940] font-bold disabled:opacity-50 transition-opacity"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${resendCooldown === 0 ? "hover:rotate-180 transition-transform duration-500" : ""}`}
                      />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-8 pt-6 flex items-center justify-center gap-3 border-t border-slate-50">
            <div className="flex items-center gap-2 text-slate-400">
              <Lock className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
                Encrypted Access | Role-Based Security Enabled
              </span>
            </div>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
