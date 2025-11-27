// TrendIndicator component for showing KPI trends
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendDirection } from '@/types/api.types';

interface TrendIndicatorProps {
  change: number;
  trend: TrendDirection;
  suffix?: string;
  showValue?: boolean;
}

export function TrendIndicator({ change, trend, suffix = '%', showValue = true }: TrendIndicatorProps) {
  const isPositive = trend === 'UP';
  const isNegative = trend === 'DOWN';
  const isStable = trend === 'STABLE';

  const color = isPositive
    ? 'var(--color-success)'
    : isNegative
      ? 'var(--color-error)'
      : 'var(--color-text-muted)';

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span
      className="inline-flex items-center gap-1 text-sm font-medium"
      style={{ color }}
    >
      <Icon size={14} />
      {showValue && (
        isStable
          ? 'No change'
          : `${change > 0 ? '+' : ''}${change.toFixed(1)}${suffix}`
      )}
    </span>
  );
}
