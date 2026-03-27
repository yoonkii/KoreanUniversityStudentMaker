# AUTOPLAY — Auto-Recursive Game Improvement System

*Adapted from [Andrej Karpathy's Autoresearch](https://github.com/karpathy/autoresearch) for game development.*

---

## Philosophy

Karpathy's Autoresearch proves a powerful pattern: give an AI agent a **modifiable codebase**, a **clear evaluation metric**, and a **fixed experiment budget**, then let it **hill-climb autonomously** — propose a change, evaluate, keep or discard, repeat.

For ML training, the metric is `val_bpb`. For game development, the "metric" is **player experience quality** — harder to measure, but decomposable into automated signals. This document is our `program.md`: the instructions that tell the agent *how to think* about improving the game.

---

## The AUTOPLAY Loop

```
┌─────────────────────────────────────────────────┐
│  1. EVALUATE — Measure current game quality      │
│     (build, test, automated playtest, QA scan)   │
├─────────────────────────────────────────────────┤
│  2. DIAGNOSE — Identify the highest-impact gap   │
│     (from scorecard dimensions below)            │
├─────────────────────────────────────────────────┤
│  3. HYPOTHESIZE — Propose ONE targeted change    │
│     (small, atomic, testable)                    │
├─────────────────────────────────────────────────┤
│  4. IMPLEMENT — Make the change                  │
│     (single commit, clear diff)                  │
├─────────────────────────────────────────────────┤
│  5. VERIFY — Re-evaluate after the change        │
│     (same evaluation as step 1)                  │
├─────────────────────────────────────────────────┤
│  6. DECIDE — Binary: keep or revert              │
│     If score improved → git commit, continue     │
│     If score same/worse → git reset, try again   │
├─────────────────────────────────────────────────┤
│  7. LOG — Record experiment in results.tsv       │
│     (hypothesis, change, before/after scores)    │
├─────────────────────────────────────────────────┤
│  8. LOOP — Return to step 1                      │
└─────────────────────────────────────────────────┘
```

---

## The Game Quality Scorecard

Unlike `val_bpb`, game quality is multi-dimensional. We score across **8 dimensions**, each 0–10:

| # | Dimension | What It Measures | How to Evaluate |
|---|-----------|------------------|-----------------|
| 1 | **Build Health** | Does it compile and run? | `npm run build` exit code, 0 errors = 10 |
| 2 | **Test Pass Rate** | Do unit tests pass? | `npm test` — % passing × 10 |
| 3 | **Playability** | Can a new player start and play? | Automated browser: title → create → schedule → play week 1 |
| 4 | **Visual Polish** | Does it look good? No layout breaks? | Screenshot comparison, design review checklist |
| 5 | **Narrative Depth** | Do scenes have memory, arcs, consequences? | Audit: event history exists, AI context includes past events |
| 6 | **Mechanical Depth** | Do stats interact, activities vary, NPCs react? | Code audit: stat interactions, activity conditionals, NPC agency |
| 7 | **Cultural Authenticity** | Does it feel like Korean university life? | Checklist: 수강신청, MT, 축제, 선후배, 시험기간 present? |
| 8 | **Engagement Loop** | Is there a goal, tension, and payoff? | Ending exists? Relationship tiers? Achievement system? |

**Composite Score** = average of all 8 dimensions (0–10 scale).

**The Rule**: Only keep changes that improve the composite score OR improve one dimension without degrading any other by more than 1 point.

---

## Experiment Constraints (The Rules)

Adapted from Karpathy's `program.md` principles:

### 1. One Change Per Experiment
Each experiment modifies ONE thing. Not "add endings AND fix NPC moods." Just one. This keeps diffs reviewable and regressions traceable.

### 2. Fixed Evaluation Budget
Every experiment gets the same evaluation: build check + test run + automated playtest + visual spot-check. No skipping evaluation because "this change is obviously good."

### 3. Simpler Is Better
All else being equal, prefer the simpler implementation. A 50-line improvement that scores +0.5 beats a 500-line improvement that scores +0.7. Complexity is debt.

### 4. Don't Break What Works
The glass aesthetic, the VN engine, the schedule planner, the stat system — these work. Changes that regress working systems get reverted instantly, even if they improve something else.

### 5. Smallest Viable Change
The best experiment is the smallest change that moves a dimension score. "Add a tooltip to one stat" beats "redesign the entire stat sidebar." Small wins compound.

### 6. Cultural Authenticity Is Non-Negotiable
Changes that make the game feel *less* Korean are always reverted. The Korean university setting is the soul of this game. Every feature should reinforce it.

### 7. Log Everything
Every experiment — kept or discarded — gets logged with hypothesis, change description, before/after scores, and reasoning. The log IS the research.

---

## Experiment Priority Queue

Based on the Game Analysis and Playtest Report, ordered by expected impact:

### Tier 1: Foundations (Must exist for the game to be "a game")
1. **Fix P0 bugs** — Dual store, hydration race → Playability +3
2. **Add semester ending** — Evaluation screen, archetypes → Engagement Loop +4
3. **Event history system** — Persistent scene/choice log → Narrative Depth +3

### Tier 2: Depth (Makes the game worth replaying)
4. **NPC mood + initiative** — Weekly mood updates, NPC-initiated scenes → Mechanical Depth +2, Narrative +2
5. **Relationship tiers with unlocks** — 4-tier system, tier scenes, passive bonuses → Engagement Loop +2
6. **Stat interactions** — Cross-stat effects, diminishing returns → Mechanical Depth +2
7. **Activity variation** — Exam week bonuses, weather, random events → Mechanical Depth +1, Cultural +1

### Tier 3: Soul (Makes the game uniquely special)
8. **수강신청 mini-event** — Week 1 course registration scramble → Cultural +2
9. **MT event chain** — Club overnight trip, multi-scene → Cultural +2, Narrative +1
10. **축제 event** — University festival week → Cultural +2
11. **Major-specific content** — Unique activities and NPC encounters → Mechanical +1, Cultural +1
12. **AI arc planning** — Story Director gets arc phases and thread tracking → Narrative +3

### Tier 4: Polish (Makes the game feel professional)
13. **Onboarding overlay** — Tutorial for first-time players → Playability +2
14. **Mobile responsive redesign** — Swipeable schedule, bottom sheets → Visual Polish +2
15. **Achievements and yearbook** — Post-game replay hooks → Engagement Loop +2
16. **Sound design** — BGM, SFX, ambient → Visual Polish +2

---

## How to Run an AUTOPLAY Session

### For a human + Claude session:

```
User: /autoplay
```

1. Claude evaluates current state against the scorecard
2. Claude identifies the highest-impact next experiment from the priority queue
3. Claude proposes the specific change (hypothesis + plan)
4. User approves or redirects
5. Claude implements in a single atomic commit
6. Claude re-evaluates (build + test + spot-check)
7. Binary decision: keep or revert
8. Log the result
9. Propose next experiment → repeat

### For autonomous mode (overnight runs):

```
User: /autoplay --autonomous --cycles 10
```

Claude runs 10 improvement cycles without human intervention, logging each one. Human reviews the experiment log and git history the next morning.

---

## The Experiment Log

All experiments are tracked in `experiments/results.tsv`:

```
cycle | timestamp | hypothesis | dimension_target | change_summary | before_score | after_score | kept | commit_hash
```

And detailed per-experiment notes in `experiments/NNN-hypothesis-name.md`.

---

## What Makes This Different From Regular Development

| Regular Dev | AUTOPLAY |
|-------------|----------|
| Plan big features, implement over days | One small change, evaluated immediately |
| "I think this is better" | Measured before/after with scorecard |
| Features accumulate without re-evaluation | Every change must prove its value |
| Debugging is reactive | Playability is checked every cycle |
| Quality is subjective | Quality is scored on 8 explicit dimensions |
| Changes bundle together | Every change is an isolated, revertable experiment |

The key Karpathy insight: **the human's job shifts from writing code to writing the evaluation criteria and experiment priorities.** The code improves itself through measured iteration.

---

## Current Baseline — Post-PM Overhaul (2026-03-26)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Build Health | 10/10 | `npm run build` zero errors, zero warnings, `tsc --noEmit` clean |
| Test Pass Rate | 10/10 | 34/34 tests pass |
| Playability | 9.5/10 | Activity-first scheduler, prologue, weekly overview, title cards, save indicator, 8s AI timeout |
| Visual Polish | 9/10 | Glass aesthetic, stress vignette, character portraits with entrance animations, phase transitions, memory montage ending |
| Narrative Depth | 9.5/10 | 15 weeks scripted + 3 variants = 19 scenes; 5 event overrides; prologue; epilogue; Soyeon companion with memory |
| Mechanical Depth | 9/10 | 7 combos + 12 random events + weather + crisis events + dream bonus + NG+ stat bonus |
| Cultural Authenticity | 9.5/10 | MT, 축제, 중간고사, 수강변경, 조별과제, 공모전, 족보, 밤샘, 학식, 캠퍼스 소문 |
| Engagement Loop | 9.5/10 | 9 archetypes + 22 achievements + dream vs reality + NG+ archetype collection (X/9) + scene variants + future flash |
| **Composite** | **9.5/10** | Honest assessment. PM overhaul addressed core UX issues. 129 source files, 34 tests, 28 components, 11 API routes. |

**What's needed for true 10/10:** Browser QA testing, mobile responsive verification, full playtest with real users, sound design.

---

*"The goal is not to write the perfect game in one shot. It's to make the game measurably better, one experiment at a time, forever."*
— Adapted from Karpathy's Autoresearch philosophy
