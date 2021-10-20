var assert = require('assert');
var tabuliser = require("../tabuliser.js")

describe('Tabuliser Functionality Testing', function () {
  it(' Basic Annotation', async function () {
    var annotation = require('../TestTables/test-simple_1_31_annotation.json');
    var all_data = require('../TestTables/test-simple_1_31_all_data.json');
    all_data = all_data.tableResults.map( a => { delete a["docid_page"]; return a})

    var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/test_simple.html")

    assert.equal(JSON.stringify(results), JSON.stringify(all_data));
  });

  it(' Header Spreading', async function () {

    var annotation = require('../TestTables/spread-multiple-columns_1_31_annotation.json');
    var all_data = require('../TestTables/spread-multiple-columns_1_31_all_data.json');
    all_data = all_data.tableResults.map( a => { delete a["docid_page"]; return a})

    var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/spread_multiple_columns.html")

    assert.equal(JSON.stringify(results), JSON.stringify(all_data));
  });

  it(' Multiple row Headers', async function () {

    var annotation = require('../TestTables/spread-multiple-headers_1_31_annotation.json');
    var all_data = require('../TestTables/spread-multiple-headers_1_31_all_data.json');
    all_data = all_data.tableResults.map( a => { delete a["docid_page"]; return a})

    var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/spread_multiple_headers.html")

    assert.equal(JSON.stringify(results), JSON.stringify(all_data));
  });

  it(' Composite headers', async function () {
    var annotation = require('../TestTables/composite-formats_annotation.json');
    var all_data = require('../TestTables/composite-formats_all_data.json');
    all_data = all_data.tableResults.map( a => { delete a["docid_page"]; return a})

    var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/composite_formats.html")

    assert.equal(JSON.stringify(results), JSON.stringify(all_data));
  });

});
