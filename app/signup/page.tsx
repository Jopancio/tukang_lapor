import Link from "next/link";
import { ShieldAlert, ArrowLeft, Phone } from "lucide-react";
import AuthLeftPanel from "@/components/AuthLeftPanel";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen" style={{ background: "#F5F7FA" }}>
      {/* Left Panel */}
      <AuthLeftPanel mode="signup" />

      {/* Right Panel */}
      <div
        className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 sm:py-16"
        style={{ background: "#F5F7FA" }}
      >
        {/* Info Card */}
        <div
          className="flex flex-col items-center text-center w-full"
          style={{
            maxWidth: 440,
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "clamp(24px, 5vw, 48px)",
            gap: 28,
            boxShadow: "0 8px 32px rgba(0,0,0,0.094)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldAlert size={32} color="#16A34A" />
          </div>

          {/* Heading */}
          <div className="flex flex-col" style={{ gap: 10 }}>
            <h2
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 26,
                fontWeight: 700,
                color: "#0D0D0D",
                letterSpacing: -0.5,
                margin: 0,
              }}
            >
              Ingin Bergabung?
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 15,
                fontWeight: 400,
                color: "#6B7280",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Pendaftaran akun hanya dapat dilakukan oleh administrator sekolah.
              Silakan hubungi admin untuk membuat akun Anda.
            </p>
          </div>

          {/* Contact Card */}
          <div
            className="flex items-center gap-3 w-full"
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Phone size={16} color="#16A34A" />
            </div>
            <div className="flex flex-col text-left" style={{ gap: 2 }}>
              <span
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#9CA3AF",
                }}
              >
                Hubungi Administrator
              </span>
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Kantor Tata Usaha Sekolah
              </span>
            </div>
          </div>

          {/* Back to Login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full transition-opacity hover:opacity-90 active:opacity-80"
            style={{
              background: "#16A34A",
              borderRadius: 8,
              height: 48,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(22,163,74,0.25)",
            }}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
            <span
              style={{
                fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                fontSize: 15,
                fontWeight: 600,
                color: "#FFFFFF",
              }}
            >
              Kembali ke Login
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}