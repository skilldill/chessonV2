import React, { useEffect, useRef, useState } from "react";

type PlasmaButtonProps = {
  children?: React.ReactNode;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  active?: boolean;
};

const WIDTH = 96;
const HEIGHT = 28;
const RADIUS_PX = 9999;

// Plasma colors
const COLORS = ["#3b5bff", "#5b2dff", "#a855f7", "#60a5fa"] as const;
const NOT_ACTIVE_COLORS = ["#bcbcbc", "#dddddd", "#bababa", "#f3f3f3"] as const;

// Animation parameters
const BLOB_COUNT = 5;
const BASE_SPEED = 0.6; // movement speed multiplier
const FRAME_INTERVAL_MS = 22; // ~45fps cap
const TOP_VIGNETTE_ALPHA = 0.32;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Ensure CSS is injected once
let injectedStyles = false;
function injectStylesOnce() {
  if (injectedStyles) return;
  injectedStyles = true;
  const css = `
  .plasma-btn {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    border: none;
    border-radius: ${RADIUS_PX}px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    user-select: none;
    cursor: pointer;
    background: transparent;
    transition: transform 120ms ease, filter 160ms ease, opacity 160ms ease;
    outline: none;
  }
  .plasma-btn[data-disabled="true"] {
    cursor: not-allowed;
    opacity: 0.6;
    filter: saturate(0.8) brightness(0.9);
  }
  .plasma-btn:not([data-disabled="true"]):hover {
    filter: brightness(1.05) saturate(1.08);
  }
  .plasma-btn:not([data-disabled="true"]):active {
    transform: scaleX(0.95) scaleY(1.05);
  }
  .plasma-btn:focus-visible {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.9), 0 0 0 4px rgba(181, 96, 255, 0.26);
  }
  .plasma-btn__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .plasma-btn__label {
    position: relative;
    z-index: 1;
    color: #fff;
    font-weight: 600;
    font-size: 12px;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0,0,0,0.45);
    padding: 0 10px;
    white-space: nowrap;
    pointer-events: none;
  }
  `;
  const tag = document.createElement("style");
  tag.setAttribute("data-plasma-button", "true");
  tag.appendChild(document.createTextNode(css));
  document.head.appendChild(tag);
}

// Utility: hex to rgba string with alpha
function hexToRgba(hex: string, alpha: number) {
  const v = hex.replace("#", "");
  const bigint = parseInt(v.length === 3 ? v.split("").map(c=>c+c).join("") : v, 16);
  const r = (bigint >> 4) & 255;
  const g = (bigint >> 8) & 255;
  const b = (bigint >> 0) & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export const PlasmaButton: React.FC<PlasmaButtonProps> = ({
  children,
  onClick,
  disabled,
  className,
  active = true,
  title,
}) => {
  injectStylesOnce();

  const colorsForRendering = active ? COLORS : NOT_ACTIVE_COLORS;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const playingRef = useRef<boolean>(false);
  const [isReduced, setIsReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;
  });
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Intersection Observer to pause when hidden
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          setIsVisible(e.isIntersecting);
        }
      },
      { root: null, threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reduced motion listener
  useEffect(() => {
    const mq = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!mq) return;
    const handler = () => setIsReduced(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // Document visibility pause
  const [isDocVisible, setIsDocVisible] = useState<boolean>(() => !document.hidden);
  useEffect(() => {
    const onVis = () => setIsDocVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Resize & DPR handling
  const setupCanvas = () => {
    const canvas = canvasRef.current!;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    // Internal render scale (downsample or upsample logic), at least 1.5x and capped
    const scale = Math.max(1.5, Math.min(2.25, dpr * 1.5));
    const w = Math.round(WIDTH * scale);
    const h = Math.round(HEIGHT * scale);
    canvas.width = w;
    canvas.height = h;
    // CSS size remains logical
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    return { w, h, scale };
  };

  // Plasma state
  const seedsRef = useRef(
    new Array(BLOB_COUNT).fill(0).map((_, i) => ({
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      speed: BASE_SPEED * (0.6 + Math.random() * 0.8),
      radius: 0.35 + Math.random() * 0.22, // relative to min(W,H)
      color: colorsForRendering[i % colorsForRendering.length],
    }))
  );

  const drawFrame = (time: number, oneshot = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    const minDim = Math.min(W, H);

    // Clear with dark base
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(10,10,14,0.9)";
    ctx.fillRect(0, 0, W, H);

    // Additive blobs
    ctx.globalCompositeOperation = "lighter";
    const t = time / 1000;

    seedsRef.current.forEach((s, i) => {
      const px =
        (0.5 +
          0.42 * Math.sin(t * 0.7 * s.speed + s.phaseX) +
          (i % 2 === 0 ? 0.08 : -0.04)) *
        W;
      const py =
        (1.3 +
          0.35 * Math.sin(t * 0.9 * s.speed + s.phaseY) +
          (i % 3 === 0 ? -0.12 : 0.08)) *
        H;
      const r = 100;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, hexToRgba(s.color, 0.85));
      grad.addColorStop(0.55, hexToRgba(s.color, 0.35));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Slight purple-pink lift on bottom-right
    {
      ctx.globalCompositeOperation = "lighter";
      const px = W * 0.78;
      const py = H * 0.86;
      const r = minDim * 0.9;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, hexToRgba("#d56cff", 0.35));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Screen blend to soften
    ctx.globalCompositeOperation = "screen";

    // Top dark vignette
    {
      ctx.globalCompositeOperation = "source-over";
      const lg = ctx.createLinearGradient(0, 0, 0, H);
      lg.addColorStop(0, `rgba(0,0,0,${TOP_VIGNETTE_ALPHA})`);
      lg.addColorStop(0.5, "rgba(0,0,0,0.07)");
      lg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
    }

    if (oneshot) return;

    // rAF loop with throttling
    const now = performance.now();
    if (now - lastTimeRef.current >= FRAME_INTERVAL_MS) {
      lastTimeRef.current = now;
    }
    rafRef.current = requestAnimationFrame((ts) => {
      if (playingRef.current) drawFrame(ts);
    });
  };

  // Start/stop controls
  const start = (oneshot = false) => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    playingRef.current = !oneshot;
    lastTimeRef.current = performance.now();
    drawFrame(lastTimeRef.current, oneshot);
  };
  const stop = () => {
    playingRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Init / lifecycle
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    setupCanvas();

    const renderOne = () => {
      start(true);
    };

    const run = () => {
      stop();
      start(false);
    };

    // Re-render on resize (DPR changes)
    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = c.getBoundingClientRect();
      if (Math.round(width) !== WIDTH || Math.round(height) !== HEIGHT) {
        // CSS size changed externally — keep our size locked but refresh buffer
      }
      setupCanvas();
      if (isReduced || disabled) renderOne();
    });
    resizeObserver.observe(c);

    // Initial frame
    if (isReduced || disabled) {
      renderOne();
    } else if (isVisible && isDocVisible) {
      run();
    }

    return () => {
      resizeObserver.disconnect();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to toggles that affect playback
  useEffect(() => {
    if (!canvasRef.current) return;
    setupCanvas();
    if (disabled || isReduced || !isVisible || !isDocVisible) {
      // draw single static frame
      stop();
      start(true);
    } else {
      // resume animation
      if (!playingRef.current) start(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, isReduced, isVisible, isDocVisible]);

  // Keyboard handling for Enter/Space (works even if using <button>)
  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      ref={containerRef}
      type="button"
      title={title}
      className={`plasma-btn${className ? " " + className : ""}`}
      data-disabled={disabled ? "true" : "false"}
      onClick={disabled ? undefined : (e) => onClick?.(e)}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-disabled={disabled ? true : undefined}
    >
      <canvas ref={canvasRef} className="plasma-btn__canvas" />
      <span className="plasma-btn__label">{children}</span>
    </button>
  );
};
