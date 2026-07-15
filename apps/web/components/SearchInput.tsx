"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

type Props = {
  placeholder?: string;
};

export function SearchInput({ placeholder = "Search incidents..." }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}` as any);
    });
  };

  return (
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-inkmuted group-focus-within:text-accent transition-colors" />
      <input
        className="bg-surface border border-hairline rounded-xl py-2.5 pl-10 pr-4 text-sm text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/30 w-64"
        placeholder={placeholder}
        defaultValue={searchParams.get("q") || ""}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-accent font-bold uppercase tracking-widest animate-pulse">
          Filtering
        </span>
      )}
    </div>
  );
}
