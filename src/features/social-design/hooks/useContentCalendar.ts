"use client";

import { useCallback, useMemo } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import type {
  ContentCalendarApiResponse,
  ContentPlanItemDTO,
} from "@/features/social-design/types";
import {
  getCurrentMonthJakarta,
  shiftMonthString,
} from "@/features/social-design/utils";

export type CalendarViewMode = "calendar" | "table";

export interface UseContentCalendarOptions {
  initialItems: ContentPlanItemDTO[];
  initialMonth: string;
}

const VIEW_MODES = ["calendar", "table"] as const;

export function useContentCalendar({
  initialItems,
  initialMonth,
}: UseContentCalendarOptions) {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useQueryStates(
    {
      month: parseAsString.withDefault(initialMonth),
      platform: parseAsString.withDefault("ALL"),
      status: parseAsString.withDefault("ALL"),
      pillar: parseAsString.withDefault("ALL"),
      creatorId: parseAsString.withDefault("ALL"),
      view: parseAsStringLiteral(VIEW_MODES).withDefault("calendar"),
    },
    {
      history: "replace",
      shallow: true,
    }
  );

  const isInitialQuery =
    filters.month === initialMonth &&
    filters.platform === "ALL" &&
    filters.status === "ALL" &&
    filters.pillar === "ALL" &&
    filters.creatorId === "ALL";

  const queryKey = useMemo(
    () => [
      "social-design",
      "content-calendar",
      filters.month,
      filters.platform,
      filters.status,
      filters.pillar,
      filters.creatorId,
    ],
    [
      filters.month,
      filters.platform,
      filters.status,
      filters.pillar,
      filters.creatorId,
    ]
  );

  const query = useQuery<ContentCalendarApiResponse>({
    queryKey,
    queryFn: async () => {
      const search = new URLSearchParams();
      if (filters.month) search.set("month", filters.month);
      if (filters.platform !== "ALL") search.set("platform", filters.platform);
      if (filters.status !== "ALL") search.set("status", filters.status);
      if (filters.pillar !== "ALL") search.set("pillar", filters.pillar);
      if (filters.creatorId !== "ALL") search.set("creatorId", filters.creatorId);

      const res = await fetch(`/api/content/calendar?${search.toString()}`, {
        cache: "no-cache",
      });
      if (!res.ok) {
        const errPayload = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(
          errPayload.error?.message ?? "Gagal memuat data Content Calendar."
        );
      }
      return (await res.json()) as ContentCalendarApiResponse;
    },
    initialData: isInitialQuery
      ? {
          items: initialItems,
          month: initialMonth,
          meta: { total: initialItems.length },
        }
      : undefined,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });

  const goToPrevMonth = useCallback(() => {
    const base = filters.month === "ALL" ? getCurrentMonthJakarta() : filters.month;
    void setFilters({ month: shiftMonthString(base, -1) });
  }, [filters.month, setFilters]);

  const goToNextMonth = useCallback(() => {
    const base = filters.month === "ALL" ? getCurrentMonthJakarta() : filters.month;
    void setFilters({ month: shiftMonthString(base, 1) });
  }, [filters.month, setFilters]);

  const goToCurrentMonth = useCallback(() => {
    void setFilters({ month: getCurrentMonthJakarta() });
  }, [setFilters]);

  const resetFilters = useCallback(() => {
    void setFilters({
      month: initialMonth,
      platform: "ALL",
      status: "ALL",
      pillar: "ALL",
      creatorId: "ALL",
    });
  }, [initialMonth, setFilters]);

  const invalidateCalendar = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["social-design", "content-calendar"],
    });
  }, [queryClient]);

  return {
    filters,
    setFilters,
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
    resetFilters,
    invalidateCalendar,
  };
}
