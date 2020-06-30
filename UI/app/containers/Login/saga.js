import { take, call, put, select, takeLatest } from 'redux-saga/effects';
import { LOGIN_CHANGE_DETAILS } from './constants';
import { loginAction, loginSuccessAction, loginFailedAction } from './actions';
import { makeSelectLogin } from './selectors';

import request from '../../utils/request';

// import HttpClient from '../../network/http-client';
// import { URL_BASE } from '../../links'
// const urlBase = URL_BASE + 'api/'
// const httpClient = new HttpClient()

export function* doLogin() {

  const login_details = yield select(makeSelectLogin());
  const requestURL = `http://localhost:6541/login`;

  const params = new URLSearchParams();
        params.append('username', login_details.username);
        params.append('password', login_details.password);

  const options = {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    // mode: 'cors', // no-cors, *cors, same-origin
    // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    // credentials: 'same-origin', // include, *same-origin, omit
    // headers: {
    //   'Content-Type': 'application/json'
    //   // 'Content-Type': 'application/x-www-form-urlencoded',
    // },
    // redirect: 'follow', // manual, *follow, error
    // referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);
    if ( response.status && response.status == "unauthorised"){
      yield put(loginFailedAction(response.status));
    } else {
      yield put(loginSuccessAction(response.payload.hash));
    }

  } catch (err) {
    yield put(loginFailedAction(err));
  }

}

// Individual exports for testing
export default function* loginSaga() {
  // See example in containers/HomePage/saga.js
  // console.log("saga executed")
  yield takeLatest(LOGIN_CHANGE_DETAILS, doLogin);
}
