"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Scheme = "dark" | "light";

function apply(scheme: Scheme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(scheme);
  try {
    localStorage.setItem("theme", scheme);
  } catch {}
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [scheme, setScheme] = useState<Scheme>("dark");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem("theme")) as Scheme | null;
    const initial: Scheme = stored ?? (document.documentElement.classList.contains("light") ? "light" : "dark");
    setScheme(initial);
  }, []);

  const toggle = () => {
    const next: Scheme = scheme === "dark" ? "light" : "dark";
    setScheme(next);
    apply(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={
        compact
          ? "flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface2 text-ink transition hover:bg-surface3"
          : "flex items-center gap-2 rounded-pill border border-hairline bg-surface2 px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface3"
      }
    >
      {scheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && <span>{scheme === "dark" ? "Light" : "Dark"}</span>}
    </button>
  );
}
