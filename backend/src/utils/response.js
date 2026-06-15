function formatResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    data
  };
}

module.exports = { formatResponse };
