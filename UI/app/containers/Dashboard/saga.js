import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { SEARCH_ACTION } from './constants';

import { updateSearchResultsAction } from './actions';
import makeSelectDashboard from './selectors';

import request from '../../utils/request';

import makeSelectLocation from '../App/selectors'

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

// Individual exports for testing
export default function* dashboardSaga() {
  // See example in containers/HomePage/saga.js
  yield takeLatest(SEARCH_ACTION, doSearch);
}
