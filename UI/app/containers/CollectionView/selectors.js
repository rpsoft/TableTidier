import { createSelector } from 'reselect';
import { initialState } from './reducer';

/**
 * Direct selector to the collectionView state domain
 */

const selectCollectionViewDomain = state =>
  state.collectionView || initialState;

/**
 * Other specific selectors
 */

/**
 * Default selector used by CollectionView
 */

const makeSelectCollectionView = () =>
  createSelector(
    selectCollectionViewDomain,
    substate => substate,
  );

export default makeSelectCollectionView;
export { selectCollectionViewDomain };
