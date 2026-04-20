import { ProfileCard } from "../../components/ProfileCard/ProfileCard";
import { CreateRoomSection } from "../../components/CreateRoomSection/CreateRoomSection";
import { QuickPlayButton } from "../../components/QuickPlayButton/QuickPlayButton";
import { useQuickPlayEntry } from "../../hooks/useQuickPlayEntry";
import { AppVersionCaption } from "../../components/AppVersionCaption/AppVersionCaption";
import { AppTopBar } from "../../components/AppTopBar/AppTopBar";

export const HomeScreen = () => {
  const { playersInRandomQueue, quickPlayLabel, openQuickPlay } = useQuickPlayEntry();

  return (
    <div className="relative w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
      <AppTopBar />
      <div className="max-w-[432px] w-full flex flex-col items-center gap-3 px-4">
        <ProfileCard />
        <QuickPlayButton
            onClick={openQuickPlay}
            timeLabel={quickPlayLabel}
            playersInQueue={playersInRandomQueue}
          />
        <CreateRoomSection />
        <AppVersionCaption />
      </div>
    </div>
  );
};
