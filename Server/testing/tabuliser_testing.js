"use strict";

var assert = require('assert');

var tabuliser = require("../tabuliser.js")


var all_data_bad = require('../TestTables/test-simple_1_31_all_data_bad.json');
all_data_bad = all_data_bad.tableResults.map( a => { delete a["docid_page"]; return a})

describe('Tabuliser Functionality Testing', function () {
  it(' Basic Annotation', async function () {
    var annotation = require('../TestTables/test-simple_1_31_annotation.json');
    var all_data = require('../TestTables/test-simple_1_31_all_data.json');
    all_data = all_data.tableResults.map( a => { delete a["docid_page"]; return a})

    var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/test_simple.html")

    assert.equal(JSON.stringify(results), JSON.stringify(all_data));
  });

  it(' Header Spreading', async function () {

    var annotation = require('../TestTables/spread_1_31_annotation.json');
    var all_data = require('../TestTables/spread_1_31_all_data.json');
    all_data = all_data.tableResults.map( a => { delete a["docid_page"]; return a})

    var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/spread.html")

    assert.equal(JSON.stringify(results), JSON.stringify(all_data));
  });

  it(' Multiple row Headers', async function () {

    var annotation = require('../TestTables/spread-multiple-headers_1_31_annotation.json');
    var all_data = require('../TestTables/spread-multiple-headers_1_31_all_data.json');
    all_data = all_data.tableResults.map( a => { delete a["docid_page"]; return a})

    var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/spread_multiple_headers.html")

    assert.equal(JSON.stringify(results), JSON.stringify(all_data));
  });
});
//
// describe('Sample table comparison2', function () {
//
//   // it(' The stored result and generated result should be the same2', async function () {
//   //   var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/test_simple.html")
//   //   assert.notEqual(JSON.stringify(results), JSON.stringify(all_data_bad));
//   // });
// });



// describe('Sample table comparison', function () {
//   it(' The stored result and generated result should be the same', async function () {
//
//     all_data_bad = all_data_bad.tableResults.map( a => { delete a["docid_page"]; return a})
//
//     var results = await tabuliser.getFileResults({annotations: annotation.annotation}, "TestTables/test_simple.html")
//
//     assert.equal(JSON.stringify(results), JSON.stringify(all_data_bad));
//   });
// });

//
// describe('whatever2', function () {
//   // describe('#indexOf()', function() {
//   it('should return -65 when the value is not present', function () {
//     assert.equal([1, 2, 3].indexOf(4), -1);
//   }); // });
// });
