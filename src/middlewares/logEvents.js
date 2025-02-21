import logger from "../utils/logger.js";

const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV !== "production")
    logger.debug(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
};

const errorLogger = (err, req, res, next) => {
  logger.error(
    `Error occurred: ${err.message}, Method: ${req.method}, URL: ${req.url}, Stack Trace: ${err.stack}`
  );
  next(err);
};

export { requestLogger, errorLogger };
