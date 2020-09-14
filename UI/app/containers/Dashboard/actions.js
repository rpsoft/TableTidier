/*
 *
 * Dashboard actions
 *
 */

import { SEARCH_ACTION, SEARCH_RESULTS_UPDATE_ACTION, REQUEST_COLLECTIONS_LIST_ACTION, UPDATE_COLLECTIONS_LIST_ACTION } from './constants';

export function doSearchAction(searchContent, searchType, hash, username) {
  return {
    type: SEARCH_ACTION,
    searchContent,
    searchType,
    hash,
    username
  };
}

export function updateSearchResultsAction(search_results) {
  return {
    type: SEARCH_RESULTS_UPDATE_ACTION,
    search_results
  };
}

export function requestCollectionsListAction() {
  return {
    type: REQUEST_COLLECTIONS_LIST_ACTION,
  };
}


export function updateCollectionsListAction(collections_list) {
  return {
    type: UPDATE_COLLECTIONS_LIST_ACTION,
    collections_list
  };
}
