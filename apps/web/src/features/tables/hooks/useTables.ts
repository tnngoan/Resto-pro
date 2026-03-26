import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { Table, TableStatus } from '@restopro/shared';
import { mockTables } from '../../../data/mockTables';

// ─── Query Keys ──────────────────────────────────────────────────────────────

const tableKeys = {
  all: ['tables'] as const,
  list: (restaurantId: string) =>
    [...tableKeys.all, 'list', restaurantId] as const,
  detail: (tableId: string) =>
    [...tableKeys.all, 'detail', tableId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all tables for a restaurant.
 * Falls back to mock data if the API is not available.
 */
export function useTables(restaurantId: string) {
  return useQuery({
    queryKey: tableKeys.list(restaurantId),
    queryFn: async (): Promise<Table[]> => {
      try {
        const data = await apiClient.get<Table[]>(
          `/tables?restaurantId=${restaurantId}`,
        );
        return data;
      } catch {
        console.warn('[useTables] API unavailable, using mock data');
        return mockTables;
      }
    },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Create a new table */
export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      capacity: number;
      zone?: string;
      positionX?: number;
      positionY?: number;
    }): Promise<Table> => {
      return apiClient.post<Table>('/tables', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

/** Update table (position, status, capacity, etc.) */
export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Table>;
    }): Promise<Table> => {
      return apiClient.patch<Table>(`/tables/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

/** Update table status */
export function useUpdateTableStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: TableStatus;
    }): Promise<Table> => {
      return apiClient.patch<Table>(`/tables/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

/** Delete a table */
export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return apiClient.delete(`/tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

// ─── Real-time hook ──────────────────────────────────────────────────────────

/**
 * Subscribe to real-time table status updates via WebSocket.
 * Invalidates the tables query on each status_changed event.
 *
 * Currently a no-op placeholder — will be wired when the WebSocket
 * server is available. The invalidation pattern is already in place.
 */
export function useTableSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // TODO: Wire to actual WebSocket when backend is ready
    // const socket = io('/kitchen', { auth: { token } });
    // socket.on('table:status_changed', () => {
    //   queryClient.invalidateQueries({ queryKey: tableKeys.all });
    // });
    // return () => { socket.disconnect(); };

    // Placeholder: no-op cleanup
    return () => {};
  }, [queryClient]);
}
