// src/components/NotificationPrompt.tsx
"use client";
import { useEffect, useState } from "react";
import { checkPermissionStatus, subscribe } from "../utils/notificationClient";
import { showToast } from "../utils/commonFunctions";
import { Bell, X } from "lucide-react";

export default function NotificationPrompt() {
    const [status, setStatus] = useState<string>("default");
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);

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

    if (status === "granted" || status === "unsupported" || dismissed) return null; // Already allowed ya support nahi

    return (
        <div className="fixed bottom-3 left-3 z-50 flex max-w-[240px] items-start gap-2 rounded-xl border border-[#EEEEEE] bg-white p-2.5 shadow-lg sm:bottom-4 sm:left-4 sm:max-w-[260px] sm:gap-2.5 sm:rounded-2xl sm:p-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#00ADB5]/10 sm:h-8 sm:w-8">
                <Bell size={14} className="text-[#222831] sm:h-4 sm:w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="mb-1.5 text-[11px] leading-snug text-[#222831] sm:text-xs">
                    Enable notifications for new offers &amp; updates 🔔
                </p>
                <button
                    onClick={handleEnable}
                    disabled={loading}
                    className="inline-flex items-center rounded-lg bg-[#00ADB5] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#00ADB5] disabled:opacity-60 sm:px-3 sm:py-1.5 sm:text-xs"
                >
                    {loading ? "Enabling..." : "Enable"}
                </button>
            </div>
            <button
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
                className="flex-shrink-0 rounded-full p-0.5 text-[#222831] transition hover:bg-[#EEEEEE] hover:text-[#00ADB5]"
            >
                <X size={13} />
            </button>
        </div>
    );
}