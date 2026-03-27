import { z } from "zod";

/** Zod schema for an AI-generated Scene matching src/store/types.ts Scene type */
export const SceneResponseSchema = z.object({
  id: z.string(),
  location: z.string(),
  backgroundVariant: z.string(),
  characters: z.array(
    z.object({
      characterId: z.string(),
      expression: z.string(),
      position: z.enum(["left", "center", "right"]),
    })
  ),
  dialogue: z.array(
    z.object({
      characterId: z.string().nullable(),
      text: z.string(),
      expression: z.string().optional(),
    })
  ),
  choices: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        statEffects: z.object({
          gpa: z.number().optional(),
          money: z.number().optional(),
          health: z.number().optional(),
          social: z.number().optional(),
          stress: z.number().optional(),
          charm: z.number().optional(),
        }),
        relationshipEffects: z
          .array(
            z.object({
              characterId: z.string(),
              change: z.number(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

export type SceneResponse = z.infer<typeof SceneResponseSchema>;
