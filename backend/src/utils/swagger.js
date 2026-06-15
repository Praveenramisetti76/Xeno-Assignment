function generateSwaggerSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Xeno API',
      version: '1.0.0',
      description: 'API documentation for the Xeno backend'
    }
  };
}

module.exports = { generateSwaggerSpec };
