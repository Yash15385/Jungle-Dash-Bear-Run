const templates = [
  [{ lane: 1, type: 'low_barrier' }],
  [{ lane: 0, type: 'crate' }, { lane: 2, type: 'overhead_gate' }],
  [{ lane: 0, type: 'overhead_gate' }, { lane: 1, type: 'low_barrier' }],
  [{ lane: 1, type: 'crate' }, { lane: 2, type: 'low_barrier' }],
  [{ lane: 0, type: 'crate' }, { lane: 1, type: 'track_gap' }],
];

/** Return a fair lane pattern. Each row leaves at least one lane without an obstacle. */
export function createObstaclePattern(random = Math.random) {
  const source = templates[Math.floor(random() * templates.length)];
  return source.map(item => ({ ...item, distance: 0 }));
}

export function placePattern(pattern, distance, minReactionDistance = 11) {
  return pattern.map(item => ({ ...item, distance: distance + minReactionDistance }));
}
