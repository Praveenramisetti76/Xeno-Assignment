const { isValidEmail, formatPhoneNumber } = require('./validation');

describe('Validation Helpers', () => {
  test('isValidEmail checks email validity', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  test('formatPhoneNumber formats number correctly', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
  });
});
