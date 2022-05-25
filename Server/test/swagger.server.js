const util = require('util')
const express = require('express');
const logger = require('morgan')
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const swaggerOptions = require('../swagger.config')

// IP Port for swagger server http server
const PORT = 5000

const app = express();
app.use(logger('tiny'))

// Load routes to test
const swaggerDocs = swaggerJsDoc(swaggerOptions);
console.log(util.inspect(swaggerDocs, {showHidden: false, depth: null, colors: true}))

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.listen(PORT, () => console.log(`listening on: http://localhost:${PORT}/api-docs`));