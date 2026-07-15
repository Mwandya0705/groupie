"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { User, Mail, Lock, Shield, Eye, EyeOff, Activity } from "lucide-react";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("operator");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    // Check if username is taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      setStatus("Error: This username is already taken. Please choose another.");
      setLoading(false);
      return;
    }
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
          role: role
        }
      }
    });

    setLoading(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Account created successfully! Redirecting...");
    setTimeout(() => window.location.href = "/dashboard", 2000);
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    // Create a temporary guest account or just redirect with metadata
    // For simplicity, we'll create a structured guest identity
    const guestId = `guest_${Math.floor(Math.random() * 10000)}`;
    const guestEmail = `${guestId}@guest.iuu`;
    const { error } = await supabase.auth.signUp({
      email: guestEmail,
      password: "GuestPassword123!",
      options: {
        data: {
          full_name: "Anonymous Guest",
          username: "Guest",
          role: "guest"
        }
      }
    });

    if (error) {
      setStatus("Guest access error: " + error.message);
      setLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-hairline bg-surface p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Join IUU Surveillance</h1>
          <p className="mt-2 text-sm text-inkmuted">Create your officer or guest account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-inkmuted">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" />
              <input 
                className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/50" 
                placeholder="John Doe" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-inkmuted">Username</label>
            <div className="relative">
              <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" />
              <input 
                className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/50" 
                placeholder="johndoe88" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-inkmuted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" />
              <input 
                className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/50" 
                placeholder="admin@iuu.surveillance" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-inkmuted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" />
              <input
                className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-12 text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/50"
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

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-inkmuted">Assigned Role</label>
            <select 
              className="w-full rounded-lg border border-hairline bg-canvas py-2.5 px-3 text-ink outline-none focus:ring-2 focus:ring-accent/50"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="operator">Operator</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>

          {status ? (
            <div className={`rounded-lg p-3 text-sm ${status.includes("successfully") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {status}
            </div>
          ) : null}

          <div className="space-y-3 pt-2">
            <button 
              className="w-full rounded-lg bg-accent py-3 font-bold text-ink transition-all hover:bg-accent disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            
            <button 
              onClick={handleGuestAccess}
              type="button"
              className="w-full rounded-lg border border-hairline bg-surface2/30 py-3 font-bold text-inkmuted transition-all hover:bg-surface2 hover:text-ink disabled:opacity-50"
              disabled={loading}
            >
              Proceed as Guest
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-inkmuted">
          Already have an account? <a href="/login" className="text-accent hover:underline">Log in</a>
        </div>
      </div>
    </main>
  );
}
