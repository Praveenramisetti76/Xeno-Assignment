function getSystemStats() {
  return {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    nodeVersion: process.version
  };
}

module.exports = { getSystemStats };
