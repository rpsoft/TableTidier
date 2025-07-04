const fs = require('fs');
const resultData = JSON.parse(fs.readFileSync('result.json', 'utf8'));

fs.writeFileSync('test.html', '<html>' + resultData.html_tables.join('') + '</html>');
