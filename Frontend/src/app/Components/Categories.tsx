"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import useFetch, { baseUrl } from "../utils/commonFunctions";

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);

  const { data: catRes } = useFetch<any>(
    `${baseUrl}category/getAllCategories`,
  );

  useEffect(() => {
    if (catRes?.data) {
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    }
  }, [catRes]);

  const displayCats = categories;

  return (
    <section className="py-8 md:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-6">
          <span className="h-px w-6 bg-[#C8A84E]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A84E]">
            Shop by Category
          </span>
          <span className="h-px flex-1 bg-gray-100" />
        </div>

        {/* Circular Icon Strip */}
        <div className="flex flex-wrap justify-center gap-5 md:gap-8">
          {displayCats.map((cat: any) => (
            <Link
              href={`/productsPage?category=${cat._id}`}
              key={cat._id}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#C8A84E] transition-all duration-300 shadow-sm group-hover:shadow-md">
                <img
                  src={cat.image || "/carousel/Clothes.jpg"}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="text-[11px] md:text-xs font-bold text-[#222831] group-hover:text-[#C8A84E] transition-colors text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
