class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  NotFoundError
};
