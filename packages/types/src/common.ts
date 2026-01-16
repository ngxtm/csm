import { z } from 'zod';

// Pagination
export const PaginationDto = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type PaginationDto = z.infer<typeof PaginationDto>;

export const PaginationMeta = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});
export type PaginationMeta = z.infer<typeof PaginationMeta>;

// API Response wrapper
export const ApiResponse = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    meta: PaginationMeta.optional(),
  });

export const ApiError = z.object({
  success: z.literal(false),
  statusCode: z.number(),
  message: z.string(),
  timestamp: z.string(),
});
export type ApiError = z.infer<typeof ApiError>;
