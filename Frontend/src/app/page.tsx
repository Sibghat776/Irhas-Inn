// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import Carousel from "./Components/Carousel";
import TrustBadges from "./Components/TrustBadges";
import Categories from "./Components/Categories";
import PromoBanner from "./Components/PromoBanner";
import Products from "./Components/Products";
import ProductSpotlight from "./Components/ProductSpotlight";
import CategoryProductRow from "./Components/CategoryProductRow";
import LookingForSomething from "./Components/LookingForSomething";
import About from "./Components/About";
import Contact from "./Components/Contact";
import { baseUrl } from "./utils/commonFunctions";

interface BannerData {
  _id: string;
  image: string;
  title?: string;
  subtitle?: string;
  categoryRef?: { _id: string; name: string; slug: string } | null;
}

export default function Home() {
  const pathname = usePathname();
  const [catBanners, setCatBanners] = useState<Record<string, string>>({});
  const [brandBanner, setBrandBanner] = useState<BannerData | null>(null);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // Fetch category banners
        const catRes = await axios.get(
          `${baseUrl}homepage-banners?type=categoryBanner`,
        );
        const catData = catRes.data?.data;
        if (Array.isArray(catData)) {
          const lookup: Record<string, string> = {};
          catData.forEach((banner: BannerData) => {
            if (banner.title) {
              lookup[banner.title] = banner.image;
            }
          });
          setCatBanners(lookup);
        }

        // Fetch brand banner
        const brandRes = await axios.get(
          `${baseUrl}homepage-banners?type=brandBanner`,
        );
        const brandData = brandRes.data?.data;
        if (Array.isArray(brandData) && brandData.length > 0) {
          setBrandBanner(brandData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch banners:", err);
      }
    };
    fetchBanners();
  }, []);

  // Helper to resolve a banner image: try lookup first, fall back to hardcoded path
  const bannerImage = (name: string, fallback: string) =>
    catBanners[name] || fallback;

  // Handle hash scroll when navigating from other pages
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash.replace("#", ""));
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  }, [pathname]);

  return (
    <main className="w-full min-h-screen bg-white text-[#222831] overflow-x-hidden">
      {/* SECTION 1: Hero Carousel (Asymmetric Grid) */}
      <Carousel />

      {/* SECTION 2: Trust Badges Strip */}
      <TrustBadges />

      {/* SECTION 3: Category Icon Strip (Circular) */}
      <Categories />

      {/* SECTION 4: Promo Banner Grid (3 Tiles) */}
      <PromoBanner bannerImages={catBanners} />

      {/* SECTION 5: Featured Products Grid */}
      <Products />

      {/* SECTION 6: Product Spotlight Banner */}
      <ProductSpotlight />

      {/* SECTION 7: Brand Statement Banner (manageable from Admin) */}
      <section className="relative h-48 md:h-56 overflow-hidden bg-[#222831]">
        <img
          src={brandBanner?.image || "/Irha Studio-12.jpg"}
          alt={brandBanner?.title || "Irhas'Inn - Customize Product All In One"}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <p className="text-[#C8A84E] text-sm font-bold tracking-[0.3em] uppercase mb-1">
              {brandBanner?.title || "Irhas'Inn"}
            </p>
            <h2 className="text-white text-2xl md:text-4xl font-black leading-tight">
              Customize Product{" "}
              <span className="text-[#C8A84E]">All In One</span>
            </h2>
            <p className="text-white/60 text-sm mt-1 max-w-xl">
              {brandBanner?.subtitle || "Premium Quality — Delivered with Care Across Pakistan"}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8: Category-Themed Product Row - Azaadi Collection */}
      <CategoryProductRow
        categoryName="Azaadi Collection"
        categorySlug="clothes"
        categoryImage={bannerImage("Azaadi Collection", "/Azadi Collection.jpg")}
      />

      {/* SECTION 9: Another Category Product Row - Eid Collection */}
      <CategoryProductRow
        categoryName="Eid Collection"
        categorySlug="accessories"
        categoryImage={bannerImage("Eid Collection", "/Eid Collection Banner.jpg")}
      />

      {/* SECTION 10: Customized Mugs Row */}
      <CategoryProductRow
        categoryName="Customized Mugs"
        categorySlug="accessories"
        categoryImage={bannerImage("Customized Mugs", "/mug banner.jpg")}
      />

      {/* SECTION 11: Customized Hajj Gifts Row */}
      <CategoryProductRow
        categoryName="Customized Hajj Gifts"
        categorySlug="accessories"
        categoryImage={bannerImage("Customized Hajj Gifts", "/Hajj Bannaer.jpg")}
      />

      {/* SECTION 11b: Customize Pop Socket Row */}
      <CategoryProductRow
        categoryName="Customize Pop Socket"
        categorySlug="accessories"
        categoryImage={bannerImage("Customize Pop Socket", "/Pop Socket Banner.jpg")}
      />

      {/* SECTION 12: "Looking for Something Else?" Search Section */}
      <LookingForSomething />

      {/* SECTION 13: About Us */}
      <About />

      {/* SECTION 14: Contact Us */}
      <Contact />
    </main>
  );
}
