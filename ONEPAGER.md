# KUSM — Korean University Student Maker

**One-page quick-start guide**

---

## What Is This?

A **browser-based stat-raising visual novel** set in a Korean university.
You create a student, plan their weekly schedule, build relationships with AI-driven NPCs, and shape their story across a 16-week semester.

Inspired by *Princess Maker 3* (stat management, life simulation) and *Blue Archive* (Korean campus setting, character-driven drama).

---

## Core Gameplay Loop

```
Character Creation (name, gender, major)
         ↓
Week N: Schedule Planning
  └─ 7 days × 3 slots → assign activity per slot
         ↓
simulateWeek() resolves schedule → StatDeltas applied
  └─ stress > 70 → positive gains halved (stress penalty)
         ↓
Visual Novel scenes play (weeks 1–2 handcrafted, week 3+ AI-generated)
  └─ tension formula drives AI scene intensity
         ↓
Week Summary: stat changes + relationship updates
         ↓
Week N+1 … repeat to week 16 → Ending
```

**Six stats to balance:** GPA · Money · Health · Social · Stress · Charm
**Eight activities:** Lecture · Study · Part-time · Club · Date · Exercise · Rest · Friends
**Six NPCs:** Soyeon (mentor) · Jaemin (roommate) · Prof. Kim · Minji (rival) · Hyunwoo · Boss

---

## Tech Stack (at a glance)

| What | How |
|------|-----|
| Framework | Next.js 16.2.1 — App Router |
| UI | React 19 + TypeScript 5 |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 (localStorage-persisted) |
| AI | Anthropic Claude API (game director, rate-limited) |
| Tests | Vitest — 22 unit tests |
| Rate Limiting | Upstash Redis + in-memory fallback |

---

## Current Status

| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | Project bootstrap (Next.js, Tailwind, Zustand, TS types) | ✅ Done |
| 2 | Full playable vertical slice (art, schedule, VN, AI director) | ✅ Done |
| 3 | Extended content (weeks 3–8, midterm arc, items) | Pending |
| 4 | Second semester + multiple endings | Pending |
| 5 | Polish (BGM, SFX, mobile, save slots) | Pending |
| 6 | Production deploy + Lighthouse ≥ 90 | Pending |

---

## Key Files to Look at First

| File | Why |
|------|-----|
| `AGENTS.md` | **Read before writing any code** — Next.js 16 breaking changes |
| `OVERVIEW.md` | Full technical deep-dive |
| `src/store/types.ts` | All game types in one place |
| `src/store/gameStore.ts` | Single source of truth for game state |
| `src/lib/gameEngine.ts` | Core `simulateWeek()` logic |
| `src/lib/tensionFormula.ts` | AI narrative intensity driver |
| `src/app/api/game-director/route.ts` | Claude AI scene generation |
| `src/data/activities.ts` | Activity definitions + stat effects |
| `src/data/characters.ts` | NPC definitions + relationship seeds |

---

## Get Started in 3 Commands

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev   # → http://localhost:3000
```

Run tests: `npm test`

---

## Repo

`https://github.com/yoonkii/KoreanUniversityStudentMaker`
