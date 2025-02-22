import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.error("MONGO_URI is not defined in the environment variables");
    process.exit(1);
  }
  try {
    const mongooseConnection = await mongoose.connect(process.env.MONGO_URI, {
      //   connectTimeoutMS: 10000, // 10 seconds
      //   socketTimeoutMS: 45000, // 45 seconds
    });
    logger.info(
      `Connected to the MongoDB Atlas: ${mongooseConnection.connection.host}`
    );
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

export default connectDB;
