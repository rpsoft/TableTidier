/**
 *
 * Collection
 *
 */

import React, {
  memo,
  // useState,
  // useEffect
} from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { FormattedMessage } from 'react-intl';
import messages from './messages';

import { makeStyles } from '@material-ui/core/styles';

import CollectionIcon from '@material-ui/icons/DynamicFeed';

import IconButton from '@material-ui/core/IconButton';
// import PersonIcon from '@material-ui/icons/Person';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

import {
  Card,
  Button,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  collectionCard: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: 10,
    padding:10,
    margin:5,
  },
  link: {
    marginBottom:10,
    fontSize:20,
    fontWeight: 'bold',
    color: '#4e4e4e',
    textDecoration: 'none',
    '&:hover': {
      color: 'black',
    },
    '& > div': {
      '&:hover':{
        backgroundColor: '#f7f7f7',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
      }
    },
  },
  marginZero: {
    margin: 0,
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
  const navigate = useNavigate();

  return (
    <Card className={classes.collectionCard}>
      <div>
        {/* Header */}
        <Link to={collectionUrl} className={classes.link}>
          <div>
            <CollectionIcon fontSize={"small"}/>
            {' '+col_id+'. '} { title || "default title"}
          </div>
        </Link>

        <div style={{marginTop:5, marginLeft:27, fontSize: 17}}>
          Description: { description || "default description"}
        </div>
      </div>

      {/* Info: number of tables and user owner */}
      <div
        style={{
          marginTop: 5,
          marginLeft: 5,
          marginRight: 5,
          fontSize: 15
        }}
      >
        <div>
          { table_n || '0'} tables
        </div>
        <span
          // style={{marginLeft: 15, marginRight: 5}}
        >
          Owner: { owner_username || 'default owner'}
        </span>
      </div>
      <Button
        onClick={()=>navigate(collectionUrl)}
        variant="contained"
        classes={{
          startIcon: classes.marginZero
        }}
        className={classes.button}
        startIcon={
          <PlayArrowIcon 
            size="large"
            style={{
              fontSize: 34
            }}
          />
        }
      />
    </Card>
  );
}

Collection.propTypes = {};

export default memo(Collection);
