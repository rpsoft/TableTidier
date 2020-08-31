/*
 *
 * Register reducer
 *
 */
import produce from 'immer';
import { REGISTER_ACCOUNT } from './constants';

export const initialState = {};

/* eslint-disable default-case, no-param-reassign */
const registerReducer = (state = initialState, action) =>
  produce(state, (/* draft */) => {
    switch (action.type) {
      case REGISTER_ACCOUNT:
        break;
    }
  });

export default registerReducer;
