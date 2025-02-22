import mongoose from "mongoose";
import logger from "../utils/logger.js";

const gracefulShutdown = (server) => {
  logger.info("Starting graceful shutdown...");

  mongoose.connection.close().then(() => {
    logger.info("MongoDB connection closed");

    server.close(() => {
      logger.info("Server is closed");
      process.exit(1);
    });
  });

  setTimeout(() => {
    logger.error("Forcefully exiting after timeout");
    process.exit(1);
  }, 10000);
};

export default gracefulShutdown;
