"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  LayoutDashboard,
  FileBarChart2,
  Users,
  ClipboardList,
  MapPin,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dasbor Admin",   Icon: LayoutDashboard, href: "/admin",          badge: null },
  { id: "laporan",   label: "Laporan",         Icon: FileBarChart2,   href: "/admin/laporan",  badge: 0 },
  { id: "pekerja",   label: "Manaj. Pekerja",  Icon: Users,           href: "/admin/pekerja",  badge: null },
  { id: "tugas",     label: "Manaj. Tugas",    Icon: ClipboardList,   href: "/admin/tugas",    badge: 7 },
  { id: "area",      label: "Peta Area",       Icon: MapPin,          href: "/admin/area",     badge: null },
];

export default function AdminSidebar() {
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
        <Menu size={22} color="#1E3A5F" />
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
      style={{ width: 240, background: "#1E3A5F", flexShrink: 0 }}
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
              <ShieldCheck size={18} color="#FFFFFF" />
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
                style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#93C5FD", lineHeight: 1 }}
              >
                Panel Admin
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
            color: "#93C5FD",
            opacity: 0.7,
            padding: "16px 24px 8px",
            letterSpacing: "0.05em",
          }}
        >
          MANAJEMEN
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
                  style={{ width: 4, height: 40, background: "#60A5FA", top: 4 }}
                />
              )}
              <Icon
                size={18}
                color={active ? "#1E3A5F" : "#FFFFFF"}
                style={{ opacity: active ? 1 : 0.7 }}
              />
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#1E3A5F" : "#FFFFFF",
                  opacity: active ? 1 : 0.7,
                  flex: 1,
                }}
              >
                {label}
              </span>
              {badge !== null && badge > 0 && (
                <span
                  className="flex items-center justify-center rounded-[10px]"
                  style={{
                    minWidth: 20,
                    height: 20,
                    padding: "0 5px",
                    background: active ? "#EF4444" : "#EF4444CC",
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

      {/* BOTTOM — Profile */}
      <div>
        <div style={{ background: "#FFFFFF", height: 1, opacity: 0.12 }} />

        {/* Profile row */}
        <div
          className="flex items-center gap-3"
          style={{ padding: "18px 20px" }}
        >
          <div
            className="relative flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 36, height: 36, background: "#2563EB" }}
          >
            <span
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: 14,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              BH
            </span>
            <span
              className="absolute rounded-full"
              style={{
                width: 9,
                height: 9,
                background: "#22C55E",
                border: "1.5px solid #1E3A5F",
                bottom: 0,
                right: 0,
              }}
            />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: 12,
                fontWeight: 700,
                color: "#FFFFFF",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Bu Hartini
            </span>
            <span
              style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#93C5FD" }}
            >
              Kepala Sekolah
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
          >
            <LogOut size={15} color="#93C5FD" style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
