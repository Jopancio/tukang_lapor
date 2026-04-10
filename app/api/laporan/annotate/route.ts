import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { foto_url } = body as { foto_url?: string };

  if (!foto_url || typeof foto_url !== "string") {
    return NextResponse.json(
      { error: "foto_url wajib diisi" },
      { status: 400 }
    );
  }

  // Validate URL belongs to our Supabase storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !foto_url.startsWith(supabaseUrl)) {
    return NextResponse.json(
      { error: "URL foto tidak valid" },
      { status: 400 }
    );
  }



  /* ── Fetch image and convert to base64 ────────────────── */
  let base64Data: string;
  let mimeType: string;

  try {
    const imgRes = await fetch(foto_url);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil gambar" },
        { status: 400 }
      );
    }

    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    mimeType = contentType.split(";")[0].trim();

    const buffer = await imgRes.arrayBuffer();
    base64Data = Buffer.from(buffer).toString("base64");
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil gambar dari storage" },
      { status: 500 }
    );
  }

  /* ── Ask Gemini to detect trash locations ─────────────── */
  const prompt = `You are a trash/litter detection assistant for a school cleanliness app.

Analyze this image and identify all visible trash, litter, garbage, waste, dirt, or cleanliness issues.

For each detected item, provide a bounding box as normalized percentages (0 to 100) of the image dimensions.

Respond ONLY with raw JSON (no markdown, no code blocks), in this exact format:
{
  "detections": [
    {
      "label": "Short label in Indonesian (e.g. Sampah Plastik, Kertas Bekas, Tumpukan Sampah)",
      "confidence": 0.0 to 1.0,
      "box": {
        "x": left edge as percentage 0-100,
        "y": top edge as percentage 0-100,
        "w": width as percentage 0-100,
        "h": height as percentage 0-100
      }
    }
  ]
}

If no trash or issues are visible, return: {"detections": []}
Be thorough - identify all visible trash items, even small ones.`;

  try {
    const text = await callGeminiWithFallback(async (ai, model) => {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Data } },
            ],
          },
        ],
      });
      return (response.text ?? "").trim();
    });

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: { detections?: unknown[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ detections: [], raw: cleaned });
    }

    // Validate structure
    const detections = Array.isArray(parsed.detections)
      ? parsed.detections.filter(
          (d: unknown) => {
            if (!d || typeof d !== "object") return false;
            const obj = d as Record<string, unknown>;
            if (!obj.box || typeof obj.box !== "object") return false;
            const box = obj.box as Record<string, unknown>;
            return (
              typeof box.x === "number" &&
              typeof box.y === "number" &&
              typeof box.w === "number" &&
              typeof box.h === "number"
            );
          }
        )
      : [];

    return NextResponse.json({ detections });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Gagal menganalisis gambar";
    const isQuota = /429|503|quota|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(msg);
    return NextResponse.json(
      { error: isQuota ? "Kuota AI habis. Coba lagi nanti." : msg },
      { status: isQuota ? 429 : 500 }
    );
  }
}
