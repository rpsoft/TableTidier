/*
 *
 * CollectionView reducer
 *
 */
import produce from 'immer';
import {
  LOAD_COLLECTION_ACTION,
  UPDATE_COLLECTION_ACTION,
  UPDATE_COLLECTION_TABLES_ACTION,
} from './constants';

export const initialState = {
  title :'',
  collection_id : '',
  description : '',
  owner_username : '',
  tables : [],
  collectionsList : [],
  visibility : 'public',
  completion : 'in progress',
  permissions : {read: false, write: false}
};

/* eslint-disable default-case, no-param-reassign */
const collectionViewReducer = (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case LOAD_COLLECTION_ACTION:
        break;
      case UPDATE_COLLECTION_ACTION:
        try{
          if ( action.collectionData){
            draft.title = action.collectionData.title;
            draft.collection_id = action.collectionData.collection_id;
            draft.description = action.collectionData.description;
            draft.owner_username = action.collectionData.owner_username;
            draft.tables = action.collectionData.tables;
            draft.collectionsList = action.collectionData.collectionsList;
            draft.visibility = action.collectionData.visibility;
            draft.completion = action.collectionData.completion;
            draft.permissions = action.collectionData.permissions
          }
        } catch(e){
          console.log(e)
        }
        // console.log("REDUCED = "+JSON.stringify(action.collectionData))
        break;
      case UPDATE_COLLECTION_TABLES_ACTION:
        draft.tables = action.tables;
        break;
    }
  });

export default collectionViewReducer;
