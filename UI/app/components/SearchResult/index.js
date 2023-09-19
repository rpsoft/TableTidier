/**
 *
 * SearchResult
 *
 */

import React from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import {
  useNavigate,
} from "react-router-dom";

import './SearchResult.css';

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
  linkUrl,
  data,
  onClick
}) {
  let navigate = useNavigate();
  return (
    <div
      className='SearchResultContainer'
    >
      <Button
        tooltip={linkUrl}
        onClick={()=>
          linkUrl? navigate(linkUrl): null
        }
      >
        { type == 'table' ? <Table /> : <CollectionIcon /> }
        <div
          className='button-link'
        >{ text }</div>
      </Button>
      {
      score && <>
        <div>
          {selectedChunks.join(' ')}
        </div>
      </>
      }
    </div>
  );
}

SearchResult.propTypes = {};

export default SearchResult;
