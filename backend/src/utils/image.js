function resizeImageMock(buffer, width, height) {
  // Simulating image processing
  return {
    format: 'png',
    size: buffer.length / 2,
    dimensions: { width, height }
  };
}

module.exports = { resizeImageMock };
