function getPaginatedData(items, page, limit) {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    totalItems: items.length,
    totalPages: Math.ceil(items.length / limit),
    currentPage: page,
    items: items.slice(startIndex, endIndex)
  };
}

module.exports = { getPaginatedData };
