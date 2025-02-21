import logger from "../utils/logger.js";
import CustomError from "../utils/customError.js";

const notFound = (req, res, next) => {
  next(new CustomError(`Not Found - ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}, Stack: ${err.stack}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { notFound, errorHandler };
