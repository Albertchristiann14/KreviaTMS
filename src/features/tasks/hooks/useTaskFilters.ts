"use client";

import {
  parseAsBoolean,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";

export function useProjectListFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      status: parseAsString.withDefault("ACTIVE_ALL"),
      q: parseAsString.withDefault(""),
    },
    { shallow: false }
  );

  const resetFilters = () => {
    void setFilters({
      status: "ACTIVE_ALL",
      q: "",
    });
  };

  return { filters, setFilters, resetFilters };
}

export function useTaskBoardFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      projectId: parseAsString.withDefault("ALL"),
      assigneeId: parseAsString.withDefault("ALL"),
      priority: parseAsString.withDefault("ALL"),
      taskType: parseAsString.withDefault("ALL"),
      overdueOnly: parseAsBoolean.withDefault(false),
      q: parseAsString.withDefault(""),
    },
    { shallow: true }
  );

  const hasActiveFilters =
    filters.projectId !== "ALL" ||
    filters.assigneeId !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.taskType !== "ALL" ||
    filters.overdueOnly ||
    filters.q.trim().length > 0;

  const resetFilters = () => {
    void setFilters({
      projectId: "ALL",
      assigneeId: "ALL",
      priority: "ALL",
      taskType: "ALL",
      overdueOnly: false,
      q: "",
    });
  };

  return { filters, setFilters, hasActiveFilters, resetFilters };
}

export function useMyTasksFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      projectId: parseAsString.withDefault("ALL"),
      status: parseAsString.withDefault("ALL"),
      priority: parseAsString.withDefault("ALL"),
      taskType: parseAsString.withDefault("ALL"),
      q: parseAsString.withDefault(""),
      tab: parseAsString.withDefault("active"),
    },
    { shallow: true }
  );

  const hasActiveFilters =
    filters.projectId !== "ALL" ||
    filters.status !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.taskType !== "ALL" ||
    filters.q.trim().length > 0;

  const resetFilters = () => {
    void setFilters({
      projectId: "ALL",
      status: "ALL",
      priority: "ALL",
      taskType: "ALL",
      q: "",
    });
  };

  return { filters, setFilters, hasActiveFilters, resetFilters };
}

export function useWorkCalendarFilters(defaultMonthKey: string) {
  const [filters, setFilters] = useQueryStates(
    {
      view: parseAsString.withDefault("month"),
      date: parseAsString.withDefault(defaultMonthKey),
      projectId: parseAsString.withDefault("ALL"),
      assigneeId: parseAsString.withDefault("ALL"),
      priority: parseAsString.withDefault("ALL"),
      taskType: parseAsString.withDefault("ALL"),
      overlayContent: parseAsBoolean.withDefault(true),
    },
    { shallow: true }
  );

  const resetFilters = () => {
    void setFilters({
      projectId: "ALL",
      assigneeId: "ALL",
      priority: "ALL",
      taskType: "ALL",
    });
  };

  return { filters, setFilters, resetFilters };
}

export function useDebouncedSearchParam(key = "q") {
  return useQueryState(key, parseAsString.withDefault(""));
}
