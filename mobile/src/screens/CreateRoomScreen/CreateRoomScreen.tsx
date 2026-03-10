import { IonPage, IonContent, IonPicker, IonPickerColumn, IonPickerColumnOption, IonText } from '@ionic/react';
import { ChessButton } from '../../components/ChessButton/ChessButton';
import { QuickPlayButton } from '../../components/QuickPlayButton/QuickPlayButton';
import { useState } from 'react';
import { useCreateRoom } from '../../hooks/useCreateRoom';
import { useQuickPlayEntry } from '../../hooks/useQuickPlayEntry';

const MINUTES_FOR_PLAYER = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 120];
const SECONDS_FOR_MOVE = [0, 1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 60, 100];

const CreateRoomScreen: React.FC = () => {
    const [timeMinutes, setTimeMinutes] = useState(10);
    const [incrementSeconds, setIncrementSeconds] = useState(1);

    const { createRoom } = useCreateRoom();
    const { openQuickPlay, quickPlayLabel, playersInRandomQueue } = useQuickPlayEntry();

    const handleCreateRoom = () => {
        console.log(timeMinutes, incrementSeconds);
        createRoom({
            timeMinutes,
            incrementSeconds,
        });
    }

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
            </IonContent>
        </IonPage>
    );
};

export default CreateRoomScreen;