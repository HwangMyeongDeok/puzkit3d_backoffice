// src/services/supportTicket.service.ts

import { axiosInstance } from '@/lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

export type TicketType   = 'ReplacePart' | 'Exchange' | 'Return';
export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Rejected';

export interface TicketDetailItem {
  id: string;
  orderDetailId: string;
  partId?: string | null;
  quantity: number;
  note?: string | null;
  productName?: string;
  variantName?: string;
  thumbnailUrl?: string;
}

export interface SupportTicketDto {
  id: string;
  orderId: string;
  orderCode?: string;
  type: TicketType;
  status: TicketStatus;
  reason: string;
  proof: string;
  createdAt: string;
  updatedAt?: string;
  details: TicketDetailItem[];
}

export interface SupportTicketListItemDto {
  id: string;
  orderId: string;
  orderCode?: string;
  type: TicketType;
  status: TicketStatus;
  reason: string;
  createdAt: string;
}

export interface TicketPagedResult {
  items: SupportTicketListItemDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetTicketsParams {
  pageNumber: number;
  pageSize: number;
  status?: TicketStatus | string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Query Keys
───────────────────────────────────────────────────────────────────────────── */

export const TICKET_KEYS = {
  all:    ['support-tickets'] as const,
  lists:  () => [...TICKET_KEYS.all, 'list'] as const,
  list:   (params: GetTicketsParams) => [...TICKET_KEYS.lists(), params] as const,
  detail: (id: string) => [...TICKET_KEYS.all, 'detail', id] as const,
};

/* ─────────────────────────────────────────────────────────────────────────────
   API Functions
───────────────────────────────────────────────────────────────────────────── */

const getTickets = async (params: GetTicketsParams): Promise<TicketPagedResult> => {
  const { data } = await axiosInstance.get('/support-tickets', {
    params: {
      pageNumber: params.pageNumber,
      pageSize:   params.pageSize,
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return data;
};

const getTicketById = async (id: string): Promise<SupportTicketDto> => {
  const { data } = await axiosInstance.get(`/support-tickets/${id}`);
  return data;
};

const updateTicketStatus = async ({
  id,
  status,
}: {
  id: string;
  status: TicketStatus;
}): Promise<void> => {
  await axiosInstance.patch(`/support-tickets/${id}/status`, { status });
};

const deleteTicket = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/support-tickets/${id}`);
};

/* ─────────────────────────────────────────────────────────────────────────────
   Hooks
───────────────────────────────────────────────────────────────────────────── */

/** Paginated list with optional status filter */
export function useGetTickets(params: GetTicketsParams) {
  return useQuery({
    queryKey:  TICKET_KEYS.list(params),
    queryFn:   () => getTickets(params),
    placeholderData: (prev) => prev, // keep previous page while loading next
  });
}

/** Single ticket detail — lazy: call with `enabled: false` until needed */
export function useGetTicketById(id: string | null, enabled = true) {
  return useQuery({
    queryKey: TICKET_KEYS.detail(id ?? ''),
    queryFn:  () => getTicketById(id!),
    enabled:  !!id && enabled,
  });
}

/** Update status — staff can set any valid status */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTicketStatus,
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.detail(id) });
      toast.success('Ticket status updated successfully.');
    },
    onError: () => {
      toast.error('Failed to update ticket status. Please try again.');
    },
  });
}

/** Delete — API only allows deletion when status is "Open" */
export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: TICKET_KEYS.lists() });
      queryClient.removeQueries({ queryKey: TICKET_KEYS.detail(id) });
      toast.success('Support ticket deleted.');
    },
    onError: () => {
      toast.error('Failed to delete ticket. Please try again.');
    },
  });
}