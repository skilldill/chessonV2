import { useTranslation } from "react-i18next";
import type { AnalysisEvaluationPoint, MoveQuality } from "../../types/analysis";

type AnalysisEvaluationChartProps = {
  points: AnalysisEvaluationPoint[];
  selectedPly?: number | null;
  onPointClick?: (point: AnalysisEvaluationPoint) => void;
};

const WIDTH = 720;
const HEIGHT = 240;
const PADDING_X = 28;
const PADDING_Y = 22;
const MAX_SCORE = 10;

const QUALITY_COLORS: Record<MoveQuality, string> = {
  excellent: "#22c55e",
  good: "#38bdf8",
  normal: "#94a3b8",
  bad: "#f59e0b",
  blunder: "#ef4444",
};

export function AnalysisEvaluationChart({
  points,
  selectedPly,
  onPointClick,
}: AnalysisEvaluationChartProps) {
  const { t } = useTranslation();
  const safePoints = points.length > 0 ? points : [{ ply: 0, moveNumber: 0, score: 0 }];
  const maxPly = Math.max(...safePoints.map((point) => point.ply), 1);

  const toX = (ply: number) => PADDING_X + (ply / maxPly) * (WIDTH - PADDING_X * 2);
  const toY = (score: number) => {
    const normalized = Math.max(-MAX_SCORE, Math.min(MAX_SCORE, score));
    const ratio = (MAX_SCORE - normalized) / (MAX_SCORE * 2);
    return PADDING_Y + ratio * (HEIGHT - PADDING_Y * 2);
  };

  const linePath = safePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${toX(point.ply)} ${toY(point.score)}`)
    .join(" ");

  const zeroY = toY(0);

  return (
    <div className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">{t("analysis.chart.title")}</h2>
          <p className="text-xs text-white/50">{t("analysis.chart.subtitle")}</p>
        </div>
        <div className="text-xs text-white/50">{t("analysis.chart.units")}</div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-[220px] w-full overflow-visible"
        role="img"
        aria-label={t("analysis.chart.aria")}
      >
        <rect x="0" y="0" width={WIDTH} height={zeroY} fill="rgba(255,255,255,0.035)" />
        <rect x="0" y={zeroY} width={WIDTH} height={HEIGHT - zeroY} fill="rgba(0,0,0,0.16)" />

        {[-5, 0, 5].map((score) => (
          <g key={score}>
            <line
              x1={PADDING_X}
              y1={toY(score)}
              x2={WIDTH - PADDING_X}
              y2={toY(score)}
              stroke={score === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}
              strokeWidth={score === 0 ? 1.5 : 1}
            />
            <text x={4} y={toY(score) + 4} fill="rgba(255,255,255,0.48)" fontSize="11">
              {score > 0 ? `+${score}` : score}
            </text>
          </g>
        ))}

        <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {safePoints.map((point) => {
          const isSelected = selectedPly === point.ply;
          const isImportant = point.quality === "bad" || point.quality === "blunder";
          const radius = isSelected ? 7 : isImportant ? 5 : 3.5;

          return (
            <g
              key={point.ply}
              className="cursor-pointer focus:outline-none"
              role="button"
              tabIndex={0}
              onClick={() => onPointClick?.(point)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onPointClick?.(point);
                }
              }}
              aria-label={t("analysis.chart.pointAria", { ply: point.ply, score: point.score })}
            >
              <circle
                cx={toX(point.ply)}
                cy={toY(point.score)}
                r={radius + 8}
                fill="transparent"
              />
              <circle
                cx={toX(point.ply)}
                cy={toY(point.score)}
                r={radius}
                fill={QUALITY_COLORS[point.quality || "normal"]}
                stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.55)"}
                strokeWidth={isSelected ? 2.5 : 1}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
