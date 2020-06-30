/*
 *
 * Login actions
 *
 */

import { APP_SET_GLOBALS } from './constants';

export function appSetGlobals(params) {

  return {
    type: APP_SET_GLOBALS,
    payload: params
  };
}
