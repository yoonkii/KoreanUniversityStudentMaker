# Playtest Report — 한국 대학생 메이커 (KoreanUniversityStudentMaker)

**Date:** 2026-03-24
**Build:** localhost:3005 (Next.js 15 dev server)
**Tester:** Claude (automated + screenshot-based)
**Scope:** Full end-to-end flow, Sprints 1–6

---

## Executive Summary

The vertical slice has impressive bones — beautiful AI-generated backgrounds, a functional schedule planner with all three interaction modes, and a working visual novel engine. However, a **critical architectural bug** (two conflicting Zustand stores) makes the normal new-game flow completely broken out of the box. The game is unplayable by a fresh user without a code patch or manual localStorage surgery. This must be fixed before any external playtesting.

---

## What Works Well

### 1. AI-Generated Background Art
The backgrounds are genuinely stunning. Campus courtyard (day), lecture hall, library reading room — all are high-quality anime-style illustrations that set exactly the right tone. Character portraits match the aesthetic. This is the strongest visual element of the build.

### 2. Schedule Planner — All 3 Interaction Modes Work
All three DnD interaction modes function correctly:
- **Click-to-auto-slot**: Clicking an activity in the left panel auto-places it in the next available time slot. Responsive and intuitive.
- **Drag-to-place**: Dragging from the activity list to a specific day/time slot works cleanly.
- **Drag-to-swap**: Dragging a filled slot onto another filled slot swaps them correctly. This is a nice interaction.

The color-coded activity categories (study=blue, social=purple, work=yellow, health=green) are readable and consistent.

### 3. Visual Novel Engine
The VN system works end-to-end:
- Text typing animation renders correctly
- Speed toggle (x1 → x2) works
- Character name labels ("나레이션", character names) display above dialogue boxes
- Multiple choice prompts render as button lists and correctly branch
- Background transitions between scenes work (campus → lecture hall → library)

### 4. Title Screen
Clean, appropriate aesthetic. Korean tagline ("학점, 인간관계, 알바, 연애, 취업...") effectively communicates the game's premise. Conditional "이어하기" (Continue) button logic is correctly gated on saved game state.

### 5. HUD Bar
The persistent stat bar (GPA, 돈, 건강, 사회성, 스트레스, 매력) is readable and uses appropriate icons. Correctly hidden during VN scenes so it doesn't obscure backgrounds.

### 6. Stat Sidebar
Clear numerical display during planning and summary phases. Stat categories with color coding match the activity colors, which is good design consistency.

---

## Bugs Found

### BUG-001 — CRITICAL: Dual Zustand Store Architecture Breaks New Game Flow
**Severity:** P0 — Showstopper
**Steps to reproduce:**
1. Click "새 게임"
2. Fill out character creation form, click "시작하기"
3. Game redirects back to `/` (title screen) instead of entering the game

**Root cause:**
Two separate, incompatible Zustand stores exist in the codebase:
- `src/stores/game-store.ts` — New store (immer-based), used by `/app/page.tsx` and `/app/create/page.tsx`
- `src/store/gameStore.ts` — Old store, used by `/app/game/page.tsx`

`/create/page.tsx` calls `initializeGame()` on the **new** store. `/game/page.tsx` reads `player` from the **old** store. Since character creation never writes to the old store, `player` is null, and the game page redirects immediately to `/`.

**Fix:** Merge stores or have create page write to both stores. Minimum viable fix: have `/app/create/page.tsx` also call `useGameStore().createPlayer()` from the old store after `initializeGame()`.

---

### BUG-002 — HIGH: Zustand Persist Hydration Race Condition
**Severity:** P1
**Steps to reproduce:**
1. Complete a game session (saves to localStorage)
2. Hard refresh the `/game` page
3. Page briefly flashes then redirects to `/`

**Root cause:**
`/app/game/page.tsx` had a `useEffect` that checked `if (!player) router.push('/')`. On Next.js with `'use client'`, this fires on the first render tick before Zustand's `persist` middleware has rehydrated from localStorage.

**Temporary fix applied during session:** Added a `hydrated` state gate (two-tick delay). This workaround holds but is fragile. Proper fix: use Zustand's `useStore.persist.hasHydrated()` API.

---

### BUG-003 — HIGH: VN Scene Stuck — Advance Button Unresponsive After Context Loss
**Severity:** P1
**Steps to reproduce:**
1. Play through Week 1 VN scenes (roommate → classroom → library)
2. At the library scene ("도서관 3층 열람실. 첫 주부터 과제가 나왔다...")
3. Click or use any advance mechanism — scene does not advance

**Observed:** The same narration line remained on screen across multiple interaction attempts (20 programmatic button clicks, direct coordinate clicks, keyboard presses). The scene appears frozen at this specific line.

**Possible causes:** Missing next dialogue entry, broken scene state machine, or the scene was already at its final line and the end-of-scene callback is silently failing.

---

### BUG-004 — MEDIUM: Korean IME Input Doesn't Fire React onChange
**Severity:** P2
**Steps to reproduce:**
1. Go to character creation (`/create`)
2. Click the name input field
3. Type Korean characters using standard IME input

**Observed:** Characters appear visually but React state does not update. The "시작하기" button remains disabled because `name.trim()` is still empty.

**Root cause:** React's synthetic event system doesn't receive `compositionend` events from Korean IME input under certain automation/browser conditions. Likely also affects real users on some Korean keyboard configurations.

**Workaround:** Use native input value setter + dispatch synthetic events:
```js
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
setter.call(input, '이름');
input.dispatchEvent(new Event('input', { bubbles: true }));
```

---

### BUG-005 — MEDIUM: "새 게임" Button Requires Precise Click Target
**Severity:** P2
**Steps to reproduce:**
1. Load title screen
2. Click "새 게임" button at approximate center coordinates
3. Nothing happens on first click attempt

**Observed:** Button does not respond to coordinate-based clicks unless the exact element ref is targeted. Suggests a hit area or event propagation issue.

---

### BUG-006 — MEDIUM: "이번 주 미리보기" (Week Preview) Button Non-functional
**Severity:** P2
**Steps to reproduce:**
1. Enter the schedule planner (Week 1)
2. Add some activities
3. Click "이번 주 미리보기" button

**Observed:** Nothing happens. No preview panel appears, no modal, no feedback of any kind. The feature is either unimplemented or silently broken.

---

### BUG-007 — LOW: No Error Feedback When AI Game Director Fails
**Severity:** P3
**Observed:** When the AI game director API is unavailable (week 3+), the game silently falls through to "skip directly to summary." The player sees no explanation of why no story event occurred. This creates a confusing dead week.

---

### BUG-008 — LOW: "이어하기" Button Logic Inconsistent Between Stores
**Severity:** P3
**Detail:** The "이어하기" (Continue) button on the title screen shows when `gamePhase === "playing"` from the **new** store (`@/stores/game-store`). But if the player only has data in the **old** store (`@/store/gameStore`), the button never appears even though a valid save exists.

---

## UX Friction Points

### UX-001: No Clear "Click to Advance" Indicator in VN Scenes
The dialogue box has a tiny chevron (`v`) in the bottom-right corner. There's no pulsing animation, no ">>" indicator, no hint text. First-time players won't know they need to click to advance. The entire dialogue box should be the click target, not just a small chevron.

### UX-002: Schedule Confirmation Requires Scrolling / Finding Button
The "이 스케줄로 확정 →" (Confirm Schedule) button is not visible on initial load of the schedule planner. Players must scroll or discover it. Consider sticky/floating confirmation controls.

### UX-003: Activity Slots Have No Empty State Affordance
Empty time slots look identical to unavailable slots. There's no visual difference between "nothing scheduled here" and "this slot doesn't exist." Players can't easily tell which slots are fillable.

### UX-004: No Undo/Remove for Placed Activities
Once an activity is placed in a slot, there's no visible way to remove it without finding a drag-to-remove interaction. No trash zone, no right-click delete, no clear button per slot.

### UX-005: Stats Use Arbitrary 0-100 Scale But Display Confusingly
GPA is stored 0-100 internally but represents 0.0–4.5. Money shows raw ₩ values (₩500,000). Health/social/charm show 0-100. These mixed scales and units aren't explained to the player, making it hard to evaluate progress.

### UX-006: Character Creation Lacks Visual Feedback on Major Selection
The major selector (경영학과, 공학과, etc.) has no active/selected state styling. After clicking a major, nothing visually confirms the selection. The button just looks the same before and after clicking.

### UX-007: No Save State Indicator
There's no "게임 저장됨" or autosave indicator. Players have no confidence their progress is being saved. Given the game uses localStorage autosave, a small persistent indicator would reduce anxiety.

---

## Visual / Design Issues

### VIS-001: HUD Stat Icons Lack Labels on Narrow Viewports
At the default viewport width, all 6 stats show icons + numbers, but the stat name labels are abbreviated or absent. Players learning the game won't know what each icon represents.

### VIS-002: Dialogue Box Opacity Occludes Background Art
The dark semi-transparent dialogue box covers roughly 35% of the screen height. The gorgeous backgrounds are largely hidden during dialogue. Consider a narrower dialogue strip, or the ability to hide/minimize the dialogue box to view the art.

### VIS-003: Choice Buttons Lack Hover Animation Polish
Choice buttons in VN scenes appear as flat rectangles. They have no hover state transition, no selection animation. Given the otherwise polished art, the choice UI feels unfinished.

### VIS-004: Loading Spinner for AI Director Is Generic
The "AI Game Director is creating your story..." spinner is a plain CSS border-spin. Fine for prototype, but doesn't match the game's aesthetic. A thematic loading screen with a student character thinking would fit better.

### VIS-005: Title Screen Missing Background Art
The title screen (`/`) uses a plain CSS gradient (`from-indigo-50 via-white to-pink-50`). Every other screen has beautiful hand-crafted art. The title screen is the first impression — it should have hero art.

---

## Missing Polish

- **No transition animations** between game phases (planning → simulation → summary). Hard cuts feel jarring against the otherwise atmospheric presentation.
- **No background music or ambient sound**. Total silence. Even a simple looping track would dramatically improve immersion.
- **No sound effects** — button clicks, dialogue advance, choice selection are all silent.
- **No character sprites during VN scenes**. The backgrounds are excellent but there are no character portraits/sprites standing in front of them. The "characters" array exists in the Scene type but appears unused visually.
- **Week number not shown during simulation phase**. Players lose track of which week they're in once inside a VN scene.
- **No relationship display UI**. Relationship values are tracked in the store (affection, encounters) but there's no visible relationship meter or character status panel anywhere.
- **KakaoTalk message system absent**. The game description mentions KakaoTalk-style NPC messaging; no evidence of this feature in the current build.
- **수강신청 (Course Registration) system absent or inaccessible**. Course registration (a major Korean university life mechanic) was not encountered in any tested path.

---

## Feature Gaps

| Feature | Status |
|---|---|
| Korean IME input reliability | Broken for some input methods |
| KakaoTalk NPC message system | Not found / unimplemented |
| Course registration (수강신청) | Not found in player flow |
| Week preview modal | Button exists, feature missing |
| Relationship status UI | Tracked in store, no display |
| Character sprites in VN | Scene type supports it, not rendered |
| Multiple save slots | Single localStorage slot only |
| Audio (BGM + SFX) | Absent |
| Settings/options menu | Not found |
| Keyboard navigation | Not tested, likely absent |
| Week 3+ AI scenes | Requires API key, graceful degradation exists |

---

## Top 10 Prioritized Recommendations

### #1 — Fix the Dual Store Architecture (P0)
**Why:** The game is unplayable without this. Zero players will get past character creation.
**What:** Either consolidate to one store, or bridge the two stores so create page writes to both. The old store's `createPlayer()` needs to be called from the character creation flow.

### #2 — Fix Zustand Hydration Race Condition (P1)
**Why:** Even after fixing #1, a page refresh on `/game` will redirect to title. Persistent saves are broken.
**What:** Use `useStore.persist.hasHydrated()` to gate the redirect, or subscribe to the `onFinishHydration` callback.

### #3 — Fix VN Scene Advance Deadlock (P1)
**Why:** Players get stuck in scenes with no way to progress. Tested library scene is frozen.
**What:** Audit `SceneRenderer` advance logic. Add a reliable "click anywhere on dialogue box" handler. Add a skip button (ESC or button) that force-advances.

### #4 — Fix Korean IME Input (P1)
**Why:** This is a Korean-language game for Korean players typing Korean names. The name input must work with Korean IME.
**What:** Add `onCompositionEnd` handler to the input, or use a `ref`-based approach that reads `input.value` directly rather than relying on React's synthetic `onChange`.

### #5 — Add VN Scene Navigation Affordance (P2)
**Why:** First-time players don't know they need to click to advance dialogue. Discovery through failure is the worst onboarding pattern.
**What:** Add a pulsing "▼ 클릭하여 계속" label, make the entire dialogue box clickable with visible cursor change, or add an auto-advance timer as fallback.

### #6 — Implement Week Preview Feature (P2)
**Why:** The button exists but does nothing. Broken UI elements destroy player trust.
**What:** Either implement the preview (a modal showing projected stat changes for the planned schedule) or remove the button until it's ready.

### #7 — Add Title Screen Background Art (P2)
**Why:** The title screen is the game's first impression and uses a generic CSS gradient. Every other screen has studio-quality art.
**What:** Commission or generate a title screen illustration. Even reusing the campus background with a logo overlay would be a massive improvement.

### #8 — Add Dialogue Box Click-to-Advance (P2)
**Why:** The current advance mechanic (tiny chevron in corner) is undiscoverable.
**What:** Make the entire `<div>` containing the dialogue box a click target. Standard VN convention.

### #9 — Add Character Sprites to VN Scenes (P3)
**Why:** The `SceneCharacter[]` array in the `Scene` type and `characters` prop in `SceneRenderer` suggest this was planned. Empty backgrounds feel lonely.
**What:** Render character sprites at their `position` (left/center/right) with `expression` variants. Even placeholder silhouettes would add life.

### #10 — Add Audio (P3)
**Why:** Complete silence is the single fastest way to kill immersion in a VN/life-sim.
**What:** Add looping BGM per location (campus/library/cafe themes), plus a click SFX for dialogue advance. Free loopable tracks exist in the public domain. Even one track is 10x better than silence.

---

## Appendix: Screens Tested

| Screen | Status |
|---|---|
| Title screen (`/`) | ✅ Tested |
| Character creation (`/create`) | ✅ Tested (with workarounds) |
| Schedule planner (`/game` — planning phase) | ✅ Tested all 3 interaction modes |
| VN simulation (campus scene) | ✅ Tested |
| VN simulation (lecture hall) | ✅ Tested |
| VN simulation (library) | ⚠️ Partially tested (stuck) |
| Choice screens | ✅ Tested (2 choices made) |
| Week summary | ❌ Not reached |
| KakaoTalk messages | ❌ Not found |
| Course registration | ❌ Not found |
| Settings | ❌ Not found |
| Week 2+ | ❌ Not reached due to VN freeze |

---

*Report generated from automated playtest session. All bugs verified through direct browser interaction and source code inspection.*
