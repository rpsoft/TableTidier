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
    // * :-)  Sqlite version transform "annotations".annotation from text to json
    annotationDataGet: async (tids) => query(
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
where
  "table".tid = "annotations".tid AND "table".tid = ANY ($1)`,
      [tids]
    ),

    resultsDataGet: async (tids) => query(`SELECT * FROM "result" WHERE tid = ANY ($1)`, [tids]),    
  }
}







module.exports = driver