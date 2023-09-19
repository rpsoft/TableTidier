
exports.tablesDocidPageGet = (tables) => {
  const tablesDocidPage = tables.map( (tab, index) => {
    const [docid, page] = tab.split("_");
    // if invalid docid or page throw err
    if (!docid || !page) {
      throw `Param docid=${docid} or page=${page} not valid at index ${index}`
    }
    return {docid, page}
  })
  return tablesDocidPage
}