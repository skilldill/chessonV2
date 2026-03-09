import React from "react";

type QuickPlayButtonProps = {
  onClick: () => void;
  timeLabel: string;
  playersInQueue: number;
  className?: string;
  variant?: "quick" | "play" | "start";
};

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
    <div
      onClick={onClick}
      className={"flex items-center gap-[10px] px-[10px] rounded-[14px] bg-[#4F39F6] py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none  disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
        <LightningIcon />
      </div>

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
    </div>
  );
};
