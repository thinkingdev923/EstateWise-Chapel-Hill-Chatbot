import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utils/swagger";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import conversationRoutes from "./routes/conversation.routes";
import propertyRoutes from "./routes/property.routes";
import { errorHandler } from "./middleware/error.middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/properties", propertyRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

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
