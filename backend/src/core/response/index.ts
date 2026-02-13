import { Response } from 'express';

export class ApiResponse {
    public static success(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    public static created(res: Response, data: any, message: string = 'Created') {
        return ApiResponse.success(res, data, message, 201);
    }

    public static noContent(res: Response) {
        return res.status(204).send();
    }
}
