"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import useFetch, { baseUrl } from "../utils/commonFunctions";

const ProductCards: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);

  const { data: catRes } = useFetch<any>(
    `${baseUrl}category/getAllCategories`,
  );

  useEffect(() => {
    if (catRes?.data) {
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    }
  }, [catRes]);

  return (
    <section
      id="collection"
      className="py-2 bg-[#FFFFFF] transition-colors duration-500"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[#EEEEEE] text-xs font-black uppercase tracking-[0.3em] inline-block">
            Handpicked Variations
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-[#222831] tracking-tight">
            Explore Our <span className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5] bg-clip-text text-transparent">Collections</span>
          </h2>
          <p className="text-[#222831] text-sm md:text-base font-medium">
            Discover top-tier curated aesthetics tailored to match your high professional standards.
          </p>
        </div>

        {/* Updated alignment classes here */}
        <div className="flex flex-wrap justify-center gap-6">
          {categories.length === 0 ? (
            <p className="text-[#222831] text-sm text-center w-full">Loading categories...</p>
          ) : (
            categories.map((cat: any) => (
              <Link
                href={`/productsPage?category=${cat._id}`}
                key={cat._id}
                className="relative group rounded-2xl overflow-hidden bg-white border border-[#EEEEEE] shadow-md hover:shadow-2xl transition-all duration-500 ease-in-out flex flex-row h-[340px] w-full sm:w-[calc(50%-12px)] md:w-[calc(25%-18px)] min-w-[250px]"
              >
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={cat.image || "/carousel/Pens.avif"}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-[#222831]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col justify-end transform transition-transform duration-500">
                  <span className="text-[#EEEEEE] text-[10px] font-bold tracking-widest uppercase mb-1 opacity-90">
                    {cat.products?.length || 0} Products
                  </span>
                  <h3 className="text-white text-xl md:text-2xl font-black tracking-tight mb-3 transition-colors group-hover:text-white">
                    {cat.name}
                  </h3>
                  <div className="overflow-hidden max-h-0 opacity-0 group-hover:max-h-12 group-hover:opacity-100 transition-all duration-500 ease-in-out">
                    <div className="flex items-center gap-2 text-xs font-bold text-white/90 border-t border-white/20 pt-3">
                      <span>Explore Shop</span>
                      <ArrowUpRight size={14} className="transform transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#EEEEEE]" />
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#00ADB5]/40 rounded-2xl transition-all duration-500 pointer-events-none z-30" />
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductCards;
