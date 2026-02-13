import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += JSON.stringify(metadata);
    }
    return msg;
});

export const logger = winston.createLogger({
    level: env.isDevelopment ? 'debug' : 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        env.isDevelopment ? colorize() : json(),
        env.isDevelopment ? logFormat : json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

export const stream = {
    write: (message: string) => {
        logger.info(message.substring(0, message.lastIndexOf('\n')));
    },
};
