'use client';

import { Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Log {
  id: string;
  to_email: string;
  subject: string;
  template_key: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export function EmailLogTable({
  logs,
  locale,
}: {
  logs: Log[];
  locale: string;
}) {
  if (logs.length === 0) {
    return (
      <div className="p-12 text-center">
        <Mail className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No emails sent yet. Configure a provider above and start sending.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>To</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Template</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Sent</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm">{log.to_email}</TableCell>
            <TableCell className="max-w-xs truncate text-sm">
              {log.subject}
            </TableCell>
            <TableCell>
              {log.template_key ? (
                <Badge variant="outline" className="text-xs">
                  {log.template_key}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  log.status === 'sent' || log.status === 'delivered'
                    ? 'success'
                    : log.status === 'failed' || log.status === 'bounced'
                      ? 'destructive'
                      : log.status === 'complained'
                        ? 'warning'
                        : 'outline'
                }
              >
                {log.status}
              </Badge>
              {log.error_message && (
                <span className="mt-0.5 block text-[10px] text-destructive line-clamp-1">
                  {log.error_message}
                </span>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {log.sent_at
                ? new Intl.DateTimeFormat(locale, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(log.sent_at))
                : new Intl.DateTimeFormat(locale, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(log.created_at))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
