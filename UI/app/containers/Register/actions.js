/*
 *
 * Register actions
 *
 */

import { REGISTER_ACCOUNT, REGISTER_ACCOUNT_SUCCESS, REGISTER_ACCOUNT_FAIL } from './constants';

export function registerAccountAction(userData) {
  // debugger
  return {
    type: REGISTER_ACCOUNT,
    userData
  };
}

export function registerAccountActionSuccess() {
  return {
    type: REGISTER_ACCOUNT_SUCCESS,
    status : "success"
  };
}

export function registerAccountActionFailed() {
  console.log("FAILED HERE")
  return {
    type: REGISTER_ACCOUNT_FAIL,
    status : "failed"
  };
}
