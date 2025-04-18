// More info...
// https://swagger.io/specification/
// https://github.com/Surnet/swagger-jsdoc
const CONFIG = require('./config.json')

module.exports = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "TableTidier Library API",
      // Update with changes on API
      version: '2022/3/26',
    },
    servers: [
      {
        url: `http://localhost:${CONFIG.api_port}`,
      }
    ],
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      }
    }
  },
  // Change path as needed
  apis: ['./app.js', './src/routes/*.js'],
}