import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("ERROR: GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

const MODEL = "gemini-3.1-flash-image-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const ASSETS_DIR = path.resolve(process.cwd(), "assets");

const DELAY_MS = 2000; // 2 seconds between API calls

// ─── Style prefix ────────────────────────────────────────────────────────────
const BASE_STYLE =
  "Clean cel-shaded anime illustration in the style of a modern Korean mobile game like Blue Archive. " +
  "Bright, cheerful color palette with lots of pastel tones. High quality digital art, smooth clean lines, " +
  "vibrant colors, soft diffused lighting, cute anime art style.";

// ─── Character definitions ───────────────────────────────────────────────────
const CHARACTERS = [
  {
    id: "soyeon",
    description:
      "a cute anime girl with long flowing chestnut hair and warm brown eyes, " +
      "wearing a trendy Korean casual outfit (oversized pastel pink sweater, pleated cream skirt). " +
      "She has a warm golden glowing halo floating above her head",
    expressions: ["neutral", "happy", "teasing", "blushing", "worried", "sad"],
  },
  {
    id: "jaemin",
    description:
      "a handsome anime boy with messy dark brown hair and friendly dark eyes, " +
      "wearing a stylish casual Korean outfit (light blue hoodie under a beige jacket, dark jeans). " +
      "He has a soft blue glowing halo floating above his head",
    expressions: ["neutral", "happy", "anxious", "laughing", "concerned", "supportive"],
  },
  {
    id: "prof-kim",
    description:
      "a distinguished middle-aged anime man with neatly combed black hair, wearing round glasses " +
      "and a professional dark navy suit with a university name tag. " +
      "He has a subtle white glowing halo floating above his head",
    expressions: ["neutral", "stern", "approving", "disappointed", "thoughtful"],
  },
  {
    id: "minji",
    description:
      "a competitive-looking anime girl with reddish-brown twin-tails and sharp amber eyes, " +
      "wearing a chic Korean casual outfit (fitted black turtleneck, high-waisted plaid pants). " +
      "She has a fiery red glowing halo floating above her head",
    expressions: ["neutral", "competitive", "friendly", "frustrated", "triumphant"],
  },
  {
    id: "hyunwoo",
    description:
      "a cool handsome anime boy with styled silver-streaked black hair and sharp eyes, " +
      "wearing a trendy streetwear outfit (oversized bomber jacket, dark pants, sneakers). " +
      "He has a silver glowing halo floating above his head",
    expressions: ["neutral", "cool", "scheming", "helpful", "surprised"],
  },
  {
    id: "boss",
    description:
      "a friendly anime woman in her late 20s with a neat brown ponytail, " +
      "wearing a cute cafe apron over a casual white t-shirt and jeans. " +
      "She has a soft green glowing halo floating above her head",
    expressions: ["neutral", "busy", "understanding", "firm", "pleased"],
  },
  {
    id: "player",
    subVariants: [
      {
        suffix: "male",
        description:
          "a handsome anime boy with slightly tousled black hair and gentle dark eyes, " +
          "wearing a casual Korean outfit (simple white t-shirt under an open flannel shirt, khaki pants). " +
          "He has a bright white glowing halo floating above his head",
      },
      {
        suffix: "female",
        description:
          "a cute anime girl with shoulder-length black hair and gentle dark eyes, " +
          "wearing a casual Korean outfit (cropped lavender cardigan over a white top, flowy midi skirt). " +
          "She has a bright white glowing halo floating above her head",
      },
    ],
    expressions: ["neutral", "happy", "stressed", "romantic", "embarrassed", "determined"],
  },
];

// ─── Background definitions ─────────────────────────────────────────────────
const BACKGROUNDS = [
  {
    id: "classroom",
    variants: [
      {
        suffix: "daytime",
        prompt:
          "Interior of a bright modern Korean university lecture hall during the day. " +
          "Rows of desks with built-in microphones, large projector screen at front, " +
          "warm sunlight streaming through tall windows. Clean and modern architecture.",
      },
      {
        suffix: "exam",
        prompt:
          "Interior of a Korean university exam hall. Rows of individual desks spaced apart, " +
          "clock on the wall showing exam time, tense atmosphere with dim fluorescent lighting. " +
          "Papers and pencils on desks. Quiet and serious mood.",
      },
    ],
  },
  {
    id: "library",
    variants: [
      {
        suffix: "quiet",
        prompt:
          "Interior of a modern Korean university library, quiet study area. " +
          "Individual study cubicles with desk lamps, tall bookshelves in the background, " +
          "soft warm lighting, peaceful atmosphere. Large windows with campus view.",
      },
      {
        suffix: "crowded",
        prompt:
          "Interior of a busy Korean university library during exam season. " +
          "Every seat is taken (show bags and books on desks but no people), " +
          "stacks of textbooks, coffee cups, warm lighting. Busy but cozy atmosphere.",
      },
    ],
  },
  {
    id: "cafe",
    variants: [
      {
        suffix: "counter",
        prompt:
          "Interior of a cozy Korean cafe from behind the counter. " +
          "Espresso machine, pastry display case, cute menu board with hand-drawn illustrations, " +
          "warm wood and white tile aesthetic, hanging plants. Inviting atmosphere.",
      },
      {
        suffix: "seating",
        prompt:
          "Interior of a cozy Korean cafe seating area. " +
          "Small round tables, comfortable chairs, large windows showing a busy Korean street, " +
          "warm lighting, potted plants, indie posters on walls. Relaxed vibe.",
      },
    ],
  },
  {
    id: "dorm",
    variants: [
      {
        suffix: "clean",
        prompt:
          "Interior of a small but tidy Korean university dormitory room. " +
          "Single bed with cute bedding, small desk with laptop and textbooks, " +
          "mini fridge, posters on wall, warm desk lamp light. Cozy and organized.",
      },
      {
        suffix: "messy",
        prompt:
          "Interior of a messy Korean university dormitory room during exam period. " +
          "Clothes scattered, instant ramen cups on desk, textbooks everywhere, " +
          "crumpled papers, dim lighting from desk lamp only. Lived-in chaos.",
      },
    ],
  },
  {
    id: "club-room",
    variants: [
      {
        suffix: "normal",
        prompt:
          "Interior of a Korean university club activity room. " +
          "Whiteboard with notes, folding chairs in a circle, club posters and photos on walls, " +
          "a small table with snacks, colorful decorations. Welcoming and fun atmosphere.",
      },
      {
        suffix: "meeting",
        prompt:
          "Interior of a Korean university club room set up for a meeting. " +
          "Chairs arranged facing a whiteboard with agenda written on it, " +
          "laptop connected to projector, water bottles on table. Organized but casual.",
      },
    ],
  },
  {
    id: "campus",
    variants: [
      {
        suffix: "day",
        prompt:
          "Exterior of a beautiful Korean university campus during a bright spring day. " +
          "Cherry blossom trees in full bloom along a wide walkway, modern university buildings, " +
          "blue sky with fluffy clouds, green lawn areas. Cheerful and vibrant.",
      },
      {
        suffix: "sunset",
        prompt:
          "Exterior of a Korean university campus at golden hour sunset. " +
          "Warm orange and pink sky, long shadows from buildings, cherry blossom petals floating, " +
          "campus path lit by the setting sun. Romantic and peaceful atmosphere.",
      },
      {
        suffix: "night",
        prompt:
          "Exterior of a Korean university campus at night. " +
          "Street lamps illuminating pathways, warm light from library windows, " +
          "starry sky, peaceful nighttime atmosphere. Moon visible. Quiet and atmospheric.",
      },
    ],
  },
  {
    id: "restaurant",
    variants: [
      {
        suffix: "normal",
        prompt:
          "Interior of a casual Korean restaurant (포장마차 style). " +
          "Orange tent-like covering, plastic stools and tables, steam rising from pots, " +
          "soju bottles and side dishes on tables, string lights, warm and lively atmosphere.",
      },
    ],
  },
  {
    id: "mt-location",
    variants: [
      {
        suffix: "outdoor",
        prompt:
          "Exterior of a Korean MT (membership training) retreat location. " +
          "A pension/lodge in the mountains with a BBQ area, string lights between trees, " +
          "camping chairs in a circle, mountains in background, clear blue sky. Fun outdoorsy vibe.",
      },
    ],
  },
];

// ─── API call helper ─────────────────────────────────────────────────────────
async function generateImage(prompt, aspectRatio, outputPath) {
  // Skip if already generated
  if (fs.existsSync(outputPath)) {
    console.log(`  SKIP (exists): ${outputPath}`);
    return true;
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio,
        imageSize: "1K",
      },
    },
  };

  try {
    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  FAIL (${res.status}): ${outputPath}`);
      console.error(`    ${errText.slice(0, 200)}`);

      // Retry with softened prompt if safety filter triggered
      if (res.status === 400 || errText.includes("SAFETY")) {
        console.log("  RETRY with softened prompt...");
        const softenedPrompt = prompt
          .replace(/girl/g, "character")
          .replace(/boy/g, "character")
          .replace(/cute /g, "")
          .replace(/sexy/g, "")
          .replace(/school/g, "academy");
        return generateImage(softenedPrompt, aspectRatio, outputPath + ".retry");
      }
      return false;
    }

    const json = await res.json();

    // Find the image part in the response
    const candidates = json.candidates;
    if (!candidates || candidates.length === 0) {
      console.error(`  FAIL (no candidates): ${outputPath}`);
      return false;
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      console.error(`  FAIL (no parts): ${outputPath}`);
      return false;
    }

    for (const part of parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, buffer);
        console.log(`  OK: ${outputPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
        return true;
      }
    }

    console.error(`  FAIL (no image data): ${outputPath}`);
    console.error(`    Response: ${JSON.stringify(json).slice(0, 300)}`);
    return false;
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Korean University Student Maker - Asset Generator ===");
  console.log(`Model: ${MODEL}`);
  console.log(`Output: ${ASSETS_DIR}`);
  console.log();

  const results = { ok: 0, fail: 0, skip: 0 };

  // ── Generate character portraits ──
  console.log("── Character Portraits ──");
  for (const char of CHARACTERS) {
    // Handle player character with male/female sub-variants
    if (char.subVariants) {
      for (const variant of char.subVariants) {
        console.log(`\n${char.id} (${variant.suffix}):`);
        for (const expression of char.expressions) {
          const prompt =
            `${BASE_STYLE} Upper body portrait of ${variant.description}. ` +
            `Expression: ${expression} face. ` +
            `Solid pastel-colored background. Facing slightly to the side. ` +
            `Visual novel character portrait style.`;

          const filename = `${expression}-${variant.suffix}.png`;
          const outputPath = path.join(ASSETS_DIR, "characters", char.id, filename);

          if (fs.existsSync(outputPath)) {
            results.skip++;
            console.log(`  SKIP (exists): ${filename}`);
            continue;
          }

          const ok = await generateImage(prompt, "3:4", outputPath);
          if (ok) results.ok++;
          else results.fail++;

          await sleep(DELAY_MS);
        }
      }
    } else {
      console.log(`\n${char.id}:`);
      for (const expression of char.expressions) {
        const prompt =
          `${BASE_STYLE} Upper body portrait of ${char.description}. ` +
          `Expression: ${expression} face. ` +
          `Solid pastel-colored background. Facing slightly to the side. ` +
          `Visual novel character portrait style.`;

        const filename = `${expression}.png`;
        const outputPath = path.join(ASSETS_DIR, "characters", char.id, filename);

        if (fs.existsSync(outputPath)) {
          results.skip++;
          console.log(`  SKIP (exists): ${filename}`);
          continue;
        }

        const ok = await generateImage(prompt, "3:4", outputPath);
        if (ok) results.ok++;
        else results.fail++;

        await sleep(DELAY_MS);
      }
    }
  }

  // ── Generate backgrounds ──
  console.log("\n── Location Backgrounds ──");
  for (const bg of BACKGROUNDS) {
    console.log(`\n${bg.id}:`);
    for (const variant of bg.variants) {
      const prompt =
        `${BASE_STYLE} ${variant.prompt} ` +
        `Wide shot, detailed environment, no people visible. ` +
        `Visual novel game background illustration. High detail.`;

      const filename = `${variant.suffix}.png`;
      const outputPath = path.join(ASSETS_DIR, "backgrounds", bg.id, filename);

      if (fs.existsSync(outputPath)) {
        results.skip++;
        console.log(`  SKIP (exists): ${filename}`);
        continue;
      }

      const ok = await generateImage(prompt, "16:9", outputPath);
      if (ok) results.ok++;
      else results.fail++;

      await sleep(DELAY_MS);
    }
  }

  // ── Summary ──
  console.log("\n=== Generation Complete ===");
  console.log(`  Generated: ${results.ok}`);
  console.log(`  Skipped:   ${results.skip}`);
  console.log(`  Failed:    ${results.fail}`);
  console.log(`  Total:     ${results.ok + results.skip + results.fail}`);

  if (results.fail > 0) {
    console.log("\nSome images failed. Re-run the script to retry (existing images will be skipped).");
  }
}

main().catch(console.error);
