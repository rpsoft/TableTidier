/**
 *
 * TableResult
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

function TableResult() {
  return (
    <div>
      <FormattedMessage {...messages.header} />
    </div>
  );
}

TableResult.propTypes = {};

export default memo(TableResult);
