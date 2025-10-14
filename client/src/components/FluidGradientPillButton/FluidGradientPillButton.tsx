import { useEffect, useRef } from "react";

/**
 * FluidNoisePill — миниатюрная версия флюидной анимации для капсулы 96x28.
 * Всё масштабировано под маленький размер, чтобы эффект сохранялся мягким.
 */
export default function FluidNoisePill({
  width = 96,
  height = 28,
  radius = 14,
  speed = 0.1,
  colors = ["#3b5bfd", "#6a36ff", "#b056ff", "#ff7dd9", "#89c7ff"],
  backdrop = "#111",
  vignetteOpacity = 0.65,
  blurPx = 15,
  className = "block",
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const buffer = document.createElement("canvas");
    buffer.width = width;
    buffer.height = height;
    const bctx = buffer.getContext("2d");

    const flows = Array.from({ length: 6 }).map((_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() * 2 - 1) * speed * 4,
      vy: (Math.random() * 2 - 1) * speed * 4,
      r: Math.max(width, height) * (0.8 + Math.random() * 0.4),
      color: colors[i % colors.length],
      phase: Math.random() * Math.PI * 2,
    }));

    let last = performance.now();

    function clipRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      const rr = Math.min(r, h / 2, w / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
      ctx.clip();
    }

    function step(now: number) {
      if (!bctx) return;
      if (!ctx) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      bctx.clearRect(0, 0, width, height);
      bctx.globalCompositeOperation = "lighter";

      flows.forEach((f) => {
        f.x += f.vx * dt * 60;
        f.y += f.vy * dt * 60;
        if (f.x < -f.r) f.x = width + f.r;
        if (f.x > width + f.r) f.x = -f.r;
        if (f.y < -f.r) f.y = height + f.r;
        if (f.y > height + f.r) f.y = -f.r;

        const grad = bctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        grad.addColorStop(0.0, hexToRgba(f.color, 0.3));
        grad.addColorStop(0.6, hexToRgba(f.color, 0.08));
        grad.addColorStop(1.0, hexToRgba(f.color, 0.0));
        bctx.fillStyle = grad;
        bctx.beginPath();
        bctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        bctx.fill();
      });

      ctx.save();
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, width, height);
      clipRoundedRect(ctx, 0, 0, width, height, radius);
      ctx.filter = `blur(${blurPx}px) saturate(130%)`;
      ctx.drawImage(buffer, 0, 0);
      ctx.filter = "none";

      const vg = ctx.createLinearGradient(0, 0, 0, height);
      vg.addColorStop(0, `rgba(0,0,0,${vignetteOpacity})`);
      vg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      roundedStroke(ctx, 0.25, 0.25, width - 0.5, height - 0.5, radius);

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, radius, speed, colors.join("-"), backdrop, vignetteOpacity, blurPx]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={width}
      height={height}
      style={{ display: "block", borderRadius: radius, background: backdrop }}
    />
  );
}

function hexToRgba(hex: string, a = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function roundedStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.stroke();
}

/**
 * Пример использования:
 * <FluidNoisePill width={96} height={28} radius={14} />
 */
