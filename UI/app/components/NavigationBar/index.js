/**
 *
 * NavigationBar
 *
 */

 import React from 'react';
 // import PropTypes from 'prop-types';
 // import styled from 'styled-components';

//  import { FormattedMessage } from 'react-intl';
//  import messages from './messages';

import { useSelector } from 'react-redux';

import {
  useNavigate,
  useLocation,
} from 'react-router-dom'; 

 import {
  Card,
  Tooltip,
  IconButton,
} from '@material-ui/core'

 import ArrowBackIcon from '@material-ui/icons/ArrowBack';
 import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
 import DashboardIcon from '@material-ui/icons/Dashboard';
 import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
 import ChevronRightIcon from '@material-ui/icons/ChevronRight';
 import TocIcon from '@material-ui/icons/Toc';

 function NavigationBar({stylesCustom={}}) {
  let location = useLocation();
  let navigate = useNavigate();

  const collectionId = useSelector(state => {
    if ('collectionView' in state) {
      return state.collectionView.collection_id
    }
    return undefined
  })

  const locationIsAtCollection = location.pathname.includes('/collection')

  return (
    <Card
      style={{
        margin: 5,
        padding: 15,
        width: 250,
        height: 'max-content',
        ...stylesCustom.root,
      }}
    >
      <Tooltip title="Back" placement="bottom-end">
        <span>
          <IconButton
            style={{
              // color: 'darkslategray',
              marginLeft: 5,
              marginRight: 5,
            }}
            variant="outlined"
            size="small"
            disabled={'navigation' in window  && window.navigation.canGoBack == false}
            onClick={() => {
              navigate(-1);
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Forward" placement="bottom-end">
        <span>
          <IconButton
            style={{
              // color: 'darkslategray',
              marginRight: 5,
            }}
            variant="outlined"
            size="small"
            disabled={'navigation' in window  && window.navigation.canGoForward == false}
            onClick={() => {
              navigate(1);
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Dashboard" placement="bottom-end">
        <IconButton
          style={{
            color: 'slategray',
            marginRight: 5,
            marginLeft: 22,
          }}
          variant="outlined"
          size="small"
          onClick={() => {
            navigate('/dashboard');
          }}
        >
          <DashboardIcon />
        </IconButton>
      </Tooltip>
      
      {
        // Show when collectionId is defined and location is not in collection
      collectionId && !locationIsAtCollection && <>
      {/* <ArrowForwardIosIcon /> */}
      <ChevronRightIcon 
        style={{
          color: 'slategray',
        }}
      />
      <Tooltip title="Collection" placement="bottom-end">
        <IconButton
          style={{
            color: 'slategray',
          }}
          variant="outlined"
          size="small"
          onClick={() => {
            navigate('/collection?collId=' + collectionId);
          }}
        >
          <TocIcon />
        </IconButton>
      </Tooltip>
      </>
      }
    </Card>
   );
 }
 
 NavigationBar.propTypes = {};
 
 export default NavigationBar;