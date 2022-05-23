/**
 *
 * Collection
 *
 */

import React, { memo, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';
import {
  Link,
} from "react-router-dom";
import { FormattedMessage } from 'react-intl';
import messages from './messages';

import { makeStyles } from '@material-ui/core/styles';

import CollectionIcon from '@material-ui/icons/DynamicFeed';

import IconButton from '@material-ui/core/IconButton';

import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import {
  Card,
  Button,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  link: {
    color: 'inherit',
    textDecoration: 'none',
  }
}));

function Collection({
  col_id,
  title,
  description,
  owner_username,
  table_n,
  collectionUrl,
}) {
  const classes = useStyles();
  const [tables, setTables] = useState({})

  const loadTables = () => {

  }

  return (
    <Card style={{padding:10,margin:5, fontSize: 18}}><div>
      <div style={{fontSize:30,marginBottom:10}}>
        <CollectionIcon fontSize={"large"}/>
        <Link to={collectionUrl}  className={classes.link}>
          {col_id+". "} { title || "default title"}
        </Link>
      </div>
      <div style={{marginTop:5, marginLeft:5}}> Description: { description || "default description"} </div>
      <div style={{marginTop:5, marginLeft:5}}> Owner: { owner_username || "default owner"} </div>
      <div style={{marginTop:5, marginLeft:5}}> { table_n || "0"} tables </div>
      <Link to={collectionUrl} >
        <Button variant="contained" disableElevation
          style={{float:"right"}}
        >
          Enter Collection <ArrowForwardIcon />
        </Button>
      </Link>
    </div></Card>
  );
}

Collection.propTypes = {};

export default memo(Collection);
