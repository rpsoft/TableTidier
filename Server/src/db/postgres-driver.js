const { Pool, Client, Query } = require('pg')
const {
  moveFileToCollection,
} = require('../utils/files')

function driver(config) {
  // :-) Check config has valid fields

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
      return err
    }
  }

  return {
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
      await query(
        `INSERT INTO public.collection(
        title, description, owner_username, visibility, completion)
        VALUES ($1, $2, $3, $4, $5);`, 
        [title, description, owner, "public", "in progress"]
      )
      const result = await query(
        `Select * from collection
        ORDER BY collection_id DESC LIMIT 1;`
      )
      return result
    },

    collectionDelete: async function (collection_id) {
      let tables = await query(
        `SELECT docid, page FROM public."table" WHERE collection_id = $1`,[collection_id]
      )
    
      tables = tables.rows
      await this.tablesRemove(tables, collection_id, true);
    
      await query(
        `DELETE FROM collection WHERE collection_id = $1`, [collection_id]
      )
      return 'done'
    },

    collectionEdit: async (collData) => {
      const {
        collection_id,
        title,
        description,
        owner_username,
        completion,
        visibility,
      } = collData
      const result = await query(
        `UPDATE public.collection
        SET title=$2, description=$3, owner_username=$4, completion=$5, visibility=$6
        WHERE collection_id=$1`,
        [
          collection_id,
          title,
          description,
          owner_username,
          completion,
          visibility
        ]
      )
      return result
    },

    collectionGet: async (collection_id) => { 
      let result = await query(
        `SELECT *
        FROM public.collection WHERE collection_id = $1`, [collection_id])
  
      const tables = await query(
        `SELECT docid, page, "user", notes, tid, collection_id, file_path, "tableType"
        FROM public."table" WHERE collection_id = $1 ORDER BY docid,page`, [collection_id])
  
      const collectionsList = await query(
        `SELECT * FROM public.collection ORDER BY collection_id`);
  
      client.release()
  
      if ( result.rows.length == 1){
          result = result.rows[0]
          result.tables = tables.rows;
          result.collectionsList = collectionsList.rows;
          return result
      }
      return {}
    },

    collectionsList: async () => {
      const result = query(
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

    tableCreate: async (docid, page, user, collection_id, file_path) => query(
      `INSERT INTO public."table"(
	       docid, page, "user", notes, collection_id, file_path, "tableType")
	     VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [docid, page, user, '', collection_id, file_path, '']
    ),

    tablesMove: async (tables, collection_id, target_collection_id) => {
      const tablesDocidPage = tables.map( (tab) => {
        const [docid, page] = tab.split("_");
        return {docid, page}
      })

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
          moveFileToCollection(
            {
              originalname: filename,
              path: path.join(global.tables_folder, collection_id, filename)
            },
            target_collection_id
          )
        } catch (err){
          console.log(`MOVE FILE DIDN't EXIST: `+JSON.stringify(err))
        }
      }
  
      return 'done'
    },

    tablesRemove: async (tables, collection_id, fromSelect = false) => {
      let tablesDocidPage = table
      if (!fromSelect){
        tablesDocidPage = tables.map( (tab) => {
          const [docid, page] = tab.split("_");
          return {docid, page}
        })
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
          moveFileToCollection(
            {
              originalname: filename,
              path: path.join(collection_id, filename) 
            },
            'deleted' 
          )
        } catch (err){
          console.log(`REMOVE FILE DIDN't EXIST: `+JSON.stringify(err))
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
      if ( tid.rows && tid.rows.length > 0 ){
        tid = result.rows[0].tid
      }
      return tid
    },
    
  }
}

module.exports = driver