/*
 *
 * Login actions
 *
 */

import {
  LOGIN_ACTION,
  LOGIN_ACTION_SUCCESS,
  LOGIN_ACTION_FAILED,
  LOGOUT_ACTION
} from './constants';


export function doLoginAction(username, password) {
  return {
    type: LOGIN_ACTION,
    username,
    password,
  };
}

export function loginSuccessAction(userInfo) {
  return {
    type: LOGIN_ACTION_SUCCESS,
    payload: userInfo,
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

export default {
  refreshTokenStart: {
    // name format: 'yourproject/YourContainer/YOUR_ACTION_CONSTANT'
    type: 'app/App/APP_STATUS_START',
    action: function(refreshToken) {
      return {
        type: this.type,
        refreshToken,
      }
    }
  },
  refreshTokenStop: {
    type: 'app/App/REFRESH_TOKEN_STOP',
    action: function() {
      return {
        type: this.type,
      }
    }
  },
  refreshTokenRestart: {
    type: 'app/App/REFRESH_TOKEN_RESTART',
    action: function(refreshToken) {
      return {
        type: this.type,
        refreshToken,
      }
    }
  },
}