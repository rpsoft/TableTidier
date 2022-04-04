const { Pool, Client, Query } = require('pg')

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
    annotationByIDGet: (docid, page, collId) => query(
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
          ),

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

    resultsDataGet: (tids) => query(`SELECT * FROM "result" WHERE tid = ANY ($1)`, [tids]),

    tableCreate: async (docid, page, user, collection_id, file_path) => query(
      `INSERT INTO public."table"(
	       docid, page, "user", notes, collection_id, file_path, "tableType")
	     VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [docid, page, user, '', collection_id, file_path, '']
    ),

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