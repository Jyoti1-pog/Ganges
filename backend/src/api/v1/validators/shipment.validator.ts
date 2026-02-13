import { z } from 'zod';

export const createShipmentSchema = z.object({
    body: z.object({
        lockerItemIds: z.array(z.string().uuid()).min(1),
        destinationCountry: z.string().min(2),
        destinationAddress: z.string().min(10),
    })
});

export const getQuoteSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    })
});
