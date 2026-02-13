import { z } from 'zod';

export const updateProfileSchema = z.object({
    body: z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
        avatarUrl: z.string().url().optional(),
    })
});

export const getVirtualAddressSchema = z.object({
    body: z.object({
        country: z.string().optional(),
    })
});
