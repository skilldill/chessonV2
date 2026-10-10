import { HomeDashboard } from "../HomeScreen/HomeScreen";
import { useLocation } from "react-router-dom";
import { isFriendGameEntry } from "../../utils/friendGameEntry";
import { isBotGameEntry } from "../../utils/botGameEntry";
import { GameEntryScreen } from "../GameEntryScreen/GameEntryScreen";

export const CreateRoomScreen = () => {
  const location = useLocation();
  if (isBotGameEntry(location.search)) return <GameEntryScreen key="bot" mode="bot" />;
  return isFriendGameEntry(location.search) ? <GameEntryScreen key="friend" /> : <HomeDashboard />;
};
