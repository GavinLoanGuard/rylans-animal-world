// ============================================
// Confetti Animation
// Celebration effect for first animal & first scene
// ============================================

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
  shape: 'square' | 'circle' | 'star';
}

const CONFETTI_COLORS = [
  '#FFD700', // Gold
  '#FF69B4', // Pink
  '#00CED1', // Teal
  '#98FB98', // Pale green
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
  '#87CEEB', // Sky blue
  '#FFA07A', // Light salmon
];

let animationId: number | null = null;
let particles: ConfettiParticle[] = [];

export function launchConfetti(duration: number = 3000): void {
  // Create confetti container if it doesn't exist
  let container = document.getElementById('confetti-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'confetti-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
      overflow: hidden;
    `;
    document.body.appendChild(container);
  }

  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'width: 100%; height: 100%;';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  
  // Create particles
  particles = [];
  const particleCount = 150;
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      size: Math.random() * 10 + 5,
      shape: ['square', 'circle', 'star'][Math.floor(Math.random() * 3)] as ConfettiParticle['shape'],
    });
  }

  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p) => {
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity
      p.rotation += p.rotationSpeed;
      
      // Add some wobble
      p.vx += (Math.random() - 0.5) * 0.5;
      
      // Draw particle
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      
      if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawStar(ctx, 0, 0, 5, p.size / 2, p.size / 4);
        ctx.fill();
      }
      
      ctx.restore();
    });
    
    // Remove particles that are off screen
    particles = particles.filter((p) => p.y < canvas.height + 50);
    
    if (elapsed < duration && particles.length > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      // Cleanup
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      canvas.remove();
    }
  }

  animate();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
): void {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

export function stopConfetti(): void {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  const container = document.getElementById('confetti-container');
  if (container) {
    container.innerHTML = '';
  }
  
  particles = [];
}
