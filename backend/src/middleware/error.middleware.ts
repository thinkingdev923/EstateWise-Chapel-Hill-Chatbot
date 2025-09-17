import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

/**
 * Middleware to handle errors in the application.
 * It logs the error and sends a JSON response with the error message.
 *
 * @param err - The error object
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details,
      },
    });
  }

  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
};
