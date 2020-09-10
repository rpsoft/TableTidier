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
import CollectionIcon from '@material-ui/icons/DynamicFeed';

import IconButton from '@material-ui/core/IconButton';

import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import {
  Card,
  Button,
} from '@material-ui/core';

function Collection({
  title,
  description,
  owner_username,
  table_n,
  goToUrl,
}) {

  const [tables, setTables] = useState({})

  const loadTables = () => {

  }

  return (
    <Card style={{padding:10,margin:5, fontSize: 18}}><div>
      <div style={{fontSize:30}}> <CollectionIcon fontSize={"large"}/> { title || "default title"} </div>
      <div style={{marginTop:5, marginLeft:5}}> { description || "default description"} </div>
      <div style={{marginTop:5, marginLeft:5}}> { owner_username || "default owner"} </div>
      <div style={{marginTop:5, marginLeft:5}}> { table_n || "0"} tables </div>
      <Button variant="contained" disableElevation
                  onClick={ () => { console.log("col") } }
                  style={{float:"right"}}
                  >
        Enter Collection <ArrowForwardIcon />
      </Button>
    </div></Card>

  );
}

Collection.propTypes = {};

export default memo(Collection);
