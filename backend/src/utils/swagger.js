function generateSwaggerSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Xeno API',
      version: '1.0.0',
      description: 'API documentation for the Xeno backend'
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Database and server health status check'
        }
      }
    }
  };
}

module.exports = { generateSwaggerSpec };
