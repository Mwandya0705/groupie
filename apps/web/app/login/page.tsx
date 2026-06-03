"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { Shield, Mail, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // Can be email or username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    let loginEmail = identifier.trim();

    // If identifier doesn't look like an email, try to find the email by username
    if (!loginEmail.includes("@")) {
      const { data: profile, error: usernameError } = await supabase
        .from("profiles")
        .select("email")
        .ilike("username", loginEmail)
        .single();

      if (usernameError || !profile?.email) {
        setError("Invalid username or email.");
        setLoading(false);
        return;
      }
      loginEmail = profile.email;
    }
    
    // 1. Authenticate
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
      email: loginEmail, 
      password 
    });
    
    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "Invalid identifier or security passcode." : signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. Check Role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        // 3. Deny access if not admin
        await supabase.auth.signOut();
        setError("Access Denied: Only System Administrators can access the web dashboard.");
        setLoading(false);
        return;
      }
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-canvas p-6 text-inkmuted">
      <div className="fixed right-6 top-6 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-hairline bg-surface p-10 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Shield className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Administrator Portal</h1>
          <p className="mt-2 text-sm text-inkmuted">IUU Surveillance System Management</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-inkmuted">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" />
              <input 
                className="w-full rounded-lg border border-hairline bg-canvas py-3 pl-10 pr-4 text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/50 transition-all" 
                placeholder="iuuadmin@gmail.com or admin_user" 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-inkmuted">Security Passcode</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" />
              <input
                className="w-full rounded-lg border border-hairline bg-canvas py-3 pl-10 pr-12 text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-inkmuted hover:text-inkmuted transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button 
            className="w-full rounded-lg bg-accent py-3.5 font-bold text-ink transition-all hover:bg-accent active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-accent/10" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Verifying Credentials..." : "Authenticate"}
          </button>
        </form>

        <div className="text-center">
          <a href="/signup" className="text-sm text-accent hover:text-accent hover:underline transition-all">
            Setup New Administrator Account
          </a>
        </div>

        <div className="pt-4 text-center border-t border-hairline/50">
          <p className="text-xs text-inkmuted">
            Unauthorized access is strictly monitored and logged.
          </p>
        </div>
      </div>
    </main>
  );
}
