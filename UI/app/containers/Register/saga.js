import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { REGISTER_ACCOUNT, REGISTER_ACCOUNT_SUCCESS, REGISTER_ACCOUNT_FAIL } from './constants';

import { registerAccountAction, registerAccountActionSuccess, registerAccountActionFailed } from './actions';

import makeSelectRegister from './selectors';

import request from '../../utils/request';

export function* doRegister() {

  const login_details = yield select(makeSelectRegister());

  const requestURL = `/api/createUser`;

  const params = new URLSearchParams( {
    'username': login_details.userData.username,
    'password': login_details.userData.password,
    'displayName': login_details.userData.displayName,
    'email': login_details.userData.email,
  });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && ( ["failed","unauthorised"].indexOf(response.status) > -1  )){
      yield put( yield registerAccountActionFailed());
    } else {
      yield put( yield registerAccountActionSuccess());
    }

  } catch (err) {
    yield put(registerAccountActionFailed());
  }

}

// Individual exports for testing
export default function* registerSaga() {
  yield takeLatest(REGISTER_ACCOUNT, doRegister);
}
