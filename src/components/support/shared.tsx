import React from 'react';
import { type TicketStatus } from '@/services/supportTicketApi';

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, string> = {
    Open:       'bg-blue-500/10   text-blue-600   border-blue-500/30',
    Processing: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    Resolved:   'bg-green-500/10  text-green-600  border-green-500/30',
    Rejected:   'bg-red-500/10    text-red-600    border-red-500/30',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${map[status] ?? ''}`}
    >
      {status}
    </span>
  );
}

export function InfoRow({ 
  label, 
  value, 
  valueClassName 
}: { 
  label: string; 
  value: React.ReactNode; 
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right ${valueClassName || ''}`}>{value}</span>
    </div>
  );
}