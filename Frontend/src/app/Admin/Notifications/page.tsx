// src/app/Admin/Notifications/page.tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { baseUrl, showToast } from "@/app/utils/commonFunctions";
import { checkPermissionStatus, subscribe } from "../../utils/notificationClient";

const BASE_URL = baseUrl || "http://localhost:5000/api/v1";

export default function AdminNotificationPage() {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [link, setLink] = useState("/");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSend = async () => {
        console.log("FRONTEND PUBLIC:",
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
        if (!title || !body) return showToast("Please enter title and message", "error");

        setLoading(true);
        setResult(null);

        try {
            const { data } = await axios.post(
                `${BASE_URL}push/send`,
                { title, body, link },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            setResult(data);

            if (data?.success !== false) {
                setTitle("");
                setBody("");
                setLink("/");
            }
        } catch (err: any) {
            showToast(err?.response?.data?.message || "Something went wrong", "error");
            setResult(null);
        }

        setLoading(false);
    };

    return (
        <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Send Push Notification
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Broadcast a message to all subscribed devices.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Title
                        </label>
                        <input
                            placeholder="e.g. Naya Sale Live!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Message
                        </label>
                        <textarea
                            placeholder="Write your notification message..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15 resize-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Link
                        </label>
                        <input
                            placeholder="e.g. /sale"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-[#0856DF] focus:ring-2 focus:ring-[#0856DF]/15"
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="w-full rounded-xl bg-[#0856DF] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0645c8] disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Notification"}
                    </button>
                </div>

                {result && (
                    <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    );
}