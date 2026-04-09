import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Nama, email, dan password wajib diisi" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter" },
      { status: 400 }
    );
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create user — email_confirm: true skips email verification
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "Guest" },
  });

  if (error) {
    // Surface friendly messages for common errors
    if (error.message.includes("already been registered") || error.message.includes("already registered")) {
      return NextResponse.json({ error: "Email ini sudah terdaftar. Silakan login." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Insert profile with Guest role
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    email,
    name: name.trim(),
    role: "Guest",
    status: "aktif",
  });

  if (profileError) {
    console.error("Profile insert error:", profileError.message);
    // Don't block — user can still log in
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
