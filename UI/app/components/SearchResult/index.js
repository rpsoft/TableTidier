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
      style={{
        width: '100%',
        marginBottom: 5,
      }}
    >
      <Button
        tooltip={"hello"}
        style={{
          // width:"100%",
          textAlign:"left",
          justifyContent:"left"
        }}
        onClick={()=>
          linkUrl? navigate(linkUrl): null
        }
      >
        { type == "table" ? <Table /> : <CollectionIcon /> }
        <div
          style={{
            marginLeft: 5,
            marginRight: 5,
            color: 'blue',
          }}
        >{ text }</div>
      </Button>
      {
        score ? <>
          <div
            style={{
              // marginBottom: 5,
              // color: 'blue',
            }}
          >
            {selectedChunks.join(' ')}
          </div>
        </>
        : null
      }
    </div>
  );
}

SearchResult.propTypes = {};

export default SearchResult;
