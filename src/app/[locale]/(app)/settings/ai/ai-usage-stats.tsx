'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Brain } from 'lucide-react';

interface UsageRow {
  use_case: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_estimate_usd: number | null;
  latency_ms: number | null;
  created_at: string;
}

export function AiUsageStats({
  usage,
  locale,
}: {
  usage: UsageRow[];
  locale: string;
}) {
  if (usage.length === 0) {
    return (
      <div className="p-12 text-center">
        <Brain className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No AI usage this month. Generate questions or narratives to see usage here.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Use case</TableHead>
          <TableHead>Model</TableHead>
          <TableHead className="text-end">Tokens</TableHead>
          <TableHead className="text-end">Cost</TableHead>
          <TableHead className="text-end">Latency</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usage.map((u, i) => (
          <TableRow key={i}>
            <TableCell>
              <Badge variant="outline" className="text-xs capitalize">
                {u.use_case.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">
              {u.model}
            </TableCell>
            <TableCell className="text-end font-mono text-xs">
              {(u.prompt_tokens + u.completion_tokens).toLocaleString()}
            </TableCell>
            <TableCell className="text-end font-mono text-xs">
              {u.cost_estimate_usd !== null
                ? `$${u.cost_estimate_usd.toFixed(4)}`
                : '—'}
            </TableCell>
            <TableCell className="text-end text-xs text-muted-foreground">
              {u.latency_ms ? `${u.latency_ms}ms` : '—'}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat(locale, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(u.created_at))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
