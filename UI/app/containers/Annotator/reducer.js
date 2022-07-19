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

  SAVE_TABLE_TEXT_ACTION,
  SAVE_TABLE_NOTES_ACTION,
  SAVE_TABLE_ANNOTATIONS_ACTION,
  SAVE_TABLE_METADATA_ACTION,

  ISSUE_ALERT_ACTION,

  LOAD_CUIS_INDEX_ACTION,
  UPDATE_CUIS_INDEX_ACTION,
  INSERT_CUIS_INDEX_ACTION,
  DELETE_CUIS_INDEX_ACTION,
} from './constants';

export const initialState = {
  tableData: {
    collId: '',
    docid: '',
    page: '',

    annotationData: {},
    collectionData: {tables:[]},
    predictedAnnotation : {},

    tableBody: '<div>Empty content</div>',
    tablePosition: -1,
    tableTitle: '<div>Empty title</div>',

    tableStatus: '',
    tableType: '',
    textNotes: '',

    status: '',
    permissions: {read:false, write: false}
  },
  annotations: [],
  results : [],
  metadata : {},
  alertData: { open: false, message: '', isError: false },
  cuis_index: {},
  allowEdit: false,
};

// annotations: [ { location: "Row" , content:[], qualifiers:[], number:1, subAnnotation:false },
//                { location: "Col" , content:[], qualifiers:[], number:1, subAnnotation:false } ],

/* eslint-disable default-case, no-param-reassign */
const annotatorReducer = (state = initialState, action) =>
  produce(state, draft => {
    // console.log( (new Date).getTime()+" : "+action.type)
    switch (action.type) {
      case UPDATE_TABLE_CONTENT_ACTION:
        draft.tableData = action.tableData;
        draft.allowEdit = action.tableData.permissions.write;
        break;
      case UPDATE_TABLE_ANNOTATIONS_ACTION:
        draft.annotations = action.annotations;
        break;

      case UPDATE_TABLE_RESULTS_ACTION:
        draft.results = action.results;
        break;

      case UPDATE_TABLE_METADATA_ACTION:

        draft.metadata = action.metadata;
        break;

      case ISSUE_ALERT_ACTION:
        draft.alertData = action.alertData
        break;

      case UPDATE_CUIS_INDEX_ACTION:
        draft.cuis_index = action.cuis_index
        break;

      case SAVE_TABLE_TEXT_ACTION:
      case SAVE_TABLE_NOTES_ACTION:
        draft.tableData = {...draft.tableData,...action.notes}

      case SAVE_TABLE_ANNOTATIONS_ACTION:
      case SAVE_TABLE_METADATA_ACTION:
    }

    return;
  });

export default annotatorReducer;
