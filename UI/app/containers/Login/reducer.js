/*
 *
 * Login reducer
 *
 */
import produce from 'immer';
import { LOGIN_ACTION, LOGIN_ACTION_SUCCESS, LOGIN_ACTION_FAILED, LOGOUT_ACTION } from './constants';

export const initialState = {
  username : "",
  password : "",
  token : "",
  error : null,
  loginWarning : "",
};

/* eslint-disable default-case, no-param-reassign */
const loginReducer = (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case LOGIN_ACTION:
        draft.username = action.username;
        draft.password = action.password;
        break;
      case LOGIN_ACTION_SUCCESS:
        draft.token = action.payload;
        draft.error = null;
        break;
      case LOGIN_ACTION_FAILED:
        draft.error = action.payload;
        draft.token = "";
        break;
      case LOGOUT_ACTION:
        // console.log("REDUCER LOGOUT")
        draft.error = "";
        draft.token = "";
        break;
    }
  });

export default loginReducer;
