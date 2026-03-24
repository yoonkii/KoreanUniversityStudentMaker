import type { TimeSlot } from "./activity";

export interface CourseSlot {
  day: number; // 1-7 (Mon-Sun)
  period: TimeSlot;
}

export interface Course {
  id: string;
  name: { ko: string; en: string };
  slots: CourseSlot[];
  difficulty: 1 | 2 | 3; // affects GPA gain/energy cost multiplier
  professorNPCId: string | null; // can link to a professor NPC
  description: string;
}
