import React from "react";

type QuickPlayButtonProps = {
  onClick: () => void;
  timeLabel: string;
  playersInQueue: number;
  className?: string;
  /** A/B testing: "quick" | "play" | "start" */
  variant?: "quick" | "play" | "start";
};

// Copy variants for A/B testing (use variant prop)
// A: quick  - "Quick Play" / "Random opponent"
// B: play   - "Play Random Opponent" / "Instant matchmaking"
// C: start  - "Start Game Now" / "Random opponent"
const COPY = {
  quick: { title: "Quick Play", sub: "Random opponent" },
  play: { title: "Play Random Opponent", sub: "Instant matchmaking" },
  start: { title: "Start Game Now", sub: "Random opponent" },
} as const;

const LightningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5 shrink-0"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
      clipRule="evenodd"
    />
  </svg>
);

export const QuickPlayButton: React.FC<QuickPlayButtonProps> = ({
  onClick,
  timeLabel,
  playersInQueue,
  className = "",
  variant = "quick",
}) => {
  const { title, sub } = COPY[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl px-5 py-4",
        "flex items-center gap-4",
        "bg-[#4F39F6] text-white",
        "hover:bg-[#5B45F8] active:bg-[#4332D7]",
        "border border-[#4F39F6]/80",
        "transition-colors duration-150 active:scale-[0.99]",
        "focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent",
        "cursor-pointer touch-manipulation",
        "min-h-[56px]",
        className,
      ].join(" ")}
    >
      {/* Icon - speed/action cue */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
        <LightningIcon />
      </div>

      {/* Text stack - 2 levels max */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold leading-tight">{title}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide text-white/90 bg-white/15"
            aria-label="Experimental feature"
          >
            Beta
          </span>
        </div>
        <p className="text-sm text-white/80 mt-0.5">
          {sub} · {timeLabel}
          {playersInQueue > 0 && ` · ${playersInQueue} waiting`}
        </p>
      </div>

      {/* Chevron - clear tap target */}
      <svg
        className="w-5 h-5 shrink-0 text-white/60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
};
