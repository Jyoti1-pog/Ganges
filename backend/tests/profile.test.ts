import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/core/database/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../src/core/config/env';

describe('User Profile API', () => {
    let authToken: string;
    let testUser: any;

    beforeAll(async () => {
        // 1. Create a test user
        testUser = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                id: 'test-user-id',
                email: 'test@example.com',
                password: 'hashedpassword',
                role: 'USER',
                profile: {
                    create: { firstName: 'Test', lastName: 'User' }
                }
            }
        });

        // 2. Generate a valid Supabase-like JWT
        authToken = jwt.sign(
            { sub: testUser.id, email: testUser.email },
            env.SUPABASE_JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    it('should get current user profile', async () => {
        const res = await request(app)
            .get('/api/v1/user/profile')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.email).toBe(testUser.email);
    });

    it('should update user profile', async () => {
        const res = await request(app)
            .patch('/api/v1/user/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ firstName: 'Updated' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.firstName).toBe('Updated');
    });
});
