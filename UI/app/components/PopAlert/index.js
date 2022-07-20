/**
 *
 * PopAlert
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import Fade from '@material-ui/core/Fade';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';

import WarningIcon from '@material-ui/icons/Warning';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

function PopAlert({
  alertData,
  setAlertData
}) {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertData({...alertData, open: false});
  };

  return (
    <Snackbar open={alertData.open} autoHideDuration={6000} onClose={handleClose}>
      <span
        style={{
          fontSize: 17,
          textAlign:"center",
          verticalAlign: "middle", paddingLeft:10,
          backgroundColor: alertData.isError ? "rgb(253, 236, 234)": "rgb(237, 247, 237)"
        }}
      >
        {
        alertData.isError ?
          <WarningIcon style={{color:"#f44336"}} fontSize="small" />
          : <CheckCircleOutlineIcon style={{color:"#4caf50"}} fontSize="small"  />
        }
        <span style={{marginLeft:10}}>
          {alertData.message || "message"}
        </span>
        <IconButton style={{marginLeft:50}} onClick={handleClose}> <HighlightOffIcon fontSize="small" /> </IconButton>
      </span>
    </Snackbar>
  );
}

PopAlert.propTypes = {};

export default memo(PopAlert);
