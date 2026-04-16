import { IonPage, IonContent } from '@ionic/react';
import { ProfileCard } from '../../components/ProfileCard/ProfileCard';
import { CreateRoomSection } from '../../components/CreateRoomSection/CreateRoomSection';
import { QuickPlayButton } from '../../components/QuickPlayButton/QuickPlayButton';
import { useQuickPlayEntry } from '../../hooks/useQuickPlayEntry';

const HomeScreen: React.FC = () => {
  const { playersInRandomQueue, quickPlayLabel, openQuickPlay } = useQuickPlayEntry();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="w-full min-h-full flex justify-center items-center overflow-y-auto py-4">
          <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
            <ProfileCard />
            <QuickPlayButton
              onClick={openQuickPlay}
              timeLabel={quickPlayLabel}
              playersInQueue={playersInRandomQueue}
            />
            <CreateRoomSection />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomeScreen;
