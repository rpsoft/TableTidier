/**
 *
 * TableMetadata
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import {
  Card, Checkbox,
  Select as SelectField,
  TextField,
  Button,
  Paper,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Switch,
} from '@material-ui/core';

const _ = require('lodash');

import AdbIcon from '@material-ui/icons/Adb';

import TableMetadataItem from 'components/TableMetadataItem'

function TableMetadata({
  tid,
  tableResults,
  headerData,
  metadata,
  cuisIndex,
  updateTableMetadata,
  saveMetadataChanges,
  autoLabel
}) {


  var hey = _;

  const [ enableDelete, setEnableDelete ] = React.useState(false)

  const toggleCui = (key, cui) => {

    var cuipos = metadata[key].cuis_selected.indexOf(cui)

    if ( cuipos > -1){
      metadata[key].cuis_selected.splice(cuipos,1)
    } else {
      metadata[key].cuis_selected.push(cui)
    }

    updateTableMetadata(Object.assign({}, metadata))
  }


  const addCuis = (key, cuis, conceptData) => {

    cuis.map( cui => {

      if (!metadata[key]){

        var tres = tableResults
        debugger
        // metadata concept has not been annotated yet.
        metadata[key] = {
          concept: conceptData.concept,
          concept_root: conceptData.root,
          concept_source: "", // This legacy.
          cuis: [],
          cuis_selected: [],
          istitle: false,
          labeller: "",
          qualifiers: ["Presence-absense"],
          qualifiers_selected: ["Presence-absense"],
          tid: tid,
        }
      }

      var cuipos = metadata[key].cuis.indexOf(cui)

      if ( cuipos < 0 ){
          metadata[key].cuis.push(cui)
          metadata[key].cuis_selected.push(cui)
      }
    })

    updateTableMetadata(Object.assign({}, metadata))
  }

  const deleteCui = (key, cui) => {
    var cuipos = metadata[key].cuis_selected.indexOf(cui)

    if ( cuipos > -1){
      metadata[key].cuis_selected.splice(cuipos,1)
    }

    cuipos = metadata[key].cuis.indexOf(cui)

    if ( cuipos > -1){
      metadata[key].cuis.splice(cuipos,1)
    }

    updateTableMetadata(Object.assign({}, metadata))
  }

  return (
    <div style={{padding:"5px 7px 7px 7px"}} >

      <div style={{marginBottom:45}}>
        <div style={{height:35, fontSize:22, float:"left", paddingTop:5}}> 4. <b> Metadata </b> Linking </div>

        <Button variant="outlined" style={{backgroundColor:"lightblue", height: 40, float:"right"}} onClick={ () => { saveMetadataChanges(metadata);} }> Save Metadata Changes </Button>

        <Button variant="outlined" style={{backgroundColor:"lightblue", marginRight:10, height: 40, float:"right"}} onClick={ () => { autoLabel(); } }> Auto Label <AdbIcon /> </Button>

        <span style={{float:"right"}}><div style={{marginRight:10, fontSize:17, border:"1px #acacac solid", borderRadius:10, paddingLeft:10}}>
          Enable Delete
          <Switch
              checked={enableDelete}
              onChange={() => { setEnableDelete(!enableDelete) }}
              name="checkedA"
              inputProps={{ 'aria-label': 'secondary checkbox' }}

            />
        </div></span>

      </div>

      <hr style={{borderTop:"1px #acacac dashed"}}/>

      {
        Object.keys(headerData).map( (ann_groups,j) => {

          // debugger
            return <div key={j}> <h3>{ann_groups}</h3><div>{
              headerData[ann_groups].map(
                (item, i) => {

                  return <TableMetadataItem
                                  key={ i }
                                  keyN={ i }
                                  tableConcept={ item }
                                  metadata={ metadata }
                                  cuisIndex={ cuisIndex }
                                  toggleCui={ toggleCui }
                                  addCuis={ addCuis }
                                  deleteCui={ deleteCui }
                                  enableDelete={ enableDelete }
                              />}
              )} </div></div>
        })
      }

      </div>
  );
}

TableMetadata.propTypes = {};

export default memo(TableMetadata);
