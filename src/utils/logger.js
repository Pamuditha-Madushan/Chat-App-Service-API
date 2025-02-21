import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.colorize({
      all: true,
      colors: {
        info: "green",
        error: "red",
        warn: "yellow",
        debug: "magenta",
      },
    }),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: "src/logs/error-%Date%.log",
      level: "error",
      datePattern: "DD-MM-YYYY",
      maxSize: "10m",
      maxFiles: "14d",
    }),
    new transports.DailyRotateFile({
      filename: "src/logs/combined-%Date%.log",
      datePattern: "DD-MM-YYYY",
      maxSize: "10m",
      maxFiles: "14d",
    }),
  ],
});

export default logger;
