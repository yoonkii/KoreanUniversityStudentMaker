# KUSM — Korean University Student Maker

**One-page quick-start guide**

---

## What Is This?

A **browser-based stat-raising visual novel** set in a Korean university.
You create a student character, plan their weekly schedule, build relationships with AI-driven NPCs, and shape their story across one academic year (52 in-game weeks).

Inspired by *Princess Maker 3* (stat management, life simulation) and *Blue Archive* (Korean campus setting, character-driven drama).

---

## Core Gameplay Loop

```
Character Creation
       ↓
Week N: Schedule Planning (classes, clubs, part-time, rest)
       ↓
Stat Engine resolves schedule → stat deltas applied
       ↓
NPC Interaction (AI-generated dialogue via Gemini)
       ↓
Story Director fires weekly event (exam / festival / crisis)
       ↓
Week N+1 … repeat until Week 52 → Ending
```

Eight stats to balance: **Academic, Social, Health, Creativity, Ambition, Appearance, Finance, Stress**

---

## Tech Stack (at a glance)

| What | How |
|------|-----|
| Framework | Next.js 16.2.1 — App Router |
| UI | React 19 + TypeScript 5 |
| Styling | Tailwind CSS v4 |
| State | Zustand (client-side, localStorage persisted) |
| AI | Google Gemini 1.5 Flash (server-proxied) |

---

## Current Status

| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | Project bootstrap (Next.js, Tailwind, TS, repo) | ✅ Done |
| 2 | Character creation wizard + sprite system | Pending |
| 3 | Schedule grid + stat engine core loop | Pending |
| 4 | AI dialogue (Gemini NPCs) | Pending |
| 5 | Story director + event system + endings | Pending |
| 6 | Polish, mobile, deploy to Vercel | Pending |

---

## Key Files to Look at First

1. `AGENTS.md` — **Read this before touching any code** (Next.js 16 breaking changes)
2. `OVERVIEW.md` — Full technical deep-dive
3. `package.json` — Dependencies and scripts
4. `src/app/layout.tsx` + `src/app/page.tsx` — Current app shell
5. `src/store/gameStore.ts` — Game state (Sprint 1 deliverable)

---

## Get Started in 3 Commands

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY
npm run dev                  # → http://localhost:3000
```

---

## Repo

`https://github.com/yoonkii/KoreanUniversityStudentMaker`
