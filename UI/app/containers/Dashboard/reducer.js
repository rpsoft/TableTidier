/*
 *
 * Dashboard reducer
 *
 */
import produce from 'immer';
import { SEARCH_ACTION, SEARCH_RESULTS_UPDATE_ACTION, UPDATE_COLLECTIONS_LIST_ACTION } from './constants';

export const initialState = {
  searchContent : "",
  searchType : {},
  search_results : [],
  hash: "",
  username : "",
  collections : [],
};

/* eslint-disable default-case, no-param-reassign */
const dashboardReducer = (state = initialState, action) =>
  produce( state, draft => {
    switch (action.type) {
      case SEARCH_ACTION:
        draft.searchContent = action.searchContent;
        draft.searchType = action.searchType;
        draft.hash = action.hash;
        draft.username = action.username;
        break;
      case SEARCH_RESULTS_UPDATE_ACTION:
        draft.search_results = action.search_results;
        break;
      case UPDATE_COLLECTIONS_LIST_ACTION:
        // debugger
        draft.collections = action.collections_list;
        break;

    }
  });

export default dashboardReducer;
