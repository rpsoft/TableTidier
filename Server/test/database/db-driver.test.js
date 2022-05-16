require('dotenv/config')
const fs = require('fs/promises');
const path = require('path');

const CONFIG_PATH = process.env.TEST_CONFIG_PATH || require('./config.json')
// Configuration of database
const DATABASE_CONFIG = require('../../database.json')

const {
  admin,
  james,
  craig,
  lili,
} = require('./users')

const projectPath = '../../src/db/'
// Default type postgres
let driverType = projectPath
let config
let dbDriver
console.log(DATABASE_CONFIG)
// Select the dbDriver to test using rocess.env.DB_DRIVER_TYPE
// types:
//   postgres
//   sqlite
switch (process.env.DB_DRIVER_TYPE) {
  case 'sqlite':
    driverType += 'sqlite-driver.js'
    // filename
    config = DATABASE_CONFIG
    dbDriver = require(driverType)({filename: config.sqlite.filename})

    break;
  default:
    driverType += 'postgres-driver.js'
    config = DATABASE_CONFIG
    dbDriver = require(driverType)(config.postgres)
}
console.log('Loaded driver type: ' + driverType)
console.log('Config: ' + driverType)

beforeAll(async () => {
  await dbDriver.db
});
afterAll(() => dbDriver.close());

describe('dbDriver', () => {
  describe('Users', () => {
    // userGet
    test('Get user test ', async () => {
      const email = 'james@example.com'
      const user = await dbDriver.userGet({email});
      expect(user.email).toEqual(email);
    });
    test('Get unregistered user return undefined', async () => {
      const email = 'invalid@example.com'
      const user = await dbDriver.userGet({email});
      // Usuarfio 
      expect(user).toEqual(undefined);
    });

    // usersGet
    test('Get all users ', async () => {
      const users = await dbDriver.usersGet();
      const usersExpected = [
        admin,
        james,
        lili,
      ]
      expect(users).toEqual(usersExpected);
    });

    // userCreate
    test('Create user', async () => {
      const user = craig
      const result = await dbDriver.userCreate(user);
      const userExist = await dbDriver.userGet({email: user.email});
      expect(result).toEqual('done');
      expect(userExist.email).toEqual(user.email);
    });

    // userDelete
    test('Delete user', async () => {
      const email = 'craig@example.com'
      const result = await dbDriver.userDelete(email);
      const user = await dbDriver.userGet({email});
      expect(user).toEqual(undefined);
    });
  });
  describe('Table', () => {
    const docidValid = '555555555'
    // Get tid - tidGet
    test('Get table tid tidGet invalid docid', async () => {
      const docid = '7777777'
      const page = 1
      const collId = 10
      const table = await dbDriver.tidGet(docid, page, collId);
      expect(table).toEqual('not found');
    });
    test('Get table tid tidGet', async () => {
      const docid = '28905478'
      const page = 1
      const collId = 1
      const table = await dbDriver.tidGet(docid, page, collId);
      expect(table).toEqual('1');
    });

    // tableCreate
    test('Create table fails', async () => {
      const docid = '28905478'
      const page = 1
      const collId = 1
      const result = await dbDriver.tableCreate(docid, page, collId);
      expect(result).toEqual('parameters not valid');
    });
    test('Create table', async () => {
      const docid = docidValid
      const page = 1
      const user = james.email
      const collection_id = 1
      const file_path = 'filePath'
      const result = await dbDriver.tableCreate(docid, page, user, collection_id, file_path);
      expect(result).toEqual('done');
    });

    // tablesMove
    test('Move tables fails', async () => {
      const tables = ['']
      const collection_id = null
      const result = await dbDriver.tablesMove(tables, collection_id);
      expect(result).toEqual('Param docid= or page=undefined not valid at index 0');
    });
    test('Move tables from collection 1 to collection 2', async () => {
      const page = 1
      const docidPageValid = docidValid + '_' + page
      const collection_id = 1
      // Create a test file using equal docid of create table test
      try {
        await fs.writeFile(
          path.join(
            CONFIG_PATH.tables_folder,
            collection_id.toString(),
            docidPageValid + '.html'
          ),
          'TEST FILE. PLEASE DELETE ME IF YOU READ THIS. CAN BE REMOVED!',
        )
      } catch (err) {
        throw err
      }
      const tables = [docidPageValid]
      // Move tables(files) from collection 1 to collection 2
      const result = await dbDriver.tablesMove(tables, collection_id, 2);
      expect(result).toEqual('done');
    });

    // tablesRemove
    test('Remove tables fails', async () => {
      const tables = ['']
      const collection_id = null
      const result = await dbDriver.tablesRemove(tables, collection_id);
      expect(result).toEqual('Param docid= or page=undefined not valid at index 0');
    });
    test('Remove tables', async () => {
      const page = 1
      const docidPageValid = docidValid + '_' + page
      const collection_id = 2

      const tables = [docidPageValid]
      let result = await dbDriver.tablesRemove(tables, collection_id);
      expect(result).toEqual('done');
      try {
        // remove file from deleted documentes
        result = await fs.rm(
          path.join(
            CONFIG_PATH.tables_folder_deleted,
            'deleted',
            docidPageValid + '.html'
          ))
      } catch (err) {
        throw err
      }
      expect(result).toEqual(undefined);
    });

    // notesUpdate
    test('notesUpdate', async () => {
      const docid = '28905478'
      const page = 2
      const collId = 1
      const notes = 'TEST NOTES'
      const tableType = 'result_table_subgroup'
      const completion = 28905478
      // Add note test
      let result = await dbDriver.notesUpdate(
        docid,
        page,
        collId,
        notes,
        tableType,
        completion
      );
      let table = await dbDriver.tableGet(docid, page, collId);
      expect(table.notes).toEqual(notes);
      // Undo changes
      result = await dbDriver.notesUpdate(
        docid,
        page,
        collId,
        '',
        tableType,
        completion
      );
      table = await dbDriver.tableGet(docid, page, collId);
      expect(table.notes).toEqual('');
    });

  });
  describe('Collections', () => {
    // permissionsResourceGet from collection

    // collectionsList
    test('collectionsList', async () => {
      const collectionsList = await dbDriver.collectionsList();
      expect(collectionsList.length).toEqual(1);
      expect(parseInt(collectionsList[0]['table_n'])).toEqual(3);
    });

    // collectionGet
    test('collectionGet', async () => {
      const result = await dbDriver.collectionGet(1);
      expect(Object.keys(result).length).toEqual(8);
      expect(result.collection_id.toString()).toEqual('1');
      expect(result.collectionsList.length).toEqual(1);
    });

    // collectionCreate
    test('collectionCreate', async () => {
      const result = await dbDriver.collectionCreate(
        'health and wellbeing',
        'Description collection about health and wellbeing',
        lili.email
      );
      expect(result.title).toEqual('health and wellbeing');
    });

    // collectionEdit
    test('collectionEdit fails', async () => {
      let result = await dbDriver.collectionEdit({});
      expect(result).toEqual('warning, collection_id not found');
      result = await dbDriver.collectionEdit({
        collection_id: 1,
      });
      expect(result).toEqual('warning, more parameters needed');
    });
    test('collectionEdit', async () => {
      const collectionsList = await dbDriver.collectionsList();
      const collData  = {
        // get last added collection_id
        collection_id: collectionsList.at(-1).collection_id,
        // title: 'algo',
        description: 'EDITED: Description collection about health and wellbeing',
        owner_username: admin.email,
        // completion: 'algo',
        // visibility: 'algo',
      } 
      const result = await dbDriver.collectionEdit(collData);
      expect(result.owner_username).toEqual(admin.email);
    });

    // collectionDelete
    test('collectionDelete', async () => {
      // Delete last collection
      const collectionsList = await dbDriver.collectionsList();
      const result = await dbDriver.collectionDelete(collectionsList.at(-1).collection_id);
      expect(result).toEqual('done');
    });
  });
  describe('Annotations', () => {
    // annotationByIDGet
    test('annotationByIDGet table not valid', async () => {
      const docid = '3333333'
      const page = 2
      const collId = 1
      const annotations = await dbDriver.annotationByIDGet(docid, page, collId);
      expect(annotations).toEqual(null);
    });
    test('annotationByIDGet table page without anotations ', async () => {
      const docid = '28905478'
      const page = 2
      const collId = 1
      const annotations = await dbDriver.annotationByIDGet(docid, page, collId);
      expect(typeof annotations).toEqual('object');
      expect(annotations.annotation).toEqual(null);
    });
    test('annotationByIDGet', async () => {
      const docid = '28905478'
      const page = 1
      const collId = 1
      const annotations = await dbDriver.annotationByIDGet(docid, page, collId);
      expect(annotations.annotation.annotations.length).toEqual(5);
    });
    // annotationDataGet
    test('annotationDataGet table not valid', async () => {
      const tids = null
      const annotations = await dbDriver.annotationDataGet(tids);
      expect(annotations).toEqual('tids not valid, array expected');
    });
    test('annotationDataGet table not valid', async () => {
      const tids = []
      const annotations = await dbDriver.annotationDataGet(tids);
      expect(annotations).toEqual([]);
    });
    test('annotationDataGet', async () => {
      const tids = [1, 2]
      const annotations = await dbDriver.annotationDataGet(tids);
      expect(annotations.length).toEqual(1);
    });
    // annotationResultsGet
    test('annotationResultsGet', async () => {
      const annotations = await dbDriver.annotationResultsGet();
      expect(annotations.length).toEqual(1);
    });
    // annotationInsert
    test('annotationInsert fail tid = array', async () => {
      const tid = [1, 2]
      const annotations = await dbDriver.annotationInsert(tid);
      expect(annotations).toEqual('tid not valid, enter integer Number or String');
    });
    test('annotationInsert fail tid = array', async () => {
      const tid = 1
      let annotationsTableTest = await dbDriver.annotationDataGet([tid]);

      annotationsTableTest[0].annotation.annotations.push(
        {
          content: { characteristic_level: true },
          location: 'Col',
          number: '2',
          qualifiers: { indented: true }
        },
      )
      // Add annotation
      const annotations = await dbDriver.annotationInsert(tid, annotationsTableTest[0].annotation);
      expect(annotations).toEqual(undefined);
      annotationsTableTest = await dbDriver.annotationDataGet([tid]);
      expect(annotationsTableTest[0].annotation.annotations.length).toEqual(6);
      // Remove added annotation
      annotationsTableTest[0].annotation.annotations.pop()
      await dbDriver.annotationInsert(tid, annotationsTableTest[0].annotation);
      annotationsTableTest = await dbDriver.annotationDataGet([tid]);
      expect(annotationsTableTest[0].annotation.annotations.length).toEqual(5);
    });
  });
  describe('Metadata', () => {
    // metadataGet
    test('metadataGet', async () => {
      const tids = 1
      const metadata = await dbDriver.metadataGet(tids);
      expect(metadata.length).toEqual(1);
      expect(metadata[0].tid).toEqual(1);
    });
    test('metadataGet multiple tids', async () => {
      const tids = [1, 2]
      const metadata = await dbDriver.metadataGet(tids);
      expect(metadata.length).toEqual(1);
      expect(metadata[0].tid).toEqual(1);
    });

    // metadataSet
    test('metadataSet', async () => {
      const {
        concept_source,
        concept_root,
        concept,
        cuis,
        cuis_selected,
        qualifiers,
        qualifiers_selected,
        istitle,
        labeller,
        tid
      } = {
        concept_source: '',
        concept_root: '',
        concept: '£90 ml/minute',
        cuis: 'C0439232;C0700321',
        cuis_selected: 'C0439232;C0700321',
        qualifiers: '',
        qualifiers_selected: '',
        istitle: false,
        labeller: 'james@example.com',
        tid: 2
      }
      const tids = 1
      const metadata = await dbDriver.metadataSet(
        concept_source,
        concept_root,
        concept,
        cuis,
        cuis_selected,
        qualifiers,
        qualifiers_selected,
        istitle,
        labeller,
        tid
      );
      expect(metadata).toEqual(undefined);
    });
    // metadataClear
    test('metadataClear', async () => {
      const tid = 2
      const metadata = await dbDriver.metadataClear(tid);
      expect(metadata).toEqual(undefined);
    });
    // cuiMetadataGet
    test.skip('cuiMetadataGet', async () => {
      const cui = 'C0439232'
      const metadataInfo = await dbDriver.cuiMetadataGet();
      expect(dbDriver).toEqual(null);
    });
    // metadataLabellersGet
  });
  describe('Cuis', () => {
    // cuisIndexGet
    test('cuisIndexGet', async () => {
      const result = {
        "C0001551": {
          "adminApproved": false, "hasMSH": true, "preferred": "Immunologic Adjuvants", "userDefined": false
        },
        "C0001552": {
          "adminApproved": false, "hasMSH": true, "preferred": "Pharmaceutical Adjuvants", "userDefined": false
        },
        "C0001613": {
          "adminApproved": false, "hasMSH": true, "preferred": "Adrenal Cortex", "userDefined": false
        }
      }
      const cuis = await dbDriver.cuisIndexGet();
      expect(cuis).toEqual(result);
    });
    // cuiInsert
    test('cuiInsert', async () => {
      const cui = 'C0001675'
      const preferred = 'Adult'
      const hasMSH = true
      const result = await dbDriver.cuiInsert(
        cui,
        preferred,
        hasMSH,
      );
      expect(result).toEqual('done');
    });
    // cuiDataModify
    test('cuiDataModify', async () => {
      const cui = 'C0001675'
      const preferred = 'Adult UPDATED VALUE'
      const hasMSH = true
      const cuis = await dbDriver.cuiDataModify(
        cui,
        preferred,
        // adminApproved,
        true,
        cui,
      );

      expect(cuis).toEqual('done');
    });
    test('cuiDataModify changes metadata', async () => {
      const preferred = 'Adult UPDATED VALUE'
      const hasMSH = true
      // Change metadata cui
      await dbDriver.cuiDataModify(
        'C0439233',
        preferred,
        // adminApproved,
        true,
        'C0439232',
      );
      // Check metadata change
      let metadata = await dbDriver.metadataGet(1);
      expect(metadata[0].cuis.includes('C0439233')).toEqual(true);
      
      // Return metadata to original
      await dbDriver.cuiDataModify(
        'C0439232',
        preferred,
        // adminApproved,
        true,
        'C0439233',
      );
      metadata = await dbDriver.metadataGet(1);
      expect(metadata[0].cuis.includes('C0439233')).toEqual(false);
    });

    // cuiDeleteIndex
    test('cuiDeleteIndex', async () => {
      const cui = 'C0001675'
      const result = await dbDriver.cuiDeleteIndex(cui);
      expect(result).toEqual('done');
    });
    // cuiRecommend
    test('cuiRecommend', async () => {
      const recommend = await dbDriver.cuiRecommend();
      expect(recommend.length).toEqual(2);
      expect(recommend[0].concept).toEqual('aminosalicylate');
    });
  });
  describe('Permissions', () => {
    // permissionsResourceGet
    test('permissionsResourceGet', async () => {
      const permissions = await dbDriver.permissionsResourceGet('collections', james.email);
      expect(permissions).toEqual({read: [1], write: [1]});
    });
  });
  // resultsDataGet
});