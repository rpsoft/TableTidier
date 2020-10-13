
var getAnnotationResults = async () => {

  var client = await pool.connect()
  var result = await client.query(`select * from "table",annotations where "table".tid = annotations.tid order by docid desc,page asc`)
        client.release()

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
}


module.exports = {
    getAnnotationResults
}
