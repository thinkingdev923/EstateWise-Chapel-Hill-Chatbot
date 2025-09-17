/**
 * Custom application error class with status codes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = "Bad Request", details?: any): AppError {
    return new AppError(message, HttpStatusCode.BAD_REQUEST, details);
  }

  static unauthorized(
    message: string = "Unauthorized",
    details?: any,
  ): AppError {
    return new AppError(message, HttpStatusCode.UNAUTHORIZED, details);
  }

  static forbidden(message: string = "Forbidden", details?: any): AppError {
    return new AppError(message, HttpStatusCode.FORBIDDEN, details);
  }

  static notFound(message: string = "Not Found", details?: any): AppError {
    return new AppError(message, HttpStatusCode.NOT_FOUND, details);
  }

  static conflict(message: string = "Conflict", details?: any): AppError {
    return new AppError(message, HttpStatusCode.CONFLICT, details);
  }

  static unprocessableEntity(
    message: string = "Unprocessable Entity",
    details?: any,
  ): AppError {
    return new AppError(message, HttpStatusCode.UNPROCESSABLE_ENTITY, details);
  }

  static internalServerError(
    message: string = "Internal Server Error",
    details?: any,
  ): AppError {
    return new AppError(message, HttpStatusCode.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * HTTP Status Code enum for better type safety
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}
