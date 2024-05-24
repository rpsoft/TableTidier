import { createSelector } from 'reselect';
import { initialState } from './reducer';

/**
 * Direct selector to the collectionView state domain
 */

const selectCollectionViewDomain = state => state.collectionView || initialState;

const selectCredentials = state => state.app.credentials || {};


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

const makeSelectCredentials = () =>
  createSelector(
    selectCredentials,
    substate => substate,
  );

export default makeSelectCollectionView;
export { selectCollectionViewDomain, makeSelectCredentials };
