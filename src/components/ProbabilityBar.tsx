import { thresholdOf } from '../lib/format';

type Props = {
  probability: number;
};

const fillByTier = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

export default function ProbabilityBar({ probability }: Props) {
  const tier = thresholdOf(probability);
  const widthPercent = Math.max(0, Math.min(100, probability * 100));
  return (
    <div
      className="relative h-[3px] w-full overflow-hidden rounded-full bg-line/50"
      role="progressbar"
      aria-valuenow={Math.round(widthPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${fillByTier[tier]}`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}
