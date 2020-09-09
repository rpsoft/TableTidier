/*
 *
 * Dashboard actions
 *
 */

import { SEARCH_ACTION, SEARCH_RESULTS_UPDATE_ACTION } from './constants';

export function doSearchAction(searchContent,searchType) {
  return {
    type: SEARCH_ACTION,
    searchContent,
    searchType
  };
}

export function updateSearchResultsAction(search_results) {
  return {
    type: SEARCH_RESULTS_UPDATE_ACTION,
    search_results
  };
}
