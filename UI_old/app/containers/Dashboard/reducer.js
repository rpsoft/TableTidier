/*
 *
 * Dashboard reducer
 *
 */
import produce from 'immer';
import { SEARCH_ACTION, SEARCH_RESULTS_UPDATE_ACTION, UPDATE_COLLECTIONS_LIST_ACTION } from './constants';

export const initialState = {
  searchContent : '',
  searchType : {},
  search_results : [],
  search_results_metadata: [],
  collections : [],
};

/* eslint-disable default-case, no-param-reassign */
const dashboardReducer = (state = initialState, action) =>
  produce( state, draft => {
    switch (action.type) {
      case SEARCH_ACTION:
        draft.searchContent = action.searchContent;
        draft.searchType = action.searchType;

        break;
      case SEARCH_RESULTS_UPDATE_ACTION:
        const newSearchInfo = action.search_results.metadata ?
          [
            ...action.search_results.metadata,
            ...action.search_results.search_results
          ]
          : action.search_results.search_results
        draft.search_results = newSearchInfo;
        draft.search_results_metadata = action.search_results.metadata ?
          action.search_results.metadata
          : []

        break;
      case UPDATE_COLLECTIONS_LIST_ACTION:
        
        draft.collections = action.collections_list;
        break;
    }
  });

export default dashboardReducer;
