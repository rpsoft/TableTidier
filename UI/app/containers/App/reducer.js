/*
 *
 * Login reducer
 *
 */
import produce from 'immer';
import { APP_SET_GLOBALS, APP_SET_CREDENTIALS } from './constants';

export const initialState = {
  host : "localhost",
  server_port : 6541,
  ui_port : 7531,
  credentials : {},
};

/* eslint-disable default-case, no-param-reassign */
const appReducer = (state = initialState, action) =>
  produce(state, draft => {

    switch (action.type) {
      case APP_SET_GLOBALS:
        draft.host = action.params.host;
        draft.server_port = action.params.server_port;
        draft.ui_port = action.params.ui_port;
        break;
      case APP_SET_CREDENTIALS:
        draft.credentials = action.credentials;
    }
  });

export default appReducer;
