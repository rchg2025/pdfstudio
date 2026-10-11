/**
 * Lightweight Zero-dependency Canvas Confetti Utility
 * Pháo hoa chúc mừng chiến thắng mà không cần cài thêm npm package ngoài
 */

export function triggerConfetti(options?: { particleCount?: number; spread?: number; origin?: { x?: number; y?: number } }) {
  const particleCount = options?.particleCount || 100;
  const spread = options?.spread || 70;
  const originX = options?.origin?.x ?? 0.5;
  const originY = options?.origin?.y ?? 0.6;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#fef08a'];
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    life: number;
    opacity: number;
  }> = [];

  const startX = window.innerWidth * originX;
  const startY = window.innerHeight * originY;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI / 180) * (270 + (Math.random() - 0.5) * spread);
    const speed = Math.random() * 12 + 6;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      life: 1,
      opacity: 1
    });
  }

  let animationFrameId: number;
  const gravity = 0.35;
  const friction = 0.98;

  function render() {
    ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeCount = 0;
    particles.forEach(p => {
      p.vx *= friction;
      p.vy *= friction;
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= 0.012;
      p.opacity = Math.max(0, p.life);

      if (p.opacity > 0 && p.y < window.innerHeight + 50) {
        activeCount++;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.opacity;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx!.restore();
      }
    });

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
