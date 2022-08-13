// Environmet NODE_ENV DEV 'dev', 'prod' 
const sqlite3 = (
    process.env.NODE_ENV == 'test' ||
    process.env.NODE_ENV == 'dev'
  ) ?
    require('sqlite3').verbose()
    : require('sqlite3');
console.log('environment: '+process.env.NODE_ENV)
const path = require('path');

const {
  fileToCollectionMove,
  fileFromCollectionDelete,
} = require('../utils/files')

const {
  tablesDocidPageGet,
} = require('./utils-db')

function driver(config) {
  // :-) Check config has valid fields
  console.log("Configuring DB client: Sqlite")
  const {
    // Database filename
    filename,
  } = config

  // Load database handler
  let db
  // let db = new sqlite3.Database(':memory:');
  const dbLoadingPromise = new Promise((resolve, reject) => {
    // Return _db when database is open
    const _db = new sqlite3.Database(filename, (err) => {
      if (err) return reject(err)
      // When loaded store local _db in global db
      db = _db
      resolve()
    });
  })

  // Generic Calls
  const query = (action, queryText, values) => {
    return new Promise((resolve, reject) => {
      if (!db) {
        return reject(new Error('Database.close: database is not open'));
      }
      db[action](queryText, values, (err, result) => {
        if (err) {
          // if (err.includes('no such table'))
          return reject(new Error('Database: '+err));
        }
        resolve(result)
      })
    })
  }

  const queryGet = (queryText, values) => query('get', queryText, values)
  const queryAll = (queryText, values) => query('all', queryText, values)
  const queryRun = (queryText, values) => query('run', queryText, values)



  return {
    // Return db handler
    db: dbLoadingPromise,
    close: () => db.close(),

    // Returns the annotation for a single document/table
    annotationByIDGet: async (docid, page, collId) => {
      if ( docid == 'undefined' || page == 'undefined' || collId == 'undefined' ) {
        return `parameters not valid`
      }

      const annotations = await queryGet(
      `SELECT 
        docid,
        "page",
        "user",
        notes,
        collection_id,
        file_path,
        "tableType",
        "table".tid,
        completion,
        annotation,
        "table".doi,
        "table".pmid,
        "table".url
      FROM 
        "table"
      LEFT JOIN
        annotations
      ON
        "table".tid = annotations.tid
      WHERE
      docid=$1 AND page=$2 AND collection_id = $3`,
        [docid, page, collId]
      )
      if (annotations == undefined) {
        return null
      }
      annotations.annotation = JSON.parse(annotations.annotation)
      return annotations
    },

    // Get multiple tables and annotations
    annotationDataGet: async (tids) => {
      if (Array.isArray(tids) == false) return 'tids not valid, array expected'
      const annotations = await queryAll(
        `SELECT 
          docid,
          page,
          collection_id,
          file_path,
          "table".tid,
          "annotations".annotation
        FROM 
          "table",
          "annotations"
        WHERE
          "table".tid = "annotations".tid AND "table".tid IN (${tids})`
      )
      if (
        annotations == undefined ||
        annotations.length == 0
      ) {
        return []
      }
      annotations.forEach(row => row.annotation = JSON.parse(row.annotation))
      return annotations
    },

    annotationInsert: (tid, annotation) => {
      if (Array.isArray(tid) == true) return 'tid not valid, enter integer Number or String'
      if (/^[0-9]+$/.test(tid) == false) return 'tid not valid, enter integer Number or String'

      return queryRun(
        `INSERT INTO annotations 
        VALUES($annotation, $tid) ON CONFLICT (tid) DO UPDATE SET annotation = $annotation;`,
        {
          $tid: tid,
          $annotation: JSON.stringify(annotation)
        }
      )
    },

    // Get all tables with its annotations
    annotationResultsGet: async () => {
      const result = await queryAll(
        `SELECT * FROM "table", annotations 
        WHERE "table".tid = annotations.tid
        ORDER BY docid desc, page ASC`
      )
      // var filtered_rows = []
      //
      // var hey = available_documents
      //
      // var docids = Object.keys(available_documents)
      //
      // for ( var i=0; i < result.rows.length; i++ ) {
      //
      //   if (  docids.indexOf (result.rows[i].docid) > -1 ){
      //     filtered_rows.push(result.rows[i])
      //   }
      //
      // }
      //
      // result.rows = filtered_rows

        // debugger
      return result
    },

    collectionCreate: async (title, description, owner) => {
      const result = await queryGet(
        `INSERT INTO collection(
          collection_id, title, description, owner_username, visibility, completion)
        VALUES ((SELECT IFNULL(max(collection_id), 0) + 1 FROM collection), $1, $2, $3, $4, $5)
        returning *;`,
        [title, description, owner, 'public', 'in progress']
      )
      // const result = await query(
      //   `Select * from collection
      //   ORDER BY collection_id DESC LIMIT 1;`
      // )
      return result
    },

    collectionDelete: async function (collection_id) {
      try {
        const tables = await queryAll(
          `SELECT docid, page FROM "table" WHERE collection_id = $1`,[collection_id]
        )
        await this.tablesRemove(tables, collection_id, true);
        await queryRun(
          `DELETE FROM collection WHERE collection_id = $1`, [collection_id]
        )
      } catch (err) {
        return err
      }
      return 'done'
    },

    collectionEdit: async (collData) => {
      if (collData?.collection_id == undefined) return 'warning, collection_id not found'
      if (Object.keys(collData).length == 1) return 'warning, more parameters needed'
      const validFields = [
        'collection_id', 
        'title',
        'description',
        'owner_username',
        'visibility',
        'completion',
      ]
      // Generate query in function of parameters.
      const collDataFormated = {
        '$collection_id': collData.collection_id
      }
      let _query = `UPDATE collection
      SET `
      const footer = ` WHERE collection_id=$collection_id returning *;`
      for (const item in collData) {
        if (
          // collection_id already included, skip
          item == 'collection_id' ||
          // or field not included in database
          validFields.includes(item) == false
        ) continue
        collDataFormated['$'+item] = collData[item]
        _query += `${item}=$${item}, `
      }
      _query = _query.slice(0, -2).concat(footer)
      try {
        const result = await queryGet(
          _query,
          collDataFormated
        )
        return result
      } catch (err) {
        console.log(err)
        return err
      }
    },

    collectionGet: async (collection_id) => {
      const result = await queryAll(
        `SELECT *
        FROM collection WHERE collection_id = $1`, [collection_id])
  
      if (result.length == 0) {
        return 'collection not found'
      }

      const tables = await queryAll(
        `SELECT docid, page, "user", notes, tid, collection_id, file_path, "tableType"
        FROM "table" WHERE collection_id = $1 ORDER BY docid,page`, [collection_id])
  
      const collectionsList = await queryAll(
        `SELECT * FROM collection ORDER BY collection_id`);

      if ( result.length == 1) {
        return {
          ...result[0],
          tables,
          collectionsList,
        }
      }
      return {}
    },

    collectionsList: async () => {
      const result = await queryAll(
        `SELECT collection.collection_id, title, description, owner_username, table_n
        FROM collection
        LEFT JOIN
        ( SELECT collection_id, count(docid) as table_n FROM
        ( select distinct docid, page, collection_id from "table" ) as interm
        group by collection_id ) as coll_counts
        ON collection.collection_id = coll_counts.collection_id ORDER BY collection.collection_id`
      )
      return result
    },

    cuiInsert: async (cui, preferred, hasMSH) => {
      const result = await queryRun(
      `INSERT INTO cuis_index(cui, preferred, "hasMSH", user_defined, admin_approved)
      VALUES (
        $cui,
        $preferred,
        $hasMSH,
        $user_defined,
        $admin_approved
      ) ON CONFLICT (cui) DO UPDATE 
      SET 
        preferred = $preferred,
        "hasMSH" = $hasMSH,
        user_defined = $user_defined,
        admin_approved = $admin_approved`,
      {
        $cui: cui,
        $preferred: preferred,
        $hasMSH: hasMSH,
        $user_defined: true,
        $admin_approved: false
      })
      return 'done'
    },

    cuiDataModify: async (cui, preferred, adminApproved, prevcui) => {
      // Update cuis_index table
      let result = await queryRun(
        `UPDATE cuis_index SET cui=$1, preferred=$2, admin_approved=$3 WHERE cui = $4`,
        [cui, preferred, adminApproved, prevcui]
      )

      // Update metadata table
      result = await queryRun(
        `UPDATE metadata 
        SET
          cuis = REPLACE(cuis, $prevcui, $cui),
          cuis_selected = REPLACE(cuis_selected, $prevcui, $cui);`,
        {
          $cui: cui,
          $prevcui: prevcui
        }
      )

      return 'done'
    },

    cuiDeleteIndex: async (cui) => {
      await queryRun('delete from cuis_index where cui = $1', [cui])
      return 'done'
    },

    cuiRecommend: async () => {
      const result = await queryAll(`select * from cuis_recommend`)
      return result
    },

    cuisIndexGet: async () => {
      const cuis = {}
      const result = await queryAll(`select * from cuis_index ORDER BY preferred ASC`)
      result.forEach( row => {
        cuis[row.cui] = {
          preferred : row.preferred,
          hasMSH: row.hasMSH ? true: false,
          userDefined: row.user_defined ? true: false,
          adminApproved: row.admin_approved ? true: false
        }
      })
    
      return cuis
    },

    cuiMetadataGet: (cui) => queryAll(`select docid,page,"user" from metadata where cuis like $1 `, ["%"+cui+"%"]),

    metadataClear: (tid) => queryRun('DELETE FROM metadata WHERE tid = $1', [tid]),

    metadataGet: (tids) => queryAll(`SELECT * FROM metadata WHERE tid IN (${tids})`),

    metadataSet: (
      concept_source,
      concept_root,
      concept,
      cuis,
      cuis_selected,
      qualifiers,
      qualifiers_selected,
      istitle=false,
      labeller,
      tid
    ) => queryRun(`
    INSERT INTO 
    metadata(
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
    )
    VALUES (
      $concept_source,
      $concept_root,
      $concept,
      $cuis,
      $cuis_selected,
      $qualifiers,
      $qualifiers_selected,
      $istitle,
      $labeller,
      $tid
    )
    ON CONFLICT (concept_source, concept_root, concept, tid)
    DO UPDATE SET
      cuis = $cuis,
      cuis_selected = $cuis_selected,
      qualifiers = $qualifiers,
      qualifiers_selected = $qualifiers_selected,
      istitle = $istitle,
      labeller = $labeller`,
    {
      $concept_source: concept_source,
      $concept_root: concept_root,
      $concept: concept,
      $cuis: cuis,
      $cuis_selected: cuis_selected,
      $qualifiers: qualifiers,
      $qualifiers_selected: qualifiers_selected,
      $istitle: istitle,
      $labeller: labeller,
      $tid: tid
    }),

    // Gets the labellers associated w ith each document/table.
    metadataLabellersGet: () => query(`SELECT distinct docid, page, labeller FROM metadata`),

    notesUpdate: async (docid, page, collid, notes, tableType, completion) => {
      await queryRun(
        `UPDATE "table"
        SET
          notes=$notes,
          "tableType"=$tableType,
          completion=$completion
        WHERE
          docid=$docid AND page=$page AND collection_id=$collid`,
        {
          $docid: docid,
          $page: page,
          $collid: collid,
          $notes: notes,
          $tableType: tableType,
          $completion: completion
        }
      )
      return 'done'
    },

    // resource = {type: [collection or table], id: [collection or table id]}
    permissionsResourceGet: async (resource, user) => {
      let permissions;

      switch (resource) {
        case 'collections':
          permissions = await queryAll(
            `select *,
            (owner_username = $1) as write,
            (visibility = 'public' OR owner_username = $1) as read
            from collection`,
            [user]
          )
          break;
        case 'table':
          break;
        default:
      }

      return permissions?.reduce( (acc, row) => {
        if (row.read) {
          acc.read.push(row.collection_id)
        }
        if (row.write) {
          acc.write.push(row.collection_id)
        }
        return acc
      },
        {read:[], write:[]}
      )
    },

    resultsDataGet: (tids) => query(`SELECT * FROM "result" WHERE tid = ANY ($1)`, [tids]),

    tableCreate: async (docid, page, user, collection_id, file_path) => {
      // not valid parameters?
      if (!!(docid && page && user && collection_id && file_path) == false) {
        return `parameters not valid`
      }
      try {
        await queryRun(
          `INSERT INTO "table"(
             tid, docid, page, "user", notes, collection_id, file_path, "tableType")
           VALUES ((SELECT IFNULL(max(tid), 0) + 1 FROM "table"), $1, $2, $3, $4, $5, $6, $7);`,
          [docid, page, user, '', collection_id, file_path, '']
          )
      } catch (err) {
        return err
      }
      return 'done'
    },

    tableGet: async (docid, page, collId) => {
      let tid = await queryGet(
        `SELECT * FROM "table" WHERE docid = $1 AND page = $2 AND collection_id = $3`,
        [docid, page, collId]
      )
      if ( tid && tid.length == 0 ){
        return 'not found'
      }
      return tid
    },

    tableGetByTid: async (tid) => {
      const result = await queryGet(
        `SELECT * FROM "table" WHERE tid = $1`,
        [tid]
      )
      if ( result && result.length == 0 ){
        return 'not found'
      }
      return result
    },

    tableReferencesUpdate: async (tid, pmid, doi, url) => {
      await queryRun(
      `UPDATE "table"
      SET
        pmid=$2,
        doi=$3,
        url=$4
      WHERE
        tid=$1`,
      {
        $1: tid,
        $2: pmid,
        $3: doi,
        $4: url
      })
      return 'done'
    },

    tablesMove: async (tables, collection_id, target_collection_id) => {
      if (Array.isArray(tables) == false) return 'tables not valid, array expected'
      if (tables.length == 0) return 'tables empty'

      let tablesDocidPage
      try {
        tablesDocidPage = tablesDocidPageGet(tables)
      } catch(err) {
        return err
      }

      for ( let table of tablesDocidPage) {
        const {
          docid,
          page,
        } = table

        await queryRun(
          `UPDATE "table"
          SET collection_id=$4
          WHERE docid = $1 AND page = $2 AND collection_id = $3;`,
          {
            $1: docid,
            $2: page,
            $3: collection_id,
            $4: target_collection_id
          })
  
        const filename = `${docid}_${page}.html`;
        try{
          await fileToCollectionMove(
            {
              filename,
              collIdCurrent: collection_id.toString(),
              // current path
              path: path.join(
                collection_id.toString(),
                filename
              )
            },
            target_collection_id
          )
        } catch (err){
          const errorText = `MOVE FAil: ` + err + JSON.stringify(err)
          return errorText
        }
      }
  
      return 'done'
    },

    tablesMoveByTid: async (tables, collection_id, target_collection_id) => {
      if (Array.isArray(tables) == false) return 'tables not valid, array expected'
      if (tables.length == 0) return 'tables empty'

      for (const tid of tables) {
        const movedTable = await queryGet(
          `UPDATE "table"
          SET collection_id=$4
          WHERE docid = $1 AND page = $2 AND collection_id = $3 returning *;`,
          {
            $1: docid,
            $2: page,
            $3: collection_id,
            $4: target_collection_id
          })
  
        const {
          file_path: filename,
        } = movedTable
        try{
          await fileToCollectionMove(
            {
              filename,
              collIdCurrent: collection_id.toString(),
              // current path
              path: path.join(
                collection_id.toString(),
                filename
              )
            },
            target_collection_id
          )
        } catch (err){
          const errorText = `MOVE FAil: ` + err + JSON.stringify(err)
          return errorText
        }
      }
  
      return 'done'
    },

    tablesRemove: async (tables, collection_id, fromSelect = false) => {
      if (Array.isArray(tables) == false) return 'tables not valid, array expected'
      if (tables.length == 0) return 'tables empty'

      let tablesDocidPage
      try {
        tablesDocidPage = tablesDocidPageGet(tables)
      } catch(err) {
        return err
      }
  
      for (let table of tablesDocidPage) {
        const {
          docid,
          page,
        } = table
        let tableDeleted

        try {
          tableDeleted = await queryGet(
            `DELETE FROM "table"
            WHERE docid = $1 AND page = $2 AND collection_id = $3 returning *;`,
            [docid, page, collection_id]
          )
        } catch (err) {
          return err
        }
  
        const {
          file_path: filename,
          tid,
        } = tableDeleted

        try{
          await fileFromCollectionDelete(
            {
              filename,
              // current path
              path: path.join(
                collection_id.toString(),
                filename
              ),
              tid,
            },
            'deleted' 
          )
        } catch (err) {
          const errorText = `REMOVE FAil: ` + err + JSON.stringify(err)
          return errorText
        }
      }
      return 'done'
    },

    tablesRemoveByTid: async (tables) => {
      if (Array.isArray(tables) == false) return 'tables not valid, array expected'
      if (tables.length == 0) return 'tables empty'
  
      for (const tid of tables) {
        let tableDeleted
        try {
          tableDeleted = await queryGet(
            `DELETE FROM "table"
            WHERE tid = $1 returning *;`,
            [tid]
          )
        } catch (err) {
          return err
        }
  
        const {
          file_path: filename,
          collection_id,
        } = tableDeleted

        try{
          await fileFromCollectionDelete(
            {
              filename,
              // current path
              path: path.join(
                collection_id.toString(),
                filename
              ),
              tid,
            },
            'deleted' 
          )
        } catch (err) {
          const errorText = `REMOVE FAil: ` + err + JSON.stringify(err)
          return errorText
        }
      }
      return 'done'
    },

    // Table id Get
    // important.
    // Use this to recover the table id (tid).
    // tid is used as primary key in many tables.
    // uniquely identifying tables across sql tables.
    tidGet: async (docid, page, collId) => {
      if (
        docid == "undefined" ||
        page == "undefined" || 
        collId == "undefined" 
      ) {
        return -1
      }
      let tid = await queryGet(
        `SELECT tid FROM "table" WHERE docid = $1 AND page = $2 AND collection_id = $3`,
        [docid, page, collId]
      )
      if (!tid) {
        return 'not found'
      }
      return tid.tid.toString()
    },

    userCreate: async (userData) => {
      const {
        username,
        password,
        displayName,
        email,
      } = userData
      
      if (
        username == "undefined" ||
        password == "undefined" ||
        email == "undefined" 
      ) {
        return {code: 'invalid_parameters', error: 'invalid user data'}
      }

      await queryRun(
        `INSERT INTO users
        (id, username, password, "displayName", email, registered, role)
        VALUES ((SELECT IFNULL(max(id), 0) + 1 FROM users), $1, $2, $3, $4, $5, $6)`,
        [
          username,
          password,
          displayName,
          email,
          Date.now(),
          'standard'
        ]
      );

      return 'done'
    },
    
    userDelete: async (email) => {
      await queryRun(`
      DELETE FROM users
	    WHERE email=$1`, [email])
      return 'done'
    },

    userGet: async ({username, email, id}) => {
      const fieldName = username ? 'username' :
        email ? 'email' :
        id ? 'id' : null

      const value = username ? username :
        email ? email :
        id ? id : null

      if (!value) {
        return 'Invalid parameter'
      }

      const user = await queryGet(`
      SELECT
        id, username, password, "displayName", email, registered, role
      FROM users
      WHERE ${fieldName} = $1`, [value])
      return user
    },

    usersGet: async () => {
      const users = await queryAll(
        'SELECT id, username, password, "displayName", email, registered, role FROM users'
      )
      return users
    },
  }
}

module.exports = driver