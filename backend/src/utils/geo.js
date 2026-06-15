function getGeoFromIP(ip) {
  // Mocked IP Geolocation lookup
  if (ip === '127.0.0.1') return { country: 'Localhost', code: 'LH' };
  return { country: 'United States', code: 'US' };
}

module.exports = { getGeoFromIP };
