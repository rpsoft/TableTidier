import { createSelector } from 'reselect';
import { initialState } from './reducer';
import { initialState as initialStateApp } from '../App/reducer';

/**
 * Direct selector to the login state domain
 */

const selectLoginDomain = state => state.login || initialState;
const selectAppDomain = state => state.app || initialStateApp;

/**
 * Other specific selectors
 */

/**
 * Default selector used by Login
 */
const makeSelectLogin = () =>
  createSelector(
    selectLoginDomain,
    substate => substate,
  );

const makeLoginSelector = () =>
  createSelector(
    selectLoginDomain,
    selectAppDomain,
    substate => substate.token,
  );

export default makeSelectLogin;
export { selectLoginDomain, makeLoginSelector, makeSelectLogin  };
