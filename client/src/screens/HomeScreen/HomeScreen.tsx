import { ProfileCard } from "../../components/ProfileCard/ProfileCard";
import { CreateRoomSection } from "../../components/CreateRoomSection/CreateRoomSection";
import { useQuickPlayEntry } from "../../hooks/useQuickPlayEntry";

export const HomeScreen = () => {
  const { playersInRandomQueue, quickPlayLabel, openQuickPlay } = useQuickPlayEntry();

  return (
    <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
      <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
        <ProfileCard />
        <button
          onClick={openQuickPlay}
          className="w-full rounded-xl px-6 py-5 bg-[#4F39F6] text-white font-semibold hover:bg-[#4332D7] transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">Быстрая игра с рандомным игроком</span>
            <span className="text-sm opacity-90">{quickPlayLabel}</span>
            <span className="text-xs opacity-75">
              Сейчас в режиме: {playersInRandomQueue}
            </span>
          </div>
        </button>
        <CreateRoomSection />
      </div>
    </div>
  );
};
