// src/app/page.tsx
"use client";

import React from "react";
import Carousel from "./Components/Carousel";
import TrustBadges from "./Components/TrustBadges";
import Categories from "./Components/Categories";
import PromoBanner from "./Components/PromoBanner";
import Products from "./Components/Products";
import ProductSpotlight from "./Components/ProductSpotlight";
import CategoryProductRow from "./Components/CategoryProductRow";
import LookingForSomething from "./Components/LookingForSomething";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-white text-[#222831] overflow-x-hidden">
      {/* SECTION 1: Hero Carousel (Asymmetric Grid) */}
      <Carousel />

      {/* SECTION 2: Trust Badges Strip */}
      <TrustBadges />

      {/* SECTION 3: Category Icon Strip (Circular) */}
      <Categories />

      {/* SECTION 4: Promo Banner Grid (3 Tiles) */}
      <PromoBanner />

      {/* SECTION 5: Featured Products Grid */}
      <Products />

      {/* SECTION 6: Product Spotlight Banner */}
      <ProductSpotlight />

      {/* SECTION 7: Category-Themed Product Row */}
      <CategoryProductRow
        categoryName="Customized Birthday T-Shirts"
        categorySlug="clothes"
        categoryImage="/carousel/Clothes.jpg"
      />

      {/* SECTION 8: Another Category Product Row */}
      <CategoryProductRow
        categoryName="Customized Cricket Player T-Shirts"
        categorySlug="accessories"
        categoryImage="/carousel/Accessories.jpg"
      />

      {/* SECTION 9: "Looking for Something Else?" Search Section */}
      <LookingForSomething />
    </main>
  );
}
