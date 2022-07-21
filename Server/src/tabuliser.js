const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs/promises');
const clone = require( 'just-clone');
const { mainModule } = require('process');


async function getFileResults (annotation, filePath){
  // debugger
  // console.log(JSON.stringify(annotation != null))
  if ( annotation == null ){
    return []
  }

  annotation.annotations.forEach( (ann, a) => {ann.pos = a} )

  let tableData
  try {
    tableData = fs.readFile(filePath, {encoding: "utf8"})
  } catch (err) {
    console.log(err)
    tableData = err
  }

  const $ = cheerio.load(await tableData)

  const maxColumn = $("tr").toArray().reduce(
    (acc, item, i) => {
      return $(item).children().length > acc ?
        $(item).children().length
        : acc 
    }, 0
  )
  const maxRows = $("tr").toArray().length

  let matrix = Array.from(
    { length: maxRows },
    e => Array(maxColumn).fill({
      colcontent: {},
      rowcontent: {},
      text: new String('')
    })
  );

  matrix = clone(matrix)

  // debugger

  $("tr").toArray().map(
    (row, r) => {
      let coffset = 0;

      $(row).children().toArray().map(
        (col, c) => {
          c = c+coffset

          let emptyOffset = 0;

          while ( matrix[r][c].text.trim().length > 0 ) {
            emptyOffset = emptyOffset+1
            c = c+1

            if ( c >= maxColumn ){
              return
            }
          }
            //<em>
          const format = []
          if (
            $(col).find("[class*=indent]").length > 0 ||
            $(col).attr("class")?.toLowerCase()?.includes("indent") == true
          ) {
            format.push("indented")
          }
          // debugger
          if (
            $(col).find("[style*=bold]").length > 0 ||
            $(col).attr("class")?.toLowerCase()?.includes("bold") == true 
          ) {
            format.push("bold")
          }

          if ( 
            $(col).find("[style*=italic]").length > 0 ||
            $(col).attr("class")?.toLowerCase()?.includes("italic") == true ||
            $(col).html().replaceAll(' ', '').includes("<em>") == true)
          {
            format.push("italic")
          }

          matrix[r][c] = {
            ...matrix[r][c],
            text: $(col).text().replaceAll((/  |\t|\r\n|\n|\r/gm),"").trim(),
            format: format
          }

          const colspan = $(col).attr("colspan")-1

          if( colspan > 0) {
            for (let cspan = 1; cspan <= colspan; cspan++){
              matrix[r][c+cspan] = matrix[r][c]
            }
            coffset = coffset+colspan
          }

          const rowspan = $(col).attr("rowspan")-1

          if( rowspan > 0 ){
            for (let rspan = 1; rspan <= rowspan; rspan++){
              if ( (r+rspan) < matrix.length ){
                  matrix[r+rspan][c] = matrix[r][c]
              }
            }
          }
        }
      )

      // Out of the columns what's the max column number containing a header?
      const maxColHeader = Math.max(...annotation.annotations
        .filter( el => el.location == "Col")
        .map( el => parseInt(el.number)-1))

      // here we check if the content is exactly the same across row cells. Since we spread the out in the previous steps, if an empty row, all cells should be the same.
      const isEmptyRow = matrix[r].slice(maxColHeader+1).map( c => c.text ).join("").length < 1

      // Find the index position of the first and last non empty cells.
      const firstAndLast = matrix[r].map( col => col.text ).reduce(
        (acc, col, i, mat) => {
          if ( (i+1 < mat.length) && col.length > 0 && mat[i+1].length < 1 && acc.first < 0 ){
            acc.first = i;
          }
          if ( i > 0 && col.length > 0 && mat[i-1].length < 1 ){
            acc.last = i;
          }
          return acc
        }, {first:-1, last:-1}
      )

      const isEmptyRowWithPValue = firstAndLast.first > -1 &&
                                   firstAndLast.last > -1 && 
                                  (firstAndLast.last - firstAndLast.first) > 1

      matrix[r].map(
        (col, c) => {
          const format = matrix[r][c].format ? [...matrix[r][c].format] : []
          if ( isEmptyRow ){
            format.push('empty_row')
          }

          if ( isEmptyRowWithPValue ){
            format.push('empty_row_with_p_value')
          }

          matrix[r][c] = {
            ...matrix[r][c],
            format
          }
        }
      )
    }
  )

  //normalise trailing spaces to facilitate indent detection
  for ( const c in [...new Array(maxColumn).keys()]){
    let space = null
    let count = 0

    for ( const r in [...new Array(maxRows).keys()]){

      if ( matrix[r][c].text.trim().length < 1 ){
        continue
      }

      const currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0]
      if ( space == null || space.length > currentSpace.length ){
        space = currentSpace
      }
    }

    for ( const r in [...new Array(maxRows).keys()]){
      const currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0]

      if ( (space == currentSpace) || (matrix[r][c].length == undefined) ){
        count ++
      }

    }

    if ( count == maxRows){
      for ( const r in [...new Array(maxRows).keys()]){
        if (matrix[r][c].text.trim().length < 1) {  // clean up empty cells from any spaces.
            matrix[r][c].text = matrix[r][c].text.trim()
        }

        matrix[r][c].text = matrix[r][c].text.replace(space, '')

        const currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0]

        if ( currentSpace.length > 0 ){
          const format = matrix[r][c].format
          format.push("indented")
          matrix[r][c] = {
            ...matrix[r][c],
            format: format
          }
        }
      }
    }
  }

  let headerRows = []
  let headerCols = []
  const existingHeadersCount = {}
  const existingHeaders = {}

  annotation.annotations.map( el => {
    const key = Object.keys(el.content).sort().reverse().join(";")
    existingHeadersCount[key] = existingHeadersCount[key] ?
      existingHeadersCount[key]+1
      : 1

    el.annotationKey = key+"@"+existingHeadersCount[key]

    existingHeaders[key+"@"+existingHeadersCount[key]] = ''
  })

  // here we order the annotations from more complex to simpler. This allows simpler computations later on.
  annotation.annotations = annotation.annotations.sort(
    (A,B) => A.number - B.number == 0
    ? Object.keys(B.qualifiers).length - Object.keys(A.qualifiers).length
    : A.number - B.number
  )

  // debugger

  // Spread row header values
  annotation.annotations.filter( el => el.location == "Row")
    .map( el => {
      matrix[el.number-1].map( (mc, c) => {
        if ( c > 0 && mc.text.trim().length < 1 ){
          matrix[el.number-1][c].text = matrix[el.number-1][c-1].text //clone(matrix[el.number-1][c-1])
        }

        const rowcontent = {...matrix[el.number-1][c].rowcontent }
        rowcontent[el.annotationKey] = matrix[el.number-1][c].text.replace(/\s+/g, ' ').trim()

        matrix[el.number-1][c].rowcontent = rowcontent

        headerRows = Array.from(new Set([...headerRows, el.number-1]))
      })
    })

  // Spread col header values??? Need to revise what this does.
  annotation.annotations.filter( el => el.location == "Col").map( el => {
    matrix.map( (row, r) => {
      if( headerRows.indexOf(r) < 0 && (r > Math.min(...headerRows)) ) {
        
        // Fill space in column with previous row element. Spreading headings over the columns
        if ( r > 0 && (matrix[r][el.number-1].text.trim().length == 0 )) {
          matrix[r][el.number-1] = clone( matrix[r-1][el.number-1] )
          matrix[r][el.number-1].rowcontent = {}
        }

        if ( Object.keys( el.qualifiers ).length > 0){
          if (
            Object.keys(el.qualifiers)
              .reduce(
                (acc, ele) => acc && matrix[r][el.number-1].format.includes(ele),
                true
              )
          ){
            if ( Object.keys(matrix[r][el.number-1].colcontent).length == 0 )
              matrix[r][el.number-1].colcontent[el.annotationKey] = matrix[r][el.number-1].text.replace(/\s+/g, ' ').trim()
          }
        } else {
          if ( Object.keys(matrix[r][el.number-1].colcontent).length == 0 )
            matrix[r][el.number-1].colcontent[el.annotationKey] = matrix[r][el.number-1].text.replace(/\s+/g, ' ').trim()
        }
        // ! :-)
        headerCols = Array.from(new Set([...headerCols, el.number-1]))
      }
    });
  })

  let colHeadersBuffer = annotation.annotations
    .filter( el => el.location == "Col")
    .reduce( (acc,el) => {
      acc[el.annotationKey] = '';
      return acc
    }, {})

  const colPositions = annotation.annotations
    .filter( el => el.location == "Col")
    .reduce( (acc, ann, a) => {
      acc[ann.annotationKey] = {
        pos: ann.pos,
        subAnnotation: ann.subAnnotation
      };
      return acc
    }, {})

  let dataResults = matrix.reduce ( (acc, row, r) => {
    let cpos = colPositions

    if ( headerRows.includes(r) == false ) {
      for ( const h in headerCols ) {
        const hcol = headerCols[h]

        Object.keys(matrix[r][hcol].colcontent).map( chead => {
          const pos = colPositions[chead].pos
          const colHeadersToEmpty = Object.keys(colPositions)
            .filter( chead => colPositions[chead].subAnnotation && ( colPositions[chead].pos > pos ))
          colHeadersToEmpty.map( chead => { colHeadersBuffer[chead] = '' })
        })

        colHeadersBuffer = {
          ...colHeadersBuffer,
          ...matrix[r][hcol].colcontent
        }

        // console.log(colHeadersBuffer)
      }
    }

    row.map( (currentCell, c) => {
      if ( r >= Math.min(...headerRows) && c > Math.max(...headerCols) ) {
        let newHeaders = {
          // ...newHeaders,
          ...colHeadersBuffer
        }

        let headerGroups = headerRows.filter( hr => hr < r ).reduce( (acc,hrow) => {
          if (acc.buffer.length == 0 ){
            acc.buffer.push(hrow)
          } else {
            if ( hrow - acc.buffer[acc.buffer.length-1] == 1 ) {
              acc.buffer.push(hrow)
            } else {
              acc.groups.push(clone(acc.buffer))
              acc.buffer = [hrow]
            }
          }

          return acc
        }, {groups: [], buffer: []})

        headerGroups = [...headerGroups.groups, headerGroups.buffer]

        for ( const h in headerGroups[headerGroups.length-1] ) {
          const hrow = headerGroups[headerGroups.length-1][h]
          newHeaders = {
            ...newHeaders,
            ...matrix[hrow][c].rowcontent
          }
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
    const anyPresent = Object.keys(colHeadersBuffer).reduce( (acc, hcol) => { return acc || res[hcol] == res.value }, false )

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
