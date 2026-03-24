# KUSM — Korean University Student Maker: Technical Overview

> AI-driven visual novel stat-raising simulation set in a Korean university.
> Inspired by *Princess Maker 3* and *Blue Archive*.

---

## Project Architecture

A **Next.js 16 / React 19** single-page game using the App Router. Game logic runs client-side; server routes exist solely to proxy the Claude AI API (rate-limited) and serve static assets.

```
kusm/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   ├── components/             # UI — game HUD, visual novel renderer
│   ├── store/                  # Zustand global game state
│   ├── lib/                    # Pure game logic (engine, tension, rate-limit)
│   ├── data/                   # Static game data (activities, characters, scenes)
│   └── types/                  # Shared TypeScript type augmentations
├── public/                     # 59 assets: character portraits + backgrounds
├── AGENTS.md / CLAUDE.md       # Dev constraints
├── CHANGELOG.md / TODOS.md / VERSION
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
| Language | TypeScript 5.9.3 (strict) |
| Styling | Tailwind CSS 4.2.2 + PostCSS |
| State Management | Zustand 5.0.12 (localStorage-persisted, v2 schema) |
| AI | Anthropic Claude API (`claude-sonnet-4-5-20250929`) |
| Rate Limiting | Upstash Redis + in-memory fallback (10 req/min/IP) |
| Testing | Vitest 3.2.4 (22 unit tests) |
| Fonts | Pretendard (Korean-first typography) |
| Package Manager | npm |

---

## Directory Map

```
src/
├── app/
│   ├── page.tsx                    # Title screen ("새 게임 시작" / "이어하기")
│   ├── character-creation/page.tsx # Character creation wizard
│   ├── game/page.tsx               # Main game loop (planning → simulation → VN)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── game-director/route.ts  # AI scene generation (weeks 3+)
│       └── generate-dialogue/route.ts  # Character-specific dialogue (reserved)
├── components/
│   ├── game/
│   │   ├── HUDBar.tsx              # Week/semester + phase display
│   │   ├── StatsSidebar.tsx        # Live stat bars + relationship panel
│   │   ├── SchedulePlanner.tsx     # 7-day × 3-slot drag-and-drop planner
│   │   └── WeekSummary.tsx         # Stat-delta summary after week resolution
│   ├── vn/
│   │   ├── SceneRenderer.tsx       # Orchestrates VN rendering
│   │   ├── BackgroundLayer.tsx     # Background image switcher
│   │   ├── CharacterPortrait.tsx   # Expression + position handler
│   │   ├── DialogueBox.tsx         # Typewriter text rendering
│   │   └── ChoiceList.tsx          # Choice presentation + stat-effect preview
│   └── ui/
│       ├── GlassPanel.tsx          # Frosted-glass card primitive
│       └── ProgressBar.tsx         # Animated stat bar
├── store/
│   ├── gameStore.ts                # Zustand store definition + actions
│   ├── gameStore.test.ts           # Store unit tests
│   └── types.ts                    # All TypeScript interfaces (single source)
├── lib/
│   ├── gameEngine.ts               # simulateWeek() — core resolution logic
│   ├── gameEngine.test.ts
│   ├── tensionFormula.ts           # calculateTension() — AI intensity driver
│   ├── tensionFormula.test.ts
│   ├── rateLimit.ts                # checkRateLimit() with Redis/memory fallback
│   └── rateLimit.test.ts
├── data/
│   ├── activities.ts               # 8 activities with stat-delta definitions
│   ├── characters.ts               # 6 NPC definitions with relationship seeds
│   └── scenes/
│       ├── week1.ts                # 4 handcrafted scenes (orientation, first class…)
│       └── week2.ts                # 3 handcrafted scenes (study group, date, club)
└── types/
    └── iconify.d.ts
```

---

## Game Systems

### Stat Engine (`src/lib/gameEngine.ts`)

`simulateWeek(schedule, stats)` is the core resolution function. It iterates every filled slot in the 7 × 3 schedule grid, accumulates `StatDelta` objects from each activity, and applies a global penalty rule:

> **Stress Penalty:** When `stress > 70`, all positive stat gains (except Money) are halved.

Six tracked stats:

| Stat | Range | Notes |
|------|-------|-------|
| GPA | 0–100 | Academic performance |
| Money | ₩ unbounded | Part-time income / spending |
| Health | 0–100 | Physical wellbeing |
| Social | 0–100 | Relationship breadth |
| Stress | 0–100 | Inverse wellbeing; triggers penalty at 70 |
| Charm | 0–100 | Appearance + social appeal |

### Eight Activities (`src/data/activities.ts`)

| Activity | Korean | Key Gains | Key Costs |
|----------|--------|-----------|-----------|
| Lecture | 수업 | GPA+3, Social+1 | Stress+3 |
| Study | 도서관 | GPA+5 | Stress+8, Health-3 |
| Part-time | 아르바이트 | Money+₩45k, Social+2 | Stress+5, Health-5 |
| Club | 동아리 | Social+8, Charm+3 | Stress-3, Money-₩10k |
| Date | 데이트 | Social+5, Charm+5, Stress-10 | Money-₩30k |
| Exercise | 운동 | Health+10, Charm+2 | Stress-5 |
| Rest | 휴식 | Health+10 | Stress-15 |
| Friends | 친구 | Social+10 | Stress-5, Money-₩15k |

### Tension Formula (`src/lib/tensionFormula.ts`)

Produces a 0–100 score that drives AI narrative intensity:

```
tension = min(100,
  statPressure × 0.4          // distance from ideal (GPA=70, Health=70, Stress=30)
  + relationshipVariance × 0.3 // max-affection − min-affection across known NPCs
  + examBonus                  // +30 at week 8 (midterm) and week 15 (finals)
  + currentWeek × 2
)
```

Low tension → slice-of-life scenes. High tension → dramatic confrontations.

### Game Store (`src/store/gameStore.ts`)

Zustand v5 store with `persist` middleware (localStorage, schema v2):

```ts
interface GameState {
  phase: 'title' | 'creation' | 'planning' | 'simulation' | 'summary'
  player: PlayerProfile           // name, gender, major
  stats: PlayerStats              // current 6-stat block (clamped)
  currentWeek: number             // 1–16
  relationships: Record<CharacterId, CharacterRelationship>
  schedule: WeekSchedule          // 7 × 3 activity slots
  currentScene: Scene | null
  sceneQueue: Scene[]
  weekStatDeltas: StatDelta[]
  gameStarted: boolean
}
```

### Visual Novel Engine (`src/components/vn/`)

Scene structure:
- `location` + `backgroundVariant` → `BackgroundLayer` picks correct asset
- `characters[]` with `expressionId` + `position` (left/center/right) → `CharacterPortrait`
- `dialogueLines[]` → `DialogueBox` with typewriter effect
- `choices[]` with `statEffects` + `relationshipEffects` → `ChoiceList`

---

## AI Integration

### Game Director (`src/app/api/game-director/route.ts`)

Generates dynamic scenes for **week 3 and beyond**:

- **Model:** `claude-sonnet-4-5-20250929`
- **Rate limit:** 10 req/min per IP (Upstash Redis; in-memory fallback for dev)
- **Input:** `playerStats`, `relationships`, `currentWeek`, `tension`, `recentEvents`
- **Output:** Validated Scene JSON — `eventType`, `title`, `location`, `dialogue`, `choices`
- System prompt written in Korean; narrative intensity scales with `tension` score
- JSON schema enforced server-side before returning to client

### Six NPCs (`src/data/characters.ts`)

| ID | Name | Role | Personality |
|----|------|------|-------------|
| soyeon | 박소연 | Warm senior | caring_mentor |
| jaemin | 이재민 | Roommate | supportive_friend |
| prof_kim | 김 교수 | Professor | strict_mentor |
| minji | 한민지 | Rival | competitive_rival |
| hyunwoo | 정현우 | Cool senior | cool_senior |
| boss | 이사장님 | Part-time boss | warm_boss |

Relationship affection is tracked 0–100 per character and fed into scene generation.

---

## Asset Library

**59 total assets** in `public/`:

- **44 character portraits** across 6 NPCs × 5–6 expressions + 12 player variants (gender × emotion)
- **15 background images:** campus (day/night/sunset), classroom, library (quiet/crowded), café, club room, dorm, restaurant, mountain

---

## Design System

- **Aesthetic:** Dark premium, inspired by Blue Archive
- **Colors:** Navy `#0F1A2E`, Teal `#4ECDC4`, Pink `#F5A0B5`, Gold `#FFD166`, Coral `#FF6B6B`, Lavender `#A78BFA`
- **Glass effects:** `backdrop-blur-20px`, `saturate-1.4`, soft borders
- **Typography:** Pretendard, Korean word-break rules
- **Responsive:** Mobile-first Tailwind breakpoints

---

## How to Run Locally

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Anthropic API key (for AI scene generation on week 3+)
- Optional: Upstash Redis URL + token (falls back to in-memory if absent)

### Steps

```bash
git clone https://github.com/yoonkii/KoreanUniversityStudentMaker.git
cd KoreanUniversityStudentMaker
npm install

# Create env file
cat > .env.local <<EOF
ANTHROPIC_API_KEY=sk-ant-...
# Optional — omit to use in-memory rate limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
EOF

npm run dev        # → http://localhost:3000
npm test           # run 22 unit tests with Vitest
```

---

## Sprint Roadmap

### Sprint 1 — Foundation ✅
- [x] Next.js 16 + React 19 + TypeScript + Tailwind v4 bootstrap
- [x] Zustand game store (v2 schema with localStorage persist)
- [x] TypeScript interfaces: PlayerStats, PlayerProfile, Scene, CharacterRelationship…
- [x] AGENTS.md / CLAUDE.md dev constraints

### Sprint 2 — Vertical Slice ✅
- [x] Character creation wizard (name, gender, major)
- [x] 59-asset art library (portraits + backgrounds)
- [x] 8-activity schedule planner (7-day × 3-slot)
- [x] `simulateWeek()` stat engine with stress penalty
- [x] VN rendering pipeline (BackgroundLayer, CharacterPortrait, DialogueBox, ChoiceList)
- [x] HUD bar + StatsSidebar + WeekSummary screens
- [x] 7 handcrafted scenes (weeks 1–2)
- [x] Claude AI game director for dynamic scenes (week 3+)
- [x] Upstash Redis rate limiting with in-memory fallback
- [x] Tension formula driving AI narrative intensity
- [x] 22 Vitest unit tests
- [x] CHANGELOG, VERSION, TODOS

### Sprint 3 — Extended Content (Pending)
- [ ] Weeks 3–8 handcrafted scenes + midterm arc
- [ ] Expanded NPC dialogue variety
- [ ] Inventory / item system

### Sprint 4 — Second Semester (Pending)
- [ ] Weeks 9–16 with finals arc
- [ ] Multiple ending conditions based on final stats

### Sprint 5 — Polish (Pending)
- [ ] BGM + SFX integration
- [ ] Mobile layout optimisation
- [ ] Save-slot UI + export

### Sprint 6 — Production Deploy (Pending)
- [ ] Vercel deployment + secrets setup
- [ ] Lighthouse ≥ 90 performance audit
- [ ] Consider Godot migration for minigames (see TODOS.md P2 note)
