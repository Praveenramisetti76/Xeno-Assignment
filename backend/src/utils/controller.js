class BaseController {
  sendResponse(res, statusCode, data, message = 'Success') {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data
    });
  }

  sendError(res, apiError) {
    return res.status(apiError.statusCode || 500).json({
      status: apiError.status || 'error',
      message: apiError.message
    });
  }
}

module.exports = BaseController;
