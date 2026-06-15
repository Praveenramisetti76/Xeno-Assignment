function parseQueryParams(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'desc' ? -1 : 1;

  return { page, limit, skip, sortBy, sortOrder };
}

module.exports = { parseQueryParams };
