/**
 *
 * ConfirmationDialog
 *
 */

import React from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@material-ui/core';

import { makeStyles, useTheme } from '@material-ui/core/styles';

function ConfirmationDialog({
  title,
  accept_action,
  cancel_action,
  open,
  style,
}) {
  const theme = useTheme();
  const {
    accept: acceptColor,
    cancel: cancelColor,
  } = theme.palette.dialog
  return (
    <Dialog
      PaperProps={{style}}
      aria-labelledby="customized-dialog-title"
      open={open}
      onClose={ cancel_action }
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent>
        <h3
          style={{
            color:"#ff2323",
            textAlign:"center"
          }}
        >Are you sure?</h3>
      </DialogContent>
      <DialogActions
        style={{
        }}
      >
        <Button
          onClick={ accept_action }
          style={{
            backgroundColor: acceptColor,
          }}
        > Accept </Button>
        <Button
          onClick={ cancel_action }
          style={{
            backgroundColor: cancelColor,
          }}
        > Cancel </Button>
      </DialogActions>
    </Dialog>)
}

ConfirmationDialog.propTypes = {};

export default ConfirmationDialog;
