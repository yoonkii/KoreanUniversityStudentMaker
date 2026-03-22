# Changelog

All notable changes to Korean University Student Maker will be documented in this file.

## [0.1.0.0] - 2026-03-22

### Added
- Title screen with "새 게임 시작" and "이어하기" options
- Character creation: name, gender (여성/남성), major selection with portrait preview
- Weekly schedule planner: 7 days x 3 time slots, 8 activities (수업, 공부, 아르바이트, 동아리, 데이트, 운동, 휴식, 친구)
- Visual novel engine: background layer, character portraits, typewriter dialogue, choice system
- 6-stat tracking: GPA, money, health, social, stress, charm with visual progress bars
- Stress penalty system: >70 stress halves positive stat gains
- HUD bar with week/semester display, stats sidebar
- Week summary screen with stat delta visualization
- 7 hardcoded VN scenes (4 for week 1, 3 for week 2) with 3 active characters (Soyeon, Jaemin, Prof. Kim)
- AI Game Director integration: weeks 3+ generate dynamic scenes via Claude API
- AI dialogue generation API route with schema validation
- Narrative tension formula for driving AI scene intensity
- In-memory rate limiting with Upstash Redis production fallback (10 req/min)
- Zustand persistent game state with version migration (localStorage)
- Glass-effect UI following DESIGN.md design system (navy theme, Pretendard font)
- 59 game assets: 44 character portraits, 15 background images
- Vitest test suite: 22 unit tests covering game engine, tension formula, rate limiter, and store
