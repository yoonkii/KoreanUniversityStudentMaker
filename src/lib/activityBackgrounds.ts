/**
 * Maps activity names/IDs to BackgroundLayer-compatible location + variant.
 * Used by the PM-style ActionPhase to show full-screen backgrounds per activity.
 */

interface ActivityScene {
  location: string;
  variant: string;
}

const ACTIVITY_BG_MAP: Record<string, ActivityScene> = {
  // Core activities
  lecture:    { location: 'classroom', variant: 'daytime' },
  study:      { location: 'library',   variant: 'quiet' },
  parttime:   { location: 'cafe',      variant: 'counter' },
  club:       { location: 'club-room', variant: 'normal' },
  date:       { location: 'cafe',      variant: 'seating' },
  exercise:   { location: 'campus',    variant: 'day' },
  rest:       { location: 'dorm',      variant: 'clean' },
  friends:    { location: 'cafe',      variant: 'seating' },
  // Unlockable activities
  tutoring:   { location: 'classroom', variant: 'daytime' },
  networking: { location: 'cafe',      variant: 'seating' },
  selfcare:   { location: 'dorm',      variant: 'clean' },
  explore:    { location: 'campus',    variant: 'day' },
  volunteer:  { location: 'campus',    variant: 'day' },
};

// Time-of-day overrides: evening activities get different variants
const EVENING_OVERRIDES: Record<string, ActivityScene> = {
  date:     { location: 'campus',  variant: 'sunset' },
  friends:  { location: 'campus',  variant: 'night' },
  club:     { location: 'club-room', variant: 'meeting' },
  rest:     { location: 'dorm',    variant: 'messy' },
  exercise: { location: 'campus',  variant: 'sunset' },
};

export function getActivityBackground(activityId: string, timeSlot?: string): ActivityScene {
  if (timeSlot === 'evening' && EVENING_OVERRIDES[activityId]) {
    return EVENING_OVERRIDES[activityId];
  }
  return ACTIVITY_BG_MAP[activityId] ?? { location: 'campus', variant: 'day' };
}
