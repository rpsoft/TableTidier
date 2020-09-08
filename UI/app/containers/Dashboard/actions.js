/*
 *
 * Dashboard actions
 *
 */

import { SEARCH_ACTION } from './constants';

export function doSearchAction(searchContent,searchType) {
  return {
    type: SEARCH_ACTION,
    searchContent,
    searchType
  };
}
