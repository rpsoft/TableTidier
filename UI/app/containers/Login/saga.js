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
  doLogOutAction,
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
  let userInfo = JSON.parse(
    window.atob(refreshToken.split('.')[1])
  )
  userInfo.refreshToken = refreshToken
  const locationData = yield select(makeSelectLocation());
  const requestURL = locationData.api_url+'refreshToken';

  const params = new URLSearchParams({})
  
  while (true) {
    // if refreshToken expired call logout and finish
    if (userInfo.exp*1e3 < Date.now()) {
      // logout
      yield put( yield doLogOutAction());
      return
    }
 
    // Each 5sec for testing
    // yield delay(5000 - Math.round(Math.random()*1e3))

    // Get interval period from refreshToken expiration
    // expiration - Date.now() in milliseconds minus 10 seconds minus 0-1 second randomly
    yield delay( (userInfo.exp*1e3 - Date.now()) - 10e3 - Math.round(Math.random()*1e3))
    // console.log('refresToken!!! ', Date())

    // const login_details = yield select(makeSelectLogin());
    const options = generateOptionsPost(params)
    options.headers['Refresh-Token'] = userInfo.refreshToken
    // console.log(refreshToken)

    const response = yield call(request, requestURL, options)
    if (response.message == 'No authorization token was found') {
      continue
    }
    // Update userInfo for next refreshToken call 
    userInfo = {
      ...JSON.parse(window.atob(response.refreshToken.split('.')[1])),
      refreshToken: response.refreshToken,
    }

    // Update token at local store
    yield call([localStorage, 'setItem'], 'refreshToken', JSON.stringify({
      token: response.refreshToken,
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
