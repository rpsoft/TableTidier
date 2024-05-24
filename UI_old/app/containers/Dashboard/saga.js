import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import {
  SEARCH_ACTION,
  REQUEST_COLLECTIONS_LIST_ACTION,
  CREATE_COLLECTION_ACTION
} from './constants';

import {
  updateSearchResultsAction,
  updateCollectionsListAction
} from './actions';

import makeSelectDashboard, {makeSelectCredentials} from './selectors';

import 
  request,
  {
    generateOptionsPost
  }
from '../../utils/request';

import makeSelectLocation from '../App/selectors'
import makeSelectLogin from '../Login/selectors'

const queryString = require('query-string');

import { URL_BASE } from '../../links'

export function* doSearch() {

  const dashboard_state = yield select(makeSelectDashboard());
  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const requestURL = locationData.api_url+`search`;

  const params = new URLSearchParams({
    'searchContent': dashboard_state.searchContent,
    'searchType': JSON.stringify(dashboard_state.searchType),
  });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised') {
      return
    }

    yield put( yield updateSearchResultsAction(response) );
  } catch (err) {
    console.log(err)
  }
}

export function* listCollections() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`collections`;

  const params = new URLSearchParams({
    'action': 'list'
  });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised'){
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
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`collections`;

  const params = new URLSearchParams({
    'action': 'create'
  });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised' ){
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
    } else {

      yield listCollections()

      // yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}

// Individual exports for testing
export default function* dashboardSaga() {
  yield takeLatest(SEARCH_ACTION, doSearch);
  yield takeLatest(REQUEST_COLLECTIONS_LIST_ACTION, listCollections);
  yield takeLatest(CREATE_COLLECTION_ACTION, createCollection);
}
