const { Pool, Client, Query } = require('pg')
const path = require('path');
const {
  moveFileToCollection,
} = require('../utils/files')

function driver(config) {
  // :-) Check config has valid fields
  console.log("Configuring DB client: Postgres")
  const pool = new Pool({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.database,
  })

   // Generic 
  const query = async (queryText, values) => {
    try {
      const client = await pool.connect()
      const result = await client.query(queryText, values)
      client.release()
      return result   
    } catch (err) {
      throw err
    }
  }

  return {
    // Return db handler
    pool: pool,
    db: pool,
    close: () => pool.end(),

    // Returns the annotation for a single document/table
    annotationByIDGet: (docid, page, collId) => {
      if ( docid == "undefined" || page == "undefined" || collId == "undefined" ) {
        return {rows:[]}
      }

      return query(
      `SELECT 
        docid,
        "user",
        notes,
        collection_id,
        file_path,
        "tableType",
        "table".tid,
        completion,
        annotation
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
    },

    annotationDataGet: (tids) => query(
    // * :-)  Sqlite version transform "annotations".annotation from text to json
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
  "table".tid = "annotations".tid AND "table".tid = ANY ($1)`,
      [tids]
    ),

    annotationInsert: (tid, annotation) => query(
      'INSERT INTO annotations VALUES($2,$1) ON CONFLICT (tid) DO UPDATE SET annotation = $2;',
      [tid, annotation]
    ),

    annotationResultsGet: async () => {
      const result = await query(
        `SELECT * FROM "table", annotations where "table".tid = annotations.tid order by docid desc,page asc`
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
      const result = await query(
        `INSERT INTO public.collection(
        title, description, owner_username, visibility, completion)
        VALUES ($1, $2, $3, $4, $5)
        returning *;`, 
        [title, description, owner, 'public', 'in progress']
      )
      // const result = await query(
      //   `Select * from collection
      //   ORDER BY collection_id DESC LIMIT 1;`
      // )
      return result.rows[0]
    },

    collectionDelete: async function (collection_id) {
      try {
        let tables = await query(
          `SELECT docid, page FROM public."table" WHERE collection_id = $1`,[collection_id]
        )
        tables = tables.rows
        await this.tablesRemove(tables, collection_id, true);
        await query(
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
      // Generate query in function of parameters.
      const collDataFormated = [collData.collection_id]
      // collection_id is parameter 1, so start by 2
      let counterParams = 2
      let _query = `UPDATE public.collection
      SET `
      const footer = ` WHERE collection_id=$1 returning *;`
      for (const item in collData) {
        if (item == 'collection_id') continue
        collDataFormated.push(collData[item])
        _query += `${item}=$${counterParams}, `
        counterParams++
      }
      _query = _query.slice(0, -2).concat(footer)
      console.log(_query)
      console.log(collDataFormated)
      try {
        const result = await query(
          _query,
          collDataFormated
        )
        console.log(result)
        return result.rows[0]
      } catch (err) {
        return err
      }
    },

    collectionGet: async (collection_id) => { 
      const result = await query(
        `SELECT *
        FROM public.collection WHERE collection_id = $1`, [collection_id])
  
      const tables = await query(
        `SELECT docid, page, "user", notes, tid, collection_id, file_path, "tableType"
        FROM public."table" WHERE collection_id = $1 ORDER BY docid,page`, [collection_id])
  
      const collectionsList = await query(
        `SELECT * FROM public.collection ORDER BY collection_id`);
  
      if ( result.rows.length == 1){
          return {
            ...result.rows[0],
            tables: tables.rows,
            collectionsList: collectionsList.rows,
          }
      }
      return {}
    },

    collectionsList: async () => {
      const result = await query(
        `SELECT collection.collection_id, title, description, owner_username, table_n
        FROM public.collection
        LEFT JOIN
        ( SELECT collection_id, count(docid) as table_n FROM
        ( select distinct docid, page, collection_id from public.table ) as interm
        group by collection_id ) as coll_counts
        ON collection.collection_id = coll_counts.collection_id ORDER BY collection_id`
      )
      return result.rows
    },

    cuiInsert: async (cui, preferred, hasMSH) => query(
      `INSERT INTO cuis_index(cui,preferred,"hasMSH",user_defined,admin_approved)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cui) DO UPDATE 
      SET preferred = $2, "hasMSH" = $3, user_defined = $4, admin_approved = $5`,
      [cui,preferred,hasMSH,true,false]
    ),

    cuiDataModify: async (cui, preferred, adminApproved, prevcui) => {
      let result = await query(`UPDATE cuis_index SET cui=$1, preferred=$2, admin_approved=$3 WHERE cui = $4`,
        [cui, preferred, adminApproved, prevcui] )

      if ( result && result.rowCount ){
        const q = new Query(
          `UPDATE metadata 
          SET
            cuis = array_to_string(array_replace(regexp_split_to_array(cuis, ';'), $2, $1), ';'),
            cuis_selected = array_to_string(array_replace(regexp_split_to_array(cuis_selected, ';'), $2, $1), ';')`,
          [cui, prevcui]
        )
        result = await query( q )
      }

      return result
    },

    cuiDeleteIndex: (cui) => query('delete from cuis_index where cui = $1', [cui]),

    cuiRecommend: async () => {
      const result = await query(`select * from cuis_recommend`)
      return result.rows
    },

    cuisIndexGet: async () => {
      const cuis = {}
      const result = await query(`select * from cuis_index ORDER BY preferred ASC`)
      result.rows.forEach( row => {
        cuis[row.cui] = {preferred : row.preferred, hasMSH: row.hasMSH, userDefined: row.user_defined, adminApproved: row.admin_approved}
      })
    
      return cuis
    },

    cuiMetadataGet: (cui) => query(`select docid,page,"user" from metadata where cuis like $1 `, ["%"+cui+"%"]),

    metadataClear: (tid) => query('DELETE FROM metadata WHERE tid = $1', [tid]),

    metadataGet: (tids) => query(`SELECT * FROM metadata WHERE tid = ANY ($1)`,[tids]),

    metadataSet: (
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
    ) => query(`
    INSERT INTO metadata(concept_source, concept_root, concept, cuis, cuis_selected, qualifiers, qualifiers_selected, istitle, labeller, tid)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (concept_source, concept_root, concept, tid)
    DO UPDATE SET cuis = $4, cuis_selected = $5, qualifiers = $6, qualifiers_selected = $7, istitle = $8, labeller = $9`,
    [
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
    ]),

    // Gets the labellers associated w ith each document/table.
    metadataLabellersGet: () => query(`SELECT distinct docid, page, labeller FROM metadata`),

    notesUpdate: (docid, page, collid, notes, tableType, completion) => query(
      `UPDATE public."table"
      SET
        notes=$4,
        "tableType"=$5,
        completion=$6
      WHERE
        docid=$1 AND page=$2 AND collection_id=$3`,
      [docid, page, collid, notes, tableType, completion]
    ),

    // resource = {type: [collection or table], id: [collection or table id]}
    permissionsResourceGet: async (resource, user) => {
      let permissions;

      switch (resource) {
        case "collections":
          permissions = await query(
            `select *,
            (owner_username = $1) as write,
            (visibility = 'public' OR owner_username = $1) as read
            from collection`,
            [user]
          )
          break;
        case "table":
          break;
        default:
    
      }
    
      return permissions?.rows.reduce( (acc, row) => {
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
        return `parameters no valid`
      }
      try {
        await query(
        `INSERT INTO public."table"(
          docid, page, "user", notes, collection_id, file_path, "tableType")
        VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [docid, page, user, '', collection_id, file_path, '']
        )
      } catch (err) {
        return err
      }
      return 'done'
    },

    tablesMove: async (tables, collection_id, target_collection_id) => {
      if (Array.isArray(tables) == false) return 'tables not valid, array expected'
      if (tables.length == 0) return 'tables empty'

      let tablesDocidPage
      try {
        tablesDocidPage = tables.map( (tab, index) => {
          const [docid, page] = tab.split("_");
          // if invalid docid or page throw err
          if (!docid || !page) {
            throw `Param docid=${docid} or page=${page} not valid at index ${index}`
          }
          return {docid, page}
        })
      } catch(err) {
        return err
      }

      for ( let table of tablesDocidPage) {
        const {
          docid,
          page,
        } = table
        await query(
          `UPDATE public."table"
           SET collection_id=$4
           WHERE docid = $1 AND page = $2 AND collection_id = $3;`,
          [docid, page, collection_id, target_collection_id])
  
        const filename = `${docid}_${page}.html`;
        try{
          await moveFileToCollection(
            {
              originalname: filename,
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
        if (!fromSelect) {
          tablesDocidPage = tables.map( (tab, index) => {
            const [docid, page] = tab.split("_");
            // if invalid docid or page throw err
            if (!docid || !page) {
              throw `Param docid=${docid} or page=${page} not valid at index ${index}`
            }
            return {docid, page}
          })
        }
      } catch(err) {
        return err
      }
  
      for ( let table of tablesDocidPage) {
        const {
          docid,
          page,
        } = table
        await query(
          `DELETE FROM public."table"
          WHERE docid = $1 AND page = $2 AND collection_id = $3;`,
          [docid, page, collection_id]
        )
  
        const filename = `${docid}_${page}.html`;
        try{
          await moveFileToCollection(
            {
              originalname: filename,
              path: path.join(
                collection_id.toString(),
                filename
              ) 
            },
            'deleted' 
          )
        } catch (err){
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
      let tid = await query(
        `SELECT tid FROM public."table" WHERE docid = $1 AND page = $2 AND collection_id = $3`,
        [docid, page, collId]
      )
      if ( tid.rows && tid.rows.length == 0 ){
        return 'not found'
      }
      return tid.rows[0].tid
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

      let result = await query(
        'INSERT INTO public.users( username, password, "displayName", email, registered, role) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          username,
          password,
          displayName,
          email,
          Date.now(),
          "standard"
        ]
      );

      return 'done'
    },

    userDelete: async (email) => {
      const user = await query(`
      DELETE FROM public.users
	    WHERE email=$1`, [email])
      return 'done'
    },
    
    userGet: async (email) => {
      const user = await query(`
      SELECT
        id, username, password, "displayName", email, registered, role
      FROM users
      WHERE email = $1`, [email])
      return user.rows[0]
    },

    usersGet: async () => {
      const users = await query('SELECT id, username, password, "displayName", email, registered, role FROM public.users')
      // convert registered from string to number
      // bigint (64 bits) returned as string by pg module
      users.rows.forEach(row => row.registered = parseInt(row.registered))
      return users.rows
    },
  }
}

module.exports = driver