/**
 * Standardized API Response Types for GangGPT
 * Ensures consistent response format across all endpoints
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message !== undefined) {
    response.message = message;
  }

  return response;
}

/**
 * Error response helper
 */
export function createErrorResponse(
  error: string,
  code?: string,
  details?: Record<string, any>
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  if (code !== undefined) {
    response.code = code;
  }

  if (details !== undefined) {
    response.details = details;
  }

  return response;
}

/**
 * Paginated response helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  const response: PaginatedResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };

  if (message !== undefined) {
    response.message = message;
  }

  return response;
}

/**
 * Type guards for response types
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorResponse(
  response: ApiResponse<any>
): response is ErrorResponse {
  return response.success === false;
}

export function isPaginatedResponse<T>(
  response: ApiResponse<T[] | any>
): response is PaginatedResponse<T> {
  return 'pagination' in response && Array.isArray(response.data);
}
