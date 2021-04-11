import { take, call, put, select, takeLatest } from 'redux-saga/effects';
import { LOGIN_ACTION } from './constants';
import { loginAction, loginSuccessAction, loginFailedAction } from './actions';
import { makeSelectLogin } from './selectors';

import request from '../../utils/request';
// import HttpClient from '../../network/http-client';

import makeSelectLocation from '../App/selectors'
import {issueAlertAction} from '../App/actions'

const queryString = require('query-string');

export function* doLogin() {

  const locationData = yield select(makeSelectLocation());

  // const parsed = queryString.parse(location.search);

  const login_details = yield select(makeSelectLogin());
  const requestURL = locationData.api_url+`login`;

  // const requestURL = `http://localhost:6541/login`;(locationData.server_port ? `:`+locationData.server_port : "")

  const params = new URLSearchParams( { 'username': login_details.username, 'password': login_details.password });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    console.log("LOGIN: "+response.status);

    if ( response.status && response.status == "unauthorised"){
      yield put( yield loginFailedAction(response.status));
    } else {
      yield put( yield loginSuccessAction(response.payload.hash));
      yield put( yield issueAlertAction({ open: true, message: "Logged in Successfully", isError: false }))
    }
  } catch (err) {
    yield put(loginFailedAction(err));
  }

}

// Individual exports for testing
export default function* loginSaga() {
  // See example in containers/HomePage/saga.js
  yield takeLatest(LOGIN_ACTION, doLogin);
}
