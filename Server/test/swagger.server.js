const util = require('util')
const express = require('express');
const logger = require('morgan')
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const swaggerOptions = require('../swagger.config')

// Load routes to test
// const books = require('./routes/books')

const PORT = 5000

const app = express();
app.use(logger())

const swaggerDocs = swaggerJsDoc(swaggerOptions);
console.log(util.inspect(swaggerDocs, {showHidden: false, depth: null, colors: true}))

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// app.use('/', books)

app.listen(PORT, () => console.log(`listening on: http://localhost:${PORT}/api-docs`));