const activeSessions = new Set();

function registerSession(userId) {
  activeSessions.add(userId);
}

function removeSession(userId) {
  activeSessions.delete(userId);
}

module.exports = { registerSession, removeSession };
