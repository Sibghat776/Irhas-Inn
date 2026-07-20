"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, UserX, Mail, Phone, Trash2, Edit, X } from "lucide-react";
import useFetch, { baseUrl, showToast } from "@/app/utils/commonFunctions";
import axios from "axios";
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
  role?: "user" | "admin" | "superadmin";
}

const RoleBadge = ({ role }: { role?: string }) => {
  if (role === "superadmin")
    return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">Super Admin</span>;
  if (role === "admin")
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Reseller Admin</span>;
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">User</span>;
};

const UsersPage = () => {
  const { data: res } = useFetch<any>(`${baseUrl}auth/getUsers`);
  const [data, setData] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [roleChangingId, setRoleChangingId] = useState<string | null>(null);
  const [roleConfirm, setRoleConfirm] = useState<{ user: User; newRole: "user" | "admin" } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("user");

  const [editFormData, setEditFormData] = useState({ username: "", email: "" });

  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin" | "superadmin">("all");
  const visibleUsers = roleFilter === "all"
    ? data
    : data.filter((u) => (u.role ?? "user") === roleFilter);

  useEffect(() => {
    if (res?.data) setData(res.data);
  }, [res]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUserId(parsed._id ?? null);
          const resolvedRole = parsed.role ?? (parsed.isAdmin ? "superadmin" : "user");
          setCurrentUserRole(resolvedRole);
          if (process.env.NODE_ENV !== "production") console.log("[UsersPage] role:", resolvedRole);
        } catch {}
      }
    }
  }, []);

  const handleRoleChange = async () => {
    if (!roleConfirm) return;
    const { user, newRole } = roleConfirm;
    setRoleConfirm(null);
    setRoleChangingId(user._id);
    try {
      const res = await axios.patch(
        `${baseUrl}admin/users/${user._id}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      setData((prev) => prev.map((u) => u._id === user._id ? { ...u, role: newRole } : u));
      showToast(`${user.username} is now ${newRole === "admin" ? "a Reseller Admin" : "a regular User"}`, "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update role", "error");
    } finally {
      setRoleChangingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const userToDelete = data.find((user) => user._id === deleteId);
      await axios.delete(`${baseUrl}auth/deleteUser/${deleteId}`, { withCredentials: true });
      setData(data.filter((user) => user._id !== deleteId));
      const loggedInUser = localStorage.getItem("user");
      if (loggedInUser) {
        const parsedUser = JSON.parse(loggedInUser);
        if (parsedUser.username === userToDelete?.username) {
          dispatch(logout());
          localStorage.removeItem("user");
          try { await axios.get(`${baseUrl}auth/logout`, { withCredentials: true }); } catch {}
          showToast("User account deleted. You have been logged out.", "info");
          setTimeout(() => { window.location.href = "/"; }, 1500);
        } else {
          showToast("User Deleted Successfully", "success");
        }
      } else {
        showToast("User Deleted Successfully", "success");
      }
      setDeleteId(null);
    } catch (err) {
      showToast("Failed to delete user", "error");
    }
  };

  const handleUpdate = async () => {
    if (!editingUser || isUpdating) return;
    if (!editFormData.username.trim() || !editFormData.email.trim()) {
      showToast("Username and email are required", "error");
      return;
    }
    setIsUpdating(true);
    try {
      const response = await axios.put(
        `${baseUrl}auth/updateUser/${editingUser._id}`,
        { username: editFormData.username, email: editFormData.email },
        { withCredentials: true }
      );
      if (response.data.success) {
        setData(data.map((user) => user._id === editingUser._id ? { ...user, ...editFormData } : user));
        const loggedInUser = localStorage.getItem("user");
        if (loggedInUser) {
          const parsedUser = JSON.parse(loggedInUser);
          if (parsedUser.username === editingUser.username) {
            localStorage.setItem("user", JSON.stringify({ ...parsedUser, username: editFormData.username, email: editFormData.email }));
          }
        }
        showToast("User updated successfully", "success");
        setEditingUser(null);
        setEditFormData({ username: "", email: "" });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update user", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({ username: user.username, email: user.email });
  };

  const isSuperAdmin = currentUserRole === "superadmin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Customer Base</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your platform users</p>
        </div>
        <span className="inline-flex w-max items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">
          Total: {data.length}
        </span>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
        >
          <option value="all">All</option>
          <option value="user">User</option>
          <option value="admin">Reseller Admin</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[780px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-4">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Status</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleUsers.map((user) => {
              const isOwnRow = user._id === currentUserId;
              const isLoading = roleChangingId === user._id;
              return (
                <tr key={user._id} className="transition-colors hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.profilePic ? (
                        <img src={user.profilePic} className="h-10 w-10 rounded-full border border-slate-200 object-cover bg-slate-100" alt="pfp" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-slate-900">{user.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{user.email}</td>
                  <td className="p-4 text-sm font-mono text-slate-600">{user.phoneNo}</td>
                  <td className="p-4">
                    {user.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <UserCheck size={12} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        <UserX size={12} /> Unverified
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {/* Superadmin can change roles, but not their own, and not to superadmin */}
                    {isSuperAdmin && !isOwnRow && user.role !== "superadmin" ? (
                      <select
                        value={user.role ?? "user"}
                        disabled={isLoading}
                        onChange={(e) => setRoleConfirm({ user, newRole: e.target.value as "user" | "admin" })}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0856DF]/30 disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="admin">Reseller Admin</option>
                      </select>
                    ) : (
                      <RoleBadge role={user.role} />
                    )}
                    {isLoading && <span className="ml-2 text-xs text-slate-400">Saving…</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(user)} className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-600 hover:text-white" aria-label="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeleteId(user._id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-600 hover:text-white" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Change Confirmation */}
      {roleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Confirm Role Change</h3>
            <p className="mb-6 text-sm text-slate-500">
              {roleConfirm.newRole === "admin"
                ? `Make ${roleConfirm.user.username} a Reseller Admin? They will be able to add and manage their own products.`
                : `Remove admin access from ${roleConfirm.user.username}? They will lose access to the Admin panel.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRoleConfirm(null)} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleRoleChange} className="flex-1 rounded-xl bg-[#0856DF] py-3 text-sm font-semibold text-white hover:bg-[#0645c8]">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:rounded-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Delete User?</h3>
            <p className="mb-6 text-sm font-medium text-slate-500">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={22} /></button>
            </div>
            <div className="space-y-4 overflow-y-auto px-6 py-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</p>
                <p className="break-all font-mono text-sm text-slate-700">{editingUser._id}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Username</label>
                <input className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15" value={editFormData.username} onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })} placeholder="Enter username" disabled={isUpdating} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Email</label>
                <input className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} placeholder="Enter email" type="email" disabled={isUpdating} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingUser(null)} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={isUpdating}>Cancel</button>
                <button onClick={handleUpdate} disabled={isUpdating} className="flex-1 rounded-xl bg-[#0856DF] py-3 text-sm font-semibold text-white hover:bg-[#0645c8] disabled:opacity-50">
                  {isUpdating ? "Updating..." : "Update Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
