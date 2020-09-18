import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { LOAD_COLLECTION_ACTION, EDIT_COLLECTION_ACTION } from './constants';

import { loadCollectionAction, updateCollectionAction } from './actions';

import makeSelectCollectionView, {  makeSelectCredentials } from './selectors';

import makeSelectLocation from '../App/selectors'

const queryString = require('query-string');

import request from '../../utils/request';

export function* getCollectionData() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);

  // debugger

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
      // console.log(response)
      // COUld probably redirect to /
      yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : ""}) );
    } else {
      //
      // var tabs_n_anns = response.data.tables.reduce( (acc,ann,i) => {
      //                   var key = ann.docid+"_"+ann.page
      //                   if ( acc[key] ){
      //                       var ans = acc[key]
      //                       ans.push(ann)
      //                   } else {
      //                       acc[key] = [ann]
      //                   }
      //                   return acc; },{} )
      //
      // response.table = tabs_n_anns;

      debugger
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

  // debugger

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
      // debugger
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

// Individual exports for testing
export default function* collectionViewSaga() {
  yield takeLatest(LOAD_COLLECTION_ACTION, getCollectionData);
  yield takeLatest(EDIT_COLLECTION_ACTION, editCollectionData);
}
