import { z } from "zod";

export const SimulationResponseSchema = z.object({
  interactions: z.array(z.object({
    participants: z.array(z.string()).describe("NPC IDs involved."),
    summary: z.string().describe("1-2 sentence summary of what happened."),
    relationshipChanges: z.array(z.object({
      npc1: z.string(),
      npc2: z.string(),
      delta: z.number().min(-5).max(5),
    })),
    newSecrets: z.array(z.object({
      knownBy: z.string().describe("NPC ID who now knows this."),
      content: z.string().describe("What they learned."),
    })),
    threadImpact: z.string().optional().describe("How this affects a story thread."),
    playerDiscoverable: z.boolean().describe("Can the player find out about this?"),
    discoveryMethod: z.string().optional().describe("How the player would discover this."),
  })),
  npcMoodUpdates: z.array(z.object({
    npcId: z.string(),
    emotionShift: z.object({
      type: z.string(),
      intensity: z.number().min(1).max(10),
    }),
    reason: z.string(),
  })),
});

export type SimulationResponse = z.infer<typeof SimulationResponseSchema>;
