# KUSM — Korean University Student Maker: Technical Overview

> AI-driven visual novel stat-raising simulation set in a Korean university.
> Inspired by *Princess Maker 3*, *Blue Archive*, and *RimWorld*.

---

## Project Architecture

A **Next.js 16 / React 19** single-page game using the App Router. Game logic runs client-side; server routes proxy a **Google Gemini** AI layer and art generation API. The project is structured as a clean 5-layer stack:

```
Types → Systems → Engine → Store → UI
```

```
kusm/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── page.tsx            # Title screen
│   │   ├── create/             # Character creation wizard
│   │   ├── game/               # Main gameplay + relationships + ending pages
│   │   └── api/
│   │       ├── ai/             # AI: npc-brain, story-director, npc-simulation, weekly-summary, ending
│   │       └── art/            # Art generation: character, background
│   ├── engine/                 # Pure game logic (no UI)
│   │   ├── types/              # TypeScript interfaces (game-state, stats, npc, emotion, story…)
│   │   ├── systems/            # Game rule engines (stat, relationship, economy, crisis…)
│   │   ├── ai/                 # LLM client, NPC brains, story director, memory manager
│   │   ├── turn/               # Day-runner orchestrator (9-phase daily loop)
│   │   ├── save/               # Art cache (localStorage base64)
│   │   └── data/               # Static data (NPCs, courses, locations, storyteller modes, fallback events)
│   ├── components/             # React UI components (game HUD, schedule, narrative, portraits)
│   ├── stores/                 # Zustand global game state (Immer middleware)
│   ├── lib/                    # Shared utilities (clsx, etc.)
│   └── hooks/                  # Custom React hooks
├── public/                     # Static assets: character portraits + backgrounds
├── AGENTS.md / CLAUDE.md       # Dev constraints (read before writing code)
├── GAME_ANALYSIS.md            # Deep architectural analysis of the full game
├── OVERVIEW.md                 # This document
├── ONEPAGER.md                 # Quick-start guide
├── next.config.ts
├── tailwind.config (inline v4)
├── tsconfig.json
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router) |
| UI Runtime | React 19.2.4 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + PostCSS |
| State Management | Zustand 5.0.12 + Immer (localStorage-persisted) |
| AI | Google Gemini 3 Flash (`@google/genai` 1.46.0) |
| Schema Validation | Zod 4.3.6 + zod-to-json-schema |
| Rate Limiting | Token-bucket (15 RPM, burst 5) — in-memory, no external dep |
| Testing | Vitest 3.2.4 (22 unit tests) |
| Package Manager | npm |

---

## Directory Map

```
src/
├── app/
│   ├── page.tsx                        # Title screen ("새 게임" / "이어하기")
│   ├── create/page.tsx                 # Character creation (name, university, major, storyteller mode)
│   ├── game/
│   │   ├── page.tsx                    # Main game loop (schedule → day resolution → narrative)
│   │   ├── relationships/page.tsx      # Relationship graph (all NPCs, affection, roles)
│   │   └── ending/page.tsx             # Semester-end: archetype, grades, rolling narrative
│   └── api/
│       ├── ai/
│       │   ├── _shared/ai-client.ts    # Gemini singleton + token-bucket rate limiter + retry
│       │   ├── npc-brain/route.ts      # POST: NPC dialogue + emotion + stat modifiers
│       │   ├── story-director/route.ts # POST: narrative tension evaluation + interventions
│       │   ├── npc-simulation/route.ts # POST: off-camera NPC autonomous behavior
│       │   ├── weekly-summary/route.ts # POST: compress week events → rolling narrative
│       │   └── ending/route.ts         # POST: semester-end archetype + grades + narrative
│       └── art/
│           ├── character/route.ts      # POST: character portrait generation
│           └── background/route.ts     # POST: location background generation
├── engine/
│   ├── types/
│   │   ├── game-state.ts              # Master state container (Player/Clock/NPC/Story)
│   │   ├── stats.ts                   # 6-stat system: GPA, Energy, Social, Finances, Career, Mental
│   │   ├── activity.ts                # 8 activities with base stat deltas
│   │   ├── npc.ts                     # NPC sheet: Big 5 personality, relationships, 3-tier memory
│   │   ├── emotion.ts                 # 13 emotion types + EmotionalState model
│   │   ├── story.ts                   # Story threads, crises, discoveries, storyteller modes
│   │   ├── course.ts                  # Course definitions with time slots + difficulty
│   │   └── art.ts                     # Art generation prompts + cached portrait references
│   ├── systems/
│   │   ├── stat-engine.ts             # applyStatDelta(), clamp [0–100], major-specific init
│   │   ├── relationship-engine.ts     # Affection tracking, daily decay, encounter candidates
│   │   ├── semester-clock.ts          # Day/week advance, semester phase (6 phases), rent days
│   │   ├── activity-resolver.ts       # 3-slot schedule → cumulative StatDelta + locations
│   │   ├── crisis-detector.ts         # Stat threshold monitoring (collapse, burnout, broke…)
│   │   ├── story-thread-manager.ts    # Arc lifecycle: active → escalating → resolving → resolved
│   │   └── economy-engine.ts          # ₩500k starting capital, weekly rent drain, income
│   ├── ai/
│   │   ├── npc-brain.ts               # Per-NPC dialogue generation (calls /api/ai/npc-brain)
│   │   ├── story-director.ts          # Daily tension evaluation (calls /api/ai/story-director)
│   │   ├── npc-simulator.ts           # Off-camera NPC behavior simulation
│   │   ├── emotion-model.ts           # Deterministic emotion computation (not LLM-driven)
│   │   ├── memory-manager.ts          # 3-tier memory: short-term (5 FIFO) + long-term (10) + impressions
│   │   └── prompt-templates/
│   │       ├── npc-dialogue.ts        # System/context/situation prompts for NPC roleplay
│   │       └── director-evaluate.ts   # Director prompts for Cassandra / Randy / Phoebe modes
│   ├── turn/
│   │   └── day-runner.ts              # 9-phase daily orchestrator (see Game Loop below)
│   ├── save/
│   │   └── art-cache.ts               # Generated art cached as base64 in localStorage
│   └── data/
│       ├── core-npcs.ts               # 8 predefined NPCs with Big 5, backstory, appearance prompts
│       ├── courses.ts                 # 8 course catalog with time slots + linked NPCs
│       ├── locations.ts               # 10 campus locations with art prompts
│       ├── storyteller-modes.ts       # 3 tension curves: Cassandra / Randy / Phoebe
│       ├── npc-initializer.ts         # Instantiates NPCs with initial emotional/relational states
│       └── fallback-events.ts         # 20 hardcoded events (weeks 1–2, no AI dependency)
├── components/
│   ├── game/
│   │   ├── stat-sidebar.tsx           # Live stat bars + labels
│   │   ├── schedule-grid.tsx          # 7-day × 3-slot scheduler
│   │   ├── activity-picker.tsx        # Modal: select activity for a slot
│   │   ├── narrative-panel.tsx        # Day narrative with typewriter effect
│   │   ├── day-result.tsx             # Stat deltas + day summary
│   │   ├── npc-portrait.tsx           # NPC avatar + expression (cached art)
│   │   └── art-loading-screen.tsx     # Loading overlay during art generation
│   └── ui/
│       └── stat-bar.tsx               # Reusable animated stat bar
├── stores/
│   └── game-store.ts                  # Zustand + Immer store with all game actions
├── lib/
│   └── utils.ts                       # Shared utilities
└── hooks/                             # Custom React hooks
```

---

## Game Systems

### 3-Layer AI Architecture

```
┌─────────────────────────────────────────┐
│          Story Director                 │  ← "What should happen today?"
│  (Cassandra / Randy / Phoebe modes)     │     Evaluates tension, plants seeds
└────────────────┬────────────────────────┘
                 │ interventions
┌────────────────▼────────────────────────┐
│           NPC Brains                    │  ← "How does this NPC respond?"
│  (Big 5 personality + 3-tier memory)    │     Dialogue, emotion, stat modifiers
└────────────────┬────────────────────────┘
                 │ encounter results
┌────────────────▼────────────────────────┐
│         Game Systems                    │  ← "What are the rules?"
│  (stat, economy, crisis, clock)         │     Deterministic resolution
└─────────────────────────────────────────┘
```

### Nine-Phase Daily Loop (`src/engine/turn/day-runner.ts`)

Each day resolves in 9 sequential phases:

1. **Base Stat Deltas** — Schedule slots → stat changes (Study = GPA+5, Energy-3, Mental-1)
2. **Story Director Call** — AI evaluates tension, recommends interventions + NPC biases
3. **NPC Encounters** — Determine which NPCs player meets (location + director bias + random)
4. **NPC Brain Calls** — For each encounter: generate dialogue, emotion, stat modifiers, memory entry
5. **NPC Simulation** — Off-camera NPC behavior (goals evolve, relationships shift autonomously)
6. **Memory Updates** — Log player actions + NPC interactions to 3-tier memory system
7. **Apply Stat Modifiers** — AI-suggested tweaks applied (clamped ±5 per encounter)
8. **Crisis Detection** — Check stat thresholds: collapse (<10 Energy), burnout, broke, isolation spiral
9. **Game Over Check** — Day 113+ or critical stat failure

Returns: `DayResult` with narrative text, NPC dialogues, stat deltas, crises, game-over flag.

### Six Player Stats

| Stat | Range | Trigger |
|------|-------|---------|
| GPA | 0–100 | GPA probation crisis at < 10 |
| Energy | 0–100 | Collapse crisis at < 10 |
| Social | 0–100 | Isolation spiral at < 10 |
| Finances | ₩ (unbounded) | Broke crisis when negative |
| Career | 0–100 | — |
| Mental | 0–100 | Burnout crisis at < 10 |

Major (CS / Business / Liberal Arts / Engineering / Art) sets starting stat distributions.

### Eight Activities (`src/engine/data/`)

| Activity | Korean | Key Gains | Key Costs |
|----------|--------|-----------|-----------|
| Attend Class | 수업 | GPA+3, Social+1 | Energy-2 |
| Study | 도서관 | GPA+5, Career+1 | Energy-3, Mental-1 |
| Part-time Work | 아르바이트 | Finances+₩45k, Social+2 | Energy-5 |
| Club | 동아리 | Social+8, Mental+3 | Energy-2, Finances-₩10k |
| Exercise | 운동 | Energy+10, Mental+3 | — |
| Rest | 휴식 | Energy+10, Mental+5 | — |
| Career Prep | 취업 준비 | Career+8, GPA+2 | Energy-3, Mental-2 |
| Date | 데이트 | Social+5, Mental+5 | Finances-₩30k |

### Eight NPCs (`src/engine/data/core-npcs.ts`)

Each NPC has a **Big Five personality profile** (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism), values, backstory, quirks, goals, and appearance prompt for art generation.

| Name | Role | Personality Archetype |
|------|------|----------------------|
| 김민수 | Roommate | High extraversion, supportive |
| 이지원 | Classmate | High conscientiousness, studious |
| 박현우 | Senior | High openness, mentor figure |
| 정유나 | Romantic interest | High agreeableness, warm |
| 김서영 | Professor | High conscientiousness, strict |
| 박준호 | Work colleague | Balanced, pragmatic |
| 이영미 | Club president | High extraversion, leader |
| 최민영 | Rival | High neuroticism + competitiveness |

### NPC 3-Tier Memory System (`src/engine/ai/memory-manager.ts`)

| Tier | Capacity | Rule |
|------|----------|------|
| Short-term | 5 slots (FIFO) | All interactions |
| Long-term | 10 slots (importance-sorted) | Promoted when \|emotionalImpact\| ≥ 3 |
| Impressions | 1 sentence per entity | Updated on significant events |

### Three Storyteller Modes (`src/engine/data/storyteller-modes.ts`)

| Mode | Character | Tension Curve | Style |
|------|-----------|---------------|-------|
| **Cassandra** | Pessimistic oracle | Steadily rising | Foreshadows bad endings, creates dread |
| **Randy** | Chaos agent | Random spikes | Unpredictable; throws curveballs |
| **Phoebe** | Nurturing | Slice-of-life with occasional spikes | Gentle drama, relationship-focused |

### Economy Engine (`src/engine/systems/economy-engine.ts`)

- Starting capital: ₩500,000
- Weekly rent drain applied on days 28, 56, 84, 112
- Part-time work income: ₩45,000 / session
- Activity costs: Date ₩30k, Club ₩10k

### Crisis System (`src/engine/systems/crisis-detector.ts`)

Five crisis types trigger stat overrides and forced schedule restrictions:

| Crisis | Trigger | Effect |
|--------|---------|--------|
| Collapse | Energy < 10 | Forced rest, stat penalties |
| Burnout | Mental < 10 | Study efficiency halved |
| Broke | Finances < 0 | Part-time forced, social activities locked |
| Isolation Spiral | Social < 10 | NPC encounters reduced |
| GPA Probation | GPA < 10 | Academic activities forced |

---

## API Routes

### AI Routes (`/api/ai/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai/npc-brain` | POST | Per-NPC: dialogue, emotion, stat modifiers, relationship delta, memory entry |
| `/api/ai/story-director` | POST | Daily: tension assessment, interventions, NPC seeds, choice requirements |
| `/api/ai/npc-simulation` | POST | Off-camera NPC autonomous behavior (goals, emotions, relationships) |
| `/api/ai/weekly-summary` | POST | Compress week events → rolling narrative summary for future prompts |
| `/api/ai/ending` | POST | Semester-end: archetype classification, grades, narrative arc |

All AI routes use the shared Gemini client (`/api/ai/_shared/ai-client.ts`) with:
- Token-bucket rate limiter: 15 RPM, burst 5
- Structured generation with Zod schema validation
- Automatic retry on transient failures

### Art Routes (`/api/art/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/art/character` | POST | Generate character portrait with expression variants |
| `/api/art/background` | POST | Generate location background image |

Generated art is cached as base64 in localStorage via `art-cache.ts`.

---

## Static Game Data

| Data File | Contents |
|-----------|----------|
| `core-npcs.ts` | 8 NPCs with full personality + art prompts |
| `courses.ts` | 8 courses: time slots, difficulty, linked NPCs |
| `locations.ts` | 10 campus locations with Korean university art prompts |
| `storyteller-modes.ts` | 3 narrative difficulty/style curves |
| `fallback-events.ts` | 20 hardcoded events for offline / weeks 1–2 |

---

## State Management (`src/stores/game-store.ts`)

Zustand 5 + Immer store, persisted to localStorage:

```ts
// Key store actions:
initializeGame(playerName, university, major, storytellerMode)
applyStatDelta(delta: StatDelta)
advanceDay()
registerNPCs(npcs: NPCSheet[])
updateNPCState(npcId, updater)
addStoryThread(thread) / updateStoryThread(id, updater)
addDayLog(entry) / addCrisis(crisis) / addDiscovery(discovery)
resetGame()
```

State shape includes: `gamePhase`, `playerState`, `clockState`, `npcStates`, `storyState`, `dayLogs[]`, `crises[]`.

---

## Design System

- **Aesthetic:** Clean, modern Korean UI (inspired by Blue Archive)
- **Primary palette:** Indigo / white / pink-50 gradient backgrounds
- **Typography:** System fonts with Korean word-break rules
- **Components:** Glass panels, animated stat bars, typewriter dialogue
- **Responsive:** Mobile-first Tailwind breakpoints

---

## How to Run Locally

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Google Gemini API key (for AI features on day 3+)

### Steps

```bash
git clone https://github.com/yoonkii/KoreanUniversityStudentMaker.git
cd KoreanUniversityStudentMaker
npm install

# Create env file
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Find a free port and run
npx next dev -p 3001   # or any free port
```

Run tests: `npm test` (22 Vitest unit tests)

---

## Sprint Roadmap

### Sprint 1 — Foundation ✅
- [x] Next.js 16 + React 19 + TypeScript + Tailwind v4 bootstrap
- [x] Zustand game store (v2 schema with localStorage persist)
- [x] TypeScript interfaces: PlayerStats, PlayerProfile, Scene, CharacterRelationship…
- [x] AGENTS.md / CLAUDE.md dev constraints

### Sprint 2 — Vertical Slice ✅
- [x] Character creation wizard (name, gender, major)
- [x] Art library (portraits + backgrounds)
- [x] 8-activity schedule planner (7-day × 3-slot)
- [x] `simulateWeek()` stat engine with stress penalty
- [x] VN rendering pipeline (BackgroundLayer, CharacterPortrait, DialogueBox, ChoiceList)
- [x] HUD bar + StatsSidebar + WeekSummary screens
- [x] Handcrafted scenes (weeks 1–2)
- [x] Claude AI game director for dynamic scenes (week 3+)
- [x] Rate limiting with in-memory fallback
- [x] 22 Vitest unit tests
- [x] CHANGELOG, VERSION, TODOS

### Sprint 3 — AI Architecture ✅
- [x] 3-layer AI architecture (Story Director → NPC Brains → Game Systems)
- [x] Switched AI backend to Google Gemini 3 Flash
- [x] NPC Brain system: per-NPC dialogue with Big 5 personality
- [x] Story Director system: 3 modes (Cassandra/Randy/Phoebe) with tension curves
- [x] Zod schema validation for all AI responses
- [x] Token-bucket rate limiter (15 RPM, burst 5)
- [x] 3-tier NPC memory (short-term FIFO + long-term + impressions)
- [x] Deterministic emotion model (not LLM-driven)

### Sprint 4 — Content & Game Data ✅
- [x] 8 NPCs with full Big Five personality, backstory, goals, appearance prompts
- [x] 8 courses with time slots, difficulty levels, and linked NPCs
- [x] 10 campus locations with Korean university art prompts
- [x] 20 fallback events for offline / weeks 1–2 (no AI dependency)
- [x] NPC initializer with starting emotional/relational states
- [x] Economy engine: ₩500k capital, weekly rent, ₩45k part-time income
- [x] 5-type crisis detection system

### Sprint 5 — Game Loop & Polish ✅
- [x] 9-phase day-runner orchestrator
- [x] Relationships page with full NPC affection graph
- [x] Ending page with archetype classification and semester narrative
- [x] Art generation pipeline with localStorage cache
- [x] /api/ai/weekly-summary and /api/ai/ending routes
- [x] /api/art/character and /api/art/background routes
- [x] NPC portrait component with expression handling
- [x] Art loading screen overlay
- [x] GAME_ANALYSIS.md architectural deep-dive

### Sprint 6 — Integration & Completion ✅
- [x] Full semester playable: days 1–112 (16 weeks)
- [x] Off-camera NPC simulation (/api/ai/npc-simulation)
- [x] Memory manager promoting high-impact events to long-term memory
- [x] Semester phase progression (orientation → settling → midterms → post-midterm → finals prep → finals)
- [x] All 5 crisis types wired into day-runner
- [x] Zustand store with Immer middleware, full action set
- [x] All 7 API routes functional
- [x] Title screen → Create → Game → Relationships → Ending full flow
