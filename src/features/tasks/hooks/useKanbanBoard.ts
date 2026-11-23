"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { moveKanbanTaskAction } from "@/features/tasks/actions/task.actions";
import {
  KANBAN_COLUMN_STATUSES,
  type KanbanBoardResponse,
  type KanbanColumnStatus,
  type TaskBoardCardDto,
} from "@/features/tasks/types";

export interface KanbanBoardFilterValues {
  projectId: string;
  assigneeId: string;
  priority: string;
  taskType: string;
  overdueOnly: boolean;
  q: string;
}

export interface MoveBoardCardVariables {
  taskId: string;
  sourceStatus: KanbanColumnStatus;
  targetStatus: KanbanColumnStatus;
  targetIndex?: number;
  expectedVersion: number;
  revisionNotes?: string;
  cancelOrReopenReason?: string;
}

class ActionMutationError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "ActionMutationError";
  }
}

function buildBoardQueryString(filters: KanbanBoardFilterValues): string {
  const params = new URLSearchParams();
  if (filters.projectId && filters.projectId !== "ALL") {
    params.set("projectId", filters.projectId);
  }
  if (filters.assigneeId && filters.assigneeId !== "ALL") {
    params.set("assigneeId", filters.assigneeId);
  }
  if (filters.priority && filters.priority !== "ALL") {
    params.set("priority", filters.priority);
  }
  if (filters.taskType && filters.taskType !== "ALL") {
    params.set("taskType", filters.taskType);
  }
  if (filters.overdueOnly) {
    params.set("overdueOnly", "true");
  }
  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }
  return params.toString();
}

function cloneBoardState(state: KanbanBoardResponse): KanbanBoardResponse {
  const columns: Record<KanbanColumnStatus, TaskBoardCardDto[]> = {
    BACKLOG: [...state.columns.BACKLOG],
    TODO: [...state.columns.TODO],
    IN_PROGRESS: [...state.columns.IN_PROGRESS],
    IN_REVIEW: [...state.columns.IN_REVIEW],
    REVISION: [...state.columns.REVISION],
    DONE: [...state.columns.DONE],
  };
  const counts: Record<KanbanColumnStatus, number> = {
    BACKLOG: columns.BACKLOG.length,
    TODO: columns.TODO.length,
    IN_PROGRESS: columns.IN_PROGRESS.length,
    IN_REVIEW: columns.IN_REVIEW.length,
    REVISION: columns.REVISION.length,
    DONE: columns.DONE.length,
  };
  return {
    columns,
    counts,
    totalCount: state.totalCount,
  };
}

function recomputeBoardTotals(board: KanbanBoardResponse): KanbanBoardResponse {
  let totalCount = 0;
  for (const col of KANBAN_COLUMN_STATUSES) {
    const len = board.columns[col].length;
    board.counts[col] = len;
    totalCount += len;
  }
  board.totalCount = totalCount;
  return board;
}

export function useKanbanBoard(
  initialData: KanbanBoardResponse,
  initialFilters: KanbanBoardFilterValues,
  filters: KanbanBoardFilterValues
) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["kanban-board", filters] as const,
    [filters]
  );

  const isInitialMatch =
    filters.projectId === initialFilters.projectId &&
    filters.assigneeId === initialFilters.assigneeId &&
    filters.priority === initialFilters.priority &&
    filters.taskType === initialFilters.taskType &&
    filters.overdueOnly === initialFilters.overdueOnly &&
    filters.q === initialFilters.q;

  const boardQuery = useQuery<KanbanBoardResponse>({
    queryKey,
    initialData: isInitialMatch ? initialData : undefined,
    placeholderData: (prev) => prev ?? initialData,
    staleTime: 15_000,
    queryFn: async () => {
      const qs = buildBoardQueryString(filters);
      const url = qs ? `/api/tasks/board?${qs}` : "/api/tasks/board";
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody.error ?? "Gagal memuat Kanban Board.");
      }
      return (await res.json()) as KanbanBoardResponse;
    },
  });

  const moveMutation = useMutation({
    mutationFn: async (vars: MoveBoardCardVariables) => {
      const boardSnapshot = queryClient.getQueryData<KanbanBoardResponse>(queryKey);
      let prevTaskId: string | null = null;
      let nextTaskId: string | null = null;

      if (boardSnapshot && vars.targetIndex !== undefined) {
        const destList = boardSnapshot.columns[vars.targetStatus];
        const actualIdx = destList.findIndex((t) => t.id === vars.taskId);
        if (actualIdx !== -1) {
          const prevCard = actualIdx > 0 ? destList[actualIdx - 1] : undefined;
          const nextCard =
            actualIdx + 1 < destList.length
              ? destList[actualIdx + 1]
              : undefined;
          prevTaskId = prevCard?.id ?? null;
          nextTaskId = nextCard?.id ?? null;
        }
      }

      const result = await moveKanbanTaskAction({
        taskId: vars.taskId,
        targetStatus: vars.targetStatus,
        expectedVersion: vars.expectedVersion,
        prevTaskId,
        nextTaskId,
        revisionNotes: vars.revisionNotes,
        cancelOrReopenReason: vars.cancelOrReopenReason,
      });

      if (!result.success) {
        throw new ActionMutationError(result.error.message, result.error.code);
      }

      return result;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const previousBoard =
        queryClient.getQueryData<KanbanBoardResponse>(queryKey);
      if (!previousBoard) {
        return { previousBoard: undefined };
      }

      const nextBoard = cloneBoardState(previousBoard);
      const sourceList = nextBoard.columns[vars.sourceStatus];
      const existingIdx = sourceList.findIndex((t) => t.id === vars.taskId);
      if (existingIdx === -1) {
        return { previousBoard };
      }

      const [movingCard] = sourceList.splice(existingIdx, 1);
      if (!movingCard) {
        return { previousBoard };
      }

      const optimisticCard: TaskBoardCardDto = {
        ...movingCard,
        status: vars.targetStatus,
        version: movingCard.version + 1,
        revisionCount:
          vars.targetStatus === "REVISION" && vars.sourceStatus !== "REVISION"
            ? movingCard.revisionCount + 1
            : movingCard.revisionCount,
      };

      const targetList = nextBoard.columns[vars.targetStatus];
      const insertIdx =
        vars.targetIndex !== undefined
          ? Math.max(0, Math.min(vars.targetIndex, targetList.length))
          : targetList.length;

      targetList.splice(insertIdx, 0, optimisticCard);
      recomputeBoardTotals(nextBoard);

      queryClient.setQueryData(queryKey, nextBoard);
      return { previousBoard };
    },
    onError: (err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKey, context.previousBoard);
      }
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memindahkan task. Perubahan dikembalikan."
      );
      if (err instanceof ActionMutationError && err.code === "CONFLICT") {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    onSuccess: (res, vars) => {
      const updatedCard = res.data;
      queryClient.setQueryData<KanbanBoardResponse>(queryKey, (current) => {
        if (!current) return current;
        const cloned = cloneBoardState(current);
        for (const col of KANBAN_COLUMN_STATUSES) {
          const idx = cloned.columns[col].findIndex(
            (t) => t.id === updatedCard.id
          );
          if (idx !== -1) {
            cloned.columns[col].splice(idx, 1);
          }
        }
        if (updatedCard.status !== "CANCELLED") {
          const destCol = updatedCard.status as KanbanColumnStatus;
          cloned.columns[destCol].push(updatedCard);
          cloned.columns[destCol].sort((a, b) => a.position - b.position);
        }
        return recomputeBoardTotals(cloned);
      });

      if (vars.sourceStatus !== vars.targetStatus) {
        toast.success(res.message ?? `Task dipindahkan ke ${vars.targetStatus}.`);
      }

      void queryClient.invalidateQueries({
        queryKey: ["slide-over-detail", "TASK_DETAIL", updatedCard.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["tasks", "calendar"] });
    },
  });

  const refreshBoard = () => {
    void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
  };

  return {
    board: boardQuery.data ?? initialData,
    isLoading: boardQuery.isLoading,
    isFetching: boardQuery.isFetching,
    moveTask: moveMutation.mutate,
    moveTaskAsync: moveMutation.mutateAsync,
    isMoving: moveMutation.isPending,
    refreshBoard,
  };
}
