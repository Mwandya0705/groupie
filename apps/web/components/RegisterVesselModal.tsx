"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import { Ship, X, Plus } from "lucide-react";

export function RegisterVesselModal() {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vesselType, setVesselType] = useState("trawler");
  const [status, setStatus] = useState("authorized");
  const [ownerInfo, setOwnerInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !registrationNumber) {
      alert("Name and Registration Number are required.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("vessels")
        .insert({
          name: name.trim(),
          registration_number: registrationNumber.trim().toUpperCase(),
          vessel_type: vesselType,
          status,
          owner_info: ownerInfo.trim() || null,
          last_sighted: new Date().toISOString()
        });

      if (error) throw error;
      
      // Reset form & close modal
      setName("");
      setRegistrationNumber("");
      setVesselType("trawler");
      setStatus("authorized");
      setOwnerInfo("");
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      alert("Failed to register vessel: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-ink font-bold text-xs hover:bg-accent/80 transition-all shadow-lg shadow-accent/20 uppercase tracking-widest"
      >
        <Plus className="h-4 w-4" />
        Register Vessel
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm animate-in fade-in duration-300">
          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-surface border border-hairline rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface2/30">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Ship className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">New Vessel Registration</h3>
                  <p className="text-xs text-inkmuted">Register a vessel into the surveillance watch registry.</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg border border-hairline text-inkmuted hover:text-ink hover:bg-surface2 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-inkmuted uppercase tracking-wider">Vessel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue Fin II"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-inkmuted uppercase tracking-wider">Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REG-7749"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full bg-surface2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-inkmuted uppercase tracking-wider">Vessel Type</label>
                  <select
                    value={vesselType}
                    onChange={(e) => setVesselType(e.target.value)}
                    className="w-full bg-surface2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                  >
                    <option value="trawler">Trawler</option>
                    <option value="longliner">Longliner</option>
                    <option value="cargo">Cargo Carrier</option>
                    <option value="speedboat">Speedboat</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-inkmuted uppercase tracking-wider">Surveillance Clearance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "authorized", label: "Authorized", color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10" },
                    { val: "investigating", label: "Investigating", color: "border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10" },
                    { val: "blacklisted", label: "Blacklisted", color: "border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10" }
                  ].map((option) => (
                    <button
                      key={option.val}
                      type="button"
                      onClick={() => setStatus(option.val)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-wider ${
                        status === option.val
                          ? option.val === "authorized" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10"
                            : option.val === "investigating" ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10"
                            : "bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/10"
                          : "border-hairline text-inkmuted hover:text-ink hover:bg-surface2"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-inkmuted uppercase tracking-wider">Owner Credentials & Information</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Zanzibar Marine Ltd (Contact: +255 777...)"
                  value={ownerInfo}
                  onChange={(e) => setOwnerInfo(e.target.value)}
                  className="w-full bg-surface2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-hairline/50 pt-5 mt-5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-hairline text-xs font-bold text-inkmuted hover:text-ink hover:bg-surface2 transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-accent px-5 py-2 text-ink font-bold text-xs hover:bg-accent/80 transition-all shadow-lg shadow-accent/20 uppercase tracking-widest"
                >
                  {loading ? "Registering..." : "Add to Registry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
