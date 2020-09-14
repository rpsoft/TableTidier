import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { LOAD_COLLECTION_ACTION } from './constants';

import { loadCollectionAction, updateCollectionAction } from './actions';

import { makeSelectCredentials } from './selectors';

import makeSelectLocation from '../App/selectors'

const queryString = require('query-string');

import request from '../../utils/request';

export function* getCollectionData() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);

  // debugger

  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/collections`;

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
      // console.log(response)
      // COUld probably redirect to /
      yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : ""}) );
    } else {
      yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
  // return {collection: "hello"}
}

// Individual exports for testing
export default function* collectionViewSaga() {
  yield takeLatest(LOAD_COLLECTION_ACTION, getCollectionData);
}
