"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TrendingUp, LayoutDashboard, ClipboardList, MapPin, History, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard, href: "/dashboard", badge: null },
  { id: "tugas", label: "Tugas Saya", Icon: ClipboardList, href: "/dashboard/tugas", badge: 3 },
  { id: "area", label: "Peta Area", Icon: MapPin, href: "/dashboard/peta-area", badge: null },
  { id: "riwayat", label: "Riwayat Kerja", Icon: History, href: "/dashboard/riwayat", badge: null },
];

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        className="lg:hidden fixed top-0 left-0 z-50 flex items-center justify-center"
        style={{ width: 56, height: 70, background: "transparent", border: "none", cursor: "pointer" }}
        onClick={() => setIsOpen(true)}
        aria-label="Buka menu navigasi"
      >
        <Menu size={22} color="#15803D" />
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

    <aside
      className={`flex flex-col justify-between fixed lg:relative inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      style={{ width: 240, background: "#15803D", flexShrink: 0 }}
    >
      {/* TOP */}
      <div>
        {/* Brand */}
        <div className="flex items-center justify-between" style={{ padding: "28px 24px" }}>
          <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-[10px]"
            style={{ width: 36, height: 36, background: "#FFFFFF22" }}
          >
            <TrendingUp size={18} color="#FFFFFF" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: 15,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1,
              }}
            >
              CleanPoint
            </span>
            <span
              style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#86EFAC", lineHeight: 1 }}
            >
              v2.0
            </span>
          </div>
          </div>
          {/* Mobile close button */}
          <button
            className="lg:hidden flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", flexShrink: 0 }}
            onClick={() => setIsOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={16} color="#FFFFFF" />
          </button>
        </div>

        {/* Divider */}
        <div style={{ background: "#FFFFFF", height: 1, opacity: 0.12 }} />

        {/* Section Label */}
        <div
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 10,
            fontWeight: 600,
            color: "#86EFAC",
            opacity: 0.7,
            padding: "16px 24px 8px",
            letterSpacing: "0.05em",
          }}
        >
          MENU UTAMA
        </div>

        {/* Nav Items */}
        {NAV_ITEMS.map(({ id, label, Icon, href, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={id}
              href={href}
              className="relative flex items-center gap-3 w-full"
              style={{
                height: 48,
                padding: "0 20px",
                background: active ? "#FFFFFF" : "transparent",
                textDecoration: "none",
              }}
              onClick={() => setIsOpen(false)}
            >
              {active && (
                <span
                  className="absolute left-0 rounded-r-sm"
                  style={{ width: 4, height: 40, background: "#4ADE80", top: 4 }}
                />
              )}
              <Icon
                size={18}
                color={active ? "#15803D" : "#FFFFFF"}
                style={{ opacity: active ? 1 : 0.7 }}
              />
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#15803D" : "#FFFFFF",
                  opacity: active ? 1 : 0.7,
                  flex: 1,
                }}
              >
                {label}
              </span>
              {badge !== null && (
                <span
                  className="flex items-center justify-center rounded-[10px]"
                  style={{
                    width: 20,
                    height: 20,
                    background: "#EF4444",
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#FFFFFF",
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* BOTTOM */}
      <div>
        <div style={{ background: "#FFFFFF", height: 1, opacity: 0.12 }} />
        <div className="relative flex items-center gap-3" style={{ padding: 20 }}>
          <div
            className="rounded-full"
            style={{ width: 40, height: 40, background: "#4ADE80", flexShrink: 0 }}
          />
          {/* Online dot */}
          <span
            className="absolute rounded-full"
            style={{
              width: 10,
              height: 10,
              background: "#4ADE80",
              border: "2px solid #15803D",
              left: 46,
              top: 42,
            }}
          />
          <div className="flex flex-col gap-0.5">
            <span
              style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}
            >
              Pak Sumarno
            </span>
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#86EFAC" }}>
              Bapa Prakarya
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
          >
            <LogOut size={16} color="#86EFAC" style={{ opacity: 0.8 }} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
