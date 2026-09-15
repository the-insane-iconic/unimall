/* ═══════════════════════════════════════════════════════════
   UNIMALL — CONFETTI CELEBRATION (js/confetti.js)
   Zero-dependency micro-confetti burst for order celebration.
   ═══════════════════════════════════════════════════════════ */

'use strict';

window.UniMallConfetti = function () {
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
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const pieces = [];

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.65;

  for (let i = 0; i < 65; i++) {
    const angle = (Math.PI * 2 * Math.random());
    const velocity = 8 + Math.random() * 14;
    pieces.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 6,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      gravity: 0.35
    });
  }

  let start = null;
  function render(time) {
    if (!start) start = time;
    const progress = (time - start) / 1800;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - progress);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (progress < 1) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(render);
};
