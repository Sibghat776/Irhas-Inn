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
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-black uppercase tracking-tight mb-6">
                Send Push Notification
            </h1>

            <div className="space-y-3">
                <input
                    placeholder="Title (e.g. Naya Sale Live!)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-2 border-zinc-300 p-3 w-full rounded focus:border-black outline-none"
                />
                <textarea
                    placeholder="Message"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="border-2 border-zinc-300 p-3 w-full rounded focus:border-black outline-none"
                />
                <input
                    placeholder="Link (e.g. /sale)"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="border-2 border-zinc-300 p-3 w-full rounded focus:border-black outline-none"
                />

                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="bg-black text-white font-bold uppercase tracking-wide px-4 py-3 rounded w-full disabled:opacity-50"
                >
                    {loading ? "Sending..." : "Send Notification"}
                </button>
            </div>

            {result && (
                <pre className="mt-4 text-sm bg-zinc-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}