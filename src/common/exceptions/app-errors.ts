import { HttpException } from "./http.exception";
import { HTTP_STATUS } from "../constants/http-status.constant";

export class BadRequestException extends HttpException {
  constructor(message = "Bad Request", errors?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, errors);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized access", errors?: unknown) {
    super(message, HTTP_STATUS.UNAUTHORIZED, errors);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Access forbidden", errors?: unknown) {
    super(message, HTTP_STATUS.FORBIDDEN, errors);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Resource not found", errors?: unknown) {
    super(message, HTTP_STATUS.NOT_FOUND, errors);
  }
}

export class ConflictException extends HttpException {
  constructor(message = "Resource conflict", errors?: unknown) {
    super(message, HTTP_STATUS.CONFLICT, errors);
  }
}

export class ValidationException extends HttpException {
  constructor(message = "Validation error", errors?: unknown) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(message = "Too many requests. Please try again later.", errors?: unknown) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, errors);
  }
}

export class InternalServerException extends HttpException {
  constructor(message = "Internal server error", errors?: unknown) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, errors);
  }
}
