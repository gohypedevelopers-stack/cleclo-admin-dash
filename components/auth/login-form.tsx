"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Store, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { motion } from "framer-motion";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");

  function handleLogin() {
    if (identifier === "cleclo@admin.com" && password === "1234567890") {
      localStorage.setItem("admin_auth_token", "admin-session-active");
      toast.success("Login Successful", {
        description: "Welcome back, Super Admin.",
      });
      router.push("/");
    } else {
      toast.error("Invalid Credentials", {
        description: "Please check your email and password.",
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <div className="bg-white/70 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 relative overflow-hidden group">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-linear-to-br from-white/40 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center space-y-3 mb-10">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="mx-auto w-20 h-20 bg-linear-to-br from-[#3E8940]/10 to-[#3E8940]/5 rounded-3xl flex items-center justify-center mb-6 shadow-[inset_0_2px_10px_rgba(62,137,64,0.1)] ring-1 ring-[#3E8940]/20"
            >
              <Store className="w-10 h-10 text-[#3E8940] drop-shadow-[0_2px_4px_rgba(62,137,64,0.2)]" />
            </motion.div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 font-quicksand">
              Welcome Back
            </h1>
            <p className="text-base text-gray-500 max-w-xs mx-auto leading-relaxed font-poppins font-medium">
              Access your admin portal and manage the platform.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="identifier"
                className="text-xs font-bold uppercase tracking-[0.15em] text-[#3E8940] ml-1"
              >
                Mobile or Email
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-4.5 text-gray-400 group-focus-within:text-[#3E8940] transition-colors duration-300">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@cleclo.com"
                  className="pl-12 h-14 bg-white/50 border-gray-100 hover:border-gray-200 focus:bg-white focus:border-[#3E8940] focus:ring-4 focus:ring-[#3E8940]/5 transition-all duration-300 rounded-2xl placeholder:text-gray-300 font-poppins text-base"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-[0.15em] text-[#3E8940] ml-1"
                >
                  Password
                </Label>
                <a
                  href="#"
                  className="text-xs font-bold text-[#3E8940]/80 hover:text-[#3E8940] transition-colors duration-300"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-4.5 text-gray-400 group-focus-within:text-[#3E8940] transition-colors duration-300">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-14 bg-white/50 border-gray-100 hover:border-gray-200 focus:bg-white focus:border-[#3E8940] focus:ring-4 focus:ring-[#3E8940]/5 transition-all duration-300 rounded-2xl placeholder:text-gray-300 font-poppins text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4.5 text-gray-400 hover:text-[#3E8940] focus:outline-none transition-colors duration-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  onClick={handleLogin}
                  className="w-full h-14 text-lg font-bold bg-linear-to-r from-[#3E8940] to-[#2E6A30] hover:from-[#3E8940] hover:to-[#3E8940] text-white shadow-[0_10px_30px_rgba(62,137,64,0.3)] hover:shadow-[0_15px_35px_rgba(62,137,64,0.4)] transition-all duration-300 rounded-2xl border-none font-quicksand"
                >
                  Secure Login
                </Button>
              </motion.div>

              <div className="mt-8 text-center">
                <p className="text-xs font-bold text-gray-400 flex items-center justify-center gap-2 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Platform Security Verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
