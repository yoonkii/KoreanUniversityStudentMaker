import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
  }
  return client;
}

const BLUE_ARCHIVE_STYLE = `anime-style character portrait in the visual style of Blue Archive game:
soft pastel color palette, detailed school uniform with clean design,
expressive large anime eyes with detailed iris, clean precise linework,
youthful Korean university student appearance, light gradient background,
high quality digital anime illustration, bust portrait, 3/4 view angle,
soft lighting with gentle shadows, slightly stylized proportions`;

interface CharacterArtRequest {
  npcId: string;
  appearancePrompt: string;
  expression?: string;
  referenceImageBase64?: string;
}

export async function POST(request: Request) {
  try {
    const body: CharacterArtRequest = await request.json();
    const ai = getClient();

    let prompt: string;

    if (body.referenceImageBase64 && body.expression) {
      // Expression variant — use reference image
      prompt = `Create this EXACT same character with the EXACT same appearance, hair, outfit, and face structure.
Change ONLY the facial expression to: ${body.expression}.
Maintain identical art style, colors, and composition.
${BLUE_ARCHIVE_STYLE}
Character details: ${body.appearancePrompt}
Expression: ${body.expression}, looking at viewer.`;
    } else {
      // Base portrait
      prompt = `${BLUE_ARCHIVE_STYLE}
Character: ${body.appearancePrompt}
Expression: neutral, slight gentle smile, looking at viewer.`;
    }

    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [
      {
        role: "user",
        parts: [],
      },
    ];

    // Add reference image if provided
    if (body.referenceImageBase64) {
      contents[0].parts.push({
        inlineData: {
          mimeType: "image/png",
          data: body.referenceImageBase64,
        },
      });
    }

    contents[0].parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ error: "No response from Nano Banana 2" }, { status: 500 });
    }

    const parts = candidates[0].content?.parts ?? [];
    let imageBase64: string | null = null;
    let textResponse = "";

    for (const part of parts) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData) {
        imageBase64 = part.inlineData.data ?? null;
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No image generated", text: textResponse },
        { status: 500 }
      );
    }

    return NextResponse.json({
      npcId: body.npcId,
      expression: body.expression ?? "neutral",
      imageBase64,
      textResponse,
    });
  } catch (error) {
    console.error("Character art generation error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
