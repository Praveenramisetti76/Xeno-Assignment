function loadConfig() {
  return {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/xeno',
    jwtSecret: process.env.JWT_SECRET || 'supersecret'
  };
}

module.exports = { loadConfig };
