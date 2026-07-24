import type { AppError } from '../types';

export class ApplicationError extends Error implements AppError {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly cause?: unknown;
  public readonly context?: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(params: {
    code: string;
    message: string;
    userMessage: string;
    cause?: unknown;
    context?: Record<string, unknown>;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = 'ApplicationError';
    this.code = params.code;
    this.userMessage = params.userMessage;
    this.cause = params.cause;
    this.context = params.context;
    this.retryable = params.retryable ?? false;
  }
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error &&
    'retryable' in error
  );
}

export function normalizeError(error: unknown, defaultMessage = 'An unexpected error occurred'): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ApplicationError({
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: defaultMessage,
      cause: error,
      retryable: true,
    });
  }

  return new ApplicationError({
    code: 'UNKNOWN_ERROR',
    message: String(error),
    userMessage: defaultMessage,
    retryable: true,
  });
}
