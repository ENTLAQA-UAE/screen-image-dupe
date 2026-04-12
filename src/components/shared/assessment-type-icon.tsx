import { Brain, FileText, Heart, Languages, MessageSquare } from 'lucide-react';

import type { AssessmentType } from '@/lib/domain/types';
import { cn } from '@/lib/utils';

const iconMap = {
  cognitive: Brain,
  personality: Heart,
  situational: MessageSquare,
  behavioral: MessageSquare,
  language: Languages,
  custom: FileText,
} as const;

const colorMap = {
  cognitive:
    'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  personality:
    'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  situational:
    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  behavioral:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  language:
    'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  custom:
    'bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400',
} as const;

interface AssessmentTypeIconProps {
  type: AssessmentType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AssessmentTypeIcon({
  type,
  size = 'md',
  className,
}: AssessmentTypeIconProps) {
  const Icon = iconMap[type] ?? FileText;
  const sizeClass =
    size === 'sm'
      ? 'h-7 w-7'
      : size === 'lg'
        ? 'h-12 w-12'
        : 'h-9 w-9';
  const iconSize =
    size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg',
        colorMap[type] ?? colorMap.custom,
        sizeClass,
        className,
      )}
    >
      <Icon className={iconSize} />
    </div>
  );
}

export function AssessmentTypeBadge({
  type,
  label,
}: {
  type: AssessmentType;
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colorMap[type] ?? colorMap.custom,
      )}
    >
      {label}
    </span>
  );
}
