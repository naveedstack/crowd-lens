import { z } from "zod";

const optionInput = z.object({
    imageUrl: z.string().optional(),
    content: z.string().optional(),
});

export const createTaskSchema = z.object({
    options: z.array(optionInput).min(2).max(5),
    title: z.string().optional(),
    signature: z.string(),
    requiredSubmissions: z.coerce.number().int().positive(),
    quotedLamportsPerVote: z.coerce.number().int().positive().optional(),
    optionType: z.enum(["image"]).optional().default("image"),
}).superRefine((data, ctx) => {
    data.options.forEach((option, index) => {
        if (!option.imageUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "imageUrl required",
                path: ["options", index, "imageUrl"],
            });
        }
        if (option.content?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Image tasks cannot include content",
                path: ["options", index, "content"],
            });
        }
    });
});

export const createSubmissionInput = z.object({
    taskId: z.string(),
    selection: z.string(),
    comment: z
        .string()
        .max(280)
        .optional()
        .transform((value) => {
            const trimmed = value?.trim();
            return trimmed ? trimmed : undefined;
        }),
});
