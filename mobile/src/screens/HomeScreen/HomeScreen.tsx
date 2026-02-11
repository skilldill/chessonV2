import { IonPage, IonContent } from '@ionic/react';
import { ProfileCard } from '../../components/ProfileCard/ProfileCard';
import { CreateRoomSection } from '../../components/CreateRoomSection/CreateRoomSection';

const HomeScreen: React.FC = () => {
  return (
    <IonPage>
      <IonContent
        className="ion-padding"
        style={{ '--background': 'linear-gradient(150deg, #282828 0%, #000 50%, #2b1565 100%)' } as React.CSSProperties}
      >
        <div className="w-full min-h-full flex justify-center items-center overflow-y-auto py-4">
          <div className="max-w-[432px] w-full flex flex-col items-center gap-6 px-4">
            <ProfileCard />
            <CreateRoomSection />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomeScreen;
