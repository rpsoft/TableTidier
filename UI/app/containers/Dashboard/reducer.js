/*
 *
 * Dashboard reducer
 *
 */
import produce from 'immer';
import { SEARCH_ACTION } from './constants';

export const initialState = {
  searchContent : "",
  searchType : {}
};

/* eslint-disable default-case, no-param-reassign */
const dashboardReducer = (state = initialState, action) =>
  produce( state, draft => {
    switch (action.type) {
      case SEARCH_ACTION:
        draft.searchContent = action.searchContent;
        draft.searchType = action.searchType;
        break;
    }
  });

export default dashboardReducer;
