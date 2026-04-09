import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAuthenticatedUser() {
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
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  // Any authenticated worker can see open laporan
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Return only open (baru / diproses) reports, newest first
  const { data, error } = await supabaseAdmin
    .from("laporan")
    .select("*")
    .in("status", ["baru", "diproses"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ laporan: data ?? [] });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status } = body as { id: string; status: string };

  if (!id || !status) {
    return NextResponse.json({ error: "id dan status wajib diisi" }, { status: 400 });
  }

  const allowedStatuses = ["diproses", "selesai"];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin
    .from("laporan")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
