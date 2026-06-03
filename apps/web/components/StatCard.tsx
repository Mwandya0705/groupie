"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
};

export function StatCard({ label, value, icon: Icon, trend, trendUp }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-6 shadow-sm transition-all hover:shadow-xl hover:border-blue-100"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-inkmuted uppercase tracking-wider">{label}</p>
          <p className="mt-4 text-3xl font-bold text-ink tabular-nums">{value}</p>
          
          {trend && (
            <div className={`mt-2 flex items-center text-xs font-bold ${trendUp ? "text-emerald-500" : "text-amber-500"}`}>
              {trendUp ? "↑" : "↓"} {trend}
              <span className="ml-1 font-normal text-inkmuted">vs last month</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="rounded-xl bg-canvas p-3 text-blue-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
            <Icon size={24} />
          </div>
        )}
      </div>
      
      {/* Decorative Gradient Flare */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-50/50 blur-3xl" />
    </motion.div>
  );
}
