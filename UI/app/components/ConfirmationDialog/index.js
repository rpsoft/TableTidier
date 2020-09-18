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

function ConfirmationDialog({
  title,
  accept_action,
  cancel_action,
  open,
}) {
  return <Dialog aria-labelledby="customized-dialog-title" open={open}>
          <DialogTitle>
            {title}
          </DialogTitle>
          <DialogContent>
            <h3 style={{color:"#ff2323"}}>Are you sure?</h3>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>{ accept_action() }}> Accept </Button>
            <Button onClick={()=>{ cancel_action() }}> Cancel </Button>
          </DialogActions>
    </Dialog>
}

ConfirmationDialog.propTypes = {};

export default ConfirmationDialog;
