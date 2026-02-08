import { useAuthRedirect } from "../../hooks/useAuthRedirect";
import { CreateRoomScreen } from "../../screens/CreateRoomScreen/CreateRoomScreen";

export const HomeRedirect = () => {
  const { checking } = useAuthRedirect();

  // Показываем загрузку во время проверки авторизации
  if (checking) {
    return (
      <div className="w-full h-[100vh] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4F39F6] border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  // Если проверка завершена и пользователь не авторизован, показываем CreateRoomScreen
  // Если авторизован, useAuthRedirect уже сделает редирект на /profile
  return <CreateRoomScreen />;
};
