export function burstParticles(container, x, y, color = '#ffd052', count = 10) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('i');
    const angle = (Math.PI * 2 * i) / count;
    particle.className = 'runner-particle';
    particle.style.cssText = `left:${x}px;top:${y}px;background:${color};--dx:${Math.cos(angle) * 34}px;--dy:${Math.sin(angle) * 34}px`;
    container.append(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }
}
