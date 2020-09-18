/*
 *
 * CollectionView actions
 *
 */

import { LOAD_COLLECTION_ACTION, UPDATE_COLLECTION_ACTION, EDIT_COLLECTION_ACTION } from './constants';

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
