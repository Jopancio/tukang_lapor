import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";

const KATEGORI_LABEL: Record<string, string> = {
  kebersihan_kelas: "Kebersihan Kelas",
  kebersihan_toilet: "Kebersihan Toilet",
  kebersihan_koridor: "Kebersihan Koridor",
  kebersihan_kantin: "Kebersihan Kantin",
  kebersihan_halaman: "Kebersihan Halaman",
  kerusakan_fasilitas: "Kerusakan Fasilitas",
  sampah_menumpuk: "Sampah Menumpuk",
  lainnya: "Lainnya",
};

const URGENCY_EMOJI: Record<string, string> = {
  darurat: "🚨",
  segera: "⚠️",
  normal: "📋",
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { reporter_name, lokasi, kategori, deskripsi, urgency, foto_url, annotations } = body;

  if (!reporter_name || !lokasi || !kategori || !deskripsi) {
    return NextResponse.json(
      { error: "reporter_name, lokasi, kategori, dan deskripsi wajib diisi" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("laporan")
    .insert({
      reporter_name: reporter_name.trim(),
      lokasi: lokasi.trim(),
      kategori,
      deskripsi: deskripsi.trim(),
      urgency: urgency || "normal",
      status: "baru",
      foto_url: foto_url || null,
      annotations: annotations || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Notify all active prakarya workers
  try {
    const { data: workers } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("status", "aktif")
      .neq("role", "Guest");

    if (workers?.length) {
      const urgencyVal = urgency || "normal";
      const emoji = URGENCY_EMOJI[urgencyVal] ?? "📋";
      const kategoriLabel = KATEGORI_LABEL[kategori] ?? kategori;

      await Promise.allSettled(
        workers.map((w) =>
          sendPushNotification(w.id, {
            title: `${emoji} Laporan Baru — ${kategoriLabel}`,
            body: `${reporter_name} · ${lokasi}: ${deskripsi.slice(0, 80)}${deskripsi.length > 80 ? "…" : ""}`,
            url: "/admin/laporan-masuk",
          })
        )
      );
    }
  } catch (pushError) {
    console.error("Push notification error:", pushError);
    // Don't fail the request if push fails
  }

  return NextResponse.json({ laporan: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  // Only admin can list all reports
  const { createServerClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ADMIN_EMAIL = "admin@google.com";
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = supabaseAdmin
    .from("laporan")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "semua") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ laporan: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const { createServerClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ADMIN_EMAIL = "admin@google.com";
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "id dan status wajib diisi" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("laporan")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ laporan: data });
}
