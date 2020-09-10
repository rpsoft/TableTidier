import { createSelector } from 'reselect';
import { initialState } from './reducer';


// const selectRouter = state => state.router;
const selectApp = state => state.app || initialState;
// const selectDashboardDomain = state => state.dashboard

const makeSelectLocation = () =>
  createSelector(
    // selectRouter,
    selectApp,
    substate => substate
  );

export default makeSelectLocation;
export { makeSelectLocation };
