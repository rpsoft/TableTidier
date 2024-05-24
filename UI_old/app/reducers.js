/**
 * Combine all reducers in this file and export the combined reducers.
 */

import { combineReducers } from 'redux';

import languageProviderReducer from 'containers/LanguageProvider/reducer';
import AppReducer from 'containers/App/reducer';

/**
 * Merges the main reducer with the router state and dynamically injected reducers
 */
export default function createReducer(injectedReducers = {}) {
  const rootReducer = combineReducers({
    language: languageProviderReducer,
    app: AppReducer,
    ...injectedReducers,
  });

  return rootReducer;
}
