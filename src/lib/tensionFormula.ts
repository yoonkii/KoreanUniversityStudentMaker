import type { PlayerStats, CharacterRelationship } from '@/store/types';

const TENSION_MAX = 100;

// Ideal midpoints for core stats (higher distance = more pressure)
const IDEAL_STRESS = 30;
const IDEAL_KNOWLEDGE = 70;
const IDEAL_HEALTH = 70;

// Week numbers that trigger exam-period bonus tension
const MIDTERM_WEEK = 8;
const FINAL_WEEK = 15;
const EXAM_BONUS = 30;

// Weights for the composite formula
const STAT_PRESSURE_WEIGHT = 0.4;
const RELATIONSHIP_VARIANCE_WEIGHT = 0.3;
const WEEK_ESCALATION_PER_WEEK = 2;

/**
 * Calculate narrative tension on a 0-100 scale.
 *
 * Tension drives the intensity of randomly selected events and dialogue
 * tone. It rises naturally over the semester and spikes during exams.
 *
 * Formula:
 *   tension = min(100,
 *     statPressure * 0.4
 *     + relationshipVariance * 0.3
 *     + weekBonus
 *     + week * 2
 *   )
 *
 * - statPressure: average distance from ideal for stress, knowledge, health (0-100)
 * - relationshipVariance: max affection - min affection across known characters
 * - weekBonus: +30 during midterm (week 8) or finals (week 15)
 */
export function calculateTension(
  stats: PlayerStats,
  relationships: Record<string, CharacterRelationship>,
  currentWeek: number,
): number {
  // --- Stat pressure ---
  const stressDistance = Math.abs(stats.stress - IDEAL_STRESS);
  const knowledgeDistance = Math.abs(stats.knowledge - IDEAL_KNOWLEDGE);
  const healthDistance = Math.abs(stats.health - IDEAL_HEALTH);
  const statPressure = (stressDistance + knowledgeDistance + healthDistance) / 3;

  // --- Relationship variance ---
  const affectionValues = Object.values(relationships).map((r) => r.affection);
  let relationshipVariance = 0;
  if (affectionValues.length >= 2) {
    const maxAffection = Math.max(...affectionValues);
    const minAffection = Math.min(...affectionValues);
    relationshipVariance = maxAffection - minAffection;
  }

  // --- Week bonus (exam periods) ---
  const weekBonus =
    currentWeek === MIDTERM_WEEK || currentWeek === FINAL_WEEK
      ? EXAM_BONUS
      : 0;

  // --- Composite ---
  const rawTension =
    statPressure * STAT_PRESSURE_WEIGHT +
    relationshipVariance * RELATIONSHIP_VARIANCE_WEIGHT +
    weekBonus +
    currentWeek * WEEK_ESCALATION_PER_WEEK;

  return Math.min(TENSION_MAX, Math.round(rawTension));
}
