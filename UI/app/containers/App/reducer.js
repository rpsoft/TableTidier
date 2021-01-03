/*
 *
 * Login reducer
 *
 */
import produce from 'immer';
import { APP_SET_GLOBALS, APP_SET_CREDENTIALS } from './constants';

export const initialState = {
  server_host: "",
  server_port: "",
  ui_host: "",
  ui_port: ""
};

/* eslint-disable default-case, no-param-reassign */
const appReducer = (state = initialState, action) =>
  produce(state, draft => {
     
    switch (action.type) {
      // case APP_SET_GLOBALS:
      //   
      //   draft.host = action.params.host ? action.params.host : draft.host;
      //   draft.server_port = action.params.ui_port ? action.params.ui_port : draft.server_port;
      //   draft.ui_port = action.params.ui_port ? action.params.ui_port : draft.ui_port;
      //   break;
      case APP_SET_CREDENTIALS:
        draft.credentials = action.credentials;
    }
  });

export default appReducer;
