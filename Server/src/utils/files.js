const fs = require('fs/promises');
const path = require('path');

const CONFIG_PATH = process.env.CONFIG_PATH || process.cwd()
const GENERAL_CONFIG = require(CONFIG_PATH + '/config.json')

const {
  tables_folder,
  // tables_folder_override,
  tables_folder_deleted,
} = GENERAL_CONFIG

/** 
 * Move a file between collections
 * */ 
 exports.moveFileToCollection = async (filedata, coll) => {
  const collString = coll.toString()
  const tables_folder_target = collString.includes("delete") ?
    tables_folder_deleted
    : tables_folder
  try {
    await fs.mkdir(
      path.join(
        tables_folder_target,
        collString
      ),
      { recursive: true }
    )
  } catch (err) {
    throw err
  }

  const filePath = filedata.path
  // Check if path includes tables_folder, if not add to it
  const fileCurrentPath = filePath.includes(tables_folder)?
    filePath 
    : path.join(tables_folder, filePath)

  const fileNewPath = path.join(
    tables_folder_target,
    collString,
    filedata.originalname
  )
  
  try {
    await fs.rename(
      fileCurrentPath,
      fileNewPath
    );
  } catch (err) {
    throw err
  }
}
