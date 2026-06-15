function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/[<>]/g, ''); // Basic XSS clean
      }
    }
  }
  next();
}

module.exports = { sanitizeInput };
