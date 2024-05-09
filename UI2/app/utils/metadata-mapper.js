/**
 * generateMetamappers will generate mappers between data and metadata for a table
 * 
 * It will return
 *  concMapper: mapper using field names
 *  posiMapper: mapper using column and row
 */
import { getPermutations } from 'array-permutation-recursive';

/**
 *
 * @param  {object} data table object with data and metadata
 *
 * @return {object}  It will return:
 *  concMapper: mapper using field names
 *  posiMapper: mapper using column and row
 */
export default function generateMetamappers(data) {
  const concMapper = {}
  const posiMapper = {}

  const metaFields = [
    'concept',
    'concept_root',
    'concept_source'
  ]

  data.metadata.forEach((meta, index) => {
    let conceptsNumber = 0
    let concepts = []
    for (let field of metaFields) {
      if (meta[field].length == 0)
        continue
      concepts.push(meta[field])
      conceptsNumber += 1
    }
    if (conceptsNumber == 1) {
      concMapper[concepts[0]] = index
    }
    if (conceptsNumber == 2) {
      concMapper[concepts[0]] = {
        // Add previous added fields if exists
        ...(concMapper[concepts[0]] || {}),
        [concepts[1]]: index
      }
    }
  })

  const fieldsToRemove = [
    'col',
    'row',
    'value'
  ]

  const findNode = (field, fields, mapper) => {
    if (fields.length == 0) return null

    if (mapper[field] == undefined) return null
     //   when reach index format number return
    if (Number.isInteger(mapper[field])) {
      return {name: field, index: mapper[field]}
    }
    for (let newFields of fields) {
      let algo = findNode(newFields.shift(), newFields, mapper[field])
      if (algo==null) continue
      return {name: field, index: algo.index}
    }
    return null
  }

  data.tableResults.forEach((result) => {
    const {
      col,
      row,
    } = result
    let resultFields = Object.keys(result)
    let fieldsToLink = resultFields.filter(item => fieldsToRemove.includes(item) == false)
    let resultFieldsValues = fieldsToLink.map(item=>result[item])
  
    for (let field of resultFieldsValues) {

      try {      
      
        var permutations = getPermutations(
          resultFieldsValues.filter(item => item != field))

        if ( ! Array.isArray(permutations) ){
          permutations = [[permutations, permutations]]
        }

        const {name, index: idx} = findNode(
          field, permutations, concMapper) || {}

        if (name == null) continue

        posiMapper[col] = {
          // Add previous added column fields if exists
          ...(posiMapper[col] || {}),
          // Add rows
          [row]: posiMapper[col]? 
            {
              ...(posiMapper[col][row] || {}),
              [name]: idx
            }: {
              [name]: idx
            }
        }

      } catch (e) {
        console.log("Permutations Error?: "+e)
        // debugger
      }
    }
  })

  return {
    concMapper,
    posiMapper,
  }
}

