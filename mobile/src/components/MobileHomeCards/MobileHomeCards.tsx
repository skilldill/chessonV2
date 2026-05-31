import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export type MobileHomeTone = "purple" | "green" | "blue" | "yellow" | "rose";

type MobilePrimaryFeatureButtonProps = {
  title: string;
  subtitle: string;
  badges: string[];
  tone: MobileHomeTone;
  icon: ReactNode;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
};

export function MobilePrimaryFeatureButton({ title, subtitle, badges, tone, icon, onClick, to, disabled }: MobilePrimaryFeatureButtonProps) {
  const isRose = tone === "rose";
  const className = `group relative min-h-[128px] w-full overflow-hidden rounded-xl border p-4 text-left text-white transition active:scale-[0.98] ${primaryToneCardClass(tone)} ${
    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
  }`;
  const content = (
    <>
      <div className={`absolute inset-0 opacity-35 ${primaryToneOverlayClass(tone)}`} />
      <div className="relative flex h-full items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <HomeIconBadge tone={isRose ? "rose" : tone}>{icon}</HomeIconBadge>
          <div>
            <p className="m-0 p-0 text-left text-[23px] font-bold leading-tight">{title}</p>
            <p className="m-0 mt-1.5 text-left text-sm text-white/75">{subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <HomeBadge key={badge} tone={tone}>{badge}</HomeBadge>
              ))}
            </div>
          </div>
        </div>
        <ArrowIcon className="mt-auto h-7 w-7 shrink-0 text-white/85 transition group-hover:translate-x-1" />
      </div>
    </>
  );

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return <button type="button" onClick={onClick} disabled={disabled} className={className}>{content}</button>;
}

export function MobileModeCard({
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
  tone: MobileHomeTone;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <HomeIconBadge tone={tone}>{icon}</HomeIconBadge>
          <div>
            <h2 className="m-0 text-[21px] font-bold leading-tight text-white">{title}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-sm text-white/75">
                  <FeatureDot className={toneTextClass(tone)} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ArrowIcon className="mt-auto h-6 w-6 shrink-0 text-white/85 transition group-hover:translate-x-1" />
      </div>
      <div className="relative mt-4 flex flex-wrap gap-2 pl-[56px]">
        {badges.map((badge) => (
          <HomeBadge key={badge} tone={tone}>{badge}</HomeBadge>
        ))}
      </div>
    </>
  );
  const className = `group w-full rounded-xl border p-4 text-left transition active:scale-[0.98] ${toneCardClass(tone)} ${
    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
  }`;

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return <button type="button" onClick={onClick} disabled={disabled} className={className}>{content}</button>;
}

function HomeIconBadge({ tone, children }: { tone: MobileHomeTone; children: ReactNode }) {
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${toneBadgeClass(tone)}`}>
      {children}
    </div>
  );
}

function HomeBadge({ children, tone = "purple" }: { children: ReactNode; tone?: MobileHomeTone }) {
  return (
    <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tonePillClass(tone)}`}>
      {children}
    </span>
  );
}

function toneCardClass(tone: MobileHomeTone) {
  const classes: Record<MobileHomeTone, string> = {
    purple: "border-[#6D5DF6]/50 bg-[#130F2B] hover:border-[#8B7CFF]/80",
    green: "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-400/60",
    blue: "border-sky-500/30 bg-sky-950/20 hover:border-sky-400/60",
    yellow: "border-yellow-500/30 bg-yellow-950/20 hover:border-yellow-400/60",
    rose: "border-rose-500/40 bg-rose-950/20 hover:border-rose-400/70",
  };

  return classes[tone];
}

function primaryToneCardClass(tone: MobileHomeTone) {
  const classes: Record<MobileHomeTone, string> = {
    purple: "border-[#6D5DF6]/70 bg-[#140F35] hover:border-[#8B7CFF]",
    green: toneCardClass("green"),
    blue: toneCardClass("blue"),
    yellow: toneCardClass("yellow"),
    rose: "border-[#BE185D]/70 bg-[#2A0D24] hover:border-[#F472B6]",
  };

  return classes[tone];
}

function primaryToneOverlayClass(tone: MobileHomeTone) {
  const classes: Record<MobileHomeTone, string> = {
    purple: "[background:linear-gradient(90deg,rgba(79,57,246,0.4),rgba(8,10,18,0.2)),linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.06)_62%,rgba(255,255,255,0.06)_100%)]",
    green: "[background:linear-gradient(90deg,rgba(16,185,129,0.26),rgba(8,10,18,0.08)),linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.05)_62%,rgba(255,255,255,0.05)_100%)]",
    blue: "[background:linear-gradient(90deg,rgba(14,165,233,0.25),rgba(8,10,18,0.08)),linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.05)_62%,rgba(255,255,255,0.05)_100%)]",
    yellow: "[background:linear-gradient(90deg,rgba(234,179,8,0.22),rgba(8,10,18,0.08)),linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.05)_62%,rgba(255,255,255,0.05)_100%)]",
    rose: "[background:linear-gradient(90deg,rgba(190,24,93,0.45),rgba(79,57,246,0.18)),linear-gradient(135deg,transparent_0%,transparent_62%,rgba(255,255,255,0.06)_62%,rgba(255,255,255,0.06)_100%)]",
  };

  return classes[tone];
}

function toneBadgeClass(tone: MobileHomeTone) {
  const classes: Record<MobileHomeTone, string> = {
    purple: "border-[#8B7CFF]/50 bg-[#4F39F6]/25 text-[#C9C2FF]",
    green: "border-emerald-400/35 bg-emerald-500/15 text-emerald-300",
    blue: "border-sky-400/35 bg-sky-500/15 text-sky-300",
    yellow: "border-yellow-400/35 bg-yellow-500/15 text-yellow-300",
    rose: "border-rose-400/40 bg-rose-500/18 text-rose-200",
  };

  return classes[tone];
}

function tonePillClass(tone: MobileHomeTone) {
  const classes: Record<MobileHomeTone, string> = {
    purple: "bg-white/8 text-white/85",
    green: "bg-emerald-500/12 text-emerald-100",
    blue: "bg-sky-500/12 text-sky-100",
    yellow: "bg-yellow-500/12 text-yellow-100",
    rose: "bg-rose-500/14 text-rose-100",
  };

  return classes[tone];
}

function toneTextClass(tone: MobileHomeTone) {
  const classes: Record<MobileHomeTone, string> = {
    purple: "text-[#9B8DFF]",
    green: "text-emerald-300",
    blue: "text-sky-300",
    yellow: "text-yellow-300",
    rose: "text-rose-300",
  };

  return classes[tone];
}

export function LightningIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 2 4 14h6.6L9.6 22 20 9h-6.9L13.5 2Z" />
    </svg>
  );
}

export function BotIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10h10a3 3 0 0 1 3 3v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 15h.01M15 15h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FriendsIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 19a5 5 0 0 1 10 0M10.5 19a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v4M9 20h6M10 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PuzzleIcon() {
  return (
    <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z"
      />
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
