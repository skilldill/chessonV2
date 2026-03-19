import { useMemo, useState } from "react";
import { useCreateRoom } from "../../hooks/useCreateRoom";
import { BotDifficultyModal, type BotDifficulty } from "../BotDifficultyModal/BotDifficultyModal";
import { RoomTimeModal, type RoomTimeControl } from "../RoomTimeModal/RoomTimeModal";
import RobotEmojiWebp from "../../assets/robot-emoji.webp";
import HandShakeEmojiWebp from "../../assets/handshake.webp";
import SharedLinkSVG from '../../assets/shared-link.svg';
import { CreateGameButton } from "../CreateGameButton/CreateGameButton";

const ROOM_TIME_CONTROLS: RoomTimeControl[] = [
  { timeMinutes: 3, incrementSeconds: 0, label: "3 min", subtitle: "Fast game" },
  { timeMinutes: 3, incrementSeconds: 2, label: "3 min + 2 sec", subtitle: "Fast with increment" },
  { timeMinutes: 5, incrementSeconds: 0, label: "5 min", subtitle: "Classic blitz" },
  { timeMinutes: 5, incrementSeconds: 2, label: "5 min + 2 sec", subtitle: "Blitz with increment" },
  { timeMinutes: 10, incrementSeconds: 0, label: "10 min", subtitle: "Rapid game" },
  { timeMinutes: 10, incrementSeconds: 5, label: "10 min + 5 sec", subtitle: "Rapid with increment" },
];

const getControlKey = (timeMinutes: number, incrementSeconds: number) => `${timeMinutes}:${incrementSeconds}`;

export const CreateRoomSection = () => {
  const { createRoom, isCreating } = useCreateRoom();
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
  const [selectedControlKey, setSelectedControlKey] = useState(getControlKey(10, 5));

  const selectedControl = useMemo(
    () => ROOM_TIME_CONTROLS.find((control) => getControlKey(control.timeMinutes, control.incrementSeconds) === selectedControlKey) ?? ROOM_TIME_CONTROLS[0],
    [selectedControlKey]
  );

  const handleCreateBotRoom = () => {
    createRoom({
      timeMinutes: 30,
      incrementSeconds: 0,
      vsBot: true,
      botDifficulty,
      botMoveTimeMs: 800,
    });
  };

  const handleCreateFriendRoom = () => {
    createRoom({
      timeMinutes: selectedControl.timeMinutes,
      incrementSeconds: selectedControl.incrementSeconds,
    });
  };

  return (
    <>
      <div className="w-full flex flex-col gap-3">
        {/* <button
          type="button"
          onClick={() => setIsBotModalOpen(true)}
          disabled={isCreating}
          className="w-full rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-[#2D7A4F]/60 bg-[#2D7A4F]/20"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <img
                src={RobotEmojiWebp}
                alt="Bot"
                className="w-[30px] h-[30px] select-none"
              />
              <span className="text-lg font-bold">Play vs Bot</span>
            </div>
            <span className="text-sm opacity-90">30 min, choose difficulty</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsTimeModalOpen(true)}
          disabled={isCreating}
          className="w-full rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-[#2D7A4F]/60 bg-[#2D7A4F]/20"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
              <span className="text-lg font-bold">Create room</span>
            </div>
            <span className="text-sm opacity-90">{selectedControl.label}</span>
          </div>
        </button> */}

        <CreateGameButton 
          title="Play vs Bot"
          subtitle="30 min, choose difficulty"
          onClick={() => setIsBotModalOpen(true)}
        />
        <CreateGameButton 
          title="Create room"
          subtitle="Share link and play with a friend"
          onClick={() => setIsTimeModalOpen(true)}
        />
      </div>

      <BotDifficultyModal
        isOpen={isBotModalOpen}
        isCreating={isCreating}
        difficulty={botDifficulty}
        onChangeDifficulty={setBotDifficulty}
        onClose={() => setIsBotModalOpen(false)}
        onConfirm={handleCreateBotRoom}
      />

      <RoomTimeModal
        isOpen={isTimeModalOpen}
        isCreating={isCreating}
        controls={ROOM_TIME_CONTROLS}
        selectedKey={selectedControlKey}
        onSelect={setSelectedControlKey}
        onClose={() => setIsTimeModalOpen(false)}
        onConfirm={handleCreateFriendRoom}
      />
    </>
  );
};
