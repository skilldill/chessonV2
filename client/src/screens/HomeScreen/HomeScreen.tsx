import { ProfileCard } from "../../components/ProfileCard/ProfileCard";
import { CreateRoomSection } from "../../components/CreateRoomSection/CreateRoomSection";
import { QuickPlayButton } from "../../components/QuickPlayButton/QuickPlayButton";
import { useQuickPlayEntry } from "../../hooks/useQuickPlayEntry";

export const HomeScreen = () => {
  const { playersInRandomQueue, quickPlayLabel, openQuickPlay } = useQuickPlayEntry();

  return (
    <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
      <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
        <ProfileCard />
        <div className="w-full flex flex-col gap-1">
          <QuickPlayButton
            onClick={openQuickPlay}
            timeLabel={quickPlayLabel}
            playersInQueue={playersInRandomQueue}
          />
          <p className="text-xs text-white/60 px-2">
            {playersInRandomQueue} {playersInRandomQueue === 1 ? "player" : "players"} in quick play
          </p>
        </div>
        <CreateRoomSection />
      </div>
    </div>
  );
};
