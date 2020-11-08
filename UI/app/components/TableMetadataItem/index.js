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
      <div> { itemData.concept } </div>
      <div> { itemData.concept } </div>
      <div> { JSON.stringify(itemData.proposed) } </div>
      <div> { JSON.stringify(itemData.proposed_user) } </div>
      <div> { JSON.stringify(itemData.selected) } </div>
    </div>
  );
}

TableMetadataItem.propTypes = {};

export default memo(TableMetadataItem);
