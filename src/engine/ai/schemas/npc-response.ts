import { z } from "zod";

export const NPCBrainResponseSchema = z.object({
  dialogue: z.string().describe("What the NPC says or does, in character. 1-3 paragraphs in Korean."),
  emotion: z.object({
    type: z.string().describe("Primary emotion felt: joy, sadness, anger, fear, surprise, trust, stress, etc."),
    intensity: z.number().min(1).max(10),
  }),
  statModifiers: z.object({
    gpa: z.number().min(-5).max(5).optional(),
    energy: z.number().min(-5).max(5).optional(),
    social: z.number().min(-5).max(5).optional(),
    finances: z.number().min(-5).max(5).optional(),
    career: z.number().min(-5).max(5).optional(),
    mental: z.number().min(-5).max(5).optional(),
  }).describe("Stat modifiers caused by this interaction. Only include non-zero values."),
  relationshipDelta: z.number().min(-10).max(10).describe("How this interaction changes the NPC's feeling toward the player."),
  choice: z.object({
    prompt: z.string().describe("The decision the player faces."),
    options: z.array(z.object({
      label: z.string(),
      consequences: z.string(),
    })).min(2).max(3),
  }).optional().describe("A choice for the player, if this is a dramatic moment."),
  memoryEntry: z.string().describe("1-sentence summary of this interaction for NPC memory."),
  secretThought: z.string().optional().describe("What the NPC thinks but doesn't say. Stored as secret knowledge."),
});

export type NPCBrainResponse = z.infer<typeof NPCBrainResponseSchema>;
