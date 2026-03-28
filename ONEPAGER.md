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

**Six stats:** 준비도 (knowledge) · 체력 (health) · 인맥 (social) · 매력 (charm) · 스트레스 (stress) · 돈 (money)

**13 activities:** 수업 · 공부 · 알바 · 동아리 · 데이트 · 운동 · 휴식 · 친구 만나기 · 과외 · 네트워킹 · 자기관리 · 캠퍼스 탐험 · 봉사활동

**5 NPCs** with unique personalities and romance-aware dialogue:
이재민 (룸메이트, 밝고 낙천적) · 한민지 (라이벌, 겉은 차갑지만) · 박소연 (따뜻한 선배) · 정현우 (동아리 선배, 카리스마) · 김 교수 (엄격하지만 따뜻한)

---

## Two-Track Relationship System

**Friendship (우정, 0-100)** — Slow and steady
- +1/interaction, halved for first 3 encounters, cap +4/week
- Tiers: 모르는 사이 → 아는 사이(20) → 친구(40) → 절친(60) → 베프(80)
- Decay: -3 after 2 weeks without meeting

**Romance (사랑, 0-100)** — Very hard by design
- Date activity only, requires friendship ≥ 40, charm ≥ 40
- NPC-specific chemistry gates (민지: knowledge≥50+respect≥60, etc.)
- 30% failure chance early, +1/success, cap +3/week
- Tiers: 없음 → 관심(10) → 설렘(25) → 연인(45) → 깊은 사랑(70)
- Decay: -2 after 2 weeks without dating (fragile!)
- Dating tier (45) achievable with dedicated effort over full semester
- Deep Love (70) nearly impossible in one playthrough

**14 endings** including 4 NPC-personalized romance endings

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

**AUTOPLAY improvement cycles running.** Current composite quality score: **8.6/10** (see `AUTOPLAY.md` for scorecard, `DEVLOG.md` for per-cycle details). 11 cycles completed:
- Bug fixes: P0 hydration, hooks ordering, SSR particle mismatch (Cycles 1,3,6)
- Semester ending: 9 archetypes, report card, achievement grid (Cycles 2,10)
- Exam/festival mechanics: 중간고사 GPA ×2, 축제 social ×1.5, HUD badges (Cycle 3)
- Scripted events: MT, 축제, 중간고사, 기말고사/종강, night study — 7 of 16 weeks (Cycles 4-8,11)
- NPC reactivity: stat-aware KakaoTalk messages (Cycle 9)
- Achievement system: 14 achievements with unlock tracking (Cycle 10)

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
| `AUTOPLAY.md` | Karpathy-inspired auto-recursive improvement system + scorecard |
| `DEVLOG.md` | Per-cycle experiment log with before/after scores |
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
