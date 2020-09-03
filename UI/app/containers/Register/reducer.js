/*
 *
 * Register reducer
 *
 */
import produce from 'immer';
import { REGISTER_ACCOUNT, REGISTER_ACCOUNT_SUCCESS, REGISTER_ACCOUNT_FAIL } from './constants';

export const initialState = {
  userData : {
    'username': "",
    'password': "",
    'displayName': "",
    'email': ""
  },
  status : "",
};

/* eslint-disable default-case, no-param-reassign */
const registerReducer = (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case REGISTER_ACCOUNT:
        draft.userData = action.userData;
        break;
      case REGISTER_ACCOUNT_SUCCESS:
        draft.status = "success"
        break;
      case REGISTER_ACCOUNT_FAIL:
        draft.status = "fail"
        break;
    }
  });

export default registerReducer;
