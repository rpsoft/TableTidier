/**
 *
 * TableMetadataItem
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

//Item here
function TableMetadataItem(
  {
    itemData
  }
) {
  return (
    <div>
      <span> { itemData.concept } </span>
      <span> { JSON.stringify(itemData.proposed) } </span>
      <span> { JSON.stringify(itemData.proposed_user) } </span>
      <span> { JSON.stringify(itemData.selected) } </span>
    </div>
  );
}

TableMetadataItem.propTypes = {};

export default memo(TableMetadataItem);
