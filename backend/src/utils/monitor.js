let isMaintenanceMode = false;

function toggleMaintenanceMode(value) {
  isMaintenanceMode = value;
}

function getSystemStats() {
  return {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    nodeVersion: process.version,
    maintenance: isMaintenanceMode
  };
}

module.exports = { getSystemStats, toggleMaintenanceMode };
