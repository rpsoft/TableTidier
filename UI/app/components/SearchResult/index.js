/**
 *
 * SearchResult
 *
 */

import React from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import Tooltip from '@material-ui/core/Tooltip';

import Table from '@material-ui/icons/BorderAll';

import CollectionIcon from '@material-ui/icons/DynamicFeed';

import Button from '@material-ui/core/Button';

function SearchResult({
  text,
  type,
  data,
  onClick
}) {
  return (
    <div>
      <Button tooltip={"hello"} style={{width:"100%",textAlign:"left", justifyContent:"left"}} onClick={onClick} >
        { type == "table" ? <Table /> : <CollectionIcon /> }
        <div style={{marginLeft:5}}>{ text }</div>
      </Button>
    </div>
  );
}

SearchResult.propTypes = {};

export default SearchResult;
