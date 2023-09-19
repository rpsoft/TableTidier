const fs = require('fs/promises');
const path = require('path');

const CONFIG_PATH = process.env.CONFIG_PATH || process.cwd()
const GENERAL_CONFIG = require(CONFIG_PATH + '/config.json')

const {
  tables_folder,
  tables_folder_override,
  tables_folder_deleted,
} = GENERAL_CONFIG

// Move from original and override
const foldersRoot = [
  tables_folder,
  tables_folder_override,
]

/** 
 * folderCreateIfNotExists
 * 
 * @param {string} foldername
 * */ 
const folderCreateIfNotExists = foldername => {
  return fs.mkdir(
    foldername,
    { recursive: true }
  )
}


/** 
 * Copy a table file from a source to a destination collection
 * 
 * @param {object} filedata
 * @param {string} filedata.source source path to copy
 * @param {string} filedata.dest destination path to copy to
 * */ 
exports.fileTableCopy = async ({source, dest}) => {
  // check where file exists HTML_TABLES and HTML_TABLES_OVERRIDE
  const fileRoutesExists = await Promise.all(
    foldersRoot.map(foldername =>
      fs.access(
        path.join(foldername, source)
      ).then(() => true, () => false))
  )

  // if all the routes are false
  // file do not exists!!!
  if (fileRoutesExists.reduce((prev, current) => prev || current, false) == false) {
    return Promise.reject(new Error('fail: file to copy do not exists!!!'))
  }

  // Copy table where exists
  const result = await Promise.all(fileRoutesExists.map((exists, index) => {
    if (exists) {
      // copy file
      return fs.cp(
        // source
        path.join(foldersRoot[index], source),
        // dest
        path.join(foldersRoot[index], dest),
        {recursive: true}
      ).then(source + ' copied to ' + foldersRoot[index])
    }
    return Promise.resolve('no need to copy to ' + foldersRoot[index])
  }))
  return result
}

/** 
 * Move a file between collections
 * 
 * @param {object} filedata
 * @param {string} filedata.filename file name from db ex: 28573499-4-1_1.html
 * @param {string} filedata.collIdCurrent current collection Id
 * @param {string} filedata.path collection current path + file name ex: 45/28573499-4-1_1.html
 * 
 * @param {string} collectionTarget id of  the target collection
 * */ 
 exports.fileToCollectionMove = async (filedata, collectionTarget) => {
  const tableMove = async (pathRoot) => {
    const collectionTargetString = collectionTarget.toString()
    // create collection folder
    await folderCreateIfNotExists(
      path.join(
        pathRoot,
        collectionTargetString
      ))

    const {
      // path contains current collection id
      path: filePath,
      filename,
    } = filedata

    // Check if path includes tables_folder, if not add to it
    const fileCurrentPath = filePath.includes(tables_folder)?
      filePath
      : path.join(pathRoot, filePath)
  
    const fileNewPath = path.join(
      pathRoot,
      collectionTargetString,
      filename,
    )

    return fs.rename(
      fileCurrentPath,
      fileNewPath
    );
  }

  try {
    // Move
    return Promise.all(foldersRoot.map(async (pathRoot) => {
      const fileWithPath = path.join(
        pathRoot,
        filedata.path
      )
      // Check if file exist
      const fileExists = await fs.stat(fileWithPath).then(() => true, () => false)
      
      if (fileExists == false) return 'file not found ' + fileWithPath

      return tableMove(pathRoot)
    }))
  } catch (err) {
    throw err
  }
}

/** 
 * Remove a file from collections
 * 
 * @param {object} filedata
 * @param {string} filedata.filename file name from db ex: 28573499-4-1_1.html
 * @param {string} filedata.collIdCurrent current collection Id
 * @param {string} filedata.path collection current path + file name ex: 45/28573499-4-1_1.html
 * */ 
exports.fileFromCollectionDelete = async (filedata) => {
  const tableRemove = async (pathRoot) => {
    // create deleted collection folder 
    await folderCreateIfNotExists(
      path.join(
        tables_folder_deleted,
        'deleted'
      ))

    const {
      path: filePath,
      tid,
      filename,
    } = filedata

    // Check if path includes tables_folder, if not add to it
    const fileCurrentPath = filePath.includes(tables_folder)?
      filePath
      : path.join(pathRoot, filePath)

    const fileNewPath = path.join(
      // move to deleted folder
      tables_folder_deleted,
      'deleted',
      // add table id to file name
      // if it came from overwrite, add 'overwrite' text to file name
      tid + (pathRoot == tables_folder_override? '&overwrite&': '&') + filename,
    )

    return fs.rename(
      fileCurrentPath,
      fileNewPath
    );
  }

  try {
    // Move
    return Promise.all(foldersRoot.map(async (pathRoot) => {
      const fileWithPath = path.join(
        pathRoot,
        filedata.path
      )
      // Check if file exist
      const fileExists = await fs.stat(fileWithPath).then(() => true, () => false)
      
      if (fileExists == false) return 'file not found ' + fileWithPath

      return tableRemove(pathRoot)
    }))
  } catch (err) {
    throw err
  }
}