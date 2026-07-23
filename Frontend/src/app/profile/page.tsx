"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Camera,
  User,
  Phone,
  MapPin,
  Save,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/Redux/store";
import {
  loginRequest,
  loginSuccess,
  loginFailure,
} from "@/app/Redux/Features/authSlice";
import useFetch, { baseUrl, showToast } from "@/app/utils/commonFunctions";
import Link from "next/link";

const ProfilePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [preview, setPreview] = useState<string>("/defaultAvatar.jpg");
  const [file, setFile] = useState<File | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    phoneNo?: string;
    address?: string;
  }>({});

  const [form, setForm] = useState({
    username: "",
    phoneNo: "",
    address: "",
  });

  const [originalForm, setOriginalForm] = useState({
    username: "",
    phoneNo: "",
    address: "",
  });

  const { data: apiResponse } = useFetch<any>(
    auth.username ? `${baseUrl}auth/getUser/${auth.username}` : "",
  );

  useEffect(() => {
    setIsMounted(true);
    if (apiResponse?.data) {
      const d = apiResponse.data;
      setUserId(d._id);
      const initialForm = {
        username: d.username || "",
        phoneNo: d.phoneNo?.toString() || "",
        address: d.address || "",
      };
      setForm(initialForm);
      setOriginalForm(initialForm);
      setPreview(d.profilePic || "/defaultAvatar.jpg");
    }
  }, [apiResponse]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    } else if (form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (form.username.length > 20) {
      newErrors.username = "Username must not exceed 20 characters";
    }

    if (form.phoneNo && !/^\d{10,15}$/.test(form.phoneNo.replace(/\D/g, ""))) {
      newErrors.phoneNo = "Phone number must be 10-15 digits";
    }

    if (form.address && form.address.length > 500) {
      newErrors.address = "Address must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setHasChanges(
      value !== originalForm[name as keyof typeof originalForm] || !!file,
    );
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const img = e.target.files?.[0];
    if (img) {
      if (img.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB", "error");
        return;
      }
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(img.type)) {
        showToast("Please upload a valid image file (JPEG, PNG, GIF, WebP)", "error");
        return;
      }
      setFile(img);
      setPreview(URL.createObjectURL(img));
      setHasChanges(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }
    dispatch(loginRequest());
    try {
      const fd = new FormData();
      fd.append("username", form.username.trim());
      fd.append("phoneNo", form.phoneNo.trim());
      fd.append("address", form.address.trim());
      if (file) fd.append("profilePic", file);

      const res = await axios.put(`${baseUrl}auth/updateUser/${userId}`, fd, {
        withCredentials: true,
      });

      dispatch(loginSuccess({
        ...res.data.data,
        isAdmin: res.data.data?.isAdmin ?? false,
      }));
      showToast("Profile updated successfully!", "success");
      setOriginalForm(form);
      setFile(null);
      setHasChanges(false);
    } catch (err: any) {
      dispatch(loginFailure("Update failed"));
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-white to-[#FFFFFF] px-4 pt-24 pb-6 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Back + Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#222831] hover:text-[#C8A84E] transition-colors mb-4">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-[#222831] tracking-tight">My Profile</h1>
          <p className="text-lg text-[#222831] font-semibold mt-1">Keep your information up to date</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-[#EEEEEE] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#C8A84E] to-[#FFFFFF]" />
          <div className="p-8 md:p-12">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-12">
              <label className="relative cursor-pointer group mb-4">
                <div className="relative w-40 h-40 rounded-2xl overflow-hidden ring-4 ring-[#EEEEEE] group-hover:ring-[#EEEEEE] transition-all duration-300 shadow-lg bg-[#FFFFFF]">
                  <img src={preview} alt="Profile Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#222831]/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="text-white w-8 h-8" />
                      <span className="text-white text-xs font-semibold uppercase">Change Photo</span>
                    </div>
                  </div>
                </div>
                <input type="file" hidden accept="image/*" onChange={handleImage} />
              </label>
              <p className="text-center text-sm text-[#222831] font-medium">PNG, JPG, GIF or WebP &bull; Max 5MB</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#222831] mb-2 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#222831]"><User size={20} /></div>
                  <input type="text" name="username" value={form.username} onChange={handleChange}
                    placeholder="Enter your username"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-[#222831] outline-none transition-all font-semibold ${
                      errors.username ? "border-[#EEEEEE] bg-[#FFFFFF] focus:border-[#C8A84E] focus:ring-2 focus:ring-[#C8A84E]"
                        : "border-[#EEEEEE] bg-[#FFFFFF] hover:border-[#EEEEEE] focus:border-[#C8A84E] focus:ring-2 focus:ring-[#C8A84E]"
                    }`} />
                </div>
                {errors.username && (
                  <div className="flex items-center gap-2 mt-2 text-[#222831] text-sm font-semibold">
                    <AlertCircle size={16} /> {errors.username}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#222831] mb-2 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#222831]"><Phone size={20} /></div>
                  <input type="tel" name="phoneNo" value={form.phoneNo} onChange={handleChange}
                    placeholder="Enter phone number (10-15 digits)"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-[#222831] outline-none transition-all font-semibold ${
                      errors.phoneNo ? "border-[#EEEEEE] bg-[#FFFFFF] focus:border-[#C8A84E] focus:ring-2 focus:ring-[#C8A84E]"
                        : "border-[#EEEEEE] bg-[#FFFFFF] hover:border-[#EEEEEE] focus:border-[#C8A84E] focus:ring-2 focus:ring-[#C8A84E]"
                    }`} />
                </div>
                {errors.phoneNo && (
                  <div className="flex items-center gap-2 mt-2 text-[#222831] text-sm font-semibold">
                    <AlertCircle size={16} /> {errors.phoneNo}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#222831] mb-2 uppercase tracking-wider">Full Address</label>
                <div className="relative">
                  <div className="absolute left-4 top-4 text-[#222831]"><MapPin size={20} /></div>
                  <textarea name="address" value={form.address} onChange={handleChange}
                    placeholder="Enter your full address (street, city, country)" rows={4} maxLength={500}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-[#222831] outline-none transition-all font-semibold resize-none ${
                      errors.address ? "border-[#EEEEEE] bg-[#FFFFFF] focus:border-[#C8A84E] focus:ring-2 focus:ring-[#C8A84E]"
                        : "border-[#EEEEEE] bg-[#FFFFFF] hover:border-[#EEEEEE] focus:border-[#C8A84E] focus:ring-2 focus:ring-[#C8A84E]"
                    }`} />
                  <p className="text-xs text-[#222831] mt-1 text-right font-medium">{form.address.length}/500</p>
                </div>
                {errors.address && (
                  <div className="flex items-center gap-2 mt-2 text-[#222831] text-sm font-semibold">
                    <AlertCircle size={16} /> {errors.address}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button type="submit" disabled={auth.loading || !hasChanges}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C8A84E] to-[#C8A84E] hover:from-[#C8A84E] hover:to-[#C8A84E] text-white font-black uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-[#EEEEEE]">
                  {auth.loading ? <><Loader2 className="animate-spin" size={20} /> Updating...</>
                    : <><Save size={20} /> Save Changes</>}
                </button>
                <button type="button" onClick={() => { setForm(originalForm); setFile(null); setPreview(apiResponse?.data?.profilePic || "/defaultAvatar.jpg"); setHasChanges(false); setErrors({}); }}
                  className="flex-1 py-3 rounded-xl bg-[#FFFFFF] hover:bg-[#EEEEEE] text-[#222831] font-black uppercase tracking-wider transition-all duration-200 border border-[#EEEEEE]">
                  Cancel
                </button>
              </div>

              <div className="mt-8 p-4 bg-[#FFFFFF] border border-[#EEEEEE] rounded-xl">
                <p className="text-sm text-[#222831] font-semibold flex items-start gap-2">
                  <Check size={18} className="flex-shrink-0 mt-0.5" />
                  <span>Your information is secure and encrypted with industry-standard protocols.</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
