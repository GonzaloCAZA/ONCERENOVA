export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createError = (message: string, statusCode: number, code: string) => {
  return new AppError(message, statusCode, code);
};

export const errorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};
