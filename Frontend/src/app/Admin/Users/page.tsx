"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, UserX, Mail, Phone, Trash2, Edit, X } from "lucide-react";
import useFetch, { baseUrl, showToast } from "@/app/utils/commonFunctions";
import axios from "axios";
import { color } from "framer-motion";
import { useDispatch } from "react-redux";
import { logout } from "@/app/Redux/Features/authSlice";
import type { AppDispatch } from "@/app/Redux/store";

interface User {
  _id: string;
  username: string;
  email: string;
  phoneNo: string;
  isVerified: boolean;
  profilePic?: string;
}

const UsersPage = () => {
  const { data: res } = useFetch<any>(`${baseUrl}auth/getUsers`);
  const [data, setData] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit State
  const [editFormData, setEditFormData] = useState({ username: "", email: "" });

  useEffect(() => {
    if (res?.data) setData(res.data);
  }, [res]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      // Get the user being deleted to check if they're logged in
      const userToDelete = data.find((user) => user._id === deleteId);

      // Delete from database
      await axios.delete(`${baseUrl}auth/deleteUser/${deleteId}`, {
        withCredentials: true,
      });

      // Remove from UI
      setData(data.filter((user) => user._id !== deleteId));

      // Check if deleted user is currently logged in
      const loggedInUser = localStorage.getItem("user");
      if (loggedInUser) {
        const parsedUser = JSON.parse(loggedInUser);
        // If the deleted user is the logged-in user, force logout
        if (parsedUser.username === userToDelete?.username) {
          // Clear Redux store
          dispatch(logout());

          // Clear localStorage
          localStorage.removeItem("user");

          // Call logout API
          try {
            await axios.get(`${baseUrl}auth/logout`, {
              withCredentials: true,
            });
          } catch (err) {
            console.log("Logout API error:", err);
          }

          // Force redirect to home page
          showToast("User account deleted. You have been logged out.", "info");
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else {
          showToast("User Deleted Successfully", "success");
        }
      } else {
        showToast("User Deleted Successfully", "success");
      }

      setDeleteId(null);
    } catch (err) {
      showToast("Failed to delete user", "error");
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser || isUpdating) return;

    // Validation
    if (!editFormData.username.trim() || !editFormData.email.trim()) {
      showToast("Username and email are required", "error");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await axios.put(
        `${baseUrl}auth/updateUser/${editingUser._id}`,
        {
          username: editFormData.username,
          email: editFormData.email,
        },
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        // Update local state
        setData(
          data.map((user) =>
            user._id === editingUser._id ? { ...user, ...editFormData } : user,
          ),
        );

        // If editing current user, update localStorage
        const loggedInUser = localStorage.getItem("user");
        if (loggedInUser) {
          const parsedUser = JSON.parse(loggedInUser);
          if (parsedUser.username === editingUser.username) {
            const updatedUser = {
              ...parsedUser,
              username: editFormData.username,
              email: editFormData.email,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        }

        showToast("User updated successfully", "success");
        setEditingUser(null);
        setEditFormData({ username: "", email: "" });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update user";
      showToast(errorMessage, "error");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({ username: user.username, email: user.email });
  };

  const randomHex =
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            Customer Base
          </h2>
          <p className="text-zinc-500 font-bold text-sm mt-1">
            Manage your platform users
          </p>
        </div>
        <div className="bg-black text-white px-6 py-2 font-black text-sm uppercase tracking-widest">
          Total: {data.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-2 border-black">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-100 border-b-4 border-black text-xs font-black uppercase tracking-widest">
              <th className="p-4">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-zinc-100">
            {data.map((user) => (
              <tr key={user._id} className="hover:bg-zinc-50 transition-colors">
                <td className="p-4 flex items-center gap-3 font-bold uppercase">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic || "/default-avatar.png"}
                      className="w-10 h-10 rounded-full border-2 border-black object-cover bg-zinc-200"
                      alt="pfp"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: randomHex }}
                      className={`flex items-center justify-center w-10 h-10 rounded-full p-3 text-white font-bold`}
                    >
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  {user.username}
                </td>
                <td className="p-4 text-sm font-medium text-zinc-600 lowercase">
                  {user.email}
                </td>
                <td className="p-4 text-sm font-mono text-zinc-600">
                  {user.phoneNo}
                </td>
                <td className="p-4">
                  {user.isVerified ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase border border-emerald-600 px-2 py-1 w-max rounded-full">
                      <UserCheck size={12} /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-400 font-black text-[10px] uppercase border border-zinc-400 px-2 py-1 w-max rounded-full">
                      <UserX size={12} /> Unverified
                    </span>
                  )}
                </td>
                <td className="p-4 flex justify-center gap-3">
                  <button
                    onClick={() => openEdit(user)}
                    className="p-2 bg-zinc-100 hover:bg-blue-600 hover:text-white transition-all border-2 border-transparent hover:border-blue-700"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(user._id)}
                    className="p-2 bg-zinc-100 hover:bg-red-600 hover:text-white transition-all border-2 border-transparent hover:border-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 border-4 border-black w-full max-w-sm shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
            <h3 className="text-2xl font-black uppercase mb-4">Delete User?</h3>
            <p className="text-zinc-600 font-bold mb-8">
              This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border-2 border-black py-3 font-black uppercase hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-3 font-black uppercase hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 border-4 border-black w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-zinc-100 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-zinc-50 border-2 border-black rounded">
              <p className="text-xs font-black text-zinc-600 uppercase mb-2">
                User ID:
              </p>
              <p className="font-mono text-sm text-zinc-700 break-all">
                {editingUser._id}
              </p>
            </div>

            <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
              Username
            </label>
            <input
              className="w-full border-4 border-black p-3 font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={editFormData.username}
              onChange={(e) =>
                setEditFormData({ ...editFormData, username: e.target.value })
              }
              placeholder="Enter username"
              disabled={isUpdating}
            />

            <label className="block text-xs font-black uppercase mb-2 text-zinc-700">
              Email
            </label>
            <input
              className="w-full border-4 border-black p-3 font-bold mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={editFormData.email}
              onChange={(e) =>
                setEditFormData({ ...editFormData, email: e.target.value })
              }
              placeholder="Enter email"
              type="email"
              disabled={isUpdating}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 border-4 border-black py-3 font-black uppercase hover:bg-zinc-100 transition-colors disabled:opacity-50"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-black text-white py-3 font-black uppercase hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Update Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
