"use client";

import { useEffect, useState } from "react";
import useFetch, { baseUrl, showToast } from "@/app/utils/commonFunctions";
import {
  Trash2,
  Edit,
  Plus,
  X,
  Eye,
  DockIcon,
  Image as ImageIcon,
} from "lucide-react";
import axios from "axios";
import Image from "next/image";
import AiGeneratorButton from "../components/AiGeneratorButton";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  slug: string;
  products: Product[];
  isActive: boolean;
  // Backend ke hisaab se image update
  image?: { url: string; public_id: string } | string;
  createdAt: string;
  updatedAt: string;
}

const CategoriesPage = () => {
  const {
    data: res,
    loading,
    reFetch,
  } = useFetch<any>(`${baseUrl}category/getAllCategories`);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingProducts, setViewingProducts] = useState<string | null>(null);

  // Image states add kiye hain
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
  });

  useEffect(() => {
    if (res?.data) setCategories(res.data);
  }, [res]);

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ name: "", description: "", slug: "" });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setIsEditMode(true);
    setEditingId(category._id);
    setFormData({
      name: category.name,
      description: category.description,
      slug: category.slug,
    });

    // Agar image pehle se hai toh preview set karein
    const imgUrl =
      typeof category.image === "object" ? category.image?.url : category.image;
    setImagePreview(imgUrl || null);
    setImageFile(null);

    setIsModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  // Naya function image handle karne ke liye
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Local preview dikhane ke liye
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      showToast("Name and description are required", "error");
      return;
    }

    if (!isEditMode && !imageFile) {
      showToast("Image is required for a new category", "error");
      return;
    }

    setIsSubmitting(true);

    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);
    submitData.append("slug", formData.slug);

    if (imageFile) {
      submitData.append("image", imageFile);
    }

    try {
      const config = {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      };

      if (isEditMode && editingId) {
        const response = await axios.put(
          `${baseUrl}category/updateCategory/${editingId}`,
          submitData,
          config,
        );

        if (response.data?.data) {
          setCategories((prev) =>
            prev.map((cat) =>
              cat._id === editingId ? response.data.data : cat,
            ),
          );
          showToast("Category updated successfully", "success");
        }
      } else {
        const response = await axios.post(
          `${baseUrl}category/addCategory`,
          submitData,
          config,
        );

        if (response.data?.data) {
          setCategories((prev) => [...prev, response.data.data]);
          showToast("Category created successfully", "success");
        }
      }

      setIsModalOpen(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to save category";
      showToast(errorMessage, "error");
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      const response = await axios.delete(
        `${baseUrl}category/deleteCategory/${deleteId}`,
        { withCredentials: true },
      );
      if (response.data) {
        setCategories(categories.filter((cat) => cat._id !== deleteId));
        showToast("Category deleted successfully", "success");
      }
      setDeleteId(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete category";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Categories
          </h2>
          <p className="mt-1 text-sm text-slate-500">Manage your product categories</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">
            <DockIcon className="h-4 w-4 text-[#0856DF]" /> Total: {categories.length}
          </span>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0856DF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0645c8]"
          >
            <Plus className="h-4 w-4" /> New Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-4 w-16">Image</th>
              <th className="p-4">Category Name</th>
              <th className="p-4">Slug</th>
              <th className="p-4 text-center">Products</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-10 text-center">
                  <p className="font-medium text-slate-500">Loading categories...</p>
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((cat) => {
                const imgUrl =
                  typeof cat.image === "object" ? cat.image?.url : cat.image;
                return (
                  <tr
                    key={cat._id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="p-4">
                      {imgUrl ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          <Image
                            src={imgUrl}
                            alt={cat.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {cat.name}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {cat.description}
                      </p>
                    </td>
                    <td className="p-4">
                      <code className="rounded bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-600">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {cat.products?.length || 0}
                        </span>
                        {cat.products && cat.products.length > 0 && (
                          <button
                            onClick={() =>
                              setViewingProducts(
                                viewingProducts === cat._id ? null : cat._id,
                              )
                            }
                            className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                            aria-label="View products"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {cat.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-500">
                      {formatDate(cat.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                          aria-label="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(cat._id)}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-600 hover:text-white"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-10 text-center">
                  <p className="font-medium text-slate-500">No categories found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditMode ? "Edit Category" : "New Category"}
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
              {/* Image Upload Section */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Category Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="text-slate-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="image-upload"
                      className="hidden"
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block w-full cursor-pointer rounded-xl border border-slate-300 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Choose Image
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                  placeholder="Enter category name"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 font-mono text-sm text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15 resize-none"
                  placeholder="Enter category description"
                  rows={4}
                  disabled={isSubmitting}
                />
                <div className="mt-2">
                  <AiGeneratorButton
                    name={formData.name}
                    context="category"
                    onGenerate={(text) =>
                      setFormData((prev) => ({ ...prev, description: text }))
                    }
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

      {/* {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 border-4 border-black w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase">
                {isEditMode ? "Edit Category" : "New Category"}
              </h3>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                  Category Name
                </label>

                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                  Slug
                </label>

                <input
                  type="text"
                  value={formData.slug}
                  disabled
                  className="w-full border-4 border-zinc-300 p-3 font-mono text-sm bg-zinc-100 text-zinc-600"
                />

                <p className="text-xs text-zinc-500 mt-1">
                  Auto-generated from name
                </p>
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
                  className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter category description"
                  rows={4}
                  disabled={isSubmitting}
                />
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
      )} */}

      {/* Delete Modal */}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:rounded-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              Delete Category?
            </h3>

            <p className="mb-6 text-sm font-medium text-slate-500">
              This action cannot be undone. Products in this category will not
              be deleted.
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

      {/* Products & Delete Modals Code yahan aayega (Same as your old code) */}
    </div>
  );
};

export default CategoriesPage;
