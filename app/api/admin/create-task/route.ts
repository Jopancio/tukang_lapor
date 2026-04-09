import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";

const ADMIN_EMAIL = "admin@google.com";

export async function POST(request: NextRequest) {
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

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await request.json();
  const { pekerja_id, judul, prioritas, tenggat, catatan } = body;

  if (!pekerja_id || !judul) {
    return NextResponse.json(
      { error: "pekerja_id dan judul wajib diisi" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert({
      pekerja_id,
      judul,
      prioritas: prioritas || "normal",
      tenggat: tenggat || null,
      catatan: catatan || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Send push notification to the assigned worker
  try {
    await sendPushNotification(pekerja_id, {
      title: "📋 Tugas Baru!",
      body: `Anda mendapat tugas baru: ${judul}`,
      url: "/dashboard/tugas",
    });
  } catch (pushError) {
    console.error("Push notification failed:", pushError);
    // Don't fail the request if push notification fails
  }

  return NextResponse.json({ task: data });
}
