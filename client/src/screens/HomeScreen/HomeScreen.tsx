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

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-6 py-8">
        <button
          type="button"
          onClick={openQuickPlay}
          className="group relative min-h-[190px] overflow-hidden rounded-xl border border-[#6D5DF6]/70 bg-[#140F35] p-8 text-left transition hover:border-[#8B7CFF] hover:bg-[#181043] active:scale-[0.995]"
        >
          <div className="absolute inset-0 opacity-35 [background:linear-gradient(90deg,rgba(79,57,246,0.4),rgba(8,10,18,0.2)),linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.06)_62%,rgba(255,255,255,0.06)_100%)]" />
          <div className="relative flex h-full flex-col items-start justify-between gap-6 min-[900px]:flex-row min-[900px]:items-center">
            <div className="flex flex-col gap-5 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-7">
              <HomeIconBadge tone="purple">
                <LightningIcon />
              </HomeIconBadge>
              <div>
                <h1 className="text-3xl font-bold leading-tight text-white min-[900px]:text-4xl">{t("room.quickPlay")}</h1>
                <p className="mt-3 text-lg text-white/75">{t("room.randomOpponent")}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <HomeBadge>{quickPlayLabel}</HomeBadge>
                </div>
              </div>
            </div>
            <ArrowIcon className="h-10 w-10 text-white/85 transition group-hover:translate-x-1" />
          </div>
        </button>

        <div className="grid gap-5 min-[900px]:grid-cols-3">
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
            badges={["30+0", t("room.aiHints")]}
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
            badges={[t("room.timeSummary", { timeMinutes, incrementSeconds }), t("room.aiHints")]}
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
    </main>
  );
};

type Tone = "purple" | "green" | "blue" | "yellow";

function HomeModeCard({
  title,
  icon,
  features,
  badges,
  tone,
  onClick,
  to,
  disabled,
}: {
  title: string;
  icon: ReactNode;
  features: string[];
  badges: string[];
  tone: Tone;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
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
        <ArrowIcon className="h-7 w-7 text-white/85 transition group-hover:translate-x-1" />
      </div>
    </>
  );

  const className = `group flex min-h-[300px] flex-col rounded-xl border p-7 text-left transition active:scale-[0.995] min-[900px]:min-h-[340px] ${toneCardClass(tone)} ${
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
  };

  return classes[tone];
}

function toneBadgeClass(tone: Tone) {
  const classes: Record<Tone, string> = {
    purple: "border-[#8B7CFF]/50 bg-[#4F39F6]/25 text-[#C9C2FF]",
    green: "border-emerald-400/35 bg-emerald-500/15 text-emerald-300",
    blue: "border-sky-400/35 bg-sky-500/15 text-sky-300",
    yellow: "border-yellow-400/35 bg-yellow-500/15 text-yellow-300",
  };

  return classes[tone];
}

function tonePillClass(tone: Tone) {
  const classes: Record<Tone, string> = {
    purple: "bg-white/8 text-white/85",
    green: "bg-emerald-500/12 text-emerald-100",
    blue: "bg-sky-500/12 text-sky-100",
    yellow: "bg-yellow-500/12 text-yellow-100",
  };

  return classes[tone];
}

function toneTextClass(tone: Tone) {
  const classes: Record<Tone, string> = {
    purple: "text-[#9B8DFF]",
    green: "text-emerald-300",
    blue: "text-sky-300",
    yellow: "text-yellow-300",
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
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
