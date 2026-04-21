import React from 'react';
import { CreateGameButton } from '../CreateGameButton/CreateGameButton';
import { useTranslation } from 'react-i18next';

type QuickPlayButtonProps = {
  onClick: () => void;
  timeLabel: string;
  playersInQueue: number;
  className?: string;
  variant?: 'quick' | 'play' | 'start';
};

export const QuickPlayButton: React.FC<QuickPlayButtonProps> = ({
  onClick,
  timeLabel,
  playersInQueue,
  className = '',
  variant = 'quick',
}) => {
  const { t } = useTranslation();
  const copyByVariant: Record<NonNullable<QuickPlayButtonProps["variant"]>, { title: string; sub: string }> = {
    quick: { title: t("room.quickPlay"), sub: t("room.randomOpponent") },
    play: { title: t("room.playRandomOpponent"), sub: t("room.instantMatchmaking") },
    start: { title: t("room.startGameNow"), sub: t("room.randomOpponent") },
  };
  const { title, sub } = copyByVariant[variant];

  return (
    <CreateGameButton 
      title={`${title} · ${sub}`}
      subtitle={`${timeLabel}`} // ${playersInQueue > 0 && ` · ${playersInQueue} waiting`}
      onClick={onClick}
    />
  );
};
