import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utils/swagger";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import conversationRoutes from "./routes/conversation.routes";
import { errorHandler } from "./middleware/error.middleware";
import dotenv from "dotenv";
import cors from "cors";
import favicon from "serve-favicon";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// In CommonJS, __dirname is available automatically.
// Serve the custom favicon from the public folder (located at the project root).
// If your server file is in src, and your public folder is at the project root,
// use path.join(__dirname, "..", "public", "favicon.ico").
app.use(favicon(path.join(__dirname, "..", "public", "favicon.ico")));

// Logging middleware: Log every incoming request to the console.
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware configuration with CORS
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// Redirect root to Swagger docs
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);

const customCss = `
  .swagger-ui wbr {
    display: none !important;
  }
  .swagger-ui a.nostyle span {
    white-space: nowrap !important;
  }

  .swagger-ui .opblock .opblock-summary-description {
    margin-top: 10px !important;
    font-size: 0.9em;
    color: #555;
  }

  .swagger-ui .opblock .opblock-summary-control {
    padding: 0 10px !important;
    cursor: pointer;
  }
  .swagger-ui .opblock .opblock-summary-control svg {
    width: 20px !important;
    height: 20px !important;
    fill: #333;
  }

  .swagger-ui .opblock {
    margin-bottom: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .swagger-ui .opblock .opblock-summary {
    padding: 10px 15px !important;
  }
`;

const swaggerOptions = {
  customCss,
  customCssUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css",
  customfavIcon: "/favicon.ico",
  customSiteTitle: "EstateWise API Documentation",
};

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerOptions),
);

// Error Handling Middleware
app.use(errorHandler);

// Connect to MongoDB and start the server
mongoose
  .connect(process.env.MONGO_URI!, {})
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
