function checkHealth(dbConnection) {
  const readyState = dbConnection ? dbConnection.readyState : 0;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return {
    uptime: process.uptime(),
    dbStatus: states[readyState] || 'unknown',
    timestamp: Date.now()
  };
}

module.exports = { checkHealth };
