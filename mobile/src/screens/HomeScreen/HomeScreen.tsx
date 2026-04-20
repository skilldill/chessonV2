import { IonPage, IonContent } from '@ionic/react';
import { ProfileCard } from '../../components/ProfileCard/ProfileCard';
import { CreateRoomSection } from '../../components/CreateRoomSection/CreateRoomSection';
import { QuickPlayButton } from '../../components/QuickPlayButton/QuickPlayButton';
import { useQuickPlayEntry } from '../../hooks/useQuickPlayEntry';
import { AppVersionCaption } from '../../components/AppVersionCaption/AppVersionCaption';
import { AppTopBar } from '../../components/AppTopBar/AppTopBar';

const HomeScreen: React.FC = () => {
  const { playersInRandomQueue, quickPlayLabel, openQuickPlay } = useQuickPlayEntry();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="relative w-full min-h-full flex justify-center items-center overflow-y-auto">
          <div className="fixed top-0 left-0 right-0 z-1">
            <AppTopBar />
          </div>
          <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
            <ProfileCard />
            <QuickPlayButton
              onClick={openQuickPlay}
              timeLabel={quickPlayLabel}
              playersInQueue={playersInRandomQueue}
            />
            <CreateRoomSection />
            <AppVersionCaption />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomeScreen;
