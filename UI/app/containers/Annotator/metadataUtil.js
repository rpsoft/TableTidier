const prepareMetadata = (headerData, tableResults) => {
    // debugger
    if(!headerData.headers || headerData.headers.length < 1 || (!tableResults) ){
      return {}
    }

    tableResults = tableResults.sort( (a,b) => a.row-b.row)

    var headerDataCopy = JSON.parse(JSON.stringify(headerData))

    headerDataCopy.headers.reverse()
    headerDataCopy.subs.reverse()

    var annotation_groups = headerDataCopy.headers.reduce(
        (acc,item,i) => {
          if ( headerDataCopy.subs[i]) {
            acc.temp.push(item)
          } else {
            acc.groups.push([...acc.temp,item].reverse());
            acc.temp = []
          };
          return acc
        }, {groups:[], temp: []})

      annotation_groups.groups[annotation_groups.groups.length-1] = [...annotation_groups.groups[annotation_groups.groups.length-1], ...annotation_groups.temp ]
      annotation_groups = annotation_groups.groups.reverse()

    var grouped_headers = annotation_groups.reduce( (acc,group,i) => {
      var concepts = tableResults.reduce( (cons,res,j)  => {
        cons.push (
          group.map( (head) => {
            if ( res[head] )
            return res[head]
          })
        )
        return cons
      },[]);

      acc[group.join()] = concepts;
      return acc;
    },{})


    var meta_concepts = Object.keys(grouped_headers).reduce( (mcon, group) => {
      var alreadyshown = []
      var lastConcept = ""

      mcon[group] = grouped_headers[group].reduce(
          (acc, concepts) => {
              var key = concepts.join()
              if ( !alreadyshown[key] ){
                alreadyshown[key] = true
                concepts = concepts.filter( b => b != undefined )

                if ( concepts[concepts.length-1] == lastConcept ){

                  concepts = concepts.slice(concepts.length-2,1)
                }
                // else {
                //   // lastConcept = concepts[concepts.length-1]
                // }

                acc.push( concepts )
              }

              return acc
          }, [])

      return mcon
    },{})

    const unfoldConcepts = (concepts) => {
      var unfolded = concepts.reduce ( (stor, elm, i) => {

            for ( var e = 1; e <= elm.length; e++ ){

                var partial_elm = elm.slice(0,e)
                var key = partial_elm.join()

                if ( stor.alreadyThere.indexOf(key) < 0 ){
                  stor.unfolded.push(partial_elm)
                  stor.alreadyThere.push(key)
                }

            }

            return stor;
      }, { unfolded:[], alreadyThere:[] })

      return unfolded.unfolded
    }

  meta_concepts = Object.keys(meta_concepts).reduce(
    (acc,mcon,j) => {
      acc[mcon] = unfoldConcepts(meta_concepts[mcon]);
      return acc
    },{} )

  return meta_concepts
}

export default prepareMetadata;
