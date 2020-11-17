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
    tableConcept,
    itemData
  }
) {

  var root = tableConcept.slice(0,tableConcept.length-1)
  var concept = tableConcept.slice(tableConcept.length-1)

  return (
    <div>

      {
        <span style={{marginLeft: root.length > 0 ? 20 : 0 }}> { concept } </span>
      }

      <span> { JSON.stringify(itemData.proposed) } </span>
      <span> { JSON.stringify(itemData.proposed_user) } </span>
      <span> { JSON.stringify(itemData.selected) } </span>

    </div>
  );
}

TableMetadataItem.propTypes = {};

export default memo(TableMetadataItem);
