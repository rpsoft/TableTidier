import { prepareAvailableDocuments } from "./table.js"

async function refreshDocuments(){
  // debugger
  var res = await prepareAvailableDocuments()
  available_documents = res.available_documents
  abs_index = res.abs_index
  DOCS = res.DOCS
}

module.exports = {
    refreshDocuments
}
