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
} from './constants';

export const initialState = {
  tableData: {
    collId:"",
    docid:"",
    page:"",

    annotationData: {},
    collectionData: {tables:[]},
    predictedAnnotation : {},

    tableBody: "<div>Empty content</div>",
    tablePosition:-1,
    tableTitle: "<div>Empty title</div>",

    tableStatus:"",
    tableType:"",
    textNotes:"",

    status:"",
  },
  annotations: [],
  results : [],
  metadata : {},
  alertData: { open: false, message: "", isError: false },
};

// annotations: [ { location: "Row" , content:[], qualifiers:[], number:1, subAnnotation:false },
//                { location: "Col" , content:[], qualifiers:[], number:1, subAnnotation:false } ],

/* eslint-disable default-case, no-param-reassign */
const annotatorReducer = (state = initialState, action) =>
  produce(state, draft => {

    console.log( (new Date).getTime()+" : "+action.type)
    switch (action.type) {
      case UPDATE_TABLE_CONTENT_ACTION:
        // debugger
        draft.tableData = action.tableData;
        // draft.results = []
        // draft.metadata = {}
        break;

      case UPDATE_TABLE_ANNOTATIONS_ACTION:
        draft.annotations = action.annotations;
        break;

      case UPDATE_TABLE_RESULTS_ACTION:
        draft.results = action.results;
        break;

      case ISSUE_ALERT_ACTION:
        // debugger
        draft.alertData = action.alertData
        break;

      case SAVE_TABLE_TEXT_ACTION:
      case SAVE_TABLE_NOTES_ACTION:

        draft.tableData = {...draft.tableData,...action.notes}
        // draft.tableData.tableStatus = action.tableStatus
        // draft.tableData.tableType = action.tableType
        // draft.tableData.textNotes = action.textNotes


      case SAVE_TABLE_ANNOTATIONS_ACTION:
      case SAVE_TABLE_METADATA_ACTION:
        // debugger
    }

    return;
  });

export default annotatorReducer;
