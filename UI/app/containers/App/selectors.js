import { createSelector } from 'reselect';
import { initialState } from './reducer';


// const selectRouter = state => state.router;
const selectApp = state => { return state.app || initialState; }
// const selectDashboardDomain = state => state.dashboard

const selectCredentials = state => state.app.credentials || {};

const makeSelectCredentials = () =>
  createSelector(
    selectCredentials,
    substate => substate,
  );

const makeSelectLocation = () =>

  createSelector(
    // selectRouter,
    selectApp,
    substate => substate
  );

export default makeSelectLocation;
export { makeSelectLocation, makeSelectCredentials };
