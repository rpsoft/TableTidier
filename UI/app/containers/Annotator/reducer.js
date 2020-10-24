/*
 *
 * Annotator reducer
 *
 */
import produce from 'immer';
import {
  // LOAD_TABLE_CONTENT_ACTION,
  // LOAD_TABLE_ANNOTATIONS_ACTION,
  // LOAD_TABLE_RESULTS_ACTION,
  // LOAD_TABLE_METADATA_ACTION,
  UPDATE_TABLE_CONTENT_ACTION,
  UPDATE_TABLE_ANNOTATIONS_ACTION,
  UPDATE_TABLE_RESULTS_ACTION,
  UPDATE_TABLE_METADATA_ACTION,
  // SAVE_TABLE_CONTENT_ACTION,
  // SAVE_TABLE_ANNOTATIONS_ACTION,
  // SAVE_TABLE_RESULTS_ACTION,
  // SAVE_TABLE_METADATA_ACTION,

} from './constants';

export const initialState = {
  tableData: { tableTitle: "<div>This is Title </div>", tableBody: "<div>This is the content</div>", collectionData: {tables:[]}, tablePosition:-1},
  annotations: [ { location: "Row" , content:{}, qualifiers:{}, number:1, subAnnotation:false },
                 { location: "Col" , content:{}, qualifiers:{}, number:1, subAnnotation:false } ],
  results : [],
  metadata : {},
};

/* eslint-disable default-case, no-param-reassign */
const annotatorReducer = (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case UPDATE_TABLE_CONTENT_ACTION:
        draft.tableData = action.tableData;
        draft.results = []
        draft.metadata = {}
        break;
      case UPDATE_TABLE_ANNOTATIONS_ACTION:
        draft.annotations = action.annotations;
        break;
      case UPDATE_TABLE_RESULTS_ACTION:
        draft.results = action.results;

    }
  });

export default annotatorReducer;
