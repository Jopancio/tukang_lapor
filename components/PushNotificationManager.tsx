"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff, BellRing, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const DISMISSED_KEY = "push_popup_dismissed";

function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setReady(true);
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } finally {
      setReady(true);
    }
  }

  const subscribeToPush = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      setSubscription(sub);

      const serializedSub = JSON.parse(JSON.stringify(sub));
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: serializedSub }),
      });
    } catch (err) {
      console.error("Failed to subscribe:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = subscription?.endpoint;
      await subscription?.unsubscribe();
      setSubscription(null);

      if (endpoint) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  return { isSupported, subscription, loading, ready, subscribeToPush, unsubscribeFromPush };
}

/* ─── BELL BUTTON (topbar) ──────────────────────────────────── */

export default function PushNotificationManager() {
  const { isSupported, subscription, loading, subscribeToPush, unsubscribeFromPush } =
    usePushNotification();

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={subscription ? unsubscribeFromPush : subscribeToPush}
      disabled={loading}
      title={subscription ? "Nonaktifkan Notifikasi" : "Aktifkan Notifikasi"}
      className="flex items-center justify-center rounded-[10px] transition-colors"
      style={{
        width: 38,
        height: 38,
        background: subscription ? "#F0FDF4" : "#FEF2F2",
        border: `1px solid ${subscription ? "#BBF7D0" : "#FECACA"}`,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {subscription ? (
        <Bell size={16} color="#16A34A" />
      ) : (
        <BellOff size={16} color="#EF4444" />
      )}
    </button>
  );
}

/* ─── POPUP (shown when not subscribed) ─────────────────────── */

export function PushNotificationPopup() {
  const { isSupported, subscription, loading, ready, subscribeToPush } =
    usePushNotification();
  const [dismissed, setDismissed] = useState(true); // start hidden

  useEffect(() => {
    // Only show popup after we know the subscription state
    if (!ready) return;
    if (subscription) {
      setDismissed(true);
      return;
    }
    // Check if user dismissed it this session
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, [ready, subscription]);

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleEnable() {
    await subscribeToPush();
    setDismissed(true);
    sessionStorage.removeItem(DISMISSED_KEY);
  }

  if (!isSupported || dismissed || subscription) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
        }}
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "min(420px, 90vw)",
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Green header strip */}
        <div
          style={{
            background: "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)",
            padding: "28px 24px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <BellRing size={28} color="#FFFFFF" />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: 20,
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Aktifkan Notifikasi
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              margin: "6px 0 0",
              lineHeight: 1.5,
            }}
          >
            Jangan lewatkan tugas baru dari admin!
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 18,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "#15803D",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Dengan mengaktifkan notifikasi, Anda akan langsung mendapat
              pemberitahuan setiap kali ada <strong>tugas baru</strong> yang
              ditugaskan kepada Anda — bahkan saat browser tidak terbuka.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleDismiss}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                fontWeight: 600,
                color: "#6B7280",
                cursor: "pointer",
              }}
            >
              Nanti Saja
            </button>
            <button
              onClick={handleEnable}
              disabled={loading}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: "none",
                background: loading
                  ? "#86EFAC"
                  : "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)",
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Bell size={15} />
              {loading ? "Mengaktifkan..." : "Aktifkan"}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "none",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={16} color="#FFFFFF" />
        </button>
      </div>
    </>
  );
}
