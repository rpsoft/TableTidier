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
  selectedChunks,
  score,
  data,
  onClick
}) {
  return (
    <div>
      <Button tooltip={"hello"} style={{width:"100%", textAlign:"left", justifyContent:"left"}} onClick={onClick} >
        { type == "table" ? <Table /> : <CollectionIcon /> }
        <div style={{marginLeft:5}}>{ text }</div>
      </Button>
      {
        score ? <>
          <span>{ /\d+.\d{0,2}/.exec(score.toString())} - </span>
          <span>{selectedChunks.join(' ')}</span>
        </>
        : null
      }
    </div>
  );
}

SearchResult.propTypes = {};

export default SearchResult;
