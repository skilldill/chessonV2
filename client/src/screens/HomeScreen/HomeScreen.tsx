import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppVersionCaption } from "../../components/AppVersionCaption/AppVersionCaption";
import {
  BotDifficultyModal,
  type BotDifficulty,
  type BotPlayerColor,
  type BotStartPositionMode,
} from "../../components/BotDifficultyModal/BotDifficultyModal";
import { RoomTimeModal } from "../../components/RoomTimeModal/RoomTimeModal";
import { useCreateRoom } from "../../hooks/useCreateRoom";
import { useQuickPlayEntry } from "../../hooks/useQuickPlayEntry";
import { getRoomTimeSettingsFromStorage, setRoomTimeSettingsToStorage } from "../../utils/roomTimeStorage";
import { TWO_QUEENS_FEN, TWO_QUEENS_GAME_MODE } from "../../constants/chess";

const initialRoomTime = getRoomTimeSettingsFromStorage();
const BOT_CUSTOM_FEN_STORAGE_KEY = "botCustomFEN";
const FRIEND_CUSTOM_FEN_STORAGE_KEY = "friendCustomFEN";

function getStorageValue(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(key) || "";
}

export const HomeScreen = () => <HomeDashboard />;

export const HomeDashboard = () => {
  const { t } = useTranslation();
  const { createRoom, isCreating } = useCreateRoom();
  const { quickPlayLabel, openQuickPlay } = useQuickPlayEntry();
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isLabsModalOpen, setIsLabsModalOpen] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
  const [botPlayerColor, setBotPlayerColor] = useState<BotPlayerColor>("white");
  const [botStartPositionMode, setBotStartPositionMode] = useState<BotStartPositionMode>("default");
  const [botCustomFEN, setBotCustomFEN] = useState(() => getStorageValue(BOT_CUSTOM_FEN_STORAGE_KEY));
  const [timeMinutes, setTimeMinutes] = useState(initialRoomTime.timeMinutes);
  const [incrementSeconds, setIncrementSeconds] = useState(initialRoomTime.incrementSeconds);
  const [friendStartPositionMode, setFriendStartPositionMode] = useState<"default" | "custom">("default");
  const [friendCustomFEN, setFriendCustomFEN] = useState(() => getStorageValue(FRIEND_CUSTOM_FEN_STORAGE_KEY));
  const [withAIhints, setWithAIhints] = useState(false);

  useEffect(() => {
    setRoomTimeSettingsToStorage(timeMinutes, incrementSeconds);
  }, [timeMinutes, incrementSeconds]);

  useEffect(() => {
    if (botCustomFEN.trim().length > 0) {
      localStorage.setItem(BOT_CUSTOM_FEN_STORAGE_KEY, botCustomFEN);
      return;
    }

    localStorage.removeItem(BOT_CUSTOM_FEN_STORAGE_KEY);
  }, [botCustomFEN]);

  useEffect(() => {
    if (friendCustomFEN.trim().length > 0) {
      localStorage.setItem(FRIEND_CUSTOM_FEN_STORAGE_KEY, friendCustomFEN);
      return;
    }

    localStorage.removeItem(FRIEND_CUSTOM_FEN_STORAGE_KEY);
  }, [friendCustomFEN]);

  const handleCreateBotRoom = () => {
    const trimmedFen = botCustomFEN.trim();
    createRoom({
      timeMinutes: 30,
      incrementSeconds: 0,
      vsBot: true,
      botDifficulty,
      botMoveTimeMs: 800,
      color: botPlayerColor,
      currentFEN: botStartPositionMode === "custom" && trimmedFen.length > 0 ? trimmedFen : undefined,
    });
  };

  const handleCreateFriendRoom = () => {
    const trimmedFen = friendCustomFEN.trim();
    createRoom({
      timeMinutes,
      incrementSeconds,
      withAIhints,
      currentFEN: friendStartPositionMode === "custom" && trimmedFen.length > 0 ? trimmedFen : undefined,
    });
  };

  const handleCreateTwoQueensRoom = () => {
    createRoom({
      timeMinutes,
      incrementSeconds,
      withAIhints: false,
      currentFEN: TWO_QUEENS_FEN,
      gameMode: TWO_QUEENS_GAME_MODE,
    });
  };

  return (
    <main className="min-h-[calc(100vh-77px)] bg-[#050507] text-white">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-6 py-8">
        <div className="grid gap-5 min-[900px]:grid-cols-2">
          <HomePrimaryCard
            title={t("room.quickPlay")}
            subtitle={t("room.randomOpponent")}
            icon={<LightningIcon />}
            badges={[quickPlayLabel]}
            onClick={openQuickPlay}
          />
          <HomePrimaryCard
            title={t('puzzles.puzzles')}
            subtitle={t('puzzles.findTheBestMove')}
            icon={<PuzzleIcon />}
            badges={[t("puzzles.hints"), t("puzzles.moveHistory")]}
            tone="rose"
            to="/puzzles"
          />
        </div>

        <div className="grid gap-5 min-[900px]:grid-cols-2 min-[1180px]:grid-cols-4">
          <HomeModeCard
            title={t("labs.title")}
            tone="purple"
            icon={<LabsIcon />}
            features={[
              t("labs.feature.experimental"),
              t("labs.feature.tryNoKingsNow"),
            ]}
            badges={[t("labs.badge")]}
            featuredBadge={t("labs.newBadge")}
            onClick={() => setIsLabsModalOpen(true)}
            disabled={isCreating}
          />
          <HomeModeCard
            title={t("room.playVsBot")}
            tone="green"
            icon={<BotIcon />}
            features={[
              t("home.botFeature.difficulty"),
              t("home.botFeature.color"),
              t("home.botFeature.fen"),
              t("home.feature.aiHints"),
            ]}
            badges={["30 min + 0 sec", t("room.aiHints")]}
            onClick={() => setIsBotModalOpen(true)}
            disabled={isCreating}
          />
          <HomeModeCard
            title={t("room.createRoom")}
            tone="blue"
            icon={<FriendsIcon />}
            features={[
              t("home.roomFeature.link"),
              t("home.roomFeature.time"),
              t("home.feature.aiHints"),
              t("home.botFeature.fen"),
            ]}
            badges={[t("room.aiHints")]}
            onClick={() => setIsTimeModalOpen(true)}
            disabled={isCreating}
          />
          <HomeModeCard
            title={t("tournament.create")}
            tone="yellow"
            icon={<TrophyIcon />}
            features={[
              t("home.tournamentFeature.swiss"),
              t("home.tournamentFeature.pairings"),
              t("home.tournamentFeature.table"),
            ]}
            badges={[t("tournament.defaultTitle")]}
            to="/tournaments/new"
          />
        </div>

        <AppVersionCaption />
      </div>

      <BotDifficultyModal
        isOpen={isBotModalOpen}
        isCreating={isCreating}
        difficulty={botDifficulty}
        playerColor={botPlayerColor}
        startPositionMode={botStartPositionMode}
        customFEN={botCustomFEN}
        onChangeDifficulty={setBotDifficulty}
        onChangePlayerColor={setBotPlayerColor}
        onChangeStartPositionMode={setBotStartPositionMode}
        onChangeCustomFEN={setBotCustomFEN}
        onClose={() => setIsBotModalOpen(false)}
        onConfirm={handleCreateBotRoom}
      />

      <RoomTimeModal
        isOpen={isTimeModalOpen}
        isCreating={isCreating}
        timeMinutes={timeMinutes}
        incrementSeconds={incrementSeconds}
        withAIhints={withAIhints}
        startPositionMode={friendStartPositionMode}
        customFEN={friendCustomFEN}
        onChangeTimeMinutes={setTimeMinutes}
        onChangeIncrementSeconds={setIncrementSeconds}
        onChangeWithAIhints={setWithAIhints}
        onChangeStartPositionMode={setFriendStartPositionMode}
        onChangeCustomFEN={setFriendCustomFEN}
        onClose={() => setIsTimeModalOpen(false)}
        onConfirm={handleCreateFriendRoom}
      />

      <LabsModal
        isOpen={isLabsModalOpen}
        isCreating={isCreating}
        onClose={() => setIsLabsModalOpen(false)}
        onCreateTwoQueens={handleCreateTwoQueensRoom}
      />
    </main>
  );
};

type Tone = "purple" | "green" | "blue" | "yellow" | "rose";

function HomePrimaryCard({
  title,
  subtitle,
  icon,
  badges,
  tone = "purple",
  onClick,
  to,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  badges: string[];
  tone?: "purple" | "rose";
  onClick?: () => void;
  to?: string;
}) {
  const isRose = tone === "rose";
  const content = (
    <>
      <div className={`absolute inset-0 opacity-35 ${
        isRose
          ? "[background:linear-gradient(90deg,rgba(190,24,93,0.45),rgba(79,57,246,0.18)),linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.06)_62%,rgba(255,255,255,0.06)_100%)]"
          : "[background:linear-gradient(90deg,rgba(79,57,246,0.4),rgba(8,10,18,0.2)),linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.06)_62%,rgba(255,255,255,0.06)_100%)]"
      }`} />
      <div className="relative flex h-full flex-col items-start justify-between gap-6 min-[1180px]:flex-row min-[1180px]:items-center">
        <div className="flex flex-col gap-5 min-[1180px]:flex-row min-[1180px]:items-start min-[1180px]:gap-7">
          <HomeIconBadge tone={isRose ? "rose" : "purple"}>{icon}</HomeIconBadge>
          <div>
            <h1 className="text-3xl font-bold leading-tight text-white min-[1180px]:text-4xl">{title}</h1>
            <p className="mt-3 text-lg text-white/75">{subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {badges.map((badge) => (
                <HomeBadge key={badge}>{badge}</HomeBadge>
              ))}
            </div>
          </div>
        </div>
        <ArrowIcon className="h-10 w-10 text-white/85 transition group-hover:translate-x-1" />
      </div>
    </>
  );

  const className = `group relative min-h-[190px] overflow-hidden rounded-xl border p-8 text-left transition active:scale-[0.995] ${
    isRose
      ? "border-[#BE185D]/70 bg-[#2A0D24] hover:border-[#F472B6] hover:bg-[#35102d]"
      : "border-[#6D5DF6]/70 bg-[#140F35] hover:border-[#8B7CFF] hover:bg-[#181043]"
  }`;

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return <button type="button" onClick={onClick} className={className}>{content}</button>;
}

function HomeModeCard({
  title,
  icon,
  features,
  badges,
  featuredBadge,
  tone,
  onClick,
  to,
  disabled,
}: {
  title: string;
  icon: ReactNode;
  features: string[];
  badges: string[];
  featuredBadge?: string;
  tone: Tone;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      {featuredBadge ? (
        <span className="labs-new-badge absolute right-4 top-4 rounded-full border border-fuchsia-300/50 bg-fuchsia-500 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[0_0_24px_rgba(217,70,239,0.65)]">
          {featuredBadge}
        </span>
      ) : null}
      <HomeIconBadge tone={tone}>{icon}</HomeIconBadge>
      <h2 className="mt-7 text-2xl font-bold text-white">{title}</h2>
      <div className="mt-6 flex flex-col gap-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 text-base text-white/75">
            <FeatureDot className={toneTextClass(tone)} />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between gap-4 pt-8">
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <HomeBadge key={badge} tone={tone}>
              {badge}
            </HomeBadge>
          ))}
        </div>
        <ArrowIcon className="h-7 w-7 shrink-0 text-white/85 transition group-hover:translate-x-1" />
      </div>
    </>
  );

  const className = `group relative flex min-h-[300px] flex-col overflow-hidden rounded-xl border p-7 text-left transition active:scale-[0.995] min-[900px]:min-h-[340px] ${featuredBadge ? "labs-featured-card" : ""} ${toneCardClass(tone)} ${
    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
  }`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

function HomeIconBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${toneBadgeClass(tone)}`}>
      {children}
    </div>
  );
}

function HomeBadge({ children, tone = "purple" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`rounded-lg px-4 py-2 text-sm font-semibold ${tonePillClass(tone)}`}>
      {children}
    </span>
  );
}

function toneCardClass(tone: Tone) {
  const classes: Record<Tone, string> = {
    purple: "border-[#6D5DF6]/50 bg-[#130F2B] hover:border-[#8B7CFF]/80",
    green: "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-400/60",
    blue: "border-sky-500/30 bg-sky-950/20 hover:border-sky-400/60",
    yellow: "border-yellow-500/30 bg-yellow-950/20 hover:border-yellow-400/60",
    rose: "border-rose-500/40 bg-rose-950/20 hover:border-rose-400/70",
  };

  return classes[tone];
}

function toneBadgeClass(tone: Tone) {
  const classes: Record<Tone, string> = {
    purple: "border-[#8B7CFF]/50 bg-[#4F39F6]/25 text-[#C9C2FF]",
    green: "border-emerald-400/35 bg-emerald-500/15 text-emerald-300",
    blue: "border-sky-400/35 bg-sky-500/15 text-sky-300",
    yellow: "border-yellow-400/35 bg-yellow-500/15 text-yellow-300",
    rose: "border-rose-400/40 bg-rose-500/18 text-rose-200",
  };

  return classes[tone];
}

function tonePillClass(tone: Tone) {
  const classes: Record<Tone, string> = {
    purple: "bg-white/8 text-white/85",
    green: "bg-emerald-500/12 text-emerald-100",
    blue: "bg-sky-500/12 text-sky-100",
    yellow: "bg-yellow-500/12 text-yellow-100",
    rose: "bg-rose-500/14 text-rose-100",
  };

  return classes[tone];
}

function toneTextClass(tone: Tone) {
  const classes: Record<Tone, string> = {
    purple: "text-[#9B8DFF]",
    green: "text-emerald-300",
    blue: "text-sky-300",
    yellow: "text-yellow-300",
    rose: "text-rose-300",
  };

  return classes[tone];
}

function LightningIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 2 4 14h6.6L9.6 22 20 9h-6.9L13.5 2Z" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10h10a3 3 0 0 1 3 3v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 15h.01M15 15h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 19a5 5 0 0 1 10 0M10.5 19a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v4M9 20h6M10 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg className="h-9 w-9" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z"
      />
    </svg>
  );
}

function LabsIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 3h4M10.5 3v5.3L5.8 17a2.6 2.6 0 0 0 2.3 3.8h7.8a2.6 2.6 0 0 0 2.3-3.8l-4.7-8.7V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 15.2h7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LabsModal({
  isOpen,
  isCreating,
  onClose,
  onCreateTwoQueens,
}: {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreateTwoQueens: () => void;
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[520px] rounded-xl border border-[#8B7CFF]/30 bg-[#0B0B12] p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{t("labs.modalTitle")}</h2>
            <p className="mt-2 text-sm text-white/60">{t("labs.modalSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-white/60 transition hover:bg-white/10 hover:text-white">
            {t("common.close")}
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onCreateTwoQueens}
            disabled={isCreating}
            className="group flex items-center justify-between gap-4 rounded-lg border border-[#8B7CFF]/45 bg-[#4F39F6]/15 p-4 text-left transition hover:border-[#B8AEFF] hover:bg-[#4F39F6]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>
              <span className="block text-lg font-semibold">{t("labs.twoQueens.title")}</span>
              <span className="mt-1 block text-sm text-white/60">{t("labs.twoQueens.subtitle")}</span>
            </span>
            <ArrowIcon className="h-6 w-6 text-white/80 transition group-hover:translate-x-1" />
          </button>

          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
            {t("labs.moreComingSoon")}
          </p>
        </div>
      </div>
    </div>
  );
}

function ArrowIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatureDot({ className }: { className: string }) {
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current ${className}`} aria-hidden="true" />;
}
