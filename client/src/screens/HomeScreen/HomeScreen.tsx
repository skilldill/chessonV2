import { ProfileCard } from "../../components/ProfileCard/ProfileCard";
import { CreateRoomSection } from "../../components/CreateRoomSection/CreateRoomSection";

export const HomeScreen = () => {
  return (
    <div className="w-full h-[100vh] flex justify-center items-center overflow-y-auto py-4">
      <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
        <ProfileCard />
        <CreateRoomSection />
      </div>
    </div>
  );
};
