"use client";

import { TrendingUp } from "lucide-react";

interface AuthLeftPanelProps {
  mode: "login" | "signup";
}

const LOGIN_FEATURES = [
  "✓  Deteksi kondisi lingkungan sekolah",
  "✓  Laporan sampah & bahaya otomatis",
  "✓  Monitor pemborosan energi real-time",
];

const SIGNUP_DESCRIPTION =
  "Buat akun gratis dan mulai\nmelaporkan kondisi lingkungan\nsekolah Anda hari ini.";

const STATS = [
  { num: "500+", label: "Sekolah" },
  { num: "10K+", label: "Laporan" },
  { num: "98%", label: "Akurasi AI" },
];

export default function AuthLeftPanel({ mode }: AuthLeftPanelProps) {
  return (
    <div
      className="relative hidden lg:flex flex-col justify-between overflow-hidden"
      style={{
        width: 560,
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #15803D 0%, #16A34A 60%, #22C55E 100%)",
        padding: 56,
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280,
          height: 280,
          background: "#FFFFFF",
          opacity: 0.05,
          top: -80,
          right: mode === "login" ? -60 : -40,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 200,
          height: 200,
          background: "#FFFFFF",
          opacity: 0.06,
          bottom: mode === "login" ? 100 : 120,
          left: -60,
        }}
      />

      {/* Top content */}
      <div className="flex flex-col gap-7 relative z-10">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{ width: 60, height: 60, background: "rgba(255,255,255,0.13)" }}
        >
          <TrendingUp size={28} color="#FFFFFF" />
        </div>

        {/* App name */}
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
            fontSize: 34,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: -1,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Tukang Lapor
        </h1>

        {/* Tagline / description */}
        {mode === "login" ? (
          <p
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontSize: 16,
              fontWeight: 400,
              color: "#DCFCE7",
              lineHeight: 1.6,
              maxWidth: 400,
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {"Sistem Pelaporan ESG\nSekolah Pintar"}
          </p>
        ) : (
          <>
            {/* Badge for signup */}
            <div
              className="flex items-center gap-2 w-fit"
              style={{
                background: "rgba(255,255,255,0.18)",
                borderRadius: 20,
                padding: "6px 12px",
              }}
            >
              <TrendingUp size={14} color="#DCFCE7" />
              <span
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 13,
                  color: "#DCFCE7",
                  fontWeight: 500,
                }}
              >
                Bergabung Sekarang
              </span>
            </div>

            <p
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontSize: 15,
                fontWeight: 400,
                color: "#DCFCE7",
                lineHeight: 1.7,
                maxWidth: 400,
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {SIGNUP_DESCRIPTION}
            </p>
          </>
        )}

        {/* Green divider */}
        <div
          style={{
            width: 40,
            height: 2,
            background: "#4ADE80",
            opacity: 0.8,
            borderRadius: 1,
          }}
        />

        {/* Features (login only) */}
        {mode === "login" && (
          <div className="flex flex-col gap-3">
            {LOGIN_FEATURES.map((f) => (
              <p
                key={f}
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#A7F3D0",
                  margin: 0,
                }}
              >
                {f}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Stats at the bottom */}
      <div className="relative z-10">
        <div
          style={{
            width: "100%",
            height: 1,
            background: "#FFFFFF",
            opacity: 0.15,
            marginBottom: 24,
          }}
        />
        <div className="flex justify-between items-center">
          {STATS.map((stat) => (
            <div key={stat.num} className="flex flex-col items-center gap-0.5">
              <span
                style={{
                  fontFamily:
                    "var(--font-space-grotesk, 'Space Grotesk', sans-serif)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {stat.num}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-inter, Inter, sans-serif)",
                  fontSize: 11,
                  fontWeight: 400,
                  color: "#A7F3D0",
                  opacity: 0.85,
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
