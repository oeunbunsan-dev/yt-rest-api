export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
