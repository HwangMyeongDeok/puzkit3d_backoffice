import { type TicketStatus } from '@/services/supportTicketApi';

export const PAGE_SIZE = 10;
export const ALL_STATUS = '__ALL__';

export const TICKET_TYPE_LABEL: Record<string, string> = {
  ReplacePart: 'Replace Part',
  Exchange:    'Exchange',
};

export const VALID_STATUSES: TicketStatus[] = ['Open', 'Processing', 'Resolved', 'Rejected'];

export const STATUS_FILTER_OPTIONS = [
  { value: ALL_STATUS,   label: 'All Statuses' },
  { value: 'Open',       label: 'Open' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Resolved',   label: 'Resolved' },
  { value: 'Rejected',   label: 'Rejected' },
];

export const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleString('vi-VN');
};