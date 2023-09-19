/**
 * * Classifier testing
 * 
 * - Classifier module uses UMLSData function
 *  Loading UMLSData takes long time to parse (seconds approx 1.3 sec)
 * 
 * - Classifier also uses a python module that also takes time to load a machine learning model
 *  It takes approx. another 1.6 seconds.
 * Then each call to the model takes between 50 - 100 ms
 * 
 * That is why it takes 2 seconds and a half more time the first call.
 * 
 *  PASS  test/classifier.test.js (9.314 s)
 *  classifiers
 *   ✓ feature_extraction (5011 ms)
 *   ✓ attemptPrediction (2548 ms)
 *  Test Suites: 1 passed, 1 total
 *  Tests:       2 passed, 2 total
 *  Snapshots:   2 passed, 2 total
 *  Time:        9.354 s, estimated 14 s
 * 
 *  This test uses snapshots so you can have a look to __snapshots__ folder.
 * 
 */

const fs = require('fs/promises');
import {format as prettyFormat} from 'pretty-format'; // ES2015 modules

const rootPathServer = process.cwd().endsWith('Server') ?
  true
  : false
console.log(process.cwd())
const classifierPath = rootPathServer ?
  '../src/classifier.js'
  : '../src/classifier.js'

// const {
//   feature_extraction,
// } = require(classifierPath);

import {
  predictionFeaturesExtractor,
  attemptPrediction,
} from '../src/classifier.js';


// Format / Serialize snapshot output
//  Added Array length and compact inner arrays 

const SEPARATOR = ',';
function serializeItems(items, config, indentation, depth, refs, printer) {
  if (items.length === 0) {
    return '';
  }
  const indentationItems = indentation + config.indent;
  return (
    config.spacingOuter +
    items
      .map(
        item => {
          //  Added Array length and compact inner arrays 
          if (Array.isArray(item)) {
            return indentationItems + 
              `Array ${item.length} [${item.map(el => `"${el}"`).join(', ').toString()}]`
          }
          return indentationItems +
            printer(item, config, indentationItems, depth, refs) // callback
        }
      )
      .join(SEPARATOR + config.spacingInner) +
    (config.min ? '' : SEPARATOR) + // following the last item
    config.spacingOuter +
    indentation
  );
}

const plugin = {
  test(value) {
    return value && Array.isArray(value);
  },
  serialize(array, config, indentation, depth, refs, printer) {
    const name = array.constructor.name;
    //  Added Array length 
    return ++depth > config.maxDepth
      ? `[${name}] ${array.length}`
      : `${config.min ? '' : `${name} ${array.length} `}[${serializeItems(
          array,
          config,
          indentation,
          depth,
          refs,
          printer,
        )}]`;
  },
}

expect.addSnapshotSerializer(plugin);

let tableHtmlTest

beforeAll(
  async () => {
    tableHtmlTest = await fs.readFile(
      rootPathServer ?
        // path Server
        './test/classifier.test.table.html'
        // path Server/test
        : './classifier.test.table.html',
      {encoding: 'utf-8'}
    )
  }
);

describe('classifiers', () => {

  test('feature_extraction', async () => {
      const result = await predictionFeaturesExtractor(tableHtmlTest)

      // * Testing format output
      // console.log(
      //   prettyFormat(result.slice(0,2), {
      //     plugins: [plugin],
      //   }),
      // );
      expect(result).toMatchSnapshot();

    },
    // timeout 15 seconds
    15e3
  );

  test('attemptPrediction', async () => {
    const result = await attemptPrediction(tableHtmlTest)
    expect(result).toMatchSnapshot();

  });
  
});
