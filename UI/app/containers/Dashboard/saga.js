import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { SEARCH_ACTION } from './constants';

// import { doSearchAction } from './actions';
import makeSelectDashboard from './selectors';

import request from '../../utils/request';


export function* doSearch() {

  const dashboard_state = yield select(makeSelectDashboard());
  const requestURL = `http://localhost:6541/search`;

  const params = new URLSearchParams( { 'searchContent': dashboard_state.searchContent, 'searchType': JSON.stringify(dashboard_state.searchType) } );

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    // debugger

    console.log("SEARCH: "+response.status);

    // if ( response.status && response.status == "unauthorised"){
    //   yield put( yield loginFailedAction(response.status));
    // } else {
    //   yield put( yield loginSuccessAction(response.payload.hash));
    // }

  } catch (err) {
    // yield put(loginFailedAction(err));
    console.log(err)
  }

}

// Individual exports for testing
export default function* dashboardSaga() {
  // See example in containers/HomePage/saga.js
  yield takeLatest(SEARCH_ACTION, doSearch);
}
