import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './core/config/env';
import { logger, stream } from './core/logger';
import { globalErrorHandler, NotFoundError } from './core/errors';
import { ApiResponse } from './core/response';
import authRoutes from './modules/auth/auth.routes';
import shipmentRoutes from './modules/shipment/shipment.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import adminRoutes from './modules/admin/admin.routes';

// Shared Middlewares
import { requestTracer } from './shared/middlewares/requestTracer';
import { apiRateLimiter } from './shared/middlewares/rateLimiter';
import { idempotency } from './shared/middlewares/idempotency';

import * as swaggerUi from 'swagger-ui-express';
import { specs } from './core/config/swagger';
import { setupWorkers } from './domain/jobs/queue.service';

const app = express();

// Initialize workers
setupWorkers();

// ===================================
// Middlewares
// ===================================

// Observability & Security
app.use(requestTracer); // High priority for tracing
app.use(helmet());
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}));

// Traffic Control
app.use(apiRateLimiter);

// Logging
app.use(morgan(env.isDevelopment ? 'dev' : 'combined', { stream }));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Mutation Logic
app.use(idempotency); // Handles POST/PUT/PATCH keys

// ===================================
// Routes
// ===================================

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Returns basic API status
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Ganges Backend is running'
    });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns system health status
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     env:
 *                       type: string
 */
app.get('/health', (req, res) => {
    ApiResponse.success(res, { status: 'UP', env: env.NODE_ENV }, 'System Healthy');
});

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Module Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);

// Legacy API Routes (Deprecated - causes type errors with new schema)
// app.use('/api/v1', apiV1Routes);

// ===================================
// Error Handling
// ===================================

// 404 Handler
app.use((req, res, next) => {
    next(new NotFoundError());
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
