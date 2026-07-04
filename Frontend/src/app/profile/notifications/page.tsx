"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/Redux/store";
import { startLoading, stopLoading } from "@/app/Redux/Features/uiSlice";
import { Bell, ArrowLeft, CheckCheck, Trash2 } from "lucide-react";
import { baseUrl, showToast } from "@/app/utils/commonFunctions";

const NotificationsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!auth.username) return;
    dispatch(startLoading("ZF Loading Notifications"));
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}notifications/`, { withCredentials: true });
      console.log("[Notifications] Fetched:", res.data.data?.length || 0);
      setNotifications(res.data.data || []);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load notifications", "error");
    } finally {
      setLoading(false);
      dispatch(stopLoading());
    }
  }, [auth.username]);

  const markAsRead = async () => {
    try {
      await axios.patch(`${baseUrl}notifications/mark-as-read`, {}, { withCredentials: true });
      console.log("[Notifications] Marked all as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err: any) {
      console.error("[Notifications] Mark as read error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-400 via-white to-gray-100 px-4 pt-24 pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#0856DF] transition-colors">
            <ArrowLeft size={16} /> Back to Profile
          </Link>
          {unreadCount > 0 && (
            <button onClick={markAsRead}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0856DF] hover:text-blue-700 transition-colors">
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
        </div>

        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Notifications</h1>
        <p className="text-gray-600 font-semibold mb-8">
          {unreadCount > 0 ? `You have ${unreadCount} unread notification(s)` : "All caught up!"}
        </p>

        {loading ? (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-semibold">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-700">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">We&apos;ll notify you when your order status updates.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                  notif.isRead ? "border-gray-200" : "border-blue-200 bg-blue-50/50"
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.isRead ? "bg-gray-100 text-gray-400" : "bg-[#0856DF]/10 text-[#0856DF]"
                  }`}>
                    <Bell size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm ${notif.isRead ? "font-semibold text-gray-700" : "font-bold text-gray-900"}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#0856DF] flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
