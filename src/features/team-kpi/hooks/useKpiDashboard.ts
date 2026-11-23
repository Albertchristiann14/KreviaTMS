"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { TeamPerformanceOverviewDTO } from "@/features/team-kpi/types";

export interface KpiDashboardFilters {
  year: number;
  month: number;
  department: string;
  projectId: string;
}

export function buildKpiDashboardQueryKey(filters: KpiDashboardFilters) {
  return [
    "kpi-dashboard",
    filters.year,
    filters.month,
    filters.department || "ALL",
    filters.projectId || "ALL",
  ] as const;
}

export function useKpiDashboard(
  filters: KpiDashboardFilters,
  initialData?: TeamPerformanceOverviewDTO,
  initialFilters?: KpiDashboardFilters
) {
  const isInitialFilterMatch =
    Boolean(initialData) &&
    Boolean(initialFilters) &&
    filters.year === initialFilters?.year &&
    filters.month === initialFilters?.month &&
    (filters.department || "ALL") === (initialFilters?.department || "ALL") &&
    (filters.projectId || "ALL") === (initialFilters?.projectId || "ALL");

  return useQuery<TeamPerformanceOverviewDTO>({
    queryKey: buildKpiDashboardQueryKey(filters),
    initialData: isInitialFilterMatch ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams({
        year: String(filters.year),
        month: String(filters.month),
      });
      if (filters.department && filters.department !== "ALL") {
        params.set("department", filters.department);
      }
      if (filters.projectId && filters.projectId !== "ALL") {
        params.set("projectId", filters.projectId);
      }

      const res = await fetch(`/api/kpi/dashboard?${params.toString()}`, {
        method: "GET",
        cache: "no-cache",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(
          body.error?.message ?? "Gagal memuat data Team KPI Dashboard."
        );
      }

      return (await res.json()) as TeamPerformanceOverviewDTO;
    },
  });
}
