import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { LOAD_COLLECTION_ACTION, EDIT_COLLECTION_ACTION, REMOVE_TABLES_ACTION, MOVE_TABLES_ACTION } from './constants';

import { loadCollectionAction, updateCollectionAction } from './actions';

import makeSelectCollectionView, {  makeSelectCredentials } from './selectors';

import makeSelectLocation from '../App/selectors'

const queryString = require('query-string');

import request from '../../utils/request';

export function* getCollectionData() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);

  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/collections`;

  if ( parsed.collId == "new"){
    yield put( yield updateCollectionAction({title : "", collection_id : "new", description: "", owner_username : ""}) );
    return
  }

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'action' : 'get'
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){

      // COUld probably redirect to /
      yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
    } else {
      yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
  // return {collection: "hello"}
}


export function* editCollectionData() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const collectionState = yield select(makeSelectCollectionView());

  const parsed = queryString.parse(location.search);

  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/collections`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'collectionData' : JSON.stringify(collectionState),
      'action' : 'edit'
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      //yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : ""}) );
    } else {
      // console.log("BOOM ALLES GUT")

      yield put( yield updateCollectionAction({title : response.data.title,
                                              collection_id : response.data.collection_id,
                                              description: response.data.description,
                                              owner_username : response.data.owner_username}) );

      // yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
  // return {collection: "hello"}
}


export function* removeCollectionTables ( payload ) {

  const credentials = yield select(makeSelectCredentials());
  const parsed = queryString.parse(location.search);

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'tablesList' : JSON.stringify(Object.keys(payload.tablesList)),
      'action' : 'remove'
    });

  const options = {
    method: 'POST',
    body: params
  }
  // debugger
  const locationData = yield select(makeSelectLocation());
  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/tables`;
  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", tables : []}) );
    } else {
      yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
    yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", tables : []}) );
  }

  return {}
}


export function* moveCollectionTables ( payload ) {
  const credentials = yield select(makeSelectCredentials());
  const parsed = queryString.parse(location.search);

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'tablesList' : JSON.stringify(Object.keys(payload.tablesList)),
      'targetCollectionID' : payload.targetCollectionID,
      'action' : 'move'
    });

  const options = {
    method: 'POST',
    body: params
  }

  const locationData = yield select(makeSelectLocation());
  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/tables`;

  try {

    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){

      yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", tables : []}) );
    } else {
      yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {

    console.log(err)
    yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", tables : []}) );
  }

  return {}
}

// Individual exports for testing
export default function* collectionViewSaga() {
  yield takeLatest(LOAD_COLLECTION_ACTION, getCollectionData);
  yield takeLatest(EDIT_COLLECTION_ACTION, editCollectionData);
  yield takeLatest(REMOVE_TABLES_ACTION, removeCollectionTables);
  yield takeLatest(MOVE_TABLES_ACTION, moveCollectionTables);

}
