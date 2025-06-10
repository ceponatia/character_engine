import { Context } from 'hono';

export interface ErrorDetails {
  error: string;
  message: string;
  timestamp: string;
  requestId?: string;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createError(message: string, statusCode: number = 500, details?: any): AppError {
  return new AppError(message, statusCode, details);
}

export function handleError(c: Context, error: Error | AppError, requestId?: string): Response {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const timestamp = new Date().toISOString();
  
  // Log error details for debugging
  const logData = {
    requestId,
    url: c.req.url,
    method: c.req.method,
    userAgent: c.req.header('user-agent'),
    timestamp,
    error: {
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && { details: error.details })
    }
  };
  
  console.error('API Error:', JSON.stringify(logData, null, 2));
  
  // Determine status code
  let statusCode = 500;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  } else if (error.message.includes('duplicate key')) {
    statusCode = 409; // Conflict
  } else if (error.message.includes('not found')) {
    statusCode = 404;
  } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
    statusCode = 401;
  } else if (error.message.includes('forbidden') || error.message.includes('permission')) {
    statusCode = 403;
  } else if (error.message.includes('validation') || error.message.includes('invalid')) {
    statusCode = 400;
  }
  
  // Prepare error response
  const errorResponse: ErrorDetails = {
    error: getErrorType(statusCode),
    message: getErrorMessage(error, statusCode, isDevelopment),
    timestamp,
    ...(requestId && { requestId })
  };
  
  // Add details only in development or for operational errors
  if (isDevelopment && error instanceof AppError && error.details) {
    errorResponse.details = error.details;
  }
  
  return c.json(errorResponse, statusCode);
}

function getErrorType(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 503: return 'Service Unavailable';
    default: return 'Error';
  }
}

function getErrorMessage(error: Error | AppError, statusCode: number, isDevelopment: boolean): string {
  // For operational errors (AppError), always return the message
  if (error instanceof AppError && error.isOperational) {
    return error.message;
  }
  
  // For development, return actual error message
  if (isDevelopment) {
    return error.message;
  }
  
  // For production, return generic messages for security
  switch (statusCode) {
    case 400: return 'The request was invalid or malformed';
    case 401: return 'Authentication is required to access this resource';
    case 403: return 'You do not have permission to access this resource';
    case 404: return 'The requested resource was not found';
    case 409: return 'The request conflicts with the current state of the resource';
    case 429: return 'Too many requests. Please try again later';
    case 500: return 'An unexpected error occurred. Please try again later';
    case 503: return 'The service is temporarily unavailable. Please try again later';
    default: return 'An error occurred while processing your request';
  }
}

// Async error wrapper for route handlers
export function asyncHandler(fn: Function) {
  return async (c: Context, next?: any) => {
    try {
      const result = await fn(c, next);
      return result;
    } catch (error) {
      const requestId = c.get('requestId') || generateRequestId();
      return handleError(c, error as Error, requestId);
    }
  };
}

// Request ID middleware
export function requestIdMiddleware() {
  return async (c: Context, next: any) => {
    const requestId = c.req.header('x-request-id') || generateRequestId();
    c.set('requestId', requestId);
    c.header('x-request-id', requestId);
    await next();
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Common error creators
export const NotFoundError = (resource: string) => 
  new AppError(`${resource} not found`, 404);

export const ValidationError = (message: string, details?: any) => 
  new AppError(`Validation failed: ${message}`, 400, details);

export const UnauthorizedError = (message: string = 'Authentication required') => 
  new AppError(message, 401);

export const ForbiddenError = (message: string = 'Access forbidden') => 
  new AppError(message, 403);

export const ConflictError = (message: string) => 
  new AppError(message, 409);

export const ServiceUnavailableError = (message: string = 'Service temporarily unavailable') => 
  new AppError(message, 503);