import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
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

  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const body = await request.json();
  const { task_id, status } = body;

  if (!task_id || !status) {
    return NextResponse.json(
      { error: "task_id dan status wajib diisi" },
      { status: 400 }
    );
  }

  const validStatuses = ["pending", "in_progress", "done"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Status tidak valid" },
      { status: 400 }
    );
  }

  // Only update own tasks
  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", task_id)
    .eq("pekerja_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ task: data });
}
