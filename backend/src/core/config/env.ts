import { cleanEnv, str, port, url } from 'envalid';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root if not in production
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
} else {
    dotenv.config();
}

export const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
    PORT: port({ default: 3000 }),
    DATABASE_URL: url(),
    REDIS_URL: url(),
    JWT_SECRET: str(),
    JWT_REFRESH_SECRET: str(),
    SUPABASE_URL: url(),
    SUPABASE_KEY: str(),
    SUPABASE_JWT_SECRET: str(),
    STRIPE_SECRET_KEY: str({ default: '' }),
    RAZORPAY_KEY_ID: str({ default: '' }),
    RAZORPAY_KEY_SECRET: str({ default: '' }),
    GOOGLE_CLIENT_ID: str({ default: '' }),
    GOOGLE_CLIENT_SECRET: str({ default: '' }),
    FRONTEND_URL: url({ default: 'http://localhost:5173' }),
});
