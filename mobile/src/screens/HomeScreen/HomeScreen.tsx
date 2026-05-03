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

        <Link
          to="/tournaments/new"
          className={`w-full flex justify-between p-[16px] rounded-xl text-white/90 border transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed [border-top-color:rgba(255,255,255,0.1)] [border-left-color:rgba(255,255,255,0.1)] [border-right-color:rgba(255,255,255,0.03)] [border-bottom-color:rgba(255,255,255,0.03)] "border-white/10 bg-white/4 hover:bg-white/8"`}
        >
            <div>
                <p className="text-[18px] font-bold m-[0px] p-[0] text-left mb-[6px]">
                  {t("tournament.create")}
                  <span className="italic font-extrabold bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] bg-clip-text text-transparent">
                    {' '} NEW
                  </span>
                </p>
                <p className="text-left">{t("tournament.homeSubtitle")}</p>
            </div>
        </Link>

        <QuickPlayButton
          onClick={openQuickPlay}
          timeLabel={quickPlayLabel}
          playersInQueue={playersInRandomQueue}
        />

        <CreateRoomSection />
      </div>
    </div>
  );
};

export default HomeScreen;
