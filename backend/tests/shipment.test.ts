import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/core/database/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../src/core/config/env';

describe('Shipment API', () => {
    let authToken: string;
    let testUser: any;
    let virtualAddress: any;
    let pkg: any;
    let lockerItem: any;

    beforeAll(async () => {
        // Setup test data
        testUser = await prisma.user.upsert({
            where: { email: 'ship-test@example.com' },
            update: {},
            create: {
                id: 'ship-test-user-id',
                email: 'ship-test@example.com',
                password: 'hashedpassword',
            }
        });

        virtualAddress = await prisma.virtualAddress.upsert({
            where: { userId: testUser.id },
            update: {},
            create: {
                userId: testUser.id,
                gangesId: 'GANGES-TEST-123'
            }
        });

        pkg = await prisma.package.create({
            data: {
                virtualAddressId: virtualAddress.id,
                weight: 1.5,
                length: 10,
                width: 10,
                height: 10,
                status: 'RECEIVED'
            }
        });

        lockerItem = await prisma.lockerItem.create({
            data: {
                packageId: pkg.id,
                shelfLocation: 'A1'
            }
        });

        authToken = jwt.sign(
            { sub: testUser.id, email: testUser.email },
            env.SUPABASE_JWT_SECRET
        );
    });

    it('should create a shipment from locker item', async () => {
        const res = await request(app)
            .post('/api/v1/shipments')
            .set('Authorization', `Bearer ${authToken}`)
            .set('Idempotency-Key', `test-key-${Date.now()}`)
            .send({
                lockerItemIds: [lockerItem.id],
                destinationCountry: 'USA',
                destinationAddress: '123 Main St, New York'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.status).toBe('DRAFT');
        expect(res.body.data.chargeableWeight).toBeDefined();
    });
});
