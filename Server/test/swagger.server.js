const express = require('express');
const logger = require('morgan')
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const swaggerOptions = require('../swagger.config')

// Load routes to test
// const books = require('./routes/books')


const app = express();
app.use(logger())

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// app.use('/', books)

app.listen(5000, () => console.log("listening on: http://localhost:5000"));