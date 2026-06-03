"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MapPin, 
  ClipboardList, 
  Zap, 
  Anchor, 
  Cpu, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Database, 
  Bell, 
  FileText, 
  Settings,
  Menu,
  ChevronLeft
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Live Patrols", icon: MapPin, href: "/dashboard/patrols" },
  { label: "Incident Management", icon: ClipboardList, href: "/dashboard/incidents" },
  { label: "Hotspot Analytics", icon: Zap, href: "/dashboard/hotspots" },
  { label: "Vessel Monitoring", icon: Anchor, href: "/dashboard/vessels" },
  { label: "AI Recognition", icon: Cpu, href: "/dashboard/ai" },
  { label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
  { label: "User Management", icon: Users, href: "/dashboard/users" },
  { label: "Roles & Permissions", icon: ShieldCheck, href: "/dashboard/roles" },
  { label: "Sync Monitor", icon: Database, href: "/dashboard/sync" },
  { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
  { label: "Audit Logs", icon: FileText, href: "/dashboard/audit" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = React.useState<{ full_name: string; role: string; email: string } | null>(null);

  React.useEffect(() => {
    async function getUser() {
      const { createClient } = await import("../lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
        
        setUserProfile({
          full_name: profile?.full_name || user.email?.split('@')[0] || "User",
          role: profile?.role || "guest",
          email: user.email || ""
        });
      }
    }
    getUser();
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-hairline bg-surface text-inkmuted">
      <div className="flex h-full flex-col px-4 py-6">
        {/* Header */}
        <div className="mb-8 px-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-inkmuted">
            {userProfile?.role === 'admin' ? "System Administrator" : "Verifying Access..."}
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            // Strictly hide navigation items if not confirmed admin
            if (userProfile?.role !== 'admin') {
              return null;
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-surface2 text-accent shadow-sm" 
                    : "hover:bg-surface2/50 hover:text-ink"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-accent" : "text-inkmuted")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="mt-auto border-t border-hairline pt-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs border border-accent/20 shadow-inner">
              {userProfile?.full_name?.slice(0, 2).toUpperCase() || "??"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-ink truncate">{userProfile?.full_name || "Administrator"}</span>
              <span className="text-[10px] uppercase font-bold tracking-tighter text-accent/70">{userProfile?.role || "Authenticating..."}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
