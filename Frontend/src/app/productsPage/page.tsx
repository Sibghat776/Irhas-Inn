"use client";

import React, { memo, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";
import {
  getLocalCart,
  setLocalCart,
  showToast,
} from "../utils/commonFunctions";
import axios from "axios";

import Navbar from "../Components/Navbar";
import Contact from "../Components/Contact";
import Footer from "../Components/Footer";
import useFetch, { baseUrl } from "../utils/commonFunctions";

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  images?: Array<{ url: string }>;
  slug: string;
}

interface ProductsPageProps {
  title?: string;
}

const ProductCardImageCarousel: React.FC<{
  images?: Array<{ url: string }>;
  label: string;
}> = ({ images, label }) => {
  const normalizedImages = useMemo(
    () => (images && images.length > 0 ? images : [{ url: "/carousel/Pens.avif" }]),
    [images],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [normalizedImages]);

  useEffect(() => {
    if (normalizedImages.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % normalizedImages.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [normalizedImages.length]);

  return (
    <div className="relative h-72 overflow-hidden">
      {normalizedImages.map((image, index) => (
        <img
          key={`${image.url}-${index}`}
          src={image.url}
          alt={`${label} ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#041241] shadow-sm">
        {label}
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {normalizedImages.map((_, dotIndex) => (
          <span
            key={dotIndex}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              dotIndex === currentIndex ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const ProductsPage: React.FC<ProductsPageProps> = ({
  title = "Our Premium Products",
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = searchParams.get("category");
  const auth = useSelector((state: RootState) => state.auth);

  const { data: prodRes, loading } = useFetch<any>(
    `${baseUrl}product/getAllProducts${categoryFilter ? `?category=${categoryFilter}` : ""}`,
  );
  const { data: catRes } = useFetch<any>(
    categoryFilter ? `${baseUrl}category/getAllCategories` : "",
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (prodRes?.data) {
      const list = Array.isArray(prodRes.data)
        ? prodRes.data
        : prodRes.data.products ?? [];
      setProducts(Array.isArray(list) ? list : []);
    }
  }, [prodRes]);

  useEffect(() => {
    if (catRes?.data && categoryFilter) {
      const cats = Array.isArray(catRes.data) ? catRes.data : [];
      const found = cats.find((c: any) => c._id === categoryFilter);
      if (found) setCategoryName(found.name);
    }
  }, [catRes, categoryFilter]);

  const addToCart = async (product: Product) => {
    const productId = product._id;
    if (!productId) return showToast("Invalid product", "error");
    const prodAny = product as any;
    if (prodAny.stock !== undefined && prodAny.stock <= 0)
      return showToast("Product is out of stock", "error");

    if (auth.username) {
      try {
        await axios.post(
          `${baseUrl}cart/`,
          { productId, quantity: 1 },
          { withCredentials: true },
        );
        showToast("Added to cart", "success");
      } catch (err: any) {
        console.error("Add to cart error", err);
        showToast(err?.response?.data?.message || "Failed to add to cart", "error");
      }
    } else {
      const local = getLocalCart();
      const exists = local.find((i: any) => (i._id || i.id) === productId);
      if (exists) {
        const newQty = (exists.quantity || 1) + 1;
        if (prodAny.stock !== undefined && newQty > prodAny.stock)
          return showToast(`Only ${prodAny.stock} items available`, "error");
        exists.quantity = newQty;
      } else {
        if (prodAny.stock !== undefined && 1 > prodAny.stock)
          return showToast(`Only ${prodAny.stock} items available`, "error");
        local.push({ ...product, _id: productId, quantity: 1 });
      }
      setLocalCart(local);
      showToast("Added to cart", "success");
    }
  };

  const buyNow = async (product: Product) => {
    await addToCart(product);
    router.push("/checkout");
  };

  return (
    <>
      <Navbar />

      <section className="relative min-h-screen pt-28 pb-20 bg-gradient-to-b from-gray-400 via-white to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-wide text-white drop-shadow-2xl">
              {categoryName || title}
            </h1>
            {categoryName && (
              <p className="mt-4 text-sm md:text-base text-gray-300 uppercase tracking-widest">
                Category — {categoryName}
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-300 text-lg">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-300 text-lg">
                No products available at the moment.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Please check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
              {products.map((prod) => {
                const originalPrice = prod.price + 100;
                const imgUrl = prod.images?.[0]?.url || "/carousel/Pens.avif";

                return (
                  <div
                    key={prod._id}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_35px_90px_rgba(0,0,0,0.85)]"
                  >
                    <div className="relative h-72 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    </div>

                    <div className="p-6 text-center">
                      <h3 className="text-xl font-bold text-white tracking-wide mb-1">
                        {prod.name}
                      </h3>

                      <div className="flex justify-center items-center gap-3 mt-2">
                        <span className="text-sm text-gray-400 line-through">
                          Rs {originalPrice.toLocaleString()}
                        </span>
                        <span className="text-lg font-semibold text-green-400">
                          Rs {prod.price.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-300 mt-3 line-clamp-3">
                        {prod.description}
                      </p>

                      <div className="mt-5 flex items-center justify-center gap-3">
                        <button
                          onClick={() => addToCart(prod)}
                          className="inline-flex items-center gap-2 bg-white text-[#041241] px-4 py-2 rounded-lg font-semibold shadow hover:shadow-lg transition transform hover:-translate-y-0.5"
                        >
                          Add to Cart
                        </button>

                        <button
                          onClick={() => buyNow(prod)}
                          className="inline-flex items-center gap-2 bg-[#0856DF] text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-[#0645c8] transition transform hover:-translate-y-0.5"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>

                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Contact />
      <Footer />
    </>
  );
};

function ProductsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPage />
    </Suspense>
  );
}

export default memo(ProductsPageWrapper);
