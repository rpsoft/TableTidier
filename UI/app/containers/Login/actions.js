/*
 *
 * Login actions
 *
 */

import { LOGIN_ACTION, LOGIN_ACTION_SUCCESS, LOGIN_ACTION_FAILED, LOGOUT_ACTION } from './constants';


export function doLoginAction(username, password) {
  return {
    type: LOGIN_ACTION,
    username,
    password,
  };
}

export function loginSuccessAction(token) {
  return {
    type: LOGIN_ACTION_SUCCESS,
    payload: token,
  };
}

export function loginFailedAction(error) {
  return {
    type: LOGIN_ACTION_FAILED,
    payload: error
  };
}

export function doLogOutAction() {
  return {
    type: LOGOUT_ACTION,
  };
}
