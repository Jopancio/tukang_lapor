import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  /* ── Auth: any logged-in worker ─────────────────────────── */
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

  /* ── Parse body ─────────────────────────────────────────── */
  const body = await req.json().catch(() => ({}));
  const { focus } = body as { focus?: string };

  /* ── Fetch worker's own tasks ───────────────────────────── */
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("pekerja_id", user.id)
    .order("created_at", { ascending: false });

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, area, role")
    .eq("id", user.id)
    .single();

  const allTasks = tasks ?? [];

  if (allTasks.length === 0) {
    return NextResponse.json({ error: "Belum ada data tugas untuk dianalisis." }, { status: 400 });
  }



  /* ── Build summary ──────────────────────────────────────── */
  const doneTasks  = allTasks.filter((t) => t.status === "done");
  const inProgress = allTasks.filter((t) => t.status === "progress");
  const waiting    = allTasks.filter((t) => t.status === "menunggu");

  const priorityCount: Record<string, number> = {};
  for (const t of allTasks) {
    const p = t.prioritas ?? "normal";
    priorityCount[p] = (priorityCount[p] ?? 0) + 1;
  }

  const efficiency = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;

  const workerName = profile?.name ?? user.email ?? "Pekerja";
  const workerArea = profile?.area ?? "-";

  /* ── Build Gemini prompt ────────────────────────────────── */
  const focusNote = focus ? `\nFokus analisis: ${focus}.` : "";

  const prompt = `
Kamu adalah asisten AI untuk sistem manajemen kebersihan sekolah bernama "Tukang Lapor".
Berikan analisis performa kebersihan untuk seorang pekerja dalam Bahasa Indonesia yang konstruktif, jelas, dan actionable.${focusNote}

PROFIL PEKERJA:
- Nama: ${workerName}
- Area: ${workerArea}

DATA TUGAS:
- Total tugas: ${allTasks.length}
- Selesai: ${doneTasks.length}
- Dalam proses: ${inProgress.length}
- Menunggu: ${waiting.length}
- Efisiensi penyelesaian: ${efficiency}%

DISTRIBUSI PRIORITAS:
${Object.entries(priorityCount).map(([k, v]) => `- ${k.toUpperCase()}: ${v} tugas`).join("\n")}

Berikan respons dalam format JSON berikut (tanpa markdown code block, cukup JSON mentah):
{
  "ringkasan": "1–2 kalimat ringkasan performa pekerja saat ini",
  "kategoriUtama": [
    {
      "kategori": "Nama kategori (mis: Penyelesaian Tugas, Penanganan Darurat, dll)",
      "status": "baik" | "perlu_perhatian" | "kritis",
      "temuan": "Penjelasan singkat temuan untuk kategori ini",
      "rekomendasi": "Saran konkret yang bisa langsung ditindaklanjuti"
    }
  ],
  "skorKesehatan": 0-100,
  "tindakanSegera": ["aksi 1", "aksi 2", "aksi 3"]
}
`;

  /* ── Call Gemini ─────────────────────────────────────────── */
  try {
    const text = await callGeminiWithFallback(async (ai, model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return (response.text ?? "").trim();
    });

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ raw: cleaned });
    }

    return NextResponse.json({ analysis: parsed });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Gagal memanggil Gemini";
    const isQuota = /429|503|quota|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(msg);
    return NextResponse.json(
      { error: isQuota ? "Kuota AI habis. Coba lagi nanti." : msg },
      { status: isQuota ? 429 : 500 }
    );
  }
}
