"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Store, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");

  function handleLogin() {
    if (identifier === "cleclo@vender.com" && password === "123456789") {
      router.push("/dashboard");
    } else if (identifier === "cleclo@admin.com" && password === "123456789") {
      router.push("/admin");
    } else {
      // For demo purposes, allow any login
      router.push("/analytics");
      // alert("Invalid credentials. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 relative">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-green-100 transform hover:rotate-10 transition-transform duration-300">
          <Store className="w-8 h-8 text-primary drop-shadow-sm" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome Back
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Enter your credentials to access your admin portal and manage the
          platform.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="identifier"
            className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1"
          >
            Mobile or Email
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">
              <User className="h-5 w-5" />
            </div>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@cleclo.com"
              className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1"
            >
              Password
            </Label>
            <a
              href="#"
              className="text-xs font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              Forgot Password?
            </a>
          </div>
          <div className="relative group">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">
              <Lock className="h-5 w-5" />
            </div>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl placeholder:text-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <Button
            type="button"
            onClick={handleLogin}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 rounded-xl"
          >
            Secure Login
          </Button>

          <div className="pt-2">
            <p className="text-xs text-gray-400 text-center">
              🔒 Your data is encrypted and securely stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
