// src/components/NotificationPrompt.tsx
"use client";
import { useEffect, useState } from "react";
import { checkPermissionStatus, subscribe } from "../utils/notificationClient"; import { showToast } from "../utils/commonFunctions";

export default function NotificationPrompt() {
    const [status, setStatus] = useState<string>("default");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setStatus(checkPermissionStatus());
    }, []);

    const handleEnable = async () => {
        setLoading(true);
        try {
            await subscribe();
            setStatus("granted");
            showToast("Notifications enabled", "success");
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : String(err);
            showToast(`Failed to enable notifications: ${msg}`, "error");
        } finally {
            setLoading(false);
        }
    };

    if (status === "granted" || status === "unsupported") return null; // Already allowed ya support nahi

    return (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border z-50">
            <p className="text-sm mb-2">Enable notifications for new offers and updates 🔔</p>
            <button
                onClick={handleEnable}
                disabled={loading}
                className="bg-black text-white px-4 py-2 rounded text-sm"
            >
                {loading ? "Enabling..." : "Enable Notifications"}
            </button>
        </div>
    );
}