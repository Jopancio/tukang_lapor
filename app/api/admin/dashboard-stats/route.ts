import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = "admin@google.com";

export async function GET() {
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

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [profilesRes, tasksRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("*"),
    supabaseAdmin.from("tasks").select("*"),
  ]);

  if (profilesRes.error || tasksRes.error) {
    return NextResponse.json(
      { error: profilesRes.error?.message || tasksRes.error?.message },
      { status: 500 }
    );
  }

  const profiles = profilesRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  return NextResponse.json({ profiles, tasks });
}
