import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
  }
  return client;
}

const BLUE_ARCHIVE_BG_STYLE = `anime-style background illustration in the visual style of Blue Archive game:
soft pastel lighting, clean detailed environment art, no characters present,
Korean setting, high quality digital anime background illustration,
wide horizontal composition, gentle color palette with warm tones`;

interface BackgroundArtRequest {
  locationId: string;
  artPrompt: string;
  timeOfDay: "day" | "evening";
}

export async function POST(request: Request) {
  try {
    const body: BackgroundArtRequest = await request.json();
    const ai = getClient();

    const timeDesc = body.timeOfDay === "day"
      ? "daytime, bright natural lighting, blue sky"
      : "evening/sunset, warm golden lighting, orange-pink sky";

    const prompt = `${BLUE_ARCHIVE_BG_STYLE}
Location: ${body.artPrompt}
Time: ${timeDesc}
Style: panoramic wide view, no people, atmospheric and immersive.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    let imageBase64: string | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data ?? null;
      }
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    return NextResponse.json({
      locationId: body.locationId,
      timeOfDay: body.timeOfDay,
      imageBase64,
    });
  } catch (error) {
    console.error("Background art generation error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
