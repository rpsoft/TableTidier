import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { SEARCH_ACTION, REQUEST_COLLECTIONS_LIST_ACTION, CREATE_COLLECTION_ACTION } from './constants';

import { updateSearchResultsAction, updateCollectionsListAction } from './actions';
import makeSelectDashboard, {makeSelectCredentials} from './selectors';

import request from '../../utils/request';

import makeSelectLocation from '../App/selectors'

import { push } from 'connected-react-router';

const queryString = require('query-string');


export function* doSearch() {

  const dashboard_state = yield select(makeSelectDashboard());

  const locationData = yield select(makeSelectLocation());

  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/search`;

  const params = new URLSearchParams({
      'searchContent': dashboard_state.searchContent,
      'searchType': JSON.stringify(dashboard_state.searchType),
      'hash' : dashboard_state.hash,
      'username' :  dashboard_state.username
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){

    } else {
      yield put( yield updateSearchResultsAction(response.slice(0,100)) );
    }
  } catch (err) {
    console.log(err)
  }

}

export function* listCollections() {

  const credentials = yield select(makeSelectCredentials());

  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);

  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/collections`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'action' : 'list'
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      yield put( yield updateCollectionsListAction([]) );
    } else {
      yield put( yield updateCollectionsListAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }
}


export function* createCollection() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);

  const requestURL = `http://`+locationData.host+`:`+locationData.server_port+`/collections`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'action' : 'create'
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

      yield listCollections()
  
      yield put(push("/collection?collId="+response.data.rows[0].collection_id))
      // debugger
      // yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
  // return {collection: "hello"}
}

// Individual exports for testing
export default function* dashboardSaga() {
  yield takeLatest(SEARCH_ACTION, doSearch);
  yield takeLatest(REQUEST_COLLECTIONS_LIST_ACTION, listCollections);

  yield takeLatest(CREATE_COLLECTION_ACTION, createCollection);
}
