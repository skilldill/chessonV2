import { type FC } from "react";
import { SettingProfileBlock } from "../../components/SettingProfileBlock/SettingProfileBlock";
import { DraggableWrap } from "../../components/DraggableWrap/DraggableWrap";

type SetProfileScreenProps = {
    onSetUserName: (userName: string, avatarIndex: number) => void;
}

export const SetProfileScreen: FC<SetProfileScreenProps> = ({ onSetUserName }) => {
    const handleToPlay = ({ nickname, avatarIndex }: { nickname: string, avatarIndex: number }) => {
        onSetUserName(nickname, avatarIndex);
    };

    const handleClose = () => {
        window.location.href = 'https://chesson.me/';
    };

    return (
        <div className="w-full h-[100vh] flex justify-center items-center">
            <DraggableWrap>
                <SettingProfileBlock onToPlay={handleToPlay} onClose={handleClose} />
            </DraggableWrap>
        </div>
    );
};
