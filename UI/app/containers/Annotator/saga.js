import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import {
  LOAD_TABLE_CONTENT_ACTION,
  LOAD_TABLE_ANNOTATIONS_ACTION,
  LOAD_TABLE_RESULTS_ACTION,
  LOAD_TABLE_METADATA_ACTION,

  UPDATE_TABLE_CONTENT_ACTION,
  UPDATE_TABLE_ANNOTATIONS_ACTION,
  UPDATE_TABLE_RESULTS_ACTION,
  UPDATE_TABLE_METADATA_ACTION,

  SAVE_TABLE_TEXT_ACTION,
  SAVE_TABLE_NOTES_ACTION,
  SAVE_TABLE_ANNOTATIONS_ACTION,
  SAVE_TABLE_METADATA_ACTION,

  LOAD_CUIS_INDEX_ACTION,
  UPDATE_CUIS_INDEX_ACTION,
  INSERT_CUIS_INDEX_ACTION,
  DELETE_CUIS_INDEX_ACTION,

  AUTO_LABEL_HEADERS_ACTION,

} from './constants';

import {
  loadTableContentAction,
  loadTableAnnotationsAction,
  loadTableResultsAction,
  loadTableMetadataAction,
  updateTableContentAction,
  updateTableAnnotationsAction,
  updateTableResultsAction,
  updateTableMetadataAction,
  issueAlertAction,
  updateCuisIndexAction,
  loadCuisIndexAction,
} from './actions';

import makeSelectAnnotator from './selectors';

import request from '../../utils/request';

import {makeSelectLocation, makeSelectCredentials} from '../App/selectors'

import { push } from 'connected-react-router';
const queryString = require('query-string');

export function* getTableContent() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);
  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/getTableContent`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'docid' : parsed.docid,
      'page' : parsed.page,
      'collId' : parsed.collId,
      'action' : 'get',
      'enablePrediction' : false
    });


  if ( !parsed.docid ){
    return {}
  }

  const options = {
    method: 'POST',
    body: params
  }
// debugger
  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );

    } else {

      response.docid = parsed.docid
      response.page = parsed.page
      response.collId = parsed.collId

      response.collectionData.tables = response.collectionData.tables.sort( (a,b) => (a.docid+"_"+a.page).localeCompare((b.docid+"_"+b.page)))

      response.tablePosition = response.collectionData.tables.reduce( (i, table, index) => {
                                            if ( (table.docid+"_"+table.page).localeCompare(parsed.docid+"_"+parsed.page) == 0){
                                               return index
                                            } else{
                                               return i
                                            }; }, -1) + 1

                                                // debugger

      response.tableStatus = response.annotationData.completion
      response.tableType = response.annotationData.tableType
      response.textNotes = response.annotationData.notes

      // response.tablePosition_prev = response.tablePosition > -1 ? response.collectionData.tables[response.tablePosition-1] : false
      // response.current = response.tablePosition > -1 ? response.collectionData.tables[response.tablePosition] : false
      // response.tablePosition_next = response.tablePosition < (response.collectionData.tables.length-1) ? response.collectionData.tables[response.tablePosition+1] : false
      // debugger
      yield put( yield updateTableContentAction(response) );

      // debugger
      var annotations = (!_.isEmpty(response.annotationData)) && response.annotationData.annotation ? response.annotationData.annotation.annotations.map(
        (item,id) => {
          item.subAnnotation = item.subAnnotation ? item.subAnnotation : false; // this is to preserve compatibility with previous annotations that don't have subAnnotation
          return item
        }) : []

      yield put( yield updateTableAnnotationsAction(annotations) );

    }
  } catch (err) {
    debugger
    console.log(err)
  }

  return {}

}

export function* getTableResult( payload ) {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);
  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/annotationPreview`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'docid' : parsed.docid,
      'page' : parsed.page,
      'collId' : parsed.collId,
      'cachedOnly' : payload.cachedOnly,
      'action' : 'get',

      // 'enablePrediction' : false
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );

    } else {
        // debugger
        yield put( yield updateTableResultsAction(response.result) );

    }
  } catch (err) {
    console.log(err)
  }

  return {}
  // return {collection: "hello"}
}

export function* getCUISIndex( payload ) {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);
  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/cuis`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'action' : 'get' // get  delete  edit
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      yield put( yield updateCuisIndexAction({}) );
      // debugger
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
    } else {
      // debugger
      yield put( yield updateCuisIndexAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}


export function* getTableMetadata( payload ) {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);
  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/metadata`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'docid' : parsed.docid,
      'page' : parsed.page,
      'collId' : parsed.collId,
      'tid' : payload.tid,
      'action' : 'get' // get  delete  edit
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
       debugger
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
    } else {

      var metadata = response.data.reduce(
        (acc, meta_item, i) => {
          var mItem = {...meta_item}

          mItem.cuis = mItem.cuis && mItem.cuis.length > 0 ? Array.from(new Set(mItem.cuis.split(";"))) : []
          mItem.cuis_selected = mItem.cuis_selected && mItem.cuis_selected.length > 0 ? Array.from(new Set(mItem.cuis_selected.split(";"))) : []


          mItem.cuis.sort( (a,b) => mItem.cuis_selected.indexOf(b) - mItem.cuis_selected.indexOf(a) )

          mItem.qualifiers = Array.from(new Set(mItem.qualifiers.split(";")))
          mItem.qualifiers_selected = Array.from(new Set(mItem.qualifiers_selected.split(";")))

          acc[meta_item.concept.toLowerCase()] = mItem;
          return acc
        }, {} )
      yield put( yield updateTableMetadataAction(metadata) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}

export function* saveChanges ( payload ) {

    const credentials = yield select(makeSelectCredentials());
    const locationData = yield select(makeSelectLocation());

    const parsed = queryString.parse(location.search);

    var requestURL = `http://`+locationData.host+`:`+locationData.server_port;

    var pre_params = {
        'hash' : credentials.hash,
        'username' :  credentials.username,
        'docid' : parsed.docid,
        'page' : parsed.page,
        'collId' : parsed.collId,
      }

    switch( payload.type ) {
      case SAVE_TABLE_TEXT_ACTION:
        requestURL = requestURL+`/text`

        pre_params = {...pre_params,
                  'action' : 'save',
                  'target' : 'text', // table / notes / annotation / metadata,
                  'payload' : JSON.stringify({tableTitle: payload.tableTitle, tableBody: payload.tableBody}),
              }

        break;
      case SAVE_TABLE_NOTES_ACTION:
        requestURL = requestURL+`/notes`

        pre_params = {...pre_params,
                  'action' : 'save',
                  'target' : 'notes', // table / notes / annotation / metadata,
                  'payload' : JSON.stringify(payload.notes),
              }

        break;
      case SAVE_TABLE_ANNOTATIONS_ACTION:
        requestURL = requestURL+`/saveAnnotation`

        pre_params = {...pre_params,
                  'action' : 'save',
                  'target' : 'annotation', // table / notes / annotation / metadata,
                  'payload' : JSON.stringify({tid: payload.tid, annotations: payload.annotations}),
              }

        break;
      case SAVE_TABLE_METADATA_ACTION:
        requestURL = requestURL+`/metadata`

        pre_params = {...pre_params,
                  'action' : 'save',
                  'target' : 'metadata', // table / notes / annotation / metadata,
                  'payload' : JSON.stringify({tid: payload.tid, metadata: payload.metadata}),
              }
        // debugger
        break;
    }

    const params = new URLSearchParams( pre_params )

    const options = {
      method: 'POST',
      body: params
    }

    try {
      const response = yield call(request, requestURL, options);

      if ( response.status && response.status == "unauthorised"){
        // COUld probably redirect to /
        // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
        // alert("unauthorised action")
        yield put( yield issueAlertAction({ open: true, message: "unauthorised action", isError: true }))
      } else {
        // debugger
          // yield put( yield updateTableResultsAction(response.result) );
          switch( payload.type ) {
            case SAVE_TABLE_TEXT_ACTION:
              yield put( yield issueAlertAction({ open: true, message: "Table Successfully Saved", isError: false }))
              break;
            case SAVE_TABLE_NOTES_ACTION:
              yield put( yield issueAlertAction({ open: true, message: "Notes Successfully Saved", isError: false }))
              break;
            case SAVE_TABLE_ANNOTATIONS_ACTION:
              yield put( yield issueAlertAction({ open: true, message: "Annotations Successfully Saved", isError: false }))
              break;
            case SAVE_TABLE_METADATA_ACTION:
              yield put( yield issueAlertAction({ open: true, message: "Metadata Successfully Saved", isError: false }))
              break;
          }
      }
    } catch (err) {
      console.log(err)
    }

    return {}
}


export function* getAutoLabels( payload ) {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);
  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/auto`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'docid' : parsed.docid,
      'page' : parsed.page,
      'collId' : parsed.collId,
      'tid' : payload.tid,
      'headers' : JSON.stringify(payload.headers),
      'action' : 'label' // get  delete  edit
    });

  const options = {
    method: 'POST',
    body: params
  }

  yield put( yield issueAlertAction({ open: true, message: "Labelling, please wait...", isError: false }))

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      // debugger
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
    } else {
      // debugger

      var metadata = Object.keys(response.autoLabels).reduce(
        (acc, key, i) => {

          var mItem = {}

          mItem.concept_source = ""
          mItem.concept = response.autoLabels[key].concept
          mItem.concept_root = response.autoLabels[key].concept

          mItem.cuis = response.autoLabels[key].labels.map( item => item.CUI )
          // debugger

          mItem.cuis_selected = mItem.cuis && mItem.cuis.length > 0 ? [mItem.cuis[0]] : []

          mItem.cuis.sort( (a,b) => mItem.cuis_selected.indexOf(b) - mItem.cuis_selected.indexOf(a) )

          mItem.qualifiers = [] //Array.from(new Set(mItem.qualifiers.split(";")))
          mItem.qualifiers_selected = [] //Array.from(new Set(mItem.qualifiers_selected.split(";")))

          mItem.istitle = false
          mItem.labeller = credentials.username
          mItem.tid = payload.tid

          acc[key] = mItem;
          return acc

        }, {} )

      // debugger
      yield put( yield updateTableMetadataAction(metadata) );

      yield put( yield loadCuisIndexAction());

      yield put( yield issueAlertAction({ open: true, message: "Labels assigned", isError: false }))

      // yield put( yield updateTableMetadataAction(metadata) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}

// Individual exports for testing
export default function* annotatorSaga() {

  yield takeLatest(LOAD_TABLE_CONTENT_ACTION, getTableContent);
  yield takeLatest(LOAD_TABLE_RESULTS_ACTION, getTableResult);
  yield takeLatest(LOAD_TABLE_METADATA_ACTION, getTableMetadata);
  yield takeLatest(LOAD_CUIS_INDEX_ACTION, getCUISIndex);

  yield takeLatest(SAVE_TABLE_TEXT_ACTION, saveChanges);
  yield takeLatest(SAVE_TABLE_NOTES_ACTION, saveChanges);
  yield takeLatest(SAVE_TABLE_ANNOTATIONS_ACTION, saveChanges);
  yield takeLatest(SAVE_TABLE_METADATA_ACTION, saveChanges);

  yield takeLatest(AUTO_LABEL_HEADERS_ACTION, getAutoLabels);

  // yield takeLatest(LOAD_TABLE_CONTENT_ACTION, getTableContent);
  // See example in containers/HomePage/saga.js
}
