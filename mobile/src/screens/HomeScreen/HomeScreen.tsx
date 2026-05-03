import { ProfileCard } from '../../components/ProfileCard/ProfileCard';
import { CreateRoomSection } from '../../components/CreateRoomSection/CreateRoomSection';
import { QuickPlayButton } from '../../components/QuickPlayButton/QuickPlayButton';
import { useQuickPlayEntry } from '../../hooks/useQuickPlayEntry';
import { AppVersionCaption } from '../../components/AppVersionCaption/AppVersionCaption';
import { AppTopBar } from '../../components/AppTopBar/AppTopBar';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { playersInRandomQueue, quickPlayLabel, openQuickPlay } = useQuickPlayEntry();

  return (
    <div className="relative w-full min-h-full flex justify-center items-center overflow-y-auto" style={{ height: window.innerHeight }}>
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
        <Link
          to="/tournaments/new"
          className="flex min-h-[72px] w-full flex-col justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-white transition-colors duration-200"
        >
          <span className="text-[18px] font-bold">{t("tournament.create")}</span>
          <span className="text-sm text-white/60">{t("tournament.homeSubtitle")}</span>
        </Link>
        <AppVersionCaption />
      </div>
    </div>
  );
};

export default HomeScreen;
