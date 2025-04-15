import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EstateWise API",
      version: "1.0.0",
      description: "API documentation for EstateWise backend"
    },
    servers: [
      { url: "http://localhost:3001", description: "Local server" }
    ]
  },
  apis: ["./src/routes/*.ts"]
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
