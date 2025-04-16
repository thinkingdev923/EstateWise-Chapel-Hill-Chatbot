import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import favicon from "serve-favicon";
import path from "path";
import dotenv from "dotenv";
import swaggerSpec from "./utils/swagger";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import conversationRoutes from "./routes/conversation.routes";
import { errorHandler } from "./middleware/error.middleware";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cookieParser());

// Logging middleware: Log every incoming request.
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// CORS configuration
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve favicon (using __dirname directly as provided)
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// REST API routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);

// Serve Swagger JSON definition
app.get("/swagger.json", (req, res) => {
  res.json(swaggerSpec);
});

// Serve Swagger UI using a CDN
app.get("/api-docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>EstateWise API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="16x16" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <style>
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: '/swagger.json',
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: "StandaloneLayout"
            });
            window.ui = ui;
          }
        </script>
      </body>
    </html>
  `);
});

// Redirect root to /api-docs
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// Error Handling Middleware
app.use(errorHandler);

// Connect to MongoDB and start the server
mongoose
  // @ts-ignore
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`EstateWise backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

export default app;
