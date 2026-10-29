# Player data pack

A small, framework-free 2D player asset pack for a browser endless runner. It contains an original vector sprite sheet, CSS animation states, a player controller, and collision dimensions. It can be used in a plain HTML game or adapted to a canvas/game engine.

## Files

- `player-sprites.svg` — seven 128 × 128 original brown-bear poses in order: run stride A, jump, slide, hit, idle, run stride B, and ladder climb. The rounded ears, brown fur, cream muzzle/belly, and friendly face follow the user's bear reference.
- `player.css` — sprite animation and lane positioning styles.
- `player.js` — keyboard and swipe controls, lane switching, jump/slide/hit state, and callbacks.
- `collision.json` — recommended upright and slide collision boxes and lane settings.

## Minimal setup

```html
<link rel="stylesheet" href="data/player_data/player.css">
<div class="runner-stage" id="stage">
  <div class="runner-player" id="player" aria-label="Runner"></div>
</div>
<script type="module">
  import { createPlayerController } from './data/player_data/player.js';
  const player = createPlayerController(document.querySelector('#player'), {
    onAction: (action) => console.log(action),
    onLaneChange: (lane) => console.log('lane', lane),
  });
  // Call player.destroy() when leaving the game screen.
</script>
```

Give `.runner-stage` a height and `position: relative`; place the player near the bottom of it. The controller changes lanes visually but does not create a track, enemies, or perform obstacle collision checks. Read `collision.json` to use the matching collision dimensions in your game logic. Keyboard controls: ←/A, →/D, ↑/Space, ↓/S, P/Escape. Touch controls use swipes.

All vector artwork here is original for this pack. The player uses simple shapes so you can readily recolor or replace it.
