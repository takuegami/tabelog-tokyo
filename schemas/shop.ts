import { z } from 'zod'

export const shopSchema = z.object({
  name: z.string().min(1),
  genre: z.string().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  image_url: z.string().url().optional(),
})

export type ShopForm = z.infer<typeof shopSchema>
