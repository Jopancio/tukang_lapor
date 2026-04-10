"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldX, X } from "lucide-react";

export default function RestrictedPopup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("restricted") === "1") {
      setShow(true);
    }
  }, [searchParams]);

  function dismiss() {
    setShow(false);
    // Remove the query param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("restricted");
    router.replace(url.pathname + url.search, { scroll: false });
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={dismiss}
    >
      <div
        className="flex flex-col items-center relative"
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          padding: "40px 36px 32px",
          maxWidth: 380,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          gap: 20,
          animation: "popupIn 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "#F3F4F6",
            border: "none",
            borderRadius: 8,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={16} color="#6B7280" />
        </button>

        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 72,
            height: 72,
            background: "#FEE2E2",
            border: "2px solid #FECACA",
          }}
        >
          <ShieldX size={32} color="#DC2626" />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center text-center" style={{ gap: 8 }}>
          <h2
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: 20,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            Akses Ditolak
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              color: "#6B7280",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Kamu tidak dapat mengakses area ini. Silakan kembali atau hubungi administrator.
          </p>
        </div>

        {/* OK Button */}
        <button
          onClick={dismiss}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            background: "#DC2626",
            color: "#FFFFFF",
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Mengerti
        </button>
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
