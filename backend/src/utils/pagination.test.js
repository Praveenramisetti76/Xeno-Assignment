const { getPaginatedData } = require('./pagination');

describe('Pagination Helper', () => {
  test('returns paginated slice of items', () => {
    const list = [1, 2, 3, 4, 5];
    const result = getPaginatedData(list, 2, 2);
    expect(result.items).toEqual([3, 4]);
    expect(result.totalPages).toBe(3);
  });
});
