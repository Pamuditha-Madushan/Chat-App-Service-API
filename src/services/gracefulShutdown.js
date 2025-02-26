import mongoose from "mongoose";
import logger from "../utils/logger.js";

const gracefulShutdown = (server) => {
  logger.warn("Starting graceful shutdown...");

  mongoose.connection.close().then(() => {
    logger.warn("MongoDB connection closed");

    server.close(() => {
      logger.warn("Server is closed");
      process.exit(1);
    });
  });

  setTimeout(() => {
    logger.error("Forcefully exiting after timeout");
    process.exit(1);
  }, 10000);
};

export default gracefulShutdown;
