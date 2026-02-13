const swaggerJsdoc = require('swagger-jsdoc');

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

const specs = swaggerJsdoc(options);
console.log('\n=== Swagger Spec Test ===');
console.log('Paths found:', Object.keys(specs.paths || {}).length);
console.log('\nPaths:');
Object.keys(specs.paths || {}).forEach(path => {
    const methods = Object.keys(specs.paths[path]).join(', ');
    console.log(`  ${path} [${methods}]`);
});
