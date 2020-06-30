/*
 *
 * Login reducer
 *
 */
import produce from 'immer';
import { APP_SET_GLOBALS } from './constants';

export const initialState = {
  host : "localhost",
  server_port : 6541,
  ui_port : 7531,
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
    }
  });

export default appReducer;
