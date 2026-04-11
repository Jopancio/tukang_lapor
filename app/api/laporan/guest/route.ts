import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");

  if (!name || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Parameter 'name' wajib diisi (minimal 2 karakter)" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("laporan")
    .select("id, reporter_name, lokasi, kategori, deskripsi, urgency, status, foto_url, annotations, created_at")
    .ilike("reporter_name", name.trim())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ laporan: data ?? [] });
}
