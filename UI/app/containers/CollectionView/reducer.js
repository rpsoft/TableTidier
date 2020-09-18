/*
 *
 * CollectionView reducer
 *
 */
import produce from 'immer';
import { LOAD_COLLECTION_ACTION, UPDATE_COLLECTION_ACTION } from './constants';

export const initialState = {
  title :"",
  collection_id : "new",
  description : "",
  owner_username : "",
  tables : []
};

/* eslint-disable default-case, no-param-reassign */
const collectionViewReducer = (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case LOAD_COLLECTION_ACTION:
        break;
      case UPDATE_COLLECTION_ACTION:
        draft.title = action.collectionData.title;
        draft.collection_id = action.collectionData.collection_id;
        draft.description = action.collectionData.description;
        draft.owner_username = action.collectionData.owner_username
        draft.tables = action.collectionData.tables
        // debugger
        // console.log("REDUCED = "+JSON.stringify(action.collectionData))
        break;
    }
  });

export default collectionViewReducer;
