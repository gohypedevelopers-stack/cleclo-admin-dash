import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50/50 via-white to-green-50/50 font-sans flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <LoginForm />
      </div>
    </div>
  );
}
