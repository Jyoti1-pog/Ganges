import { z } from 'zod';

export const createShipmentSchema = z.object({
    body: z.object({
        pickupAddress: z.string().min(1, 'Pickup address is required'),
        pickupLat: z.number().optional(),
        pickupLng: z.number().optional(),
        deliveryAddress: z.string().min(1, 'Delivery address is required'),
        deliveryLat: z.number().optional(),
        deliveryLng: z.number().optional(),
        weight: z.number().positive('Weight must be positive'),
        dimensions: z.string().optional(),
        description: z.string().optional(),
    }),
});

export const updateShipmentStatusSchema = z.object({
    body: z.object({
        status: z.enum(['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
        notes: z.string().optional(),
        location: z.string().optional(),
    }),
});

export const assignDriverSchema = z.object({
    body: z.object({
        driverId: z.string().uuid('Invalid driver ID'),
    }),
});
