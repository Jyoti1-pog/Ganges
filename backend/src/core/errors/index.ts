import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;
    public errors?: any;

    constructor(message: string, statusCode: number = 500, errors?: any) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad Request', errors?: any) {
        super(message, 400, errors);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (statusCode >= 500) {
        logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${statusCode}, Message:: ${message}`, { stack: err.stack });
    }

    return res.status(statusCode).json({
        success: false,
        status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
        message,
        ...(err.errors && { errors: err.errors })
    });
};
