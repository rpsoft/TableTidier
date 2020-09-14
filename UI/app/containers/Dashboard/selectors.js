import { createSelector } from 'reselect';
import { initialState } from './reducer';

/**
 * Direct selector to the dashboard state domain
 */

const selectDashboardDomain = state => state.dashboard || initialState;

const selectCredentials = state => state.app.credentials || {};

const makeSelectCredentials = () =>
  createSelector(
    selectCredentials,
    substate => substate,
  );

/**
 * Other specific selectors
 */

/**
 * Default selector used by Dashboard
 */
const makeSelectDashboard = () =>
  createSelector(
    selectDashboardDomain,
    substate => substate,
  );

export default makeSelectDashboard;
export { selectDashboardDomain, makeSelectCredentials };
