/**
 *
 * SearchTableItem
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';
import {
  useNavigate,
} from "react-router-dom";

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import { makeStyles, useTheme } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
  rootText: {
    color: 'rgb(77, 81, 86)',
    display: 'block',
    fontFamily: 'arial, sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    height: '44.2188px',
    lineHeight: '22.12px',
    marginBottom: 0,
    paddingTop: 0,
    textAlign: 'left',
  },
}));

function SearchTableItem({
  text,
  type,
  selectedChunks,
  score,
  linkUrl,
  data,
  onClick
}) {
  let navigate = useNavigate();
  const classes = useStyles();
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
        {/* { type == "table" ? <Table /> : <CollectionIcon /> } */}
        <div
          style={{
            marginLeft: 5,
            marginRight: 5,
            color: 'blue',
          }}
        >{ text }</div>
      </Button>
      <span>DOI </span>
      <span>PMID </span>
      <span>url </span>
      {
        score ? <>
          <div
            style={{
              // marginBottom: 5,
              // color: 'blue',
            }}
            className={classes.rootText}

          >
            {selectedChunks.map((result, index) => (
              <p
                key={index}
                style={{
                  lineHeight: '0.5em',
                }}
              >
                {result.join(' ')}
              </p>))
            }
          </div>
        </>
        : null
      }
    </div>
  );
 }
 
 SearchTableItem.propTypes = {};
 
 export default memo(SearchTableItem);
 