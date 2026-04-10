import { GoogleGenAI } from "@google/genai";

/**
 * Returns all configured Gemini API keys from env.
 * Reads GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.
 */
function getApiKeys(): string[] {
  const keys: string[] = [];
  const first = process.env.GEMINI_API_KEY;
  if (first) keys.push(first);

  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
    else break;
  }
  return keys;
}

function isModelOverloaded(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /503|UNAVAILABLE|overloaded|high demand/i.test(msg);
}

/**
 * Try calling Gemini with each API key in order, then retry with fallback models.
 * For 503 (model overloaded), skips to next model immediately.
 * For 429 (quota), tries next key first, then next model.
 * Returns the first successful result. Throws the last error if all attempts fail.
 */
export async function callGeminiWithFallback(
  runFn: (ai: GoogleGenAI, model: string) => Promise<string>,
  models: string[] = ["gemini-2.5-flash", "gemini-2.0-flash"]
): Promise<string> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi di .env.local");
  }

  let lastError: Error | null = null;

  for (const model of models) {
    for (const key of keys) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        return await runFn(ai, model);
      } catch (e: unknown) {
        lastError = e instanceof Error ? e : new Error(String(e));
        // If model itself is overloaded (503), skip to next model
        if (isModelOverloaded(e)) break;
        // For 429/other errors, try next key
      }
    }
  }

  throw lastError ?? new Error("Semua API key gagal");
}
