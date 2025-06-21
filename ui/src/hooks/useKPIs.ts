import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api';

export interface KPI {
  id: string;
  label: string;
  value: string;
}

export function useKPIs() {
  return useQuery<KPI[]>({
    queryKey: ['kpis'],
    queryFn: () => request<KPI[]>('/kpis'),
    refetchInterval: 30_000, // Refresh every 30 seconds
    retry: 3,
    staleTime: 5_000, // Consider data stale after 5 seconds
  });
}

export function useDetailedKPIs() {
  return useQuery({
    queryKey: ['kpis', 'detailed'],
    queryFn: () => request('/kpis/detailed'),
    refetchInterval: 60_000, // Refresh every minute
    retry: 2,
  });
}