import { z } from "zod";

export const DirectorResponseSchema = z.object({
  tensionAssessment: z.string().describe("1-sentence assessment of current dramatic tension."),
  interventions: z.array(z.object({
    type: z.enum(["npc_action", "npc_mood_shift", "seed_activation", "new_seed", "environment_change"]),
    targetNPC: z.string().optional().describe("NPC ID to influence."),
    description: z.string().describe("What should happen, described naturally."),
    urgency: z.enum(["background", "noticeable", "dramatic"]),
    suggestedThinkingLevel: z.enum(["minimal", "low", "medium", "high"]),
  })).max(2).describe("At most 2 interventions to bias NPC behavior."),
  seedsToPlant: z.array(z.object({
    description: z.string(),
    relatedNPCs: z.array(z.string()),
    minimumIncubationDays: z.number(),
  })).max(1).describe("At most 1 new seed to plant for future payoff."),
  threadGuidance: z.object({
    shouldEscalate: z.string().optional().describe("Thread ID to escalate."),
    shouldResolve: z.string().optional().describe("Thread ID to resolve."),
    newThreadSuggestion: z.string().optional().describe("New thread description if thread count < 3."),
    newThreadNPCs: z.array(z.string()).optional(),
    newThreadStats: z.array(z.string()).optional(),
  }),
  choiceRequired: z.boolean().describe("Whether this day MUST include a player choice."),
});

export type DirectorResponse = z.infer<typeof DirectorResponseSchema>;
