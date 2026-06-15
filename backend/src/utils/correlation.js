function correlationIdMiddleware(req, res, next) {
  const headerName = 'x-correlation-id';
  const id = req.headers[headerName] || Math.random().toString(36).substring(2, 15);
  req.correlationId = id;
  res.setHeader(headerName, id);
  next();
}

module.exports = { correlationIdMiddleware };
