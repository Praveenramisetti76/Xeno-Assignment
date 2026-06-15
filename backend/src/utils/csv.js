function convertToCSV(headers, data) {
  const headerRow = headers.join(',');
  const dataRows = data.map(row => headers.map(h => `"${row[h]}"`).join(','));
  return [headerRow, ...dataRows].join('\n');
}

module.exports = { convertToCSV };
