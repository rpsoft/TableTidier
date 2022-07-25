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
} from './actions';

import actions from './actions'

import { makeSelectLogin } from './selectors';

import 
  request,
  {
    generateOptionsPost
  }
from '../../utils/request';

import makeSelectLocation from '../App/selectors'
import {issueAlertAction} from '../App/actions'

const queryString = require('query-string');

export function* doLogin(action) {

  const locationData = yield select(makeSelectLocation());

  // const parsed = queryString.parse(location.search);

  const login_details = yield select(makeSelectLogin());
  const requestURL = locationData.api_url+`login`;
  // const requestURL = `http://localhost:6541/login`;(locationData.server_port ? `:`+locationData.server_port : "")

  const params = new URLSearchParams( {
    'username': login_details.tempUser.username,
    'password': login_details.tempUser.password
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
      const refreshToken = response.payload.refreshToken
      yield put( yield loginSuccessAction({token: refreshToken}));
      yield put( yield issueAlertAction({
        open: true,
        message: 'Logged in Successfully',
        isError: false
      }))
      // Start refresh token process at background
      yield put( yield actions.refreshTokenStart.action(refreshToken))

      // Store refreshToken at localStorage
      yield call([localStorage, 'setItem'], 'refreshToken', JSON.stringify({
        token: response.payload.refreshToken,
        refreshAt: response.payload.refreshAt,
      }))
    }
  } catch (err) {
    yield put(loginFailedAction(err));
  }
}

export function* doLogout(action) {

  const locationData = yield select(makeSelectLocation());

  // const parsed = queryString.parse(location.search);

  const login_details = yield select(makeSelectLogin());
  const requestURL = locationData.api_url+`logout`;

  const params = new URLSearchParams( {
  });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if (
      response.status &&
      (
        response.status == 'unauthorised' ||
        response.status == 'failed'
      )
    ) {
      yield put( yield loginFailedAction(response.status));
    } else {
      // Clear refreshToken at localStorage
      yield call([localStorage, 'removeItem'], 'refreshToken')
      yield put( yield actions.refreshTokenStop.action())
    }
  } catch (err) {
    yield put(loginFailedAction(err));
  }
}

export function* refresTokenInterval(refreshToken) {
  const userInfo = JSON.parse(
    window.atob(refreshToken.split('.')[1])
  )
  const locationData = yield select(makeSelectLocation());
  const requestURL = locationData.api_url+'refreshToken';

  const params = new URLSearchParams({})

  while (true) {
    // Each 5sec for testing
    // yield delay(5000 - Math.round(Math.random()*1e3))

    // Get interval period from refreshToken expiration
    yield delay(userInfo.exp*1e3 - 10e3 - Math.round(Math.random()*1e3))
    // console.log('refresToken!!! ', Date())

    const login_details = yield select(makeSelectLogin());
    const options = generateOptionsPost(params, login_details.token)
    options.headers['Refresh-Token'] = refreshToken
    // console.log(refreshToken)

    const response = yield call(request, requestURL, options)
    if (response.message == 'No authorization token was found') {
      continue
    }
    // Update token at local store
    yield call([localStorage, 'setItem'], 'refreshToken', JSON.stringify({
      token: response.refreshToken,
      refreshAt: response.refreshAt,
    }))
  }
}

export function* refresToken(refreshTokenFromLogin, refreshPeriod) {
  let refreshToken = refreshTokenFromLogin
  try {
    let clearRefresToken = null
    let action = ''
    while (true) {
      action = yield take([
        actions.refreshTokenStart.type,
        actions.refreshTokenStop.type,
        actions.refreshTokenRestart.type,
      ])
      // Stop and clean
      if (clearRefresToken) {
        yield cancel(clearRefresToken)
        clearRefresToken = null
      }
      // Start and Refresh
      if (
        action.type == actions.refreshTokenStart.type ||
        action.type == actions.refreshTokenRestart.type
      ) {
        clearRefresToken = yield fork(refresTokenInterval, action.refreshToken)
      }
    }
  } finally {
    // https://redux-saga.js.org/docs/advanced/TaskCancellation
  }
}

// Individual exports for testing
export default function* loginSaga() {
  // See example in containers/HomePage/saga.js
  yield takeLatest(LOGIN_ACTION, doLogin);
  yield takeLatest(LOGOUT_ACTION, doLogout);
  yield fork(refresToken)
}
