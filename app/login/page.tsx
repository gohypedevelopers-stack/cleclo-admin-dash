import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-full w-full overflow-hidden bg-gradient-to-br from-green-50 via-[#f0fdf4] to-emerald-100 font-sans flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-green-200/20 blur-3xl animate-float-slow" />
        <div
          className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-teal-200/20 blur-3xl animate-float-slow"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50">
        <LoginForm />
      </div>
    </div>
  );
}
