/*
 *
 * Login actions
 *
 */

import { APP_SET_GLOBALS, APP_SET_CREDENTIALS, APP_ISSUE_ALERT_ACTION } from './constants';

export function appSetGlobals(params) {

  return {
    type: APP_SET_GLOBALS,
    payload: params
  };
}

export function setLoginCredentialsAction(cookies){
   return {
     type: APP_SET_CREDENTIALS,
     credentials: cookies
   };
}

// Issue alert
export function issueAlertAction(alertData) {

  return {
    type: APP_ISSUE_ALERT_ACTION,
    alertData
  };
}

export default {
  statusSet: {
    // name format: 'yourproject/YourContainer/YOUR_ACTION_CONSTANT'
    type: 'app/App/APP_STATUS_SET',
    action: function(statusDescription) {
      return {
        type: this.type,
        statusDescription,
      }
    }
  },
  statusClear: {
    type: 'app/App/APP_STATUS_CLEAR',
    action: function(statusDescription) {
      return {
        type: this.type,
        statusDescription,
      }
    }
  },
}
