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
