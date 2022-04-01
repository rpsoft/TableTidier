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
            cuis_selected = array_to_string(array_replace(regexp_split_to_array(cuis_selected, ';'), $2, $1), ';')`
          , [cui, prevcui]
        )
        result = await query( q )
      }

      return result
    },

    cuiDeleteIndex: (cui) => query('delete from cuis_index where cui = $1', [cui]),

    cuiMetadataGet: (cui) => query(`select docid,page,"user" from metadata where cuis like $1 `, ["%"+cui+"%"]),

    tableCreate: async (docid, page, user, collection_id, file_path) => query(
      `INSERT INTO public."table"(
	       docid, page, "user", notes, collection_id, file_path, "tableType")
	     VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [docid, page, user, '', collection_id, file_path, '']),

    // Gets the labellers associated w ith each document/table.
    metadataLabellersGet: () => query(`SELECT distinct docid, page, labeller FROM metadata`),

    resultsDataGet: (tids) => query(`SELECT * FROM "result" WHERE tid = ANY ($1)`, [tids]),    
  }
}

module.exports = driver