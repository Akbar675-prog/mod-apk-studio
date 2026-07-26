import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  texts: z.array(z.string()).min(1).max(60),
  lang: z.string().min(2).max(12),
  langName: z.string().min(2).max(60),
});

export const translateTextsFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { translations: data.texts };

    const payload = data.texts.map((t, i) => ({ i, t }));
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a UI localization engine. Translate each string into the requested language. " +
              "Keep placeholders, numbers, emojis, brand/product names (e.g. Galileo, APK, GMA) intact. " +
              "Keep translations short and natural for app UI. " +
              'Reply ONLY with JSON: {"items":[{"i":0,"t":"..."}]} preserving every index.',
          },
          {
            role: "user",
            content: `Target language: ${data.langName} (${data.lang})\nStrings:\n${JSON.stringify(payload)}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return { translations: data.texts };

    try {
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content) as { items?: { i: number; t: string }[] };
      const out = [...data.texts];
      for (const item of parsed.items ?? []) {
        if (typeof item?.i === "number" && typeof item?.t === "string" && out[item.i] !== undefined) {
          out[item.i] = item.t;
        }
      }
      return { translations: out };
    } catch {
      return { translations: data.texts };
    }
  });
