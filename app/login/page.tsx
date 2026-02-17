import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] from-emerald-50 via-white to-green-100 font-sans flex items-center justify-center p-4">
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-emerald-200/30 blur-[120px] animate-pulse" />
        <div
          className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-green-200/30 blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full bg-teal-100/30 blur-[120px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-lime-100/20 blur-[100px] animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
