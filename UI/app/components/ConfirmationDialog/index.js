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
            <h3 style={{color:"#ff2323", textAlign:"center"}}>Are you sure?</h3>
          </DialogContent>
          <DialogActions style={{justifyContent:"center"}}>
            <div style={{justifyContent:"center"}}>
              <Button onClick={()=>{ accept_action() }} style={{marginRight:30}}> Accept </Button>
              <Button onClick={()=>{ cancel_action() }} style={{marginLeft:30}}> Cancel </Button>
            </div>
          </DialogActions>
    </Dialog>
}

ConfirmationDialog.propTypes = {};

export default ConfirmationDialog;
