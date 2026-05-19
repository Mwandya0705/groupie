"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { Shield, Mail, Lock, AlertTriangle, Eye, EyeOff } from "lucide-react";

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
    <main className="flex min-h-screen w-full items-center justify-center bg-[#060e17] p-6 text-slate-300">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-[#0d1b2a] p-10 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
            <Shield className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Administrator Portal</h1>
          <p className="mt-2 text-sm text-slate-400">IUU Surveillance System Management</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input 
                className="w-full rounded-lg border border-slate-800 bg-[#060e17] py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all" 
                placeholder="iuuadmin@gmail.com or admin_user" 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Passcode</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full rounded-lg border border-slate-800 bg-[#060e17] py-3 pl-10 pr-12 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
            className="w-full rounded-lg bg-teal-600 py-3.5 font-bold text-white transition-all hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-teal-500/10" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Verifying Credentials..." : "Authenticate"}
          </button>
        </form>

        <div className="text-center">
          <a href="/signup" className="text-sm text-teal-400 hover:text-teal-300 hover:underline transition-all">
            Setup New Administrator Account
          </a>
        </div>

        <div className="pt-4 text-center border-t border-slate-800/50">
          <p className="text-xs text-slate-500">
            Unauthorized access is strictly monitored and logged.
          </p>
        </div>
      </div>
    </main>
  );
}
