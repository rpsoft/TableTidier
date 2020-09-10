/**
 *
 * CollectionView
 *
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';
import makeSelectCollectionView from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';

export function CollectionView() {
  useInjectReducer({ key: 'collectionView', reducer });
  useInjectSaga({ key: 'collectionView', saga });

  return (
    <div>
      <Helmet>
        <title>CollectionView</title>
        <meta name="description" content="Description of CollectionView" />
      </Helmet>
      <FormattedMessage {...messages.header} />
      <div>This is a collection</div>
    </div>
  );
}

CollectionView.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  collectionView: makeSelectCollectionView(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withConnect,
  memo,
)(CollectionView);
