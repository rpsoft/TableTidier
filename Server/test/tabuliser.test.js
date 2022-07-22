const {
  getFileResults
} = require('../src/tabuliser');

// console.log(process.cwd())

// DB annotation output from dbdriver.annotationByIDGet(docid, page, collId)
const entry = {"docid":"NCT02827708","page":1,"user":"baseline_elig","notes":"","collection_id":86,"file_path":"NCT02827708_1.html","tableType":"baseline_table","tid":4599,"completion":"preliminary","annotation":{"annotations":[{"location":"Row","content":{"arms":true},"number":"1","qualifiers":{},"subannotation":false,"subAnnotation":false},{"location":"Col","content":{"characteristic_level":true},"number":"1","qualifiers":{"bold":true},"subannotation":false,"subAnnotation":false},{"location":"Col","content":{"characteristic_name":true},"qualifiers":{},"number":"1","subAnnotation":true}]},"doi":null,"pmid":null,"url":null}



test('tabuliser', async () => {
  const result = await getFileResults(
    entry.annotation,
    'test/tabuliser.test.NCT02827708.html'
  )
  expect(result.length).toBe(72);
  expect(result[0]).toEqual({
    "arms@1": "Oral semaglutide group",
    "characteristic_level@1": "n",
    "characteristic_name@1": "",
    "col": 2,
    "row": 1,
    "value": "163"
  });
});