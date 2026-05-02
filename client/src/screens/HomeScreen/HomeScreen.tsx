import { ProfileCard } from "../../components/ProfileCard/ProfileCard";
import { CreateRoomSection } from "../../components/CreateRoomSection/CreateRoomSection";
import { QuickPlayButton } from "../../components/QuickPlayButton/QuickPlayButton";
import { useQuickPlayEntry } from "../../hooks/useQuickPlayEntry";
import { AppVersionCaption } from "../../components/AppVersionCaption/AppVersionCaption";
import { AppTopBar } from "../../components/AppTopBar/AppTopBar";
import { Link } from "react-router-dom";

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
        <Link
          to="/tournaments/new"
          className="flex min-h-[72px] w-full flex-col justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-white transition-colors duration-200 hover:bg-white/10"
        >
          <span className="text-[18px] font-bold">Создать турнир</span>
          <span className="text-sm text-white/60">Швейцарская система с авто-жеребьевкой</span>
        </Link>
        <AppVersionCaption />
      </div>
    </div>
  );
};
