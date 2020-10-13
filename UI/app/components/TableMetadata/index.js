/**
 *
 * TableMetadata
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

function TableMetadata() {
  return (
    <div>
      <FormattedMessage {...messages.header} />
    </div>
  );
}

TableMetadata.propTypes = {};

export default memo(TableMetadata);
