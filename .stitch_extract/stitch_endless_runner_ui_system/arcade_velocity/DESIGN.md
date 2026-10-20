---
name: Arcade Velocity
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bec8d2'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#88929b'
  outline-variant: '#3e4850'
  surface-tint: '#89ceff'
  primary: '#89ceff'
  on-primary: '#00344d'
  primary-container: '#0ea5e9'
  on-primary-container: '#003751'
  inverse-primary: '#006591'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#4fdbc8'
  on-tertiary: '#003731'
  tertiary-container: '#00ae9d'
  on-tertiary-container: '#003a33'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#89ceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004c6e'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '900'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 30px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '800'
    lineHeight: 20px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  counter-display:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 32px
    letterSpacing: -0.01em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-sm: 0.75rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies an energetic, high-octane, and tactile arcade aesthetic tailored for modern mobile and web gaming. It balances playful game physics with clean, precision UI engineering. Designed to appeal to casual and competitive players across all demographics, the interface delivers immediate dopamine hits through punchy contrast, dynamic micro-interactions, and juicy visual feedback.

The style fuses modern high-contrast arcade elements with tactile, skeuomorphic depth and refined glassmorphic paneling. High-energy vibrant gradients anchor the primary actions, while layered frosted translucent surfaces ensure the 3D game canvas remains visible beneath the HUD and menus. Elements feel buoyant, squishable, and mechanical: buttons compress with distinct physical travel, score counters roll smoothly, and interactive nodes react with snappy bounce physics.

## Colors

The color palette is built around high-saturation neon primaries, glowing collectible accents, and deep, light-absorbing atmospheric backdrops.

- **Primary (Speed & Dash):** Electric Sky Blue (`#0ea5e9`) and Light Sky (`#38bdf8`) signify navigation, speed trails, shields, and primary game actions.
- **Secondary (Value & Excitement):** Vibrant Citrus Gold (`#f59e0b`), Amber Glow (`#fbbf24`), and Hyper Orange (`#f97316`) form the high-priority CTA layer, coin pickups, and level progression meters.
- **Tertiary (Power & Boost):** Bright Turquoise (`#14b8a6`) and Cyber Cyan (`#06b6d4`) highlight active multiplier buffs, magnet pickups, and sprint gauges.
- **Neutral / Canvas:** Deep Indigo Navy (`#0f172a`) and Midnight Ink (`#1e1b4b`) anchor backgrounds and provide high-contrast containment borders.
- **Surfaces & Glass:** Frosted Midnight (`rgba(15, 23, 42, 0.65)`) layered over backdrop blur preserves visibility of the running track without sacrificing text legibility. Crisp white highlights (`#ffffff`) provide gloss rims and light-catching top bevels.

## Typography

The typographic strategy pairs the punchy, geometric weight of Outfit with the warm legibility of Plus Jakarta Sans. 

- **Display & Scores:** Outfit in ExtraBold (800) and Black (900) delivers maximum visual impact for real-time score updates, multiplier callouts, and screen titles. Numeric counters must render with tabular figures (`font-variant-numeric: tabular-nums`) to prevent layout jittering during high-frequency score tick-up animations.
- **Labels & Badges:** Uppercase Outfit with tracking (`0.04em` to `0.05em`) provides arcade-style pill labels, status indicators, and button text.
- **Body & Supporting Copy:** Plus Jakarta Sans at Medium (500) and SemiBold (600) handles instructions, settings toggles, mission descriptions, and store metadata without visual fatigue.

## Layout & Spacing

The layout is designed for screen-first ergonomics, accommodating dynamic mobile thumb zones and widescreen web views while keeping the central game perspective unobstructed.

- **Mobile Viewport (up to 768px):** Uses an edge-safe layout with `0.75rem` to `1rem` margins. The Heads-Up Display (HUD) anchors strictly along the top notch/island perimeter and the bottom edge, leaving the middle 70% of the screen clear for the 3D runner track. Primary touch elements sit within a reachable bottom thumb arch.
- **Desktop & Landscape Web (769px and above):** HUD elements dock into fixed corner quadrants, maintaining compact dimensions. Menus and store dialogs render inside centered floating modal containers limited to a maximum width of 480px (mobile preview shell) or 720px (full dashboard mode), flanked by ambient blurred backdrops.
- **Grid & Gutters:** Grid flows follow a fluid 4-column structure on mobile and an 8-column layout on desktop dashboards, utilizing `gutter` (1rem) spacing for inventory and character selection grids.

## Elevation & Depth

Depth in this design system is tactical and physical, utilizing a layered approach of frosted glass, directional 3D extruded drop shadows, and high-intensity neon glows:

- **Level 1 (In-Game HUD Overlays):** Translucent frosted plates (`rgba(15, 23, 42, 0.65)`) with an integrated 12px backdrop blur (`backdrop-filter: blur(12px)`). Encased in a 1.5px semi-transparent border (`rgba(255, 255, 255, 0.15)`) to cleanly separate HUD modules from the runner track.
- **Level 2 (Cards & Secondary Modules):** Dark indigo surfaces (`#1e1b4b`) with solid 2px outline strokes (`#0f172a`) and a crisp downward offset shadow (`0 4px 0 #090d16`), establishing distinct structural weight.
- **Level 3 (Tactile 3D Buttons & Active Badges):** Dual-layered elevation using an extruded bottom bevel shadow. A top inner highlight creates a glossy lip (`inset 0 1.5px 0 rgba(255, 255, 255, 0.4)`), while the base extends downward with an opaque bevel shadow (`0 5px 0 #b45309` for orange buttons, `0 5px 0 #0369a1` for sky-blue buttons).
- **Level 4 (Modals & Celebration Screens):** Deep drop shadows (`0 20px 40px rgba(15, 23, 42, 0.75)`) reinforced by outer radial color halos (e.g., gold or electric turquoise atmospheric bloom) to highlight level completions, high scores, and rare unlocks.

## Shapes

The shape system is decidedly pill-shaped and curvilinear (`roundedness: 3`). Round, bouncy profiles maintain the arcade identity and evoke physical rubber, plastic tokens, and floating bubbles.

- **Buttons & Chips:** Full pill radii (`rounded-full` / `9999px`) dominate high-priority interactions, coin displays, and HUD gauges.
- **Panels & Dialogs:** Large containers, shop cards, and post-run score summary boards apply `rounded-xl` (1.5rem to 2rem) corner treatments, softened with matching high-radius interior components.
- **Gauges & Sliders:** Pill-capsulated track slots with smoothly rounded fills to visually communicate rapid energy accumulation and power-up cooldowns.

## Components

### Buttons & Action Triggers
- **Primary Arcade CTA (Orange/Gold):** Solid gradient fill from `#fbbf24` to `#f97316`. Features a 1.5px white top rim gloss, a 5px extruded bottom bevel (`#c2410c`), and a 48px minimum height (56px for main 'RUN'/'PLAY' triggers). On active tap, the button translates 4px downward (`translate-y-1`) while collapsing the bottom bevel to 1px for instant tactile compression.
- **Secondary Actions (Sky Blue):** Gradient from `#38bdf8` to `#0ea5e9` with a `#0369a1` bottom bevel. Used for upgrades, restarts, and utility triggers.
- **Icon / Utility Buttons:** Circular (`44px` x `44px`) pill buttons with frosted navy backgrounds, 2px borders, and sharp inner icons.

### HUD Counters & Badges
- **Score Counter:** Pill capsule with a frosted navy background (`rgba(15, 23, 42, 0.75)`), white label, and tabular Outfit numbers. Positioned top-center.
- **Coin & Multiplier Badges:** Left-aligned pill container anchored by a protruding 3D gold coin icon on the left edge. Displays current count in bold amber text (`#fbbf24`), bounded by a subtle gold stroke.
- **Active Power-Up Timers:** Compact pill badges featuring an animated countdown border ring in turquoise (`#14b8a6`) or magenta, enclosing the power-up icon and remaining duration.

### Cards & Shop Tiles
- **Character / Vehicle Select:** 1.5rem rounded containers with a frosted dark gradient (`#1e1b4b` to `#0f172a`). Include a 2px outer stroke that shifts to glowing electric blue (`#38bdf8`) when selected.
- **Stat Progression Bars:** Segmented pill tracks with dark unfilled slots and hyper-saturated cyan or orange filled segments.

### Inputs, Toggles & Checkboxes
- **Toggle Switches:** Chunky pill capsules (`52px` x `30px`) with an inset track shadow. The sliding thumb is a glossy 3D circular knob that transitions from slate grey to glowing turquoise (`#06b6d4`) upon activation.
- **Text Inputs (Player Tag / Room Code):** Rounded-full, high-contrast dark indigo input fields framed with a 2px semi-transparent border, shifting to a vibrant 2px sky blue border with an ambient neon glow on focus.

### Modals & Dialogs
- **Post-Run Summary Screen:** Floating glassmorphic panel with high-radius corners, anchored by an extruded gold banner at the top (`VICTORY` / `GAME OVER`). Includes clear separation between reward breakdown (coins, meters ran) and next-step action buttons.