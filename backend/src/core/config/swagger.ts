import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ganges Backend API',
            version: '1.0.0',
            description: 'Production-ready logistics API for GANGES',
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: [
        './src/app.ts',
        './src/api/v1/routes/*.ts',
        './src/api/v1/controllers/*.ts'
    ],
};

export const specs = swaggerJsdoc(options);
