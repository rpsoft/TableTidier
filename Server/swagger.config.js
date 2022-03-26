// More info...
// https://swagger.io/specification/
// https://github.com/Surnet/swagger-jsdoc

module.exports = {
  definition: {
      openapi: '3.0.0',
      info: {
        title: "TableTidier Library API",
        // Update with changes on API
        version: '2022/3/26',
    },
  },
  // Change path as needed
  apis: ["app.js", './routes/*.js'],
}