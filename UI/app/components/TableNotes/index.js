/**
 *
 * TableNotes
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import {
  // Card, Checkbox,
  Select,
  MenuItem,
  TextField,
  Button,
  // Paper,
  // Drawer,
  // Divider,
  // List,
  // ListItem,
  // ListItemIcon,
  // ListItemText,
  // AppBar,
  // Toolbar,
  // Typography,
  // Switch,
} from '@material-ui/core';


function TableNotes(
  {
    notesData,
    setNotesData,
    saveNoteChanges,
    allowEdit
  }
) {

  var modifyNotes = (key, value) => {
    var new_notes = Object.assign({}, notesData);
    new_notes[key] = value
    setNotesData(new_notes);

  }

  const heading = {fontWeight:"bold"}

  const NA_to_empty = (term) => (term && term == "NA") ? "" : term // Dealing with legacy NA values.


  // if ( !permissions.read ){
  //   return <div>Nope!</div>
  // }

  return (
    <div style={{padding:"5px 7px 7px 7px"}} >
      <div style={{textAlign:"left", marginBottom:5}}>
        {
          allowEdit ? <Button variant="outlined" style={{backgroundColor:"lightblue", float:"right"}} onClick={ ()=> {saveNoteChanges(notesData)} }> Save Notes Changes </Button> : ""
        }
        <div style={{height:35, fontSize:22,  paddingTop:5}}> 1. Table <b> Notes </b> </div>

      </div>

      <hr style={{borderTop:"1px #acacac dashed"}}/>

      <div style={{paddingLeft:15}}>
        <div style={{marginBottom:20}}>
          <span style={heading}> Type: </span>
          {
            allowEdit ? <Select
              id="table_type"
              value={NA_to_empty(notesData.tableType)}
              onChange={(event)=> { modifyNotes("tableType",event.target.value) }}
              style={{width:300}}>
              <MenuItem value={""}></MenuItem>
              <MenuItem value={"baseline_table"}>Baseline</MenuItem>
              <MenuItem value={"result_table_without_subgroup"}>Result Table</MenuItem>
              <MenuItem value={"result_table_subgroup"}>Result Table With Subgroups</MenuItem>
              <MenuItem value={"other_table"}>Other</MenuItem>
            </Select> : NA_to_empty(notesData.tableType)
          }

          <span style={{...heading, marginLeft:20}}> Status: </span>
          {
            allowEdit ? <Select
            id="table_status"
            value={NA_to_empty(notesData.tableStatus)}
            onChange={(event)=> { modifyNotes("tableStatus",event.target.value) }}
            style={{width:150}} >
            <MenuItem value={""}></MenuItem>
            <MenuItem value={"preliminary"}>Preliminary</MenuItem>
            <MenuItem value={"results_only"}>Results Only</MenuItem>
            <MenuItem value={"complete"}>Complete</MenuItem>
          </Select> : NA_to_empty(notesData.tableStatus)
        }
        </div>

        <div>
          <span style={heading}> Additional Notes: </span>
          {
            allowEdit ? <TextField
              multiline
              style={{width: "50%"}}
              value={notesData.textNotes}
              onChange={(event)=> { modifyNotes("textNotes",event.target.value) }}
              /> : notesData.textNotes
          }
        </div>
      </div>

    </div>
  );
}

TableNotes.propTypes = {};

export default memo(TableNotes);
