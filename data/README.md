# Runner game data

Original starter assets and browser-side modules for a responsive endless runner. The folders group content by game feature and are designed to sit beside `player_data`. They are framework-free; the SVGs work in browser pages and the JavaScript modules can be imported by a future game shell.

## Folder map

- `player_data/` — player sprite, animation styles, controls, and collision dimensions.
- `track_data/` — three-lane track layout, repeating segment definition, scenery, and camera defaults.
- `obstacle_data/` — obstacle catalog, hitboxes, and fair pattern generation.
- `collectible_data/` — coin and power-up catalog, pickup behavior, and effects metadata.
- `ui_data/` — responsive screen layout, HUD, menus, and UI styles.
- `game_systems/` — run state, scoring, difficulty, persistence, and game-loop helpers.
- `controls_data/` — keyboard, touch, and optional on-screen control definitions.
- `effects_data/` — sound manifest and lightweight visual effects.
- `web_app_data/` — responsive HTML shell, manifest, and service worker starter.
- `art_content/` — asset inventory, fonts/colors, and licensing guidance.
- `build_order/` — implementation milestones.

See each folder's README for contents and integration notes. The service worker and app manifest are templates; adjust their paths to your eventual host. All gameplay modules are building blocks and still need to be connected in a game scene.
