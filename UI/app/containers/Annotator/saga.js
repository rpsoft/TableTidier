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

  SAVE_TABLE_CONTENT_ACTION,
  SAVE_TABLE_ANNOTATIONS_ACTION,
  SAVE_TABLE_RESULTS_ACTION,
  SAVE_TABLE_METADATA_ACTION,
} from './constants';

import {
  loadTableContentAction,
  loadTableAnnotationsAction,
  loadTableResultsAction,
  loadTableMetadataAction,
  updateTableContentAction,
  updateTableAnnotationsAction,
  updateTableResultsAction,
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
                                            }; }, -1)

      // debugger
      // response.tablePosition_prev = response.tablePosition > -1 ? response.collectionData.tables[response.tablePosition-1] : false
      // response.current = response.tablePosition > -1 ? response.collectionData.tables[response.tablePosition] : false
      // response.tablePosition_next = response.tablePosition < (response.collectionData.tables.length-1) ? response.collectionData.tables[response.tablePosition+1] : false

      yield put( yield updateTableContentAction(response) );


      var annotations = _.isEmpty(response.annotationData) ? [] : response.annotationData.annotation.annotations.map(
        (item,id) => {
          // item.id = id;
          item.subAnnotation = item.subAnnotation ? item.subAnnotation : false; // this is to preserve compatibility with previous annotations that don't have subAnnotation
          return item
        })

      yield put( yield updateTableAnnotationsAction(annotations) );

    }
  } catch (err) {
    console.log(err)
  }

  return {}
  // return {collection: "hello"}
}

export function* getTableResult() {

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
      'cachedOnly' : true,
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


    // LOAD_TABLE_RESULTS_ACTION
    // UPDATE_TABLE_RESULTS_ACTION

      // response.docid = parsed.docid
      // response.page = parsed.page
      // response.collId = parsed.collId
      //
      // response.tablePosition = response.collectionData.tables.reduce( (i, table, index) => {
      //                                       if (table.docid.localeCompare(parsed.docid) == 0){
      //                                          return index
      //                                       } else{
      //                                          return i
      //                                       }; }, -1)
      //
      // response.tablePosition_prev = response.tablePosition > 0 ? response.collectionData.tables[response.tablePosition-1] : false
      // response.current = response.tablePosition > 0 ? response.collectionData.tables[response.tablePosition] : false
      // response.tablePosition_next = response.tablePosition < (response.collectionData.tables.length-1) ? response.collectionData.tables[response.tablePosition+1] : false
      //
      // yield put( yield updateTableContentAction(response) );
      //
      //
      // var annotations = _.isEmpty(response.annotationData) ? [] : response.annotationData.annotation.annotations.map(
      //   (item,id) => {
      //     // item.id = id;
      //     item.subAnnotation = item.subAnnotation ? item.subAnnotation : false; // this is to preserve compatibility with previous annotations that don't have subAnnotation
      //     return item
      //   })
      //
      // yield put( yield updateTableAnnotationsAction(annotations) );

    }
  } catch (err) {
    console.log(err)
  }

  return {}
  // return {collection: "hello"}
}



// Individual exports for testing
export default function* annotatorSaga() {
  // /annotationPreview
  yield takeLatest(LOAD_TABLE_CONTENT_ACTION, getTableContent);
  yield takeLatest(LOAD_TABLE_RESULTS_ACTION, getTableResult);

  // yield takeLatest(LOAD_TABLE_CONTENT_ACTION, getTableContent);
  // See example in containers/HomePage/saga.js
}
