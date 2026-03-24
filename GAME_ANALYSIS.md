# Korean University Student Maker — Deep Game Analysis
*Analysis Date: 2026-03-23 | Version 0.1.0*

---

## Executive Summary

Korean University Student Maker (KUSM) is an AI-powered visual novel stat-raising simulation built on Next.js 16, React 19, TypeScript, and Tailwind CSS v4. It simulates one semester of Korean university life through a 6-stat progression system, weekly activity scheduling, a visual novel engine with character portraits and typewriter dialogue, and AI-generated emergent scenes (via Anthropic Claude API) for weeks 3+.

The tech foundation is genuinely impressive for v0.1. The visual aesthetic is polished, the architecture is clean, and the AI integration works. But the **game** — the experience — is still thin. The PrincessMaker DNA is partially present; the RimWorld DNA is almost entirely absent. This report maps exactly what's there, what's missing, and what to build next.

---

## Current State Assessment

### What's Built and Working

| System | Quality | Notes |
|--------|---------|-------|
| Title Screen | ✅ Polished | Glass aesthetic, new/continue game |
| Character Creation | ✅ Working | 3-step: name, gender, major (8 options) |
| Schedule Planner | ✅ Working | 7-day grid, 3 time slots, 8 activities |
| Visual Novel Engine | ✅ Polished | Typewriter, portrait expressions, choices |
| Week 1-2 Scenes | ✅ Scripted | ~7 hand-authored scenes total |
| Week 3-16 Scenes | ⚠️ AI-dependent | No hand-authored narrative arcs |
| Stat Engine | ✅ Working | 6 stats, stress penalty at 70+, clamped 0-100 |
| Relationships | ✅ Basic | Affection tracking per NPC, persisted |
| Week Summary | ✅ Working | Stat delta display modal |
| AI Game Director | ✅ Working | Claude API, tension-modulated |
| AI Dialogue Gen | ✅ Working | Per-character context responses |
| Rate Limiting | ✅ Working | In-memory + optional Upstash Redis |
| Narrative Tension | ✅ Working | Formula-based, feeds AI prompts |
| Test Suite | ✅ 22 tests | Vitest, covers engine + tension + rate limiter |
| Asset Library | ✅ Rich | 44 character portraits, 15+ backgrounds |

### What's Placeholder or Incomplete

1. **Weeks 3–16 narrative** — Entirely AI-generated. There are no hand-crafted arcs, major milestones, NPC development, or story beats for the bulk of the game.
2. **Major-specific content** — The major selection in character creation has zero mechanical or narrative impact. Choosing 컴퓨터공학과 vs 심리학과 plays identically.
3. **Relationship depth** — Affection is a number (0-100) and encounters count, but there are no relationship tiers, no unlock thresholds, no NPC-specific scenes triggered by affection milestones.
4. **Endings/outcomes** — No semester-end evaluation, no endings, no score. The game loop has no terminal state other than week 16 passing.
5. **NPC agency** — NPCs don't do anything between scheduled scenes. They have no moods, no growth, no reactions to what the player is doing.
6. **Activity-activity interactions** — Stats accumulate by simple addition. No complex interactions (studying while sleep-deprived, club activities boosting social multiplicatively with existing friendships, etc.).
7. **Financial system** — Money exists as a stat but has no meaningful pressure. ₩500,000 starting money with ₩45,000/week part-time and cheap social activities means players rarely go broke.
8. **Mobile UX** — SchedulePlanner is not mobile-optimized.
9. **Save system** — localStorage only, single save slot, no cloud save.
10. **Tutorial/onboarding** — No guidance for first-time players. The schedule planner is intuitive, but the stat implications of choices aren't explained.

### Architecture Strengths

- **Clean separation of concerns**: data → store → engine → UI layers are distinct and well-organized
- **Zustand persistence**: save/load works transparently with version migration support
- **AI integration is additive, not load-bearing**: the game runs without API keys (weeks 1-2 work fully offline)
- **Tension formula is thoughtful**: encodes real game state (stress vs ideal, relationship variance, exam weeks) to modulate AI intensity
- **Type safety throughout**: strict TypeScript, validated AI responses, type guards on all API outputs
- **Test coverage**: 22 tests on the core logic systems — rare for a game prototype

### Architecture Weaknesses

- **Scene system is passive**: scenes are just dialogue sequences. No branching memory, no consequence chains, no "this choice affects what happens in week 6."
- **Game Director is stateless per-call**: the AI generates each scene without memory of prior AI-generated scenes. Week 5's scene doesn't know what happened in week 4.
- **No event history**: there's no persistent log of what scenes played, what choices were made, or what happened. The AI can't recall prior events.
- **Activities are uniform**: all 8 activities have fixed stat effects regardless of who you are, what week it is, or what's happening narratively.
- **The tension formula doesn't feed back**: tension is computed from state but the resulting scenes don't update state in ways that alter future tension in interesting ways.

---

## PrincessMaker DNA Check

PrincessMaker's core loop: schedule activities → stats change → characters comment on your growth → time pressure → final evaluation reveals the path you walked. The magic is that *your choices accumulate into an identity*.

### Stat-Raising Mechanics: Partially Satisfying ⚠️

**What's good**: The 6 stats are thematically coherent for university life. The stress penalty mechanic (halving positive gains above 70 stress) is genuinely clever — it models burnout and creates a meaningful constraint. Players can't just grind study forever.

**What's missing**:
- **Stat interactions**: In PrincessMaker, stats interact (high fighting stat unlocks certain endings, high sensitivity changes how NPCs speak to you). Here, stats are siloed — charm doesn't affect social gains, GPA doesn't unlock better study efficiency, social doesn't reduce stress from club activities.
- **Diminishing returns**: Raising GPA from 50 to 60 feels the same as 60 to 70. There's no curve, no plateaus, no difficult final push.
- **Visible consequences**: Players can't *see* what their stats unlock or what they're working toward. What does high charm DO? What doors does max social open?

### Character Growth Arc: Weak ❌

There's no sense that your character is becoming someone. The major selection is cosmetically inert. Week 16 isn't different from week 3 narratively. Your character doesn't grow in the eyes of NPCs. A player who has played 8 weeks looks at the same UI as a player on week 2.

**PrincessMaker** solved this with NPC commentary ("You've become so strong lately"), visual changes (new outfits, posture), and unlocking new activities as stats grew. None of this exists yet.

### Activity Scheduling: Intuitive ✅, Shallow ⚠️

The 7-day grid with morning/afternoon/evening slots is clean and immediately understandable. The activity selection is fast. This is a genuine strength.

**What's missing**:
- **Scarcity and tradeoffs**: 21 time slots with 8 activities creates a puzzle, but there's no compelling reason to not just pattern-repeat the same optimal week. No "event conflicts," no "the club meets only on specific days," no recurring obligations.
- **Variation within activities**: "Study" always gives GPA +5, stress +8. But studying for a midterm exam week should feel different from casual studying.
- **Unlockable activities**: PrincessMaker unlocked new things to do as stats grew. Here, you have all 8 activities from day 1.

### Endings/Evaluation: Absent ❌

There is no ending. Week 16 ends and... nothing. No evaluation screen, no "here's the kind of person you became," no replay motivation. This is the most critical gap relative to PrincessMaker's DNA. The entire genre depends on the promise of a meaningful conclusion.

---

## RimWorld DNA Check

RimWorld's magic: colonists have traits, needs, and relationships that generate *unexpected stories* without scripted events. The AI Director (Randy Random, etc.) applies pressure at the right moments. Players share stories because the stories feel *earned*, not authored.

### Emergent Storytelling: Barely Present ❌

The AI Game Director generates scenes, but they're isolated vignettes. There's no memory, no consequence chain. An AI scene in week 5 doesn't refer to what the player chose in week 3. The "emergent" stories don't accumulate into a coherent narrative arc.

**RimWorld** stores every colonist's mood history, relationship history, and event history. The drama emerges from those accumulations. KUSM has the stat state but no event memory.

### Character Dynamics: Static ❌

The 6 NPCs are well-described archetypes (caring senior, competitive rival, supportive roommate, etc.) but they don't *behave*. They appear in scripted scenes. They don't:
- React to the player's stats declining
- Have moods that change week-to-week
- Have relationships *with each other* that create drama
- Initiate contact based on their own personality logic

Soyeon (the caring senior) should check in more when your health is low. Minji (the rival) should be more aggressive during exam season. Hyunwoo (band club) should become distant if you stop attending club. None of this exists.

### AI Story Director: Functional but Amnesiac ⚠️

The tension formula is a genuinely smart design — it reads real game state (stress, relationships, exam proximity) to modulate drama intensity. But:

1. **No memory across calls**: Each week the AI generates a scene in isolation. It can't build on last week's AI-generated drama.
2. **No player agency memory**: Choices made in AI scenes don't persist beyond the immediate stat effect.
3. **Repetition risk**: Without event history, the AI may generate similar scenes repeatedly in weeks 5-16.
4. **Vignettes, not arcs**: The AI generates good individual moments but can't construct a 4-week arc.

### "One More Turn" Factor: Low ❌

Currently there's minimal reason to keep playing after week 2-3. The hand-authored scenes run out, the AI scenes are unpredictable in quality, and there's no goal visible on the horizon. RimWorld's "one more turn" comes from a combination of: something bad just happened that needs fixing + something good is almost complete + an unexpected event just created new possibilities. None of these dynamics exist yet.

---

## UX Assessment

### Visual Design: Strong ✅

The dark navy + glass effect aesthetic is cohesive and evocative. The teal/pink/gold/coral/lavender color system for stats is memorable and immediately legible. Pretendard font choice is excellent for Korean text. The character portrait system (opacity/scale dimming for inactive characters) creates genuine visual novel atmosphere.

### First-Time Player Experience: Poor ❌

A new player landing in the schedule planner has zero guidance:
- What do the stats do? (What is "charm" FOR?)
- What am I trying to achieve?
- Why does my schedule matter?
- What happens if stress gets too high?
- What does GPA affect?

There's no onboarding, no tutorial, no tooltips explaining consequences. The UI is clean but the *game* is opaque.

### Information Density: Low ⚠️

The stats sidebar shows current values as progress bars but communicates no *meaning*. What does GPA: 2.25 → 3.6 change? What does Social: 72 unlock? Players can't make meaningful decisions without knowing what they're optimizing for.

The activity picker shows stat effects (e.g., "GPA +5") but doesn't explain how those accumulate into outcomes.

### Mobile Friendliness: Poor ❌

The SchedulePlanner is a desktop-first 7-column grid with 3-row time slots. On mobile, this would be extremely cramped. The StatsSidebar is fixed-left-desktop-only. The VN engine (portrait + dialogue box) might work on mobile but the game management screens don't.

### Responsiveness: Partial ⚠️

CSS uses Tailwind responsive prefixes in some places, but core game UI components (SchedulePlanner, StatsSidebar) appear not to have mobile layouts.

---

## Top 10 Recommendations

### Priority 1: Add an Ending (Semester Evaluation Screen)
**Impact**: Transforms the game from a simulation with no goal into an actual game. Without this, nothing else matters.

Design: Week 16 triggers a visual novel "graduation / semester end" scene. Final stats are evaluated against thresholds. A unique ending text unlocks based on dominant stat pattern:
- High GPA + low social → "The Bookworm" path
- High social + moderate GPA → "The Campus Star"
- High money + high stress → "The Workhorse"
- Balanced → "The Well-Rounded Student"
- Low everything → "The Lost Freshman"

The ending screen shows your "yearbook entry," unlocked story summary, and replay prompt.

### Priority 2: Build an Event History / Scene Memory System
**Impact**: Enables AI to generate coherent narrative arcs instead of isolated vignettes. Fixes the amnesiac storytelling problem.

Implementation: Add `eventLog: EventRecord[]` to the game store. Each played scene (including choices made) appends a compressed summary. Pass the last 5-10 events to the AI Game Director as context. The AI can now write "following up on last week's argument with Minji..." scenes.

### Priority 3: NPC Mood and Initiative System
**Impact**: Makes characters feel alive, creates RimWorld-style emergent dynamics.

Design: Each NPC has a `mood` value (0-100) and `activityTowardPlayer` that updates weekly based on:
- Player's relationship actions (attending club → Hyunwoo mood +10)
- Player's stats (health < 30 → Soyeon sends worried text)
- NPC-specific personality triggers
- Inter-NPC relationships (Minji and Soyeon have existing tension)

Mood thresholds trigger NPC-initiated scenes or dialogue interruptions in the weekly planning phase ("Jaemin wants to hang out tonight — accept?").

### Priority 4: Major-Specific Content and Mechanics
**Impact**: Makes character creation meaningful; creates replayability; adds Korean authenticity.

Design:
- Each major gets 1-2 unique activities (CS: 코딩 프로젝트, Management: 팀 발표 준비)
- Major influences which NPCs you encounter more (CS major sees more of the rival Minji in comp-sci courses)
- Major affects stat efficiency (Psych major gets +bonus to social activities, Design major gets charm bonus)
- Major-specific events: CS → 해커톤, Business → 교내 창업 경진대회, English → 원어민 교환학생

### Priority 5: Relationship Tier System with Unlocks
**Impact**: Creates long-term relationship goals, meaningful stat consequences for relationship investment.

Design: Relationship tiers at affection 25/50/75/100:
- 0-24: Stranger / 낯선 사람
- 25-49: Acquaintance / 지인
- 50-74: Friend / 친구
- 75-99: Close Friend / 절친
- 100: Best Friend / 연인 (or other special tier)

Each tier unlock triggers a scene, grants a passive bonus (Jaemin at Friend tier: stress -2 every week automatically), and opens new activity options (study together, weekend trips).

### Priority 6: Onboarding and Contextual Tooltips
**Impact**: Fixes the first-time player experience. New players currently have no idea what to do or why.

Design:
- Week 1 starts with a brief tutorial overlay (skip-able): "You're starting university! Manage your schedule to balance academics, friendships, money, and your wellbeing."
- Stat tooltips on hover: "GPA (학점): Higher GPA opens graduate school, scholarships, and corporate tracks. Poor GPA risks academic probation."
- Activity consequence preview: Show expected stat change BEFORE committing to an activity slot
- First-week gentle guidance: "You should probably attend some lectures this week"

### Priority 7: Activity Variation and Special Events
**Impact**: Breaks the repetitive weekly grind, creates "one more turn" anticipation.

Design:
- **Exam weeks** (weeks 8, 15-16): Study activity gives GPA ×2 gains; missing it shows a warning
- **MT (엠티) week**: Club activity becomes "MT 참가" once per semester — high social/stress, memorable scene
- **수강신청 mini-game**: Semester start (week 1) has a clicking mini-game for course registration
- **Random weekly events**: 15% chance of a small event modifying one time slot (surprise test, friend emergency, part-time bonus shift)
- **Weather/seasonal effects**: Exam season in December → stress baseline +5 passively

### Priority 8: AI Scene Memory and Arc Planning
**Impact**: Makes the AI Game Director feel like a real storyteller rather than a random event generator.

Design: Give the AI Director an "arc budget":
- Week 1-4: Establish characters and player situation
- Week 5-8: Build tension toward midterms; NPC conflicts emerge
- Week 9-11: Post-midterm fallout; relationship developments
- Week 12-15: Finals pressure; story climaxes
- Week 16: Resolution

Pass the current arc phase and a list of "story threads not yet resolved" to each AI call. The AI should explicitly pick up and advance existing threads rather than generating unrelated vignettes.

### Priority 9: Mobile-Responsive Redesign of Core UI
**Impact**: Opens the game to mobile players (the primary platform for Korean players given PC bang culture vs. phone gaming habits).

Design:
- SchedulePlanner → Swipeable day carousel on mobile (one day visible at a time with left/right swipe)
- StatsSidebar → Collapsible bottom sheet on mobile, visible as icons in HUD bar
- VN Engine → Already near-mobile-ready; minor portrait scaling fixes needed
- Activity picker → Bottom sheet modal on mobile

### Priority 10: Post-Game Analysis and Achievements
**Impact**: Adds replay motivation and long-term engagement hooks.

Design:
- **Yearbook page**: Generated after week 16, shows player photo, stat radar chart, relationship portraits, key moment from each month
- **Achievements**: "Honor Roll" (GPA > 80), "Social Butterfly" (all 6 NPCs at Friend tier), "Breadwinner" (earned ₩2M+ from part-time), "Burnout" (stress hit 100 three times)
- **Replay hooks**: "Your roommate Jaemin ended up as a rival — what if you'd invested more in that friendship?"
- **New Game+**: Carry over one stat boost from previous playthrough

---

## Korean University Authenticity Check

### What's Authentic
- **Major selection**: Real Korean university majors (컴퓨터공학과, 경영학과, etc.)
- **GPA system**: 4.5 scale is exactly the Korean university standard
- **Money**: ₩ Won denomination, part-time wage (~₩10,000/hour implied by 45,000 for an afternoon shift)
- **NPC archetypes**: 선배 (senior) dynamic with Soyeon is very Korean — the senior/junior 선후배 relationship is central to Korean university culture
- **동아리 (club) culture**: Present as a core activity
- **Library study grind**: Culturally accurate (강의실 공부방 culture)

### Missing Authenticity — Critical Gaps

**수강신청 (Course Registration Battle)**: The most iconic Korean university experience. The server crashes at 6am, everyone scrambles for limited spots in popular courses. Should be week 1's defining moment — a mini-game or event that sets the tone for the whole semester.

**MT (Membership Training / 엠티)**: The mandatory club/department overnight trip, typically in the first month of semester. Huge bonding opportunity, full of social dynamics. Currently no MT event exists.

**축제 (University Festival)**: Each Korean university has a major 축제 (festival) mid-semester. Guest performers, department booths, alcohol. Should be a multi-scene event with high social rewards.

**과대 / 학생회**: Student council politics — someone always campaigns, drama ensues. Could be an event chain.

**고시원 / 자취**: Housing stress — dorm, gosiwon (study accommodation), 자취 (self-living). Different starting conditions based on this choice would add character.

**군대 (Military Service)**: For male characters, the looming 입대 is a major existential pressure throughout university years. Could influence endings.

**수능 trauma**: Many students carry anxiety from 수능 (CSAT). Could surface in stress-triggered scenes.

**선배한테 술 얻어먹기**: The culture of seniors buying drinks for juniors is very real and could be a social event type.

**학점 인플레**: Grade anxiety is intense. "학점 관리" (GPA management) as an explicit stressor — course add/drop period, talking to professors about grades.

**취업 준비**: By year 3-4, job preparation (스펙 쌓기, 인턴, 자소서) dominates student life. If the game spans 4 years eventually, this needs to appear.

**OT (Orientation)**: The department orientation in week 1 is a major social event, usually involving games, introductions, and the first taste of senior culture. Currently the orientation scene touches this but lightly.

### Suggested Cultural Calendar

| Week | Event |
|------|-------|
| 1 | 수강신청 scramble → OT → 첫 수업 |
| 2-3 | 동아리 박람회 (Club fair) → 엠티 planning |
| 4 | MT (엠티) weekend |
| 6-8 | 중간고사 (Midterms) |
| 9 | 축제 (University Festival) |
| 12-13 | 기말고사 준비, 팀플 지옥 (Group project hell) |
| 14-15 | 기말고사 (Finals) |
| 16 | 종강 파티, 방학 plans |

---

## Summary Assessment

KUSM is a strong technical foundation with a beautiful aesthetic wearing a shallow game. The infrastructure for a great game is here — the art assets, the AI integration, the stat engine, the VN engine. What's missing is the **game design layer**: goals, consequences, character arcs, and the Korean cultural specificity that makes this setting uniquely rich.

The most urgent structural gap is the **ending** — without a payoff, nothing else matters. The second most urgent is **NPC agency** — characters need to feel like they exist between scenes. The third is **AI scene memory** — so the AI can write *a story* instead of individual moments.

With those three systems in place, KUSM becomes a game worth recommending. With the full top-10 list and the cultural calendar implemented, it becomes something genuinely special — a game that Korean university students will recognize, laugh at, and share.

---

*Total files analyzed: 35+ | Lines of code reviewed: ~2,500 | Asset files: 59+*
