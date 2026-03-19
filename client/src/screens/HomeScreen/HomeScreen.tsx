import { ProfileCard } from "../../components/ProfileCard/ProfileCard";
import { CreateRoomSection } from "../../components/CreateRoomSection/CreateRoomSection";
import { QuickPlayButton } from "../../components/QuickPlayButton/QuickPlayButton";
import { useQuickPlayEntry } from "../../hooks/useQuickPlayEntry";

export const HomeScreen = () => {
  const { playersInRandomQueue, quickPlayLabel, openQuickPlay } = useQuickPlayEntry();

  return (
    <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
      <div className="max-w-[432px] w-full flex flex-col items-center gap-3 px-4">
        <ProfileCard />
        <QuickPlayButton
            onClick={openQuickPlay}
            timeLabel={quickPlayLabel}
            playersInQueue={playersInRandomQueue}
          />
        <CreateRoomSection />
      </div>
    </div>
  );
};
