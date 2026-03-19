import React from "react";
import { CreateGameButton } from "../CreateGameButton/CreateGameButton";

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

export const QuickPlayButton: React.FC<QuickPlayButtonProps> = ({
  onClick,
  timeLabel,
  playersInQueue,
  className = "",
  variant = "quick",
}) => {
  const { title, sub } = COPY[variant];

  return (
    <CreateGameButton 
      title={title}
      subtitle={`${sub} · ${timeLabel} ${playersInQueue > 0 && `· ${playersInQueue} players`}`}
      onClick={onClick}
    />
  )

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl px-4 py-5 min-h-[64px]",
        "text-white/90 font-semibold",
        "transition-all duration-200 active:scale-[0.98]",
        "focus:outline-none cursor-pointer touch-manipulation",
        "border border-[#2D7A4F]/60 bg-[#2D7A4F]/20 hover:bg-[#2D7A4F]/30",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
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
          <span className="text-lg font-bold">{title}</span>
        </div>
        <span className="text-sm opacity-90">
          {sub} · {timeLabel}
          {playersInQueue > 0 && ` · ${playersInQueue} players`}
        </span>
      </div>
    </button>
  );
};
