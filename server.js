import express from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./src/config/dbConn.js";
import logger from "./src/utils/logger.js";
import { requestLogger, errorLogger } from "./src/middlewares/logEvents.js";
import gracefulShutdown from "./src/services/gracefulShutdown.js";
import corsOptions from "./src/config/corsOptions.js";
import allowCredentials from "./src/middlewares/allowCredentials.js";
import colors from "colors";
import verifyJWT from "./src/middlewares/authMiddleware.js";
import { initializeSocket } from "./src/socket/socketServer.js";
import userRoutes from "./src/routes/userRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import imageRoutes from "./src/routes/imageRoutes.js";
// import AWS from 'aws-sdk';
// import http from "http";
// import server from http.createServer(app);
import { notFound, errorHandler } from "./src/middlewares/errorMiddlewares.js";

const port = process.env.PORT || 3000;

app.use(requestLogger);
app.use(errorLogger);

connectDB();

app.use(allowCredentials);

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API is working just fine");
});

app.use("/api/user", userRoutes);
app.use("/api/image", imageRoutes);

app.use(verifyJWT);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

let listenServer;

mongoose.connection.once("open", () => {
  listenServer = app.listen(
    port,
    logger.info(`Server started on port: ${port}`)
  );
});

initializeSocket(listenServer);

process.on("SIGINT", async () => {
  logger.warn("Received SIGINT, shutting down gracefully...");
  await mongoose.connection.close();
  logger.warn("MongoDB connection closed");
  process.exit(0);
});

// especially useful in cloud environments (e.g., Kubernetes, Docker)
// process.on("SIGTERM", async () => {
//   logger.info("Received SIGTERM, shutting down gracefully...");
//   await mongoose.connection.close();
//   logger.info("MongoDB connection closed");
//   process.exit(0);
// });

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, ${reason}`);
  gracefulShutdown(listenServer);
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}, Stack: ${err.stack}`);
  gracefulShutdown(listenServer);
});
