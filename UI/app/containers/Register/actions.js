/*
 *
 * Register actions
 *
 */

import { REGISTER_ACCOUNT } from './constants';

export function registerAccount(userData) {
  return {
    type: REGISTER_ACCOUNT,
    userData
  };
}
