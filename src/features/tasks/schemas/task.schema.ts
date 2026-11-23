import { z } from "zod";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
  TASK_TYPE_VALUES,
} from "@/lib/constants/enums";
import { validateSafeExternalHttpsUrl } from "@/lib/validations/common";
import { ASSET_SOURCE_TYPE_VALUES } from "@/features/tasks/types";

const optionalNullableUuid = z
  .string()
  .uuid("Format UUID tidak valid.")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

const optionalNullableStringDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => {
    if (val === undefined) return undefined;
    return val && val.length > 0 ? val : null;
  });

export const createTaskSchema = z
  .object({
    projectId: optionalNullableUuid,
    title: z
      .string()
      .trim()
      .min(3, "Judul task minimal 3 karakter.")
      .max(200, "Judul task maksimal 200 karakter."),
    description: z
      .string()
      .trim()
      .max(5000, "Deskripsi task maksimal 5.000 karakter.")
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    taskType: z.enum(TASK_TYPE_VALUES).default("GENERAL"),
    priority: z.enum(TASK_PRIORITY_VALUES).default("MEDIUM"),
    status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS"]).default("TODO"),
    requiresReview: z.boolean().default(true),
    assigneeId: optionalNullableUuid,
    reviewerId: optionalNullableUuid,
    contentItemId: optionalNullableUuid,
    designBriefId: optionalNullableUuid,
    startDate: optionalNullableStringDate,
    dueDate: optionalNullableStringDate,
    estimatedHours: z
      .number()
      .min(0.5, "Estimasi minimal 0.5 jam.")
      .max(500, "Estimasi maksimal 500 jam.")
      .optional()
      .nullable(),
    tags: z
      .array(z.string().trim().min(1).max(30))
      .max(5, "Maksimal 5 tag per task.")
      .optional()
      .default([]),
    checklists: z
      .array(
        z.object({
          title: z
            .string()
            .trim()
            .min(2, "Checklist minimal 2 karakter.")
            .max(200, "Checklist maksimal 200 karakter."),
        })
      )
      .max(30, "Maksimal 30 item checklist per task.")
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "BACKLOG" && !data.assigneeId) {
      ctx.addIssue({
        code: "custom",
        path: ["assigneeId"],
        message: "Assignee wajib diisi untuk task di luar Backlog.",
      });
    }

    if (data.status !== "BACKLOG" && !data.dueDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Tenggat waktu (due date) wajib diisi untuk task aktif.",
      });
    }

    if (data.taskType === "DESIGN_TASK" && !data.designBriefId) {
      ctx.addIssue({
        code: "custom",
        path: ["taskType"],
        message:
          "Task bertipe DESIGN_TASK harus ditautkan ke Design Brief melalui Content Planner / Design Workspace.",
      });
    }

    if (data.taskType === "CONTENT_PRODUCTION" && !data.contentItemId) {
      ctx.addIssue({
        code: "custom",
        path: ["taskType"],
        message:
          "Task bertipe CONTENT_PRODUCTION harus ditautkan ke Content Item melalui Content Planner.",
      });
    }

    if (data.startDate && data.dueDate) {
      const start = new Date(`${data.startDate.slice(0, 10)}T00:00:00+07:00`);
      const due = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)
          ? `${data.dueDate}T23:59:59+07:00`
          : data.dueDate
      );
      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(due.getTime()) &&
        due < start
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["dueDate"],
          message: "Due date tidak boleh lebih awal dari tanggal mulai.",
        });
      }
    }
  });

export const updateTaskSchema = z
  .object({
    taskId: z.string().uuid("ID task tidak valid."),
    projectId: optionalNullableUuid,
    title: z
      .string()
      .trim()
      .min(3, "Judul task minimal 3 karakter.")
      .max(200, "Judul task maksimal 200 karakter.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, "Deskripsi maksimal 5.000 karakter.")
      .optional()
      .nullable(),
    priority: z.enum(TASK_PRIORITY_VALUES).optional(),
    requiresReview: z.boolean().optional(),
    assigneeId: optionalNullableUuid,
    reviewerId: optionalNullableUuid,
    startDate: optionalNullableStringDate,
    dueDate: optionalNullableStringDate,
    estimatedHours: z
      .number()
      .min(0, "Estimasi jam tidak boleh negatif.")
      .max(500, "Estimasi jam maksimal 500.")
      .optional()
      .nullable(),
    actualHours: z
      .number()
      .min(0, "Aktual jam tidak boleh negatif.")
      .max(1000, "Aktual jam maksimal 1000.")
      .optional()
      .nullable(),
    tags: z
      .array(z.string().trim().min(1).max(30))
      .max(5, "Maksimal 5 tag per task.")
      .optional(),
    reassignReason: z
      .string()
      .trim()
      .max(500, "Alasan pengalihan maksimal 500 karakter.")
      .optional()
      .nullable(),
    expectedVersion: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.dueDate) {
      const start = new Date(`${data.startDate.slice(0, 10)}T00:00:00+07:00`);
      const due = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)
          ? `${data.dueDate}T23:59:59+07:00`
          : data.dueDate
      );
      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(due.getTime()) &&
        due < start
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["dueDate"],
          message: "Due date tidak boleh lebih awal dari tanggal mulai.",
        });
      }
    }
  });

export const moveKanbanTaskSchema = z.object({
  taskId: z.string().uuid("ID task tidak valid."),
  targetStatus: z.enum(TASK_STATUS_VALUES),
  expectedVersion: z.number().int().min(1, "Versi task tidak valid."),
  targetPosition: z.number().positive().finite().optional(),
  prevTaskId: optionalNullableUuid,
  nextTaskId: optionalNullableUuid,
  prevPos: z.number().positive().finite().optional().nullable(),
  nextPos: z.number().positive().finite().optional().nullable(),
  revisionNotes: z
    .string()
    .trim()
    .max(2000, "Catatan revisi maksimal 2.000 karakter.")
    .optional(),
  cancelOrReopenReason: z
    .string()
    .trim()
    .max(500, "Alasan maksimal 500 karakter.")
    .optional(),
});

export const toggleTaskChecklistSchema = z.object({
  checklistId: z.string().uuid("ID checklist tidak valid."),
  isCompleted: z.boolean(),
});

export const addTaskChecklistItemSchema = z.object({
  taskId: z.string().uuid("ID task tidak valid."),
  title: z
    .string()
    .trim()
    .min(2, "Judul checklist minimal 2 karakter.")
    .max(200, "Judul checklist maksimal 200 karakter."),
});

export const deleteTaskChecklistItemSchema = z.object({
  checklistId: z.string().uuid("ID checklist tidak valid."),
});

export const addTaskCommentSchema = z.object({
  taskId: z.string().uuid("ID task tidak valid."),
  body: z
    .string()
    .trim()
    .min(1, "Komentar tidak boleh kosong.")
    .max(3000, "Komentar maksimal 3.000 karakter."),
  parentCommentId: optionalNullableUuid,
  mentionedUserIds: z.array(z.string().uuid()).max(20).optional().default([]),
});

export const addTaskAttachmentSchema = z
  .object({
    taskId: z.string().uuid("ID task tidak valid."),
    sourceType: z.enum(ASSET_SOURCE_TYPE_VALUES),
    fileName: z
      .string()
      .trim()
      .min(1, "Nama lampiran wajib diisi.")
      .max(255, "Nama lampiran maksimal 255 karakter."),
    fileUrl: z.string().trim().max(2048).optional().nullable(),
    storageKey: z.string().trim().max(500).optional().nullable(),
    mimeType: z.string().trim().max(120).optional().nullable(),
    fileSizeBytes: z.number().int().nonnegative().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType === "UPLOAD") {
      if (!data.storageKey) {
        ctx.addIssue({
          code: "custom",
          path: ["storageKey"],
          message: "Storage key wajib tersedia untuk lampiran unggahan.",
        });
      }
    } else {
      const check = validateSafeExternalHttpsUrl(data.fileUrl ?? "");
      if (!check.valid) {
        ctx.addIssue({
          code: "custom",
          path: ["fileUrl"],
          message: check.error ?? "URL eksternal tidak valid.",
        });
      }
    }
  });

export const softDeleteTaskSchema = z.object({
  taskId: z.string().uuid("ID task tidak valid."),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
export type MoveKanbanTaskInput = z.input<typeof moveKanbanTaskSchema>;
export type ToggleTaskChecklistInput = z.input<
  typeof toggleTaskChecklistSchema
>;
export type AddTaskChecklistItemInput = z.input<
  typeof addTaskChecklistItemSchema
>;
export type AddTaskCommentInput = z.input<typeof addTaskCommentSchema>;
export type AddTaskAttachmentInput = z.input<typeof addTaskAttachmentSchema>;
