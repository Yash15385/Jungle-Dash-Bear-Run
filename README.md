# Jungle Dash

A responsive, framework-free browser prototype inspired by the Stitch UI screens in `stitch_endless_runner_ui_system.zip`. The UI follows their bold rounded buttons, compact HUD pills, and translucent panels, with a jungle palette and a custom canvas-rendered canopy trail.

## Run it

Serve this folder through a local HTTP server, then open the address it prints. For example, from this folder run `python -m http.server 8000` and visit `http://localhost:8000`. ES modules and local SVG image loading may not work when opening `index.html` directly as a `file://` URL.

## Prototype features

- Responsive start, gameplay, pause, settings, and run-results screens
- Three-lane perspective jungle track with scrolling foliage and hanging vines
- Brown-bear runner sprite from `data/player_data/player-sprites.svg`
- Keyboard and swipe controls, jump and slide actions
- Roots, hanging vines, crates, moving carts, and collectible fruit/coins
- Score, distance, sound toggle, and locally saved best distance

Controls: arrow keys or A/D to change lanes, Up/Space to jump, Down to slide, P/Escape to pause; on touch screens swipe in the matching direction.

This is an early 2D prototype. Track scenery, obstacles, and bear are rendered with lightweight canvas/vector art; the ZIP's Stitch HTML screens are design references, not a game engine or 3D asset pack. Audio is synthesized as short interface tones. Tune collision timing and difficulty during playtesting before adding progression or publishing.
