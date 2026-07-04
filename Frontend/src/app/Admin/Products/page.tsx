"use client";

import {
  Edit,
  Plus,
  Trash2,
  X,
  Upload,
  AlertCircle,
  DockIcon,
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
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const ProductsPage = () => {
  const { data: productsRes, loading: productsLoading } = useFetch<any>(
    `${baseUrl}product/getAllProducts`,
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            Product Catalog
          </h2>
          <p className="text-zinc-500 font-bold text-sm mt-1">
            Manage your product inventory
          </p>
        </div>
        <div className="flex items-center gap-4 border-4 border-black bg-black text-white px-3 py-2 font-black uppercase tracking-widest text-xs">
          <div className="flex items-center gap-2 border-4 border-white bg-white text-black px-6 py-3 font-black uppercase tracking-widest text-xs ">
            <DockIcon className="w-4 h-4" /> Total products : {products.length}
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-4 border-4 border-white bg-black text-white px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="w-4 h-4" /> New Product
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white border-b-4 border-black text-xs font-black uppercase tracking-widest">
              <th className="p-4">Product Name</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-center">Price</th>
              <th className="p-4 text-center">Stock</th>
              <th className="p-4 text-center">Rating</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-zinc-200">
            {productsLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <p className="text-black font-bold uppercase">
                    Loading products...
                  </p>
                </td>
              </tr>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-12 h-12 object-cover border-2 border-black rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-zinc-200 border-2 border-black flex items-center justify-center">
                          <Upload size={20} className="text-zinc-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-black uppercase text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-zinc-700">
                      {categories.find(
                        (c) => c._id === (product?.category as any)?._id,
                      )?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <p className="font-black text-black">Rs {product.price}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 font-black text-xs uppercase border-2 ${
                        product.stock > 20
                          ? "bg-emerald-100 text-emerald-700 border-emerald-700"
                          : product.stock > 0
                            ? "bg-yellow-100 text-yellow-700 border-yellow-700"
                            : "bg-red-100 text-red-700 border-red-700"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <p className="font-black text-black">
                      {product.averageRating
                        ? product.averageRating.toFixed(1)
                        : "—"}{" "}
                      ⭐
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border-2 border-blue-600 font-bold"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(product._id)}
                        className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all border-2 border-red-600 font-bold"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <p className="text-black font-bold uppercase">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-8 border-4 border-black w-full max-w-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase">
                {isEditMode ? "Edit Product" : "New Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Images Section */}
              <div>
                <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                  Product Images (Max 5)
                </label>
                <div className="border-4 border-dashed border-black p-6 text-center rounded">
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
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload size={32} className="text-zinc-400" />
                    <p className="font-black uppercase text-sm">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-zinc-500">
                      {images.length + previewUrls.length}/5 images
                    </p>
                  </label>
                </div>

                {/* Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {previewUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 border-2 border-black"
                      >
                        <img
                          src={url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product name"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                    Price (Rs)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border-4 border-black p-3 font-bold resize-none"
                  rows={3}
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                    Colors (comma-separated)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {suggestedColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => addSuggestedValue("colors", c)}
                        disabled={isSubmitting}
                        className="text-xs px-3 py-1 rounded-full border-2 border-slate-300 hover:bg-slate-100"
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
                    className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Red, Blue, Green"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                    Sizes (comma-separated)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {suggestedSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSuggestedValue("sizes", s)}
                        disabled={isSubmitting}
                        className="text-xs px-3 py-1 rounded-full border-2 border-slate-300 hover:bg-slate-100"
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
                    className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="S, M, L, XL"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                    Tags (comma-separated)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {suggestedTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addSuggestedValue("tags", t)}
                        disabled={isSubmitting}
                        className="text-xs px-3 py-1 rounded-full border-2 border-slate-300 hover:bg-slate-100"
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
                    className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Trending, New, Sale"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border-4 border-black py-3 font-black uppercase hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white py-3 font-black uppercase hover:bg-zinc-800 transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 border-4 border-black w-full max-w-sm shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle size={48} className="text-red-600" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-4">
              Delete Product?
            </h3>
            <p className="text-zinc-600 font-bold mb-8">
              {products.find((p) => p._id === deleteId)?.name}
              <br />
              <span className="text-xs text-zinc-500">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isSubmitting}
                className="flex-1 border-4 border-black py-3 font-black uppercase hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white py-3 font-black uppercase hover:bg-red-700 transition-colors disabled:opacity-50"
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
