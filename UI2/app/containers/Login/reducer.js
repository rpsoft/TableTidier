/*
 *
 * Login reducer
 *
 */
import produce from 'immer';
import {
  LOGIN_ACTION,
  LOGIN_ACTION_SUCCESS,
  LOGIN_ACTION_FAILED,
  LOGIN_UPDATE_TOKEN,
  LOGOUT_ACTION
} from './constants';

import actions from './actions'

export const initialState = {
  // Store pre login user in tempUser
  tempUser: {
    username: '',
    password: '',
  },
  username: '',
  password: '',
  error: null,
  loginWarning: '',
};

/* eslint-disable default-case, no-param-reassign */
const loginReducer = (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case LOGIN_ACTION:
        // store pre user in temporal user
        draft.tempUser = {
          username: action.username,
          password: action.password,
        };
        draft.loginWarning = '';
        break;
      case LOGIN_ACTION_SUCCESS:
        // Get the user from temporal user
        draft.username = action.payload.username || state.tempUser.username;
        // clean temporal user
        draft.tempUser = initialState.tempUser;
        draft.error = null;
        draft.loginWarning = '';
        break;
      case LOGIN_ACTION_FAILED:
        draft.error = action.payload;
        draft.loginWarning = 'invalid details, have you registered?';
        break;
      case LOGOUT_ACTION:
        draft.username = '';
        draft.error = '';
        draft.loginWarning = '';
        break;
    }
  });

export default loginReducer;
