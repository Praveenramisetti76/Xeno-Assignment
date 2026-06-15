const { formatDate } = require('./date');

describe('Date Utilities', () => {
  test('formats date correctly to standard format', () => {
    const result = formatDate(new Date('2026-06-15'), 'YYYY-MM-DD');
    expect(result).toBe('2026-06-15');
  });
});
