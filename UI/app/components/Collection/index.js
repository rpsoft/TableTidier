/**
 *
 * Collection
 *
 */

import React, { memo, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

function Collection({
  title,
  description,
  owner,
}) {

  const [tables, setTables] = setState({})

  const loadTables = () => {

  }


  return (
    <div>
      <FormattedMessage {...messages.header} />
    </div>
  );
}

Collection.propTypes = {};

export default memo(Collection);
