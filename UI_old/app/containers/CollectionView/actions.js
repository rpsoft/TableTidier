/*
 *
 * CollectionView actions
 *
 */

import {
  LOAD_COLLECTION_ACTION,
  UPDATE_COLLECTION_ACTION,
  UPDATE_COLLECTION_TABLES_ACTION,
  DELETE_COLLECTION_ACTION,
  EDIT_COLLECTION_ACTION,
  REMOVE_TABLES_ACTION,
  MOVE_TABLES_ACTION,
  DOWNLOAD_DATA_ACTION
} from './constants';

export function loadCollectionAction() {
  return {
    type: LOAD_COLLECTION_ACTION,
  };
}

export function updateCollectionAction(collectionData) {
  return {
    type: UPDATE_COLLECTION_ACTION,
    collectionData,
  };
}

export function updateCollectionTablesAction(tables) {
  return {
    type: UPDATE_COLLECTION_TABLES_ACTION,
    tables,
  };
}

export function editCollectionAction() {
  return {
    type: EDIT_COLLECTION_ACTION,
  };
}

export function removeTablesAction(tablesList, collectionData) {
  return {
    type: REMOVE_TABLES_ACTION,
    tablesList,
    collectionData
  };
}

export function moveTablesAction(tablesList, targetCollectionID) {
  return {
    type: MOVE_TABLES_ACTION,
    tablesList,
    targetCollectionID
  };
}

export function deleteCollectionAction() {
  return {
    type: DELETE_COLLECTION_ACTION,
  };
}


export function downloadDataAction(target, tids) {
  return {
    type: DOWNLOAD_DATA_ACTION,
    target: target,
    tids: tids
  };
}

export default {
  tablesCopy: {
    // name format: 'yourproject/YourContainer/YOUR_ACTION_CONSTANT'
    type: 'app/CollectionView/COPY_TABLES_ACTION',
    action: function(tablesList, targetCollectionID) {
      return {
        type: this.type,
        tablesList,
        targetCollectionID,
      }
    }
  },

}