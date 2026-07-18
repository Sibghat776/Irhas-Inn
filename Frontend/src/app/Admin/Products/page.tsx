"use client";

import {
  Edit,
  Plus,
  Trash2,
  X,
  Upload,
  AlertCircle,
  DockIcon,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import useFetch, { baseUrl, showToast } from "@/app/utils/commonFunctions";
import axios from "axios";
import AiGeneratorButton from "../components/AiGeneratorButton";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  colors?: string[];
  sizes?: string[];
  images: Array<{ url: string; public_id: string }>;
  sold?: number;
  averageRating?: number;
  tags?: string[];
  isActive?: boolean;
  addedBy?: string | { _id: string };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const ProductsPage = () => {
  const { data: productsRes, loading: productsLoading } = useFetch<any>(
    `${baseUrl}product/getAdminProducts`,
  );
  const { data: categoriesRes } = useFetch<any>(
    `${baseUrl}category/getAllCategories`,
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("superadmin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUserId(parsed?._id ?? null);
          setUserRole(parsed?.role ?? (parsed?.isAdmin ? "superadmin" : "user"));
        } catch {}
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    brand: "",
    category: "",
    tags: "",
    colors: "",
    sizes: "",
  });

  // Suggested quick-add values for SEO tags, colors and sizes
  const suggestedTags = ["Trending", "New", "Sale", "Bestseller", "Limited"];
  const suggestedColors = ["Red", "Blue", "Green", "Black", "White"];
  const suggestedSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const addSuggestedValue = (field: "tags" | "colors" | "sizes", value: string) => {
    setFormData((prev) => {
      const current = (prev[field] || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (current.includes(value)) return prev;
      return { ...prev, [field]: [...current, value].join(", ") };
    });
  };

  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Load products
  useEffect(() => {
    if (productsRes?.data) {
      console.log("Products Response:", productsRes);

      // Handle different API response structures
      let productsArray = [];

      if (Array.isArray(productsRes.data)) {
        productsArray = productsRes.data;
      } else if (
        productsRes.data.products &&
        Array.isArray(productsRes.data.products)
      ) {
        productsArray = productsRes.data.products;
      } else if (
        typeof productsRes.data === "object" &&
        !Array.isArray(productsRes.data)
      ) {
        // If it's an object with product data, try to extract it
        console.warn("Unexpected data structure:", productsRes.data);
        showToast("Unexpected API response structure", "error");
        productsArray = [];
      }

      setProducts(Array.isArray(productsArray) ? productsArray : []);
    }
  }, [productsRes?.data]);

  // Load categories
  useEffect(() => {
    if (categoriesRes?.data) {
      console.log("Categories Response:", categoriesRes);

      let categoriesArray = [];

      if (Array.isArray(categoriesRes.data)) {
        categoriesArray = categoriesRes.data;
      } else if (
        categoriesRes.data.categories &&
        Array.isArray(categoriesRes.data.categories)
      ) {
        categoriesArray = categoriesRes.data.categories;
      }

      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
    }
  }, [categoriesRes?.data]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + images.length > 5) {
      showToast("Maximum 5 images allowed", "error");
      return;
    }

    setImages([...images, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setImages([]);
    setPreviewUrls([]);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      brand: "",
      tags: "",
      colors: "",
      sizes: "",
    });
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setIsEditMode(true);
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      brand: product.brand.toString(),
      category: product.category,
      tags: product.tags?.join(", ") || "",
      colors: product.colors?.join(", ") || "",
      sizes: product.sizes?.join(", ") || "",
    });
    setPreviewUrls(product.images?.map((img) => img.url) || []);
    setImages([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields = [];

    // Har field ko check karein aur agar khali ho to array mein naam push kar dein
    if (!formData.name?.trim()) missingFields.push("Name");
    if (!formData.description?.trim()) missingFields.push("Description");
    if (!formData.price) missingFields.push("Price");
    if (!formData.stock) missingFields.push("Stock");
    if (!formData.brand) missingFields.push("Brand");
    if (!formData.category) missingFields.push("Category");

    // Agar array mein koi bhi item hai, iska matlab koi field missing hai
    if (missingFields.length > 0) {
      showToast(
        `Please fill these fields: ${missingFields.join(", ")}`,
        "error",
      );
      return;
    }

    if (!isEditMode && images.length === 0) {
      showToast("At least one image is required", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("price", formData.price);
      submitData.append("stock", formData.stock);
      submitData.append("category", formData.category);
      submitData.append("brand", formData.brand);

      if (formData.tags.trim()) {
        submitData.append(
          "tags",
          JSON.stringify(formData.tags.split(",").map((t) => t.trim())),
        );
      }

      if (formData.colors.trim()) {
        submitData.append(
          "colors",
          JSON.stringify(formData.colors.split(",").map((c) => c.trim())),
        );
      }

      if (formData.sizes.trim()) {
        submitData.append(
          "sizes",
          JSON.stringify(formData.sizes.split(",").map((s) => s.trim())),
        );
      }

      // Add new images
      images.forEach((img) => {
        submitData.append("images", img);
      });

      if (isEditMode && editingId) {
        // Update product
        const response = await axios.put(
          `${baseUrl}product/updateProduct/${editingId}`,
          submitData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        if (response.data.success) {
          setProducts(
            products.map((prod) =>
              prod._id === editingId ? response.data.data : prod,
            ),
          );
          showToast("Product updated successfully", "success");
        }
      } else {
        // Create product
        const response = await axios.post(
          `${baseUrl}product/addProduct`,
          submitData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        if (response.data) {
          setProducts([...products, response.data.data]);
          showToast("Product created successfully", "success");
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to save product";
      showToast(errorMessage, "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsSubmitting(true);

    try {
      const response = await axios.delete(
        `${baseUrl}product/deleteProduct/${deleteId}`,
        { withCredentials: true },
      );

      if (response.data) {
        setProducts(products.filter((prod) => prod._id !== deleteId));
        showToast("Product deleted successfully", "success");
      }

      setDeleteId(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete product";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      brand: "",
      category: "",
      tags: "",
      colors: "",
      sizes: "",
    });
    setImages([]);
    setPreviewUrls([]);
  };

  // ✅ FIX: Check if products is array before using filter
  const filteredProducts = Array.isArray(products)
    ? products.filter((prod) =>
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Product Catalog
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your product inventory
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">
            <DockIcon className="h-4 w-4 text-[#0856DF]" /> Total: {products.length}
          </span>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0856DF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0645c8]"
          >
            <Plus className="h-4 w-4" /> New Product
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full table-fixed text-left">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-4">Product Name</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-center">Price</th>
              <th className="p-4 text-center">Stock</th>
              <th className="p-4 text-center">Rating</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productsLoading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  <p className="text-sm font-medium text-slate-500">Loading products...</p>
                </td>
              </tr>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id} className="transition-colors hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                          <Upload size={18} className="text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-slate-700">
                      {categories.find(
                        (c) => c._id === (product?.category as any)?._id,
                      )?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <p className="font-semibold text-slate-900">Rs {product.price}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.stock > 20
                          ? "bg-emerald-50 text-emerald-700"
                          : product.stock > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <p className="font-semibold text-slate-900">
                      {product.averageRating
                        ? product.averageRating.toFixed(1)
                        : "—"}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {(userRole === "superadmin" || (() => { const id = typeof product.addedBy === "string" ? product.addedBy : (product.addedBy as any)?._id; return id === currentUserId; })()) && (
                        <>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                            aria-label="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(product._id)}
                            className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-600 hover:text-white"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    {searchTerm
                      ? "No products found matching your search"
                      : "No products found"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditMode ? "Edit Product" : "New Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-6 py-5">
              {/* Images Section */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Product Images (Max 5)
                </label>
                <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={images.length + previewUrls.length >= 5}
                    className="hidden"
                    id="image-input"
                  />
                  <label
                    htmlFor="image-input"
                    className="flex cursor-pointer flex-col items-center gap-2"
                  >
                    <Upload size={28} className="text-slate-400" />
                    <p className="text-sm font-semibold text-slate-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-400">
                      {images.length + previewUrls.length}/5 images
                    </p>
                  </label>
                </div>

                {previewUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {previewUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200"
                      >
                        <img src={url} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                          aria-label="Remove"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                    placeholder="Enter product name"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Price (Rs)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="max-w-xl">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full max-w-xl whitespace-pre-wrap break-words rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium leading-relaxed outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15 resize-none"
                  rows={6}
                />
                <div className="mt-2">
                  <AiGeneratorButton
                    name={formData.name}
                    context="product"
                    onGenerate={(text) =>
                      setFormData((prev) => ({ ...prev, description: text }))
                    }
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Colors (comma-separated)
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {suggestedColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => addSuggestedValue("colors", c)}
                        disabled={isSubmitting}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:bg-slate-100"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) =>
                      setFormData({ ...formData, colors: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                    placeholder="Red, Blue, Green"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Sizes (comma-separated)
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {suggestedSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSuggestedValue("sizes", s)}
                        disabled={isSubmitting}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:bg-slate-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) =>
                      setFormData({ ...formData, sizes: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                    placeholder="S, M, L, XL"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Tags (comma-separated)
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {suggestedTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addSuggestedValue("tags", t)}
                        disabled={isSubmitting}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:bg-slate-100"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                    placeholder="Trending, New, Sale"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#0856DF] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0645c8] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditMode
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:rounded-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle size={26} className="text-red-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Delete Product?</h3>
            <p className="mb-6 text-sm font-medium text-slate-500">
              {products.find((p) => p._id === deleteId)?.name}
              <br />
              <span className="text-xs text-slate-400">This action cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
