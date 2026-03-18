import { IonPage, IonContent, IonPicker, IonPickerColumn, IonPickerColumnOption, IonText } from '@ionic/react';
import { ChessButton } from '../../components/ChessButton/ChessButton';
import { QuickPlayButton } from '../../components/QuickPlayButton/QuickPlayButton';
import { useState } from 'react';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { useQuickPlayEntry } from '../../hooks/useQuickPlayEntry';
import { BotDifficultyModal, type BotDifficulty } from '../../components/BotDifficultyModal/BotDifficultyModal';
import RobotEmojiWebp from '../../assets/robot-emoji.webp';

const MINUTES_FOR_PLAYER = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120];
const SECONDS_FOR_MOVE = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100];

const CreateRoomScreen: React.FC = () => {
    const [timeMinutes, setTimeMinutes] = useState(10);
    const [incrementSeconds, setIncrementSeconds] = useState(1);
    const [isBotModalOpen, setIsBotModalOpen] = useState(false);
    const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');

    const { createRoom, isCreating } = useCreateRoom();
    const { openQuickPlay, quickPlayLabel, playersInRandomQueue } = useQuickPlayEntry();

    const handleCreateRoom = () => {
        createRoom({
            timeMinutes,
            incrementSeconds,
        });
    }

    const handleCreateBotRoom = () => {
        createRoom({
            timeMinutes: 30,
            incrementSeconds: 0,
            vsBot: true,
            botDifficulty,
            botMoveTimeMs: 800
        });
    };

    return (
        <IonPage>
            <IonContent>
                <div className="grid grid-rows-[1fr_88px] h-full">
                    <div className="flex flex-col justify-center items-center">
                        <div className='w-full px-[10px]'>
                            <QuickPlayButton
                                onClick={openQuickPlay}
                                timeLabel={quickPlayLabel}
                                playersInQueue={playersInRandomQueue}
                            />
                            <p className="text-xs text-white/60 px-2 py-2">
                                {playersInRandomQueue} {playersInRandomQueue === 1 ? "player" : "players"} in quick play
                            </p>

                            <button
                                type="button"
                                onClick={() => setIsBotModalOpen(true)}
                                disabled={isCreating}
                                className="btn-client btn-client-preset w-full rounded-xl px-4 py-5 min-h-[64px] text-white/90 font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-[#2D7A4F]/60 bg-[#2D7A4F]/20"
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <img src={RobotEmojiWebp} alt="Bot" className="w-[30px] h-[30px] select-none" />
                                        <span className="text-lg font-bold">Play vs Bot</span>
                                    </div>
                                    <span className="text-sm opacity-90">30 min, choose difficulty</span>
                                </div>
                            </button>
                        </div>
                        <IonText>
                            <h2>Time settings</h2>
                        </IonText>
                        <div className="grid grid-cols-2 gap-6">
                            <IonPicker>
                                <IonPickerColumn 
                                    value={timeMinutes} 
                                    onIonChange={({ detail }) => setTimeMinutes((detail.value as number))}
                                >
                                    {MINUTES_FOR_PLAYER.map((value) =>
                                        <IonPickerColumnOption value={value} key={value}>{value} min</IonPickerColumnOption>
                                    )}
                                </IonPickerColumn>
                            </IonPicker>

                            <IonPicker>
                                <IonPickerColumn
                                    value={incrementSeconds}
                                    onIonChange={({ detail }) => setIncrementSeconds((detail.value as number))}
                                >
                                    {SECONDS_FOR_MOVE.map((value) =>
                                        <IonPickerColumnOption value={value} key={value}>+ {value} sec</IonPickerColumnOption>
                                    )}
                                </IonPickerColumn>
                            </IonPicker>
                        </div>
                    </div>

                    <div className="w-full px-[10px] py-[20px]">
                        <ChessButton onClick={handleCreateRoom}>Create room</ChessButton>
                    </div>
                </div>

                <BotDifficultyModal
                    isOpen={isBotModalOpen}
                    isCreating={isCreating}
                    difficulty={botDifficulty}
                    onChangeDifficulty={setBotDifficulty}
                    onClose={() => setIsBotModalOpen(false)}
                    onConfirm={handleCreateBotRoom}
                />
            </IonContent>
        </IonPage>
    );
};

export default CreateRoomScreen;
