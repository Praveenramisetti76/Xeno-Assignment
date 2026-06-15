// Compiled regex for performance
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address format.
 * @param {string} email - The email string to validate.
 * @returns {boolean} True if email format is valid, false otherwise.
 */
function isValidEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Formats a 10-digit phone number.
 * @param {string} phone - The phone string to format.
 * @returns {string|null} Formatted phone number or null.
 */
function formatPhoneNumber(phone) {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return null;
}

module.exports = {
  isValidEmail,
  formatPhoneNumber
};
