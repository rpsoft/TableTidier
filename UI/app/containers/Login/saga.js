import {
  take,
  call,
  put,
  select,
  takeLatest,
  fork,
  delay,
  cancel,
  cancelled,
} from 'redux-saga/effects';
import {
  LOGIN_ACTION,
  LOGOUT_ACTION,
} from './constants';
import {
  loginAction,
  loginSuccessAction,
  loginFailedAction,
  updateToken
} from './actions';
import { makeSelectLogin } from './selectors';

import 
  request,
  {
    generateOptionsPost
  }
from '../../utils/request';
// import HttpClient from '../../network/http-client';

import makeSelectLocation from '../App/selectors'
import {issueAlertAction} from '../App/actions'

const queryString = require('query-string');

export function* doLogin() {

  const locationData = yield select(makeSelectLocation());

  // const parsed = queryString.parse(location.search);

  const login_details = yield select(makeSelectLogin());
  const requestURL = locationData.api_url+`login`;
  // debugger
  // const requestURL = `http://localhost:6541/login`;(locationData.server_port ? `:`+locationData.server_port : "")

  const params = new URLSearchParams( {
    'username': login_details.username,
    'password': login_details.password
  });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    console.log('LOGIN: '+response.status);

    if (
      response.status &&
      (
        response.status == 'unauthorised' ||
        response.status == 'failed'
      )
    ) {
      yield put( yield loginFailedAction(response.status));
    } else {
      yield put( yield loginSuccessAction(response.payload.token));
      yield put( yield issueAlertAction({
        open: true,
        message: 'Logged in Successfully',
        isError: false
      }))

      // starts the refresToken task in the background
      const bgRefresTokenTask = yield fork(
        refresToken,
        response.payload.refreshToken, 
        response.payload.refreshAt
      )

      // wait for the user stop action
      yield take(LOGOUT_ACTION)
      yield cancel(bgRefresTokenTask)
    }
  } catch (err) {
    yield put(loginFailedAction(err));
  }
}

export function* refresToken(refreshTokenFromLogin, refreshPeriod) {
  const locationData = yield select(makeSelectLocation());
  const requestURL = locationData.api_url+'refreshToken';

  const params = new URLSearchParams({})
  let refreshToken = refreshTokenFromLogin
  try {
    while (true) {
      console.log('refresToken!!! ', refreshPeriod)
      yield delay(5000)
      // yield put(actions.requestStart())
      const login_details = yield select(makeSelectLogin());
      const options = generateOptionsPost(params, login_details.token)
      options.headers['Refresh-Token'] = refreshToken
      console.log(refreshToken)

      const response = yield call(request, requestURL, options)
      // Update refreshToken
      refreshToken = response.refreshToken
      // Update token at redux store
      yield put( yield updateToken(response.token));
    }
  } finally {
    // https://redux-saga.js.org/docs/advanced/TaskCancellation
  }
}

// Individual exports for testing
export default function* loginSaga() {
  // See example in containers/HomePage/saga.js
  yield takeLatest(LOGIN_ACTION, doLogin);
}
