
async function updateClusterAnnotation(cn,concept,cuis,isdefault,cn_override){

  var client = await pool.connect()

  var done = await client.query('INSERT INTO clusters VALUES($1,$2,$3,$4,$5) ON CONFLICT (concept) DO UPDATE SET isdefault = $4, cn_override = $5;', [cn,concept,cuis,isdefault.toLowerCase() == 'true',cn_override ])
    .then(result => console.log("insert: "+ result))
    .catch(e => console.error(e.stack))
    .then(() => client.release())

}



app.get('/api/allClusterAnnotations', async function(req,res){

  var allClusterAnnotations = async () => {
    var client = await pool.connect()
    var result = await client.query(`select COALESCE(clusters.cn_override, clusters.cn) as cn,concept,rep_cuis,excluded_cuis,status,proposed_name from clusters,clusterdata where clusters.cn = clusterdata.cn ORDER BY cn asc,concept asc`)
          client.release()
    return result
  }

  res.send( await allClusterAnnotations() )

});



cleanTerm
app.get('/api/allClusters', async function(req,res){

  var getAllClusters = async () => {
    var client = await pool.connect()
    var result = await client.query(`select COALESCE(cn_override , cn) as cn,  concept, cuis, isdefault, cn_override from clusters order by cn asc, concept asc`)
          client.release()
    return result
  }

  res.send( await getAllClusters() )

});


app.get('/api/getCUIMods', async function(req,res){

  var getCUIMods = async () => {
    var client = await pool.connect()
    var result = await client.query(`select * from modifiers`)
          client.release()
    return result
  }

  res.send( await getCUIMods() )

});


app.get('/api/setCUIMod', async function(req,res){

  var setCUIMod = async (cui,type) => {
      var client = await pool.connect()
      var done = await client.query('INSERT INTO modifiers VALUES($1,$2) ON CONFLICT (cui) DO UPDATE SET type = $2;', [cui,type])
        .then(result => console.log("insert: "+ new Date()))
        .catch(e => console.error(e.stack))
        .then(() => client.release())

  }

  if ( req.query && req.query.cui && req.query.type){
    await setCUIMod(req.query.cui, req.query.type)
  }

});


app.get('/api/getClusterData', async function(req,res){

  var getClusterData = async () => {
    var client = await pool.connect()
    var result = await client.query(`select * from clusterdata`)
          client.release()
    return result
  }

  res.send( await getClusterData() )

});


app.get('/api/setClusterData', async function(req,res){
  console.log("Processing Request: "+JSON.stringify(req.query))
  var setClusterData = async (cn,rep_cuis,excluded_cuis,status,proposed_name) => {

      var p_name = proposed_name && (proposed_name.length > 0) && proposed_name !== "null"  ? proposed_name : "";

      var client = await pool.connect()
      var done = await client.query('INSERT INTO clusterdata VALUES($1,$2,$3,$4) ON CONFLICT (cn) DO UPDATE SET rep_cuis = $2, excluded_cuis = $3, status = $4, proposed_name = $5 ;', [cn,rep_cuis,excluded_cuis,status,p_name])
        .then(result => console.log("insert: "+ JSON.stringify(result)))
        .catch(e => console.error(e.stack))
        .then(() => client.release())

  }

  if ( req.query && req.query.cn && req.query.status){
    await setClusterData(req.query.cn, req.query.rep_cuis || "", req.query.excluded_cuis || "", req.query.status, req.query.proposed_name)
  }

  res.send( "updated" )

});


app.get('/api/recordClusterAnnotation',async function(req,res){

  console.log(JSON.stringify(req.query))

  if(req.query && req.query.cn.length > 0
              && req.query.concept.length > 0
              && req.query.cuis.length > 0
              && req.query.isdefault.length > 0
              && req.query.cn_override.length > 0){
      await updateClusterAnnotation( req.query.cn , req.query.concept, req.query.cuis, req.query.isdefault, req.query.cn_override )
  }

  res.send("saved cluster annotation: "+JSON.stringify(req.query))

});
