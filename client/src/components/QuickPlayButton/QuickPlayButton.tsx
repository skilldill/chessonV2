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
  const waitingInfo = playersInQueue > 0 ? `Now in game ${playersInQueue} players` : "";

  return (
    <CreateGameButton 
      title={title}
      subtitle={<div>{sub} · {timeLabel}</div>} // <br/>{waitingInfo}
      onClick={onClick}
      theme="primary"
      className={className}
    />
  )
};
