# Korean University Student Maker — Design System

Source of truth for all visual design decisions. Preview: open `design-preview.html` in a browser.

## Aesthetic

**Visual Identity:** Dark, premium visual novel UI inspired by Blue Archive's clean cel-shaded anime style. Frosted glass (liquid glass) panels over cinematic anime backgrounds. Korean-first typography. Minimal, intentional use of color.

**Mood:** Warm, inviting, slightly cinematic. University life nostalgia meets premium game UI.

## Typography

**Primary Font:** Pretendard (Korean-first)
```
CDN: https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css
Stack: 'Pretendard', system-ui, sans-serif
```

**Banned Fonts:** Inter, Noto Sans KR, Roboto, Arial, Open Sans

| Scale | Size | Weight | Tracking | Leading | Usage |
|-------|------|--------|----------|---------|-------|
| Display | text-4xl md:text-5xl lg:text-6xl | font-bold | tracking-tight | leading-snug | Game title, major announcements |
| H1 | text-3xl md:text-4xl | font-bold | tracking-tight | leading-snug | Section headers |
| H2 | text-xl md:text-2xl | font-semibold | tracking-tight | leading-snug | Subsection headers |
| H3 | text-lg md:text-xl | font-semibold | — | leading-snug | Card titles, stat labels |
| Body | text-base md:text-lg | font-normal | — | leading-relaxed | Dialogue text, descriptions |
| Caption | text-sm | font-normal | tracking-wide | leading-normal | Labels, timestamps, metadata |

**Korean Text Rules:**
- Always use `word-break: keep-all` (Tailwind: `break-keep-all`) on Korean text blocks
- Korean headlines: `leading-snug` (not `leading-none`) — Korean characters need more vertical breathing room
- Max prose width: `max-w-[65ch]`

## Color Palette

### Core Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Navy | `#0F1A2E` | `bg-navy` | Primary background |
| Surface Dark | `#162038` | `bg-surface-dark` | Card backgrounds, panels |
| Surface Light | `#1E2A45` | `bg-surface-light` | Elevated surfaces, inputs |

### Accent Colors (max 1 dominant per screen)
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Teal | `#4ECDC4` | `text-teal` / `bg-teal` | Primary action, CTA, active states |
| Soft Pink | `#F5A0B5` | `text-pink` / `bg-pink` | Romance, relationship stats |
| Warm Gold | `#FFD166` | `text-gold` / `bg-gold` | Achievement, GPA, rewards |
| Coral Red | `#FF6B6B` | `text-coral` / `bg-coral` | Warnings, stress, urgency |
| Lavender | `#A78BFA` | `text-lavender` / `bg-lavender` | Social, clubs, events |

### Text Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Text Primary | `#E8ECF4` | `text-txt-primary` | Headlines, main content |
| Text Secondary | `#8B95A8` | `text-txt-secondary` | Captions, descriptions, metadata |

**Rules:**
- No pure black (`#000000`). Use `#0F1A2E` or darker navy variants.
- No neon outer glows. Use tinted inner borders or subtle box shadows.
- No purple/blue "AI" gradients. No oversaturated accents.
- One warm palette for the entire page. Never mix warm and cool grays.

## Tailwind Config

```js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0F1A2E', light: '#162038' },
        surface: { dark: '#162038', light: '#1E2A45' },
        teal: { DEFAULT: '#4ECDC4' },
        pink: { DEFAULT: '#F5A0B5' },
        gold: { DEFAULT: '#FFD166' },
        coral: { DEFAULT: '#FF6B6B' },
        lavender: { DEFAULT: '#A78BFA' },
        txt: { primary: '#E8ECF4', secondary: '#8B95A8' },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

## Glass Effects (Liquid Glass)

Two tiers of frosted glass for UI panels:

```css
/* Standard glass — dialogue boxes, cards, sidebars */
.glass {
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Strong glass — overlays, modals, primary panels */
.glass-strong {
  backdrop-filter: blur(32px) saturate(1.6);
  -webkit-backdrop-filter: blur(32px) saturate(1.6);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

Always pair with `rounded-2xl` or `rounded-xl` for rounded corners.

## Noise Grain Overlay

Every page gets a subtle noise texture for organic, non-digital feel:

```css
.noise-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,..."); /* fractalNoise SVG */
}
```

## UI Components

### Dialogue Box
- Full-width bottom panel over background image
- `.glass-strong` with `rounded-t-2xl`
- Character name tag: teal accent pill (`bg-teal/20 text-teal`)
- Dialogue text: `text-base md:text-lg text-txt-primary leading-relaxed`
- Continue indicator: pulsing teal chevron at bottom-right

### Choice Buttons
- Stack of 2-4 options in a glass container
- Each choice: `glass` with `rounded-xl`, numbered badge
- Stat impact preview below each choice in `text-sm text-txt-secondary`
- Hover: `scale-[1.02]`, teal border glow
- Active: `scale-[0.98]`
- Transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`

### Stat Sidebar
- Fixed left panel (desktop) or collapsible drawer (mobile)
- `.glass` container with `rounded-2xl`
- Each stat: icon + label + gradient progress bar + numeric value
- Stat colors: GPA=gold, Stamina=teal, Social=pink, Money=teal, Stress=coral
- Progress bar gradient: `from-{color}/60 to-{color}` on `bg-surface-dark` track

### Schedule Planner
- Weekly grid (Mon-Fri rows, time slot columns)
- Color-coded activity blocks: lectures=teal, work=gold, clubs=lavender, free=surface-light
- `.glass` container, compact `text-sm` labels

### Character Cards
- `glass` card with `rounded-2xl overflow-hidden`
- Character portrait: `aspect-[3/4] object-cover` at top
- Name, role badge, description below
- Relationship indicator: thin colored bar at bottom

### Notification Toasts
- Right-aligned floating cards with `glass` styling
- Icon (Iconify Solar) + title + description + dismiss button
- Achievement: gold accent, Message: pink accent, Warning: coral accent
- Enter animation: `fadeInUp` from right

### HUD Bar
- Top bar overlay: `.glass` with `rounded-b-xl`
- Left: semester/week indicator, Right: time display
- `text-sm` with Iconify Solar icons

## Animation

### Staggered Reveal
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.reveal.visible {
  animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--index, 0) * 100ms);
}
```
Trigger with `IntersectionObserver` on scroll. Never use `window.addEventListener('scroll')`.

### Floating Elements
```css
@keyframes floatSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
```

### Hover Transitions
- Buttons: `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`
- Hover: `scale-[1.02]`, Active: `scale-[0.98]`
- Only animate `transform` and `opacity` for GPU acceleration

## Icons

**Library:** Iconify with Solar icon set
```
CDN: https://code.iconify.design/iconify-icon/2.3.0/iconify-icon.min.js
Usage: <iconify-icon icon="solar:icon-name-linear"></iconify-icon>
```

Common icons:
- Stats: `solar:star-bold` (GPA), `solar:heart-pulse-bold` (stamina), `solar:users-group-rounded-bold` (social), `solar:wallet-bold` (money), `solar:fire-bold` (stress)
- Actions: `solar:book-bold` (study), `solar:running-round-bold` (exercise), `solar:moon-bold` (rest), `solar:chat-round-dots-bold` (social)
- UI: `solar:arrow-right-linear` (continue), `solar:close-circle-linear` (dismiss), `solar:notification-unread-bold` (alert)

## Images

- Character portraits: `assets/characters/{name}/{expression}.png` (3:4 aspect ratio)
- Backgrounds: `assets/backgrounds/{location}/{variant}.png` (16:9 aspect ratio)
- All images: `loading="lazy"` `decoding="async"` below the fold
- Placeholder images: `https://picsum.photos/seed/{name}/{w}/{h}` (never Unsplash)

## Responsive Breakpoints

- Mobile-first design (70%+ of Korean web traffic is mobile)
- `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Use `min-h-[100dvh]` not `h-screen` (iOS Safari fix)
- Use CSS Grid over flexbox percentage math

## Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Content | 0–10 | Normal page content |
| Stat sidebar | 20 | Fixed stat panel |
| HUD bar | 30 | Top game status bar |
| Sticky nav | 40 | Navigation overlay |
| Modals/Overlays | 50 | Dialogue choices, popups |
| Noise texture | 60 | Grain overlay (pointer-events: none) |

## Content Standards

- All visible text in natural Korean (not translated-sounding)
- Honorifics: use 합니다/하세요 form consistently
- CTA copy: direct, action-oriented ("무료로 시작하기", "지금 바로 체험하기")
- No emojis in UI — use Iconify Solar icons instead
- Banned Korean cliches: "혁신적인", "획기적인", "차세대"
- Character names: realistic Korean names (하윤서, 박도현, 이서진), not generic (김철수)
- Numbers: organic-feeling (`47,200+` not `50,000+`)
