# Obstacles

Obstacle data uses forward-distance placement and describes three readable obstacle classes: single-story blocks that can be jumped, two-story towers with or without a climbable ladder, and raised single/double beams with a bottom opening that can be slid under. `patterns.js` samples readable patterns and keeps at least one lane actionable; ladder towers use the Up/Jump action when they are close in the current lane.
