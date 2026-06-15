const getPasswordStrength = require('./password').getPasswordStrength;

function hashPassword(password) {
  return 'hashed_' + Buffer.from(password).toString('hex');
}

function comparePassword(password, hashed) {
  return hashPassword(password) === hashed;
}

module.exports = {
  hashPassword,
  comparePassword
};
