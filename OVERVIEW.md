# KUSM — Korean University Student Maker: Technical Overview

> AI-driven visual novel stat-raising simulation set in a Korean university.
> Inspired by *Princess Maker 3* and *Blue Archive*.

---

## Project Architecture

This is a **Next.js 16 / React 19** single-page application using the App Router. The game runs entirely client-side; the server layer exists only to proxy AI requests (Gemini API) and serve static assets.

```
kusm/
├── src/
│   └── app/                    # Next.js App Router root
│       ├── layout.tsx          # Root shell (fonts, providers)
│       ├── page.tsx            # Entry point → game shell
│       └── globals.css         # Tailwind v4 global tokens
├── public/                     # Static assets (sprites, UI SVGs)
├── AGENTS.md                   # Dev-time constraints
├── CLAUDE.md                   # References AGENTS.md
├── next.config.ts
├── tailwind.config (inline v4)
├── tsconfig.json
└── package.json
```

### Planned Directory Expansion (Sprint 1+)

```
src/
├── app/
│   ├── api/
│   │   └── gemini/route.ts     # Server-side Gemini proxy
│   ├── game/page.tsx           # Main game screen
│   └── character/page.tsx      # Character creation screen
├── components/
│   ├── ui/                     # Reusable primitives (Button, Card…)
│   ├── game/
│   │   ├── ScheduleGrid.tsx    # Weekly schedule planner
│   │   ├── StatPanel.tsx       # Live stat display
│   │   ├── DialogueBox.tsx     # VN-style text rendering
│   │   └── CharacterSprite.tsx # Layered sprite system
│   └── character/
│       └── CreationWizard.tsx  # Multi-step character builder
├── lib/
│   ├── stats/
│   │   └── engine.ts           # Stat mutation + validation logic
│   ├── ai/
│   │   ├── gemini.ts           # Gemini API client wrapper
│   │   ├── npcBrain.ts         # Per-NPC prompt assembly
│   │   └── storyDirector.ts    # Narrative arc + event triggers
│   └── schedule/
│       └── resolver.ts         # Activity → stat-delta mapping
├── store/
│   └── gameStore.ts            # Zustand global game state
└── types/
    ├── stats.ts
    ├── character.ts
    ├── schedule.ts
    └── ai.ts
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router) |
| UI Runtime | React 19.2.4 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (PostCSS plugin) |
| State Management | Zustand (planned) |
| AI | Google Gemini (via server route proxy) |
| Fonts | Geist Sans + Geist Mono (Vercel) |
| Linting | ESLint 9 + eslint-config-next |
| Package Manager | npm |
| Node | ≥20 |

---

## Game Systems

### Stat Engine (`src/lib/stats/engine.ts`)

The core simulation loop. Manages eight primary stats:

| Stat | Korean | Description |
|------|--------|-------------|
| Academic | 학업 | GPA, exam performance |
| Social | 사교성 | Friendship depth, club standing |
| Health | 체력 | Fatigue, illness risk |
| Creativity | 창의력 | Art, music, writing output |
| Ambition | 야망 | Career drive, internship success |
| Appearance | 외모 | Grooming, fashion sense |
| Finance | 재정 | Part-time income, savings |
| Stress | 스트레스 | Inverse wellbeing indicator |

Each week, scheduled activities produce `StatDelta` objects that are validated against floor/ceiling rules and applied atomically. Stat interactions (e.g. high Stress reduces Academic gain) are encoded as modifier functions.

### Game Store (`src/store/gameStore.ts`)

Zustand store holding the complete game state as a single serialisable slice:

```ts
interface GameState {
  character: Character
  stats: StatBlock
  week: number          // 1–52 (one academic year)
  semester: Semester    // Spring | Summer | Fall | Winter
  relationships: Record<NpcId, RelationshipLevel>
  schedule: WeeklySchedule
  flags: Record<string, boolean>  // story branch flags
  history: GameEvent[]
}
```

State is persisted to `localStorage` via Zustand middleware so sessions survive page reloads.

### Character Creation (`src/components/character/CreationWizard.tsx`)

Multi-step wizard:
1. **Name & Appearance** — Korean name input + sprite customisation (hair, eyes, outfit)
2. **Background** — Hometown, family wealth tier (affects starting Finance)
3. **Major** — Selects starting Academic bias and unlocks relevant clubs
4. **Personality** — MBTI-adjacent trait pick sets hidden multipliers on stat gains

### Schedule Grid (`src/components/game/ScheduleGrid.tsx`)

Drag-and-drop weekly planner. The week is divided into:
- 5 × Morning slots (classes, part-time work)
- 5 × Afternoon slots (study, club, rest)
- 2 × Weekend slots (free activities)

Each slot accepts one `Activity`. The `schedule/resolver.ts` converts the full week into a `StatDelta[]` array fed to the stat engine.

---

## AI Integration

### Gemini Client (`src/lib/ai/gemini.ts`)

Thin wrapper around the Gemini 1.5 Flash API:
- Called server-side via `/api/gemini` to keep the API key out of the browser
- Supports streaming responses for live dialogue typewriter effect
- Implements retry-with-backoff for rate-limit errors

### NPC Brains (`src/lib/ai/npcBrain.ts`)

Each NPC has a **persona template** (name, role, personality descriptor, relationship history summary). When the player interacts with an NPC, `npcBrain.ts` assembles a context-aware prompt:

```
[Persona] + [Current relationship level] + [Recent shared events] +
[Player's stat profile] + [Player's dialogue choice] → Gemini → NPC response
```

Responses are capped at 120 tokens to keep dialogue snappy.

### Story Director (`src/lib/ai/storyDirector.ts`)

A higher-level planner that runs once per in-game week end:
- Evaluates current `GameState` against a **story arc template**
- Triggers scripted events (exams, festivals, crises) at appropriate weeks
- Uses Gemini to generate flavour text for random events that fit the current narrative mood
- Sets/clears `flags` in the game store to gate later content

---

## How to Run Locally

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- A Google AI Studio API key for Gemini (set as `GEMINI_API_KEY` in `.env.local`)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yoonkii/KoreanUniversityStudentMaker.git
cd KoreanUniversityStudentMaker

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY=your_key_here

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Sprint Roadmap

### Sprint 1 — Foundation ✅
- [x] Next.js 16 + React 19 + TypeScript project bootstrap
- [x] Tailwind CSS v4 integration
- [x] Repository + CI skeleton
- [x] AGENTS.md / CLAUDE.md dev constraints
- [ ] Zustand game store (initial slice)
- [ ] TypeScript type definitions (stats, character, schedule)

### Sprint 2 — Character Creation
- [ ] CharacterCreationWizard component (3-step)
- [ ] Sprite layer system (SVG-based)
- [ ] Major + background selection with stat modifiers
- [ ] Persist created character to game store

### Sprint 3 — Core Game Loop
- [ ] Weekly ScheduleGrid (drag-and-drop)
- [ ] Stat engine + resolver
- [ ] StatPanel UI with animated deltas
- [ ] Week advance flow (resolve → apply → narrative event)

### Sprint 4 — AI Dialogue
- [ ] Gemini server route (`/api/gemini`)
- [ ] NPC brain + persona templates (3 starter NPCs)
- [ ] DialogueBox component with streaming typewriter
- [ ] Relationship level tracking

### Sprint 5 — Story Director & Events
- [ ] Story arc template (one full academic year)
- [ ] Event trigger system (exams, festivals, crises)
- [ ] AI-generated flavour text for random events
- [ ] Multiple endings based on final stat profile

### Sprint 6 — Polish & Deploy
- [ ] Responsive layout + mobile support
- [ ] Sound design (BGM, SFX stubs)
- [ ] Vercel deployment + environment secret setup
- [ ] Performance audit (Lighthouse ≥ 90)
- [ ] Save/load system with export

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, font loading |
| `src/app/page.tsx` | Game entry point |
| `src/store/gameStore.ts` | Single source of truth for game state |
| `src/lib/stats/engine.ts` | Core simulation logic |
| `src/lib/ai/gemini.ts` | AI client wrapper |
| `src/lib/ai/storyDirector.ts` | Narrative arc management |
| `src/components/game/ScheduleGrid.tsx` | Weekly activity planner |
| `AGENTS.md` | Read before writing any code |
