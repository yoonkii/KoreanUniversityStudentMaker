# KUSM — Korean University Student Maker

**One-page quick-start guide**

---

## What Is This?

A **browser-based stat-raising visual novel** set in a Korean university.
You create a student, plan their weekly schedule, build relationships with AI-driven NPCs, and shape their story across a 16-week semester (112 days).

Inspired by *Princess Maker 3* (stat management), *RimWorld* (emergent AI agency), and *Blue Archive* (Korean campus drama).

---

## Core Gameplay Loop

```
Character Creation (name, university, major, storyteller mode)
         ↓
Day N: Schedule Planning
  └─ 7 days × 3 slots → assign 1 of 8 activities per slot
         ↓
Day Runner (9-phase):
  ├─ Base stat deltas from schedule
  ├─ Story Director evaluates tension (Cassandra/Randy/Phoebe)
  ├─ NPC encounters determined (location + director bias)
  ├─ NPC Brains generate dialogue + emotion + stat modifiers
  ├─ Off-camera NPC simulation
  ├─ 3-tier memory updates
  ├─ Crisis detection (collapse, burnout, broke, isolation, GPA probation)
  └─ Game-over check (Day 113 or critical stat failure)
         ↓
Week Summary: stat changes + relationship updates
         ↓
Week 16 → Ending: archetype + grades + semester narrative
```

---

## Stats, Activities & NPCs

**Six stats to balance:** GPA · Energy · Social · Finances · Career · Mental

**Eight activities:** Attend Class · Study · Part-time Work · Club · Exercise · Rest · Career Prep · Date

**Eight NPCs** (each with Big Five personality + 3-tier memory):
김민수 (roommate) · 이지원 (classmate) · 박현우 (senior) · 정유나 (romantic interest) · 김서영 (professor) · 박준호 (work colleague) · 이영미 (club president) · 최민영 (rival)

---

## Three Storyteller Modes

| Mode | Style |
|------|-------|
| **Cassandra** | Rising tension — foreshadows bad endings |
| **Randy** | Chaos — unpredictable curveballs |
| **Phoebe** | Gentle slice-of-life with occasional drama spikes |

---

## Tech Stack

| What | How |
|------|-----|
| Framework | Next.js 16.2.1 — App Router |
| UI | React 19 + TypeScript 5 |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 + Immer (localStorage-persisted) |
| AI | Google Gemini 3 Flash (`@google/genai`) |
| Validation | Zod 4 + zod-to-json-schema |
| Tests | Vitest — 22 unit tests |

---

## AI Architecture (3 Layers)

```
Story Director  →  NPC Brains  →  Game Systems
 (what happens?)   (how NPCs react)  (the rules)
```

**7 API routes:** `/api/ai/npc-brain`, `/api/ai/story-director`, `/api/ai/npc-simulation`, `/api/ai/weekly-summary`, `/api/ai/ending`, `/api/art/character`, `/api/art/background`

---

## Complete Sprint Status

| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | Project bootstrap (Next.js, Tailwind, Zustand, TS types) | ✅ Done |
| 2 | Playable vertical slice (art, schedule, VN, AI director) | ✅ Done |
| 3 | 3-layer AI architecture, Gemini, NPC Brains, Story Director | ✅ Done |
| 4 | 8 NPCs, 8 courses, 10 locations, 20 fallback events | ✅ Done |
| 5 | 9-phase day-runner, relationships page, ending, art pipeline | ✅ Done |
| 6 | Full semester (days 1–112), all 7 API routes, crises, memory | ✅ Done |

**All 6 sprints complete. Full game is playable.**

---

## How to Play

```bash
git clone https://github.com/yoonkii/KoreanUniversityStudentMaker.git
cd KoreanUniversityStudentMaker
npm install
echo "GEMINI_API_KEY=your-key-here" > .env.local
npx next dev -p 3001   # use any free port
```

Open `http://localhost:3001` → click "새 게임" → pick your major + storyteller mode → start scheduling your days.

Run tests: `npm test`

---

## Key Files

| File | Why |
|------|-----|
| `AGENTS.md` | **Read before writing any code** — Next.js 16 breaking changes |
| `OVERVIEW.md` | Full technical deep-dive |
| `GAME_ANALYSIS.md` | Architectural analysis + known gaps |
| `src/engine/turn/day-runner.ts` | Master 9-phase daily loop |
| `src/stores/game-store.ts` | Single source of truth for game state |
| `src/engine/data/core-npcs.ts` | All 8 NPC definitions |
| `src/engine/ai/story-director.ts` | Narrative tension system |
| `src/engine/ai/memory-manager.ts` | 3-tier NPC memory |
| `src/app/api/ai/_shared/ai-client.ts` | Gemini client + rate limiter |

---

## Repo

`https://github.com/yoonkii/KoreanUniversityStudentMaker`
