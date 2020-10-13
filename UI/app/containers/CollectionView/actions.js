/*
 *
 * CollectionView actions
 *
 */

import { LOAD_COLLECTION_ACTION, UPDATE_COLLECTION_ACTION, DELETE_COLLECTION_ACTION,
         EDIT_COLLECTION_ACTION, REMOVE_TABLES_ACTION,
         MOVE_TABLES_ACTION } from './constants';

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
