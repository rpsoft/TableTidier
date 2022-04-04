const fs = require('fs/promises');
const path = require('path');

const GENERAL_CONFIG = require('../config.json')
const {
  tables_folder,
  // tables_folder_override,
  tables_folder_deleted,
} = GENERAL_CONFIG

// Move a file between collections
const moveFileToCollection = async (filedata, coll) => {
  const tables_folder_target = coll.indexOf("delete") > -1 ? tables_folder_deleted : tables_folder
  await fs.mkdir(
    path.join(tables_folder_target, coll),
    { recursive: true }
  )
  const filePath = filedata.path
  // Check if path includes tables_folder, if not add to it
  const fileCurrentPath = path.includes(tables_folder) ? path : path.join(tables_folder, filePath)
  const fileNewPath = path.join(tables_folder_target, coll, filedata.originalname)
  fs.rename(
    fileCurrentPath,
    fileNewPath
  );
}

module.exports = {
  moveFileToCollection,
}