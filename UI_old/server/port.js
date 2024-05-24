const argv = require('./argv');

module.exports = parseInt(argv.port || process.env.PORT || '7531', 10);

// console.log(argv);

// console.log(process.argv);
