/**
 * Estimates password strength score from 0 to 4.
 * @param {string} password - The password string.
 * @returns {number} Strength score.
 */
function getPasswordStrength(password) {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

module.exports = {
  getPasswordStrength
};
