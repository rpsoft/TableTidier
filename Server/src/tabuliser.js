const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const clone = require( 'just-clone');
const { mainModule } = require('process');


async function getFileResults (annotation, filePath){

    // console.log(JSON.stringify(annotation != null))
    if ( annotation == null ){
      return []
    }

    annotation.annotations.map( (ann, a) => {ann.pos = a} )

    var tableData = new Promise( (resolve, reject) => {

        fs.readFile(filePath, "utf8", (err, data)=>{
            if ( err ){
                reject(err)
            }
            resolve(data)

        })

    })

    var $ = cheerio.load( await tableData)

    var maxColumn = $("tr").toArray().reduce ( (acc,item, i) => {return $(item).children().length > acc ? $(item).children().length : acc }, 0 )
    var maxRows = $("tr").toArray().length

    var matrix = Array.from({length: maxRows}, e => Array(maxColumn).fill({colcontent: {}, rowcontent: {}, text: new String("")}));

        matrix = clone(matrix)

    $("tr").toArray().map(
        (row, r) => {
            var coffset = 0;

            $(row).children().toArray().map(
                        (col,c) => {

                            c = c+coffset


                            var emptyOffset = 0;

                            while ( matrix[r][c].text.trim().length > 0 ){
                                emptyOffset = emptyOffset+1
                                c = c+1

                                if ( c >= maxColumn ){
                                    return
                                }

                            }

                            var format = []
                            if ( $(col).find("[class*=indent]").length > 0 )  {
                                format.push("indented")
                            }

                            if ( $(col).find("[style*=bold]").length > 0 ) {
                                format.push("bold")
                            }

                            if ( $(col).find("[style*=italic]").length > 0 ) {
                                format.push("italic")
                            }

                            matrix[r][c] = {...matrix[r][c], text: $(col).text().replaceAll("\n",""), format : format }

                            var colspan = $(col).attr("colspan")-1

                            if( colspan > 0){
                                for (var cspan = 1; cspan <= colspan; cspan++){
                                    matrix[r][c+cspan] = matrix[r][c]
                                }
                                coffset = coffset+colspan
                            }

                            var rowspan = $(col).attr("rowspan")-1


                            if( rowspan > 0){

                                for (var rspan = 1; rspan <= rowspan; rspan++){
                                    matrix[r+rspan][c] = matrix[r][c]
                                }

                            }

                        })

            var maxColHeader = Math.max(...annotation.annotations.filter( el => el.location == "Col").map( el => el.number-1))

            // here we check if the content is exactly the same across row cells. Since we spread the out in the previous steps, if an empty row, all cells should be the same.
            var isEmptyRow = matrix[r].reduce( (acc, col, c) => { return (c > maxColHeader) ? (acc && (col.text == matrix[r][maxColHeader+1].text)) : acc && true}, true)

            // similarly, all but the last one should be the same, if empty row with p-value.
            var isEmptyRowWithPValue = matrix[r].reduce( (acc, col, c) => {

                var answer = (c > maxColHeader) && ( c < (matrix[r].length-1)) ? (acc && (col.text == matrix[r][maxColHeader+1].text) && (col.text != matrix[r][maxColumn-1].text)) : acc && true

                return answer
            }, true)

            matrix[r].map(
                (col,c) => {
                    var format = matrix[r][c].format ? [...matrix[r][c].format] : []
                    if ( isEmptyRow ){
                        format.push("empty_row")
                    }

                    if ( isEmptyRowWithPValue ){
                        format.push("empty_row_with_p_value")
                    }

                    matrix[r][c] = {...matrix[r][c], format }

                })

        })


    //normalise trailing spaces to facilitate indent detection
    for ( var c in [...new Array(maxColumn).keys()]){

        var space = null
        var count = 0

        for ( r in [...new Array(maxRows).keys()]){

            if ( matrix[r][c].text.trim().length < 1 ){
                continue
            }

            var currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0]
            if ( space == null || space.length > currentSpace.length ){
               space = currentSpace
            }
        }

        for ( var r in [...new Array(maxRows).keys()]){
            var currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0]

               if ( (space == currentSpace) || (matrix[r][c].length == undefined) ){
                count ++
               }

        }

        if ( count == maxRows){

            for ( var r in [...new Array(maxRows).keys()]){

                if (matrix[r][c].text.trim().length < 1) {  // clean up empty cells from any spaces.
                    matrix[r][c].text = matrix[r][c].text.trim()
                }

                matrix[r][c].text = matrix[r][c].text.replace(space, "")

                var currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0]

                if ( currentSpace.length > 0){
                    var format = matrix[r][c].format
                    format.push("indented")
                    matrix[r][c] = {...matrix[r][c], format : format}
                }

            }
        }

    }

    var headerRows = []
    var headerCols = []
    var existingHeadersCount = {}

    var existingHeaders = {}

    // here we order the annotations from more complex to simpler. This allows simpler computations later on.
    annotation.annotations = annotation.annotations.sort( (A,B) => A.number - B.number == 0 ? Object.keys(B.qualifiers).length - Object.keys(A.qualifiers).length : A.number - B.number )

    annotation.annotations.map( el => {
        var key = Object.keys(el.content).sort().reverse().join(";")
        existingHeadersCount[key] = existingHeadersCount[key] ? existingHeadersCount[key]+1 : 1

        el.annotationKey = key+"@"+existingHeadersCount[key]

        existingHeaders[key+"@"+existingHeadersCount[key]] = ""

    })

    // Spread row header values
    annotation.annotations.filter( el => el.location == "Row").map( el =>{
            matrix[el.number-1].map( (mc,c) => {

                var rowcontent = {...matrix[el.number-1][c].rowcontent }
                    rowcontent[el.annotationKey] = matrix[el.number-1][c].text.replace(/\s+/g, ' ').trim()

                matrix[el.number-1][c].rowcontent = rowcontent
                headerRows = Array.from(new Set([...headerRows,el.number-1]))
                })
            })

    annotation.annotations.filter( el => el.location == "Col").map( el =>{

        matrix.map( (row, r) => {

            if( headerRows.indexOf(r) < 0 && (r > Math.min(...headerRows)) ){

                    if ( r > 0 && (matrix[r][el.number-1].text.trim().length == 0 )) { // Fill space in column with previous row element. Spreading headings over the columns
                        matrix[r][el.number-1] = clone ( matrix[r-1][el.number-1] )
                        matrix[r][el.number-1].rowcontent = {}
                    }

                    if ( Object.keys( el.qualifiers ).length > 0){
                        if ( Object.keys(el.qualifiers).reduce( (acc,ele) => acc && matrix[r][el.number-1].format.indexOf(ele) > -1 , true ) ){
                            if ( Object.keys(matrix[r][el.number-1].colcontent).length == 0 )
                            matrix[r][el.number-1].colcontent[el.annotationKey] = matrix[r][el.number-1].text.replace(/\s+/g, ' ').trim()
                        }
                    } else {
                        if ( Object.keys(matrix[r][el.number-1].colcontent).length == 0 )
                        matrix[r][el.number-1].colcontent[el.annotationKey] = matrix[r][el.number-1].text.replace(/\s+/g, ' ').trim()
                    }

                    headerCols = Array.from(new Set([...headerCols,el.number-1]))

                }
            });

        })



    var colHeadersBuffer = annotation.annotations.filter( el => el.location == "Col").reduce( (acc,el) => { acc[el.annotationKey] = ""; return acc }, {} )

    var colPositions = annotation.annotations.filter( el => el.location == "Col").reduce( (acc, ann, a) => {acc[ann.annotationKey] = {pos: ann.pos, subAnnotation: ann.subAnnotation}; return acc }, { } )

    var dataResults = matrix.reduce ( (acc, row, r) => {

            var cpos = colPositions

            if ( headerRows.indexOf(r) < 0){

                for ( var h in headerCols ){
                    var hcol = headerCols[h]

                    Object.keys(matrix[r][hcol].colcontent).map( chead => {

                        var pos = colPositions[chead].pos
                        var colHeadersToEmpty = Object.keys(colPositions).filter( chead => colPositions[chead].subAnnotation && (colPositions[chead].pos > pos ))
                        colHeadersToEmpty.map( chead => { colHeadersBuffer[chead] = "" })

                    })

                    colHeadersBuffer = {...colHeadersBuffer, ...matrix[r][hcol].colcontent}

                    // console.log(colHeadersBuffer)
                }
            }

            row.map( (currentCell,c) => {

                if ( r >= Math.min(...headerRows) && c > Math.max(...headerCols)){

                    var newHeaders = {...newHeaders, ...colHeadersBuffer }

                    var headerGroups = headerRows.filter( hr => hr < r ).reduce( (acc,hrow) => {
                            if (acc.buffer.length == 0 ){
                                acc.buffer.push(hrow)
                            } else {
                                if ( hrow - acc.buffer[acc.buffer.length-1] == 1 ){
                                    acc.buffer.push(hrow)
                                } else {
                                    acc.groups.push(clone(acc.buffer))
                                    acc.buffer = [hrow]
                                }
                            }

                            return acc
                        }, {groups: [], buffer: [] })

                    headerGroups = [...headerGroups.groups, headerGroups.buffer]

                    for ( var h in headerGroups[headerGroups.length-1] ){
                        var hrow = headerGroups[headerGroups.length-1][h]

                        newHeaders = {...newHeaders, ...matrix[hrow][c].rowcontent }

                    }

                    acc.push ({
                        ...existingHeaders,
                        ...newHeaders,
                        col: c,
                        row: r,
                        value: currentCell.text.replace(/\s+/g, ' ').trim(),
                    })

                }

            })

            return acc
        }, [])

    dataResults = dataResults.filter( res => {

        var anyPresent = Object.keys(colHeadersBuffer).reduce( (acc, hcol) => { return acc || res[hcol] == res.value }, false )


        return res.value.length > 0 && (!anyPresent) && headerRows.indexOf(res.row) < 0


    })

    return dataResults
}


// async function main () {
//     const annotation = {"annotations":
//         [
//             {"location":"Row","content":{"arms":true,"measures":true},"qualifiers":{},"number":"2","subAnnotation":false},
//             {"location":"Row","content":{"measures":true,"p-interaction":true},"qualifiers":{},"number":"3","subAnnotation":false},
//             {"location":"Row","content":{"arms":true,"measures":true},"qualifiers":{},"number":"17","subAnnotation":false},
//             {"location":"Row","content":{"measures":true,"p-interaction":true},"qualifiers":{},"number":"18","subAnnotation":false},
//             {"location":"Col","content":{"characteristic_name":true, "characteristic_level":true },"qualifiers":{},"number":"1","subAnnotation":false},
//             {"location":"Col","content":{"measures":true, "p-interaction":true },"qualifiers":{"empty_row_with_p_value":true},"number":"2","subAnnotation":false},
//             {"location":"Col","content":{"characteristic_name":true, "characteristic_level":true },"qualifiers":{"bold":true},"number":"2","subAnnotation":false},
//             {"location":"Col","content":{"characteristic_level":true},"qualifiers":{},"number":"2","subAnnotation":true}
//         ]}

//     var results = await getFileResults(annotation, "exampleTable.html")

//     debugger

// }


module.exports = {
    getFileResults
}
