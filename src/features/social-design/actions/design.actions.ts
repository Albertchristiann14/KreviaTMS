"use server";

import { revalidatePath } from "next/cache";
import {
  assignDesignBriefSchema,
  reviewDesignSubmissionSchema,
  startDesignBriefSchema,
  submitDesignSchema,
} from "@/features/social-design/schemas/design.schema";
import {
  assignDesignBriefAtomic,
  reviewDesignSubmissionAtomic,
  startDesignBriefAtomic,
  submitDesignVersionAtomic,
} from "@/features/social-design/services/content-workflow.service";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";

export const assignDesignBriefAction = createProtectedAction({
  permission: PERMISSIONS.DESIGN_BRIEF_MANAGE,
  schema: assignDesignBriefSchema,
  handler: async ({ ctx, input }) => {
    const result = await assignDesignBriefAtomic(ctx, {
      briefId: input.briefId,
      contentItemId: input.contentItemId ?? null,
      projectId: input.projectId,
      title: input.title,
      objective: input.objective,
      dimensionsSpec: input.dimensionsSpec ?? null,
      copyText: input.copyText ?? null,
      brandGuidelinesNotes: input.brandGuidelinesNotes ?? null,
      referenceLinks: input.referenceLinks,
      assignedDesignerId: input.assignedDesignerId,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    });

    revalidatePath("/design/workspace");
    revalidatePath("/content/calendar");
    revalidatePath("/content/planner");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");
    revalidatePath("/tasks/calendar");

    return {
      data: result,
      message: result.isUpdate
        ? `Design brief & linked task (${result.taskCode}) diperbarui.`
        : `Design brief dibuat dan task ${result.taskCode} otomatis ditugaskan.`,
    };
  },
});

export const startDesignBriefAction = createProtectedAction({
  permission: PERMISSIONS.DESIGN_SUBMISSION_CREATE,
  schema: startDesignBriefSchema,
  handler: async ({ ctx, input }) => {
    const result = await startDesignBriefAtomic(ctx, input.designBriefId);

    revalidatePath("/design/workspace");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");

    return {
      data: result,
      message: "Status pengerjaan brief diubah menjadi Working.",
    };
  },
});

export const submitDesignAction = createProtectedAction({
  permission: PERMISSIONS.DESIGN_SUBMISSION_CREATE,
  schema: submitDesignSchema,
  handler: async ({ ctx, input }) => {
    const result = await submitDesignVersionAtomic(ctx, {
      designBriefId: input.designBriefId,
      sourceType: input.sourceType,
      storageKey: input.storageKey ?? null,
      externalUrl: input.externalUrl ?? null,
      fileName: input.fileName,
      mimeType: input.mimeType ?? null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      designerNotes: input.designerNotes ?? null,
    });

    revalidatePath("/design/workspace");
    revalidatePath("/design/reviews");
    revalidatePath("/content/calendar");
    revalidatePath("/content/planner");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");

    return {
      data: result,
      message: `Desain v${result.versionNumber} berhasil dikumpulkan dan masuk antrean Design Review.`,
    };
  },
});

export const reviewDesignSubmissionAction = createProtectedAction({
  permission: PERMISSIONS.DESIGN_SUBMISSION_APPROVE,
  schema: reviewDesignSubmissionSchema,
  handler: async ({ ctx, input }) => {
    const result = await reviewDesignSubmissionAtomic(ctx, {
      submissionId: input.submissionId,
      decision: input.decision,
      feedback: input.feedback,
      revisionChecklist: input.revisionChecklist,
      revisionDueDate: input.revisionDueDate
        ? new Date(input.revisionDueDate)
        : null,
      promoteToAssetLibrary: input.promoteToAssetLibrary,
      assetTags: input.assetTags,
    });

    revalidatePath("/design/reviews");
    revalidatePath("/design/workspace");
    revalidatePath("/assets");
    revalidatePath("/content/calendar");
    revalidatePath("/content/planner");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");

    return {
      data: result,
      message:
        result.submissionStatus === "APPROVED"
          ? `Desain v${result.versionNumber} disetujui${result.promotedAssetId ? " & otomatis tersimpan ke Asset Library" : ""}. Konten siap tayang!`
          : `Permintaan revisi #${result.totalRevisionCount} terkirim ke Designer.`,
    };
  },
});
