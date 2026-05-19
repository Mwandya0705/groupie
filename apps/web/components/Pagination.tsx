"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export default function Pagination({ totalPages, currentPage }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page));
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg bg-[#0d1b2a] border border-slate-800 text-slate-400 disabled:opacity-30 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`h-10 w-10 rounded-lg border text-sm font-bold transition-all ${
              currentPage === page
                ? "bg-teal-600 border-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                : "bg-[#0d1b2a] border-slate-800 text-slate-500 hover:text-white hover:border-slate-700"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg bg-[#0d1b2a] border border-slate-800 text-slate-400 disabled:opacity-30 hover:text-white transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
