export function collectItem(item, handlers = {}) {
  handlers.onEffect?.(item.id, item.durationSeconds ?? 0);
  handlers.onSound?.(item.sound ?? item.id);
  handlers.onParticles?.(item.position);
  return item.value ?? 0;
}
