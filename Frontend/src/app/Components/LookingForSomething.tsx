"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, TrendingUp } from "lucide-react";

const quickTags = [
  "Customized T-Shirts",
  "Printed Mugs",
  "Cricket Jerseys",
  "Birthday Gifts",
  "Corporate Uniforms",
  "Photo Frames",
  "Keychains",
  "Hoodies",
];

const LookingForSomething: React.FC = () => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    router.push(`/productsPage?search=${encodeURIComponent(query)}`);
  };

  const handleTagClick = (tag: string) => {
    router.push(`/productsPage?search=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50/80">
      <div className="max-w-3xl mx-auto px-4 text-center">
        {/* Decorative top line */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-px w-8 bg-[#00ADB5]" />
          <TrendingUp size={14} className="text-[#00ADB5]" />
          <span className="h-px w-8 bg-[#00ADB5]" />
        </div>

        {/* Heading */}
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00ADB5] mb-3 inline-block">
          Need Help Finding Something?
        </span>
        <h2 className="text-2xl md:text-4xl font-black text-[#222831] leading-tight mb-3">
          Looking for Something{" "}
          <span className="relative">
            <span className="text-[#00ADB5]">Else?</span>
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#00ADB5]/20 rounded-full" />
          </span>
        </h2>
        <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
          Can&apos;t find what you&apos;re looking for? Search below or browse our popular categories to discover exactly what you need.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-10 max-w-xl mx-auto">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#00ADB5]/30 focus-within:border-[#00ADB5] focus-within:ring-2 focus-within:ring-[#00ADB5]/15 focus-within:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="pl-4 pr-2 text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search for any product..."
              className="flex-1 py-3.5 pr-2 text-sm text-[#222831] bg-transparent outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-[#00ADB5] hover:bg-[#0099a1] active:bg-[#008a92] text-white font-bold px-5 py-3.5 text-sm transition-all active:scale-[0.98]"
            >
              <span>Search</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Quick Tags */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {quickTags.map((tag, i) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              style={{ animationDelay: `${i * 50}ms` }}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-[#00ADB5] hover:text-[#00ADB5] hover:bg-[#00ADB5]/5 hover:shadow-sm active:scale-95 transition-all duration-200 animate-fade-in"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInTag {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeInTag 0.3s ease-out both;
        }
      `}</style>
    </section>
  );
};

export default LookingForSomething;
