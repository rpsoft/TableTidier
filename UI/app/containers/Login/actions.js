/*
 *
 * Login actions
 *
 */

import { LOGIN_ACTION, LOGIN_ACTION_SUCCESS, LOGIN_ACTION_FAILED, LOGOUT_ACTION } from './constants';
//
//
// export function loginAction(username, password) {
//   return {
//     type: LOGIN_ACTION,
//     payload: {username, password}
//   };
// }

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

export function doLoginAction(username, password) {
  console.log("doLoginAction called")
  return {
    type: LOGIN_ACTION,
    username,
    password,
  };
}

export function doLogOutAction() {
  console.log("DO_LOGOUT called")
  return {
    type: LOGOUT_ACTION,
  };
}
