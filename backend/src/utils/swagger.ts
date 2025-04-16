import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EstateWise API",
      version: "1.0.0",
      description:
        "API documentation for EstateWise chatbot - an AI assistant helping users find their dream homes in Chapel Hill, NC.",
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
      contact: {
        name: "EstateWise Support",
        email: "hoangson091104@gmail.com",
        url: "https://estatewise.com/",
      },
    },
    servers: [
      {
        url: "https://estatewise-backend.vercel.app/",
        description: "Production server",
      },
      {
        url: "http://localhost:3001",
        description: "Local server",
      },
      // Add your production server here if needed
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    // Uncomment below to apply global security to all endpoints
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
  },
  apis: [
    "./src/routes/*.ts",
    "./src/routes/*.js",
    "./src/models/*.ts",
    "./src/models/*.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
