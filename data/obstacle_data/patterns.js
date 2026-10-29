const templates = [
  [{ lane: 1, type: 'single_jump' }],
  [{ lane: 0, type: 'two_story_solid' }, { lane: 2, type: 'single_underpass' }],
  [{ lane: 0, type: 'two_story_ladder' }, { lane: 1, type: 'single_jump' }],
  [{ lane: 1, type: 'two_story_underpass' }, { lane: 2, type: 'single_jump' }],
  [{ lane: 0, type: 'two_story_solid' }, { lane: 1, type: 'two_story_ladder' }],
];

/** Return a fair lane pattern. Each row leaves at least one lane without an obstacle. */
export function createObstaclePattern(random = Math.random) {
  const source = templates[Math.floor(random() * templates.length)];
  return source.map(item => ({ ...item, distance: 0 }));
}

export function placePattern(pattern, distance, minReactionDistance = 11) {
  return pattern.map(item => ({ ...item, distance: distance + minReactionDistance }));
}
