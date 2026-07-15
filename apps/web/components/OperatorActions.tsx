"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, UserX, UserCheck, Shield } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  role: string;
  department: string | null;
  last_login: string | null;
  authorized: boolean;
};

type Props = {
  profile: Profile;
  currentUserId: string; // To prevent admin from deauthorizing/deleting themselves
};

export function OperatorActions({ profile, currentUserId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const isSelf = profile.id === currentUserId;

  const handleToggleAuthorization = async () => {
    if (isSelf) return;
    setLoading(true);
    try {
      const nextAuth = !profile.authorized;
      const { error } = await supabase
        .from("profiles")
        .update({ authorized: nextAuth })
        .eq("id", profile.id);

      if (error) throw error;
      router.refresh();
    } catch (e: any) {
      alert("Failed to update authorization: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    setLoading(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", profile.id);

      if (error) throw error;
      router.refresh();
    } catch (e: any) {
      alert("Failed to change role: " + (e?.message || e));
    }
  };

  const handleDeleteOperator = async () => {
    if (isSelf) return;
    if (!confirm(`Are you sure you want to remove ${profile.full_name || "this operator"} from the registry? This will delete their profile.`)) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);

      if (error) throw error;
      router.refresh();
    } catch (e: any) {
      alert("Failed to delete user profile: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-3">
      {/* 1. Dynamic Authorization Status Badge / Toggle */}
      <button
        disabled={loading || isSelf}
        onClick={handleToggleAuthorization}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
          isSelf ? "opacity-50 cursor-not-allowed border-hairline bg-surface" : ""
        } ${
          profile.authorized
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 animate-pulse"
        }`}
        title={profile.authorized ? "Click to Deauthorize user" : "Click to Authorize user"}
      >
        {profile.authorized ? (
          <>
            <UserCheck className="h-3 w-3" />
            Clearance: Active
          </>
        ) : (
          <>
            <ShieldAlert className="h-3 w-3" />
            Clearance: Pending
          </>
        )}
      </button>

      {/* 2. Role Selector dropdown */}
      <div className="relative flex items-center bg-surface border border-hairline rounded-xl px-2 py-1 text-xs">
        <Shield className="h-3.5 w-3.5 text-accent mr-1.5" />
        <select
          value={profile.role}
          onChange={(e) => handleChangeRole(e.target.value)}
          className="bg-transparent text-ink font-bold outline-none cursor-pointer pr-1"
          title="Change Operator Role"
        >
          <option value="operator" className="bg-surface1 text-ink">Operator</option>
          <option value="supervisor" className="bg-surface1 text-ink">Supervisor</option>
          <option value="admin" className="bg-surface1 text-ink">Admin</option>
          <option value="guest" className="bg-surface1 text-ink">Guest</option>
        </select>
      </div>

      {/* 3. Delete operator */}
      <button
        disabled={loading || isSelf}
        onClick={handleDeleteOperator}
        className={`p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-red-400 transition-all ${
          isSelf ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Remove Operator"
      >
        <UserX className="h-4 w-4" />
      </button>
    </div>
  );
}
