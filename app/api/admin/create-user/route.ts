import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "admin@google.com";

export async function POST(request: NextRequest) {
  // 1. Verify the caller is an authenticated admin
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

  // 2. Parse request body
  const body = await request.json();
  const { email, password, name, role, area, phone } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password harus diisi" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter" },
      { status: 400 }
    );
  }

  // 3. Create user with Service Role Key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 4. Insert profile row so Realtime and UI can pick it up
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: data.user.id,
      email,
      name: name || null,
      role: role || "Bapa Prakarya",
      area: area || null,
      phone: phone || null,
      status: "aktif",
    });

  if (profileError) {
    // Auth user was created; soft-fail on profile insert so we don't block login
    console.error("Profile insert error:", profileError.message);
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}
