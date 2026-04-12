import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  showValue?: boolean;
  valueClassName?: string;
  gradientId?: string;
  gradientColors?: { start: string; end: string };
}

export function CircularProgress({
  value,
  size = 60,
  strokeWidth = 6,
  className,
  trackClassName,
  progressClassName,
  showValue = true,
  valueClassName,
  gradientId,
  gradientColors,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  const uniqueId = gradientId || `gradient-${React.useId()}`;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {gradientColors && (
          <defs>
            <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
          </defs>
        )}
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted/30", trackClassName)}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", progressClassName)}
          style={gradientColors ? { stroke: `url(#${uniqueId})` } : undefined}
        />
      </svg>
      {showValue && (
        <span
          className={cn(
            "absolute text-sm font-bold",
            valueClassName
          )}
        >
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
