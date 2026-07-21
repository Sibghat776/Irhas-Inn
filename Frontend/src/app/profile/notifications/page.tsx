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
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err: any) {
      console.error("[Notifications] Mark as read error:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (notifications.length > 0 && unreadCount > 0) {
      markAsRead();
    }
  }, [notifications]);

  useEffect(() => {
    if (unreadCount === 0 && notifications.length > 0) {
      window.dispatchEvent(new Event("notifications-read"));
    }
  }, [unreadCount]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-white to-[#FFFFFF] px-4 pt-24 pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-[#222831] hover:text-[#00ADB5] transition-colors">
            <ArrowLeft size={16} /> Back to Profile
          </Link>
          {unreadCount > 0 && (
            <button onClick={markAsRead}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#222831] hover:text-[#00ADB5] transition-colors">
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
        </div>

        <h1 className="text-4xl font-black text-[#222831] tracking-tight mb-2">Notifications</h1>
        <p className="text-[#222831] font-semibold mb-8">
          {unreadCount > 0 ? `You have ${unreadCount} unread notification(s)` : "All caught up!"}
        </p>

        {loading ? (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto text-[#222831] mb-4" />
            <p className="text-[#222831] font-semibold">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#EEEEEE] shadow-sm">
            <Bell size={48} className="mx-auto text-[#222831] mb-4" />
            <p className="text-lg font-bold text-[#222831]">No notifications yet</p>
            <p className="text-sm text-[#222831] mt-1">We&apos;ll notify you when your order status updates.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                  notif.isRead ? "border-[#EEEEEE]" : "border-[#EEEEEE] bg-[#FFFFFF]"
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.isRead ? "bg-[#FFFFFF] text-[#222831]" : "bg-[#00ADB5]/10 text-[#222831]"
                  }`}>
                    <Bell size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm ${notif.isRead ? "font-semibold text-[#222831]" : "font-bold text-[#222831]"}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#00ADB5] flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-[#222831] mt-1">{notif.message}</p>
                    <p className="text-[10px] text-[#222831] mt-1.5">
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
