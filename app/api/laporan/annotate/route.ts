import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback } from "@/lib/gemini";

/* -- Shared prompt ------------------------------------------- */

const DETECTION_PROMPT = `You are a precise image analysis assistant for a school environment reporting app.

TASK: Analyze this image and determine if there are any issues worth reporting. Detect ALL problems across these categories:

1. SAMPAH BERSERAKAN — Scattered trash, litter, garbage, waste on floors/ground/tables
2. BAHAYA TUMPAHAN CAIRAN — Liquid spills, puddles, wet floors, leaks
3. TONG SAMPAH OVERLOAD — Overflowing trash bins, full garbage cans with trash spilling out
4. PEMBOROSAN ENERGI — Energy waste: lights on in empty rooms, AC running with no one present, projectors/screens left on, fans running in empty spaces, doors/windows open while AC is on
5. LAINNYA — Any other cleanliness, safety, or facility maintenance issues (broken items, vandalism, etc.)

IMPORTANT — CLEAN/IDEAL CONDITION CHECK:
If the image shows a CLEAN, TIDY, NORMAL environment with NO issues (e.g. a clean classroom, empty hallway with no trash, well-maintained area), set "is_clean" to true and return empty detections.

BOUNDING BOX RULES:
- Each box: (x, y, w, h) as percentages of image dimensions (0-100).
- x = LEFT edge %, y = TOP edge %, w = WIDTH %, h = HEIGHT %.
- Box MUST tightly enclose the ENTIRE object with ~2-3% margin.
- For spills/puddles: cover the FULL spread area from topmost to bottommost and leftmost to rightmost point.
- VERIFY: (x + w) past the object's right side, (y + h) past the bottom.

Respond ONLY with raw JSON (no markdown, no code fences):
{
  "is_clean": true or false,
  "detections": [
    {
      "label": "Short label in Indonesian (e.g. Sampah Plastik, Tumpahan Air, Tong Sampah Penuh, AC Menyala Tanpa Penghuni, Lampu Menyala Ruangan Kosong)",
      "confidence": 0.0 to 1.0,
      "box": { "x": number, "y": number, "w": number, "h": number }
    }
  ]
}

If clean: {"is_clean": true, "detections": []}
Be thorough — detect every issue, even small ones.`;

/* -- Parse & validate detections ----------------------------- */

interface DetectionBox {
  label: string;
  confidence: number;
  box: { x: number; y: number; w: number; h: number };
}

interface AnalysisResult {
  is_clean: boolean;
  detections: DetectionBox[];
}

function parseAnalysis(raw: string): AnalysisResult {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: { is_clean?: boolean; detections?: unknown[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { is_clean: false, detections: [] };
  }

  const isClean = parsed.is_clean === true;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const detections = Array.isArray(parsed.detections)
    ? parsed.detections
        .filter((d: unknown) => {
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
        })
        .map((d: unknown) => {
          const obj = d as DetectionBox;
          return {
            ...obj,
            box: {
              x: clamp(obj.box.x),
              y: clamp(obj.box.y),
              w: clamp(Math.min(obj.box.w, 100 - obj.box.x)),
              h: clamp(Math.min(obj.box.h, 100 - obj.box.y)),
            },
          };
        })
    : [];

  return { is_clean: isClean && detections.length === 0, detections };
}

/* -- Groq-specific prompt (Llama needs more explicit guidance) */

const GROQ_SYSTEM_PROMPT = `You are an expert image analysis AI for a school environment reporting app. You detect all kinds of issues: scattered trash, liquid spills, overflowing bins, energy waste (lights/AC/projectors on in empty rooms), and other maintenance problems. You also determine if an image shows a clean/ideal condition with no issues. You output ONLY valid JSON with precise bounding boxes.`;

const GROQ_USER_PROMPT = `Analyze this image from a school environment reporting app.

STEP 1: Determine if the image shows a CLEAN, IDEAL, NORMAL environment with NO issues. If yes, set "is_clean" to true.
STEP 2: If issues exist, identify every problem across these categories:
- Sampah Berserakan (scattered trash, litter, waste)
- Bahaya Tumpahan Cairan (liquid spills, puddles, wet floors)
- Tong Sampah Overload (overflowing trash bins)
- Pemborosan Energi (AC/lights/projectors/fans ON in empty rooms, doors open while AC running)
- Lainnya (broken items, vandalism, other issues)

STEP 3: For each item, estimate a bounding box as percentage coordinates of the full image.

CRITICAL BOUNDING BOX INSTRUCTIONS:
- x = left edge (% of image width, 0 = far left, 100 = far right)
- y = top edge (% of image height, 0 = top, 100 = bottom)
- w = box width (% of image width)
- h = box height (% of image height)
- The box MUST fully contain the ENTIRE object from edge to edge.
- For SPILLS and PUDDLES: cover from topmost to bottommost and leftmost to rightmost point.
- Add 3-5% padding around each object to ensure nothing is cut off.
- VERIFY: (x + w) must reach past the right edge. (y + h) must reach past the bottom edge.

Output ONLY raw JSON:
{
  "is_clean": true or false,
  "detections": [
    {
      "label": "Indonesian label (e.g. Tumpahan Cairan, Sampah Plastik, AC Menyala Tanpa Penghuni, Tong Sampah Penuh)",
      "confidence": 0.0 to 1.0,
      "box": { "x": number, "y": number, "w": number, "h": number }
    }
  ]
}

If clean: {"is_clean": true, "detections": []}
Be thorough and detect everything.`;

/* -- Groq multi-key fallback --------------------------------- */

function getGroqApiKeys(): string[] {
  const keys: string[] = [];
  const first = process.env.GROQ_API_KEY;
  if (first) keys.push(first);

  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key) keys.push(key);
    else break;
  }
  return keys;
}

async function callGroqVision(base64Data: string, mimeType: string): Promise<AnalysisResult> {
  const keys = getGroqApiKeys();
  if (keys.length === 0) throw new Error("GROQ_API_KEY not configured");

  let lastError: Error | null = null;

  for (const apiKey of keys) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "system",
              content: GROQ_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: [
                { type: "text", text: GROQ_USER_PROMPT },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.2,
          max_completion_tokens: 1024,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        const status = res.status;
        // 429 = rate limit / quota — try next key
        if (status === 429) {
          lastError = new Error(`Groq API 429: ${errBody.slice(0, 200)}`);
          continue;
        }
        throw new Error(`Groq API ${status}: ${errBody.slice(0, 200)}`);
      }

      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content ?? "";
      return parseAnalysis(text);
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error(String(e));
      // Only retry with next key on rate limit errors
      if (/429|rate.?limit|quota/i.test(lastError.message)) continue;
      throw lastError;
    }
  }

  throw lastError ?? new Error("Semua Groq API key gagal");
}

/* -- Route handler ------------------------------------------- */

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

  /* -- Fetch image and convert to base64 ------------------ */
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

  /* -- Try Gemini first, then Groq as fallback ------------ */
  let geminiError: string | null = null;

  try {
    const text = await callGeminiWithFallback(async (ai, model) => {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: DETECTION_PROMPT },
              { inlineData: { mimeType, data: base64Data } },
            ],
          },
        ],
      });
      return (response.text ?? "").trim();
    });

    const result = parseAnalysis(text);
    return NextResponse.json(result);
  } catch (e: unknown) {
    geminiError = e instanceof Error ? e.message : "Gemini failed";
    console.error("Gemini failed, trying Groq fallback:", geminiError);
  }

  /* -- Groq fallback -------------------------------------- */
  try {
    const result = await callGroqVision(base64Data, mimeType);
    return NextResponse.json({ ...result, provider: "groq" });
  } catch (e: unknown) {
    const groqMsg = e instanceof Error ? e.message : "Groq failed";
    console.error("Groq fallback also failed:", groqMsg);

    const combinedMsg = `Gemini: ${geminiError} | Groq: ${groqMsg}`;
    const isQuota = /429|503|quota|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(combinedMsg);
    return NextResponse.json(
      { error: isQuota ? "Kuota AI habis. Coba lagi nanti." : "Gagal menganalisis gambar" },
      { status: isQuota ? 429 : 500 }
    );
  }
}
