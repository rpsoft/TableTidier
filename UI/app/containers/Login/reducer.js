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

export const initialState = {
  // Store pre login user in tempUser
  tempUser: null,
  username : '',
  password : '',
  token : '',
  error : null,
  loginWarning : '',
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
        draft.username = draft.tempUser.username;
        // clean temporal user
        draft.tempUser = null;
        draft.token = action.payload;
        draft.error = null;
        draft.loginWarning = '';
        break;
      case LOGIN_ACTION_FAILED:
        draft.error = action.payload;
        draft.token = '';
        draft.loginWarning = 'invalid details, have you registered?';
        break;
      case LOGIN_UPDATE_TOKEN:
        draft.token = action.payload;
        break;
      case LOGOUT_ACTION:
        draft.username = '';
        draft.error = '';
        draft.token = '';
        draft.loginWarning = '';
        break;
    }
  });

export default loginReducer;
