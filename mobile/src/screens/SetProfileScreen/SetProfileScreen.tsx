import { IonPage, IonContent, IonText } from '@ionic/react';
import { useEffect, useState } from 'react';
import { MemAvatarSelect } from '../../components/MemAvatarSelect/MemAvatarSelect';
import { ChessButton } from '../../components/ChessButton/ChessButton';
import { useTranslation } from 'react-i18next';

const MAX_NICKNAME_LENGTH = 16;
const GUEST_CREATE_PROFILE_KEY = "guestCreateProfile";

type SetProfileScreenProps = {
  onSetUserName: (userName: string, avatarIndex: number) => void;
}

const SetProfileScreen: React.FC<SetProfileScreenProps> = ({ onSetUserName }) => {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState("");
  const [avatarIndex, setSelectedAvatarIndex] = useState(0);

  useEffect(() => {
      const storedProfileRaw = localStorage.getItem(GUEST_CREATE_PROFILE_KEY);
      if (!storedProfileRaw) {
          return;
      }

      try {
          const storedProfile = JSON.parse(storedProfileRaw) as { playerName?: string; avatar?: number | string };
          const storedName = (storedProfile.playerName || "").trim();
          const parsedAvatar =
              typeof storedProfile.avatar === "string"
                  ? parseInt(storedProfile.avatar, 10)
                  : storedProfile.avatar;
          const storedAvatar =
              typeof parsedAvatar === "number" && !Number.isNaN(parsedAvatar) && parsedAvatar >= 0
                  ? parsedAvatar
                  : 0;

          if (storedName) {
              setNickname(storedName.slice(0, MAX_NICKNAME_LENGTH));
          }
          setSelectedAvatarIndex(storedAvatar);
      } catch (error) {
          console.error("Failed to parse guest create profile:", error);
          localStorage.removeItem(GUEST_CREATE_PROFILE_KEY);
      }
  }, []);

  useEffect(() => {
      localStorage.setItem(
          GUEST_CREATE_PROFILE_KEY,
          JSON.stringify({
              playerName: nickname.trim(),
              avatar: avatarIndex,
          }),
      );
  }, [avatarIndex, nickname]);

  const handleSelectAvatar = (index: number) => {
      setSelectedAvatarIndex(index);
  };

  const handleChangeNickname = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value.length <= MAX_NICKNAME_LENGTH) {
          setNickname(value);
      }
  }

  const hanleToPlay = () => {
      const cleanedNickname = nickname.trim();
      if (!cleanedNickname) {
          return;
      }

      localStorage.setItem(
          GUEST_CREATE_PROFILE_KEY,
          JSON.stringify({
              playerName: cleanedNickname,
              avatar: avatarIndex,
          }),
      );
      onSetUserName(cleanedNickname, avatarIndex);
  }

  return (
    <IonPage>
      <IonContent>
        <form className="grid grid-rows-[1fr_88px] h-full">
          <div className="flex flex-col justify-center items-center gap-[20px]">
            <IonText>
              <h1 
                className="text-white text-center" 
                style={{ fontSize: 30, margin: 0, fontWeight: 600 }}
              >
                {t("setProfile.title")}
              </h1>
            </IonText>
            <div className="w-full px-[36px] py-[20px]">
              <input
                type="text"
                value={nickname}
                onChange={handleChangeNickname}
                placeholder={t("setProfile.yourName")}
                className="bg-white/4 w-full h-[46px] px-[12px] py-[11px] text-base leading-[24px] placeholder-[#99A1AF] rounded-md focus:border-indigo-700 focus:outline-none focus:border-[2px] focus:border-[#615FFF] focus:px-[10px] focus:bg-black"
              />
            </div>
            <div className="w-full px-[36px] py-[20px]">
              <MemAvatarSelect onSelectAvatar={handleSelectAvatar} initialSelected={avatarIndex} />
            </div>
          </div>
          <div className="w-full px-[36px] py-[20px]">
            <ChessButton onClick={hanleToPlay}>{t("setProfile.toPlay")}</ChessButton>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default SetProfileScreen;
