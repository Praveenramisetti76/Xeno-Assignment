function formatDate(date, formatStr = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return formatStr
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
}

module.exports = { formatDate };
