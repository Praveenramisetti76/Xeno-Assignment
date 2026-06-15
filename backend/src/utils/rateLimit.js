const rateLimits = new Map();

function simpleRateLimiter(limit = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }
    
    const timestamps = rateLimits.get(ip).filter(t => now - t < windowMs);
    timestamps.push(now);
    rateLimits.set(ip, timestamps);
    
    if (timestamps.length > limit) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    next();
  };
}

module.exports = { simpleRateLimiter };
