import { type FC } from "react";
import { SettingProfileBlock } from "../../components/SettingProfileBlock/SettingProfileBlock";

type SetProfileScreenProps = {
    onSetUserName: (userName: string, avatarIndex: number) => void;
}

export const SetProfileScreen: FC<SetProfileScreenProps> = ({ onSetUserName }) => {
    const handleToPlay = ({ nickname, avatarIndex }: { nickname: string, avatarIndex: number }) => {
        onSetUserName(nickname, avatarIndex);
    };

    return (
        <SettingProfileBlock onToPlay={handleToPlay} />
    );
};
