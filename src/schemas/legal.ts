import { z } from 'astro/zod';

/** Схема юридических страниц: политика конфиденциальности, согласие на обработку ПДн. */
export const legalSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  updated: z.string().min(1),
  order: z.number().default(1),
});

export type Legal = z.infer<typeof legalSchema>;
