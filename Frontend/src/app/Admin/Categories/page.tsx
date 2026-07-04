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
    <div className="space-y-8">
      {/* Header (Same as before) */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            Categories
          </h2>
          <p className="text-zinc-500 font-bold text-sm mt-1">
            Manage your product categories
          </p>
        </div>
        <div className="flex items-center gap-4 border-4 border-black bg-black text-white px-3 py-2 font-black uppercase tracking-widest text-xs">
          <div className="flex items-center gap-2 border-4 border-white bg-white text-black px-6 py-3 font-black uppercase tracking-widest text-xs ">
            <DockIcon className="w-4 h-4" /> Total : {categories.length}
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-4 border-4 border-white bg-black text-white px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white border-b-4 border-black text-xs font-black uppercase tracking-widest">
              <th className="p-4 w-16">Image</th>
              <th className="p-4">Category Name</th>
              <th className="p-4">Slug</th>
              <th className="p-4 text-center">Products</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-zinc-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <p className="text-black font-bold uppercase">
                    Loading categories...
                  </p>
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((cat) => {
                const imgUrl =
                  typeof cat.image === "object" ? cat.image?.url : cat.image;
                return (
                  <tr
                    key={cat._id}
                    className="hover:bg-zinc-50 transition-colors border-b-2 border-zinc-100"
                  >
                    <td className="p-4">
                      {imgUrl ? (
                        <div className="w-12 h-12 relative border-2 border-black overflow-hidden bg-zinc-100">
                          <Image
                            src={imgUrl}
                            alt={cat.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 border-2 border-black bg-zinc-100 flex items-center justify-center text-zinc-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-black text-black uppercase text-sm">
                          {cat.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="font-mono text-xs bg-zinc-100 px-3 py-2 rounded border border-zinc-300">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-black text-black text-lg">
                          {cat.products?.length || 0}
                        </span>
                        {cat.products && cat.products.length > 0 && (
                          <button
                            onClick={() =>
                              setViewingProducts(
                                viewingProducts === cat._id ? null : cat._id,
                              )
                            }
                            className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {cat.isActive ? (
                        <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black text-xs uppercase border border-emerald-300">
                          <div>✓</div> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full font-black text-xs uppercase border border-red-300">
                          <div>✗</div>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-semibold text-zinc-600">
                      {formatDate(cat.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border-2 border-blue-600 font-bold"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(cat._id)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all border-2 border-red-600 font-bold"
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
                <td colSpan={7} className="p-8 text-center">
                  <p className="text-black font-bold uppercase">
                    No categories found.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 border-4 border-black w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
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
              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
                  Category Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-4 border-black bg-zinc-100 flex items-center justify-center overflow-hidden relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="text-zinc-400" size={32} />
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
                      className="cursor-pointer inline-block w-full text-center border-4 border-black py-2 px-4 font-black uppercase text-xs hover:bg-black hover:text-white transition-colors"
                    >
                      Choose Image
                    </label>
                  </div>
                </div>
              </div>

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 border-4 border-black w-full max-w-sm shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
            <h3 className="text-2xl font-black uppercase mb-4">
              Delete Category?
            </h3>

            <p className="text-zinc-600 font-bold mb-8">
              This action cannot be undone. Products in this category will not
              be deleted.
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

      {/* Products & Delete Modals Code yahan aayega (Same as your old code) */}
    </div>
  );
};

export default CategoriesPage;
