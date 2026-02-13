import app from './app';
import { env } from './core/config/env';
import { logger } from './core/logger';
import { connectDB } from './core/database/prisma';


const PORT = process.env.PORT || 3000;
const start = async () => {
    try {
        // 1. Connect to Database
        // We catch errors here but don't exit so the server can still 
        // serve health checks/docs in 'lite' mode if DB is down.
        try {
            await connectDB();
        } catch (dbError: any) {
            logger.warn('Database connection failed. Continuing in restricted mode.', { message: dbError.message });
        }

        // 2. Start Listening
        app.listen(PORT, () => {
            console.log(`🚀 Server running at: http://localhost:${PORT}`);
            console.log(`📘 Swagger docs at: http://localhost:${PORT}/api-docs`);
        });

    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

start();


