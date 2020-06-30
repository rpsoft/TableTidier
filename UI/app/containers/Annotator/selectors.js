import { createSelector } from 'reselect';
import { initialState } from './reducer';

/**
 * Direct selector to the annotator state domain
 */

const selectAnnotatorDomain = state => {
    return {...state.annotator,...state.input} || initialState
}


/**
 * Other specific selectors
 */

/**
 * Default selector used by Annotator
 */

const makeSelectAnnotator = () =>
  createSelector(
    selectAnnotatorDomain,
    substate => substate,
  );

export default makeSelectAnnotator;
export { selectAnnotatorDomain };
