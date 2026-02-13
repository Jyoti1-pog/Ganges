import request from 'supertest';
import app from '../src/app';

describe('Health Check API', () => {
    it('should return 200 OK for /health', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});

describe('Security Middlewares', () => {
    it('should have security headers (Helmet)', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-frame-options']).toBeDefined();
        expect(res.headers['x-content-type-options']).toBeDefined();
    });

    it('should return 401 for protected routes without token', async () => {
        const res = await request(app).get('/api/v1/user/profile');
        expect(res.statusCode).toEqual(401);
    });
});
