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
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';


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

import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

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
  autoLabel,
  allowEdit
}) {

  const [ enableDelete, setEnableDelete ] = React.useState(false)

  const [ enableMetadataAdder, setMetadataAdder ] = React.useState(false)
  const [ metadataAdderText, setMetadataAdderText ] = React.useState('')

  const [ shown, setShown ] = React.useState(true)


  const toggleCui = (key, cui) => {

    const cuipos = metadata[key].cuis_selected.indexOf(cui)

    if ( cuipos > -1 ) {
      metadata[key].cuis_selected.splice(cuipos, 1)
    } else {
      metadata[key].cuis_selected.push(cui)
    }

    updateTableMetadata(Object.assign({}, metadata))
  }

  const addCuis = (key, cuis, conceptData) => {
    cuis.map( cui => {
      if (!metadata[key]){
         // debugger
        // metadata concept has not been annotated yet.
        metadata[key] = {
          concept: conceptData.concept,
          concept_root: conceptData.root,
          concept_source: '', // This legacy.
          cuis: [],
          cuis_selected: [],
          istitle: false,
          labeller: '',
          qualifiers: [],
          qualifiers_selected: [],
          tid: tid,
        }
      }

      const cuipos = metadata[key].cuis.indexOf(cui)

      if ( cuipos < 0 ){
        metadata[key].cuis.push(cui)
        metadata[key].cuis_selected.push(cui)
      }
    })

    updateTableMetadata(Object.assign({}, metadata))
  }

  const deleteCui = (key, cui) => {
    let cuipos = metadata[key].cuis_selected.indexOf(cui)

    if ( cuipos > -1){
      metadata[key].cuis_selected.splice(cuipos,1)
    }

    cuipos = metadata[key].cuis.indexOf(cui)

    if ( cuipos > -1){
      metadata[key].cuis.splice(cuipos,1)
    }

    updateTableMetadata(Object.assign({}, metadata))
  }

  const manualMetadata = () => {
    return Object.keys(metadata).reduce(
      (acc,k) => { if ( metadata[k].istitle ) {acc.push(metadata[k]);} return acc },
      []
    )
  }

  const addTitleMetadataConcept = () => {
    const newMetadata = Object.assign({}, metadata)

    if ( metadataAdderText.toLowerCase().trim().length > 0) {
      newMetadata[metadataAdderText.toLowerCase().trim()] = {
        concept: metadataAdderText.trim(),
        concept_root: '',
        concept_source: '',
        cuis: [],
        cuis_selected: [],
        istitle: true,
        labeller: 'suso',
        qualifiers: [],
        qualifiers_selected: [],
        tid: tid,
      }
    }

    updateTableMetadata(newMetadata);
    setMetadataAdder(false);
    setMetadataAdderText('');
  }

  const removeTitleMetadataConcept = (concept) => {
    const newMetadata = structuredClone(metadata)

    delete newMetadata[concept.toLowerCase().trim()];

    updateTableMetadata(newMetadata);
    // setMetadataAdder(false);
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      addTitleMetadataConcept();
    }
  }


  const content =  <div style={{paddingLeft:10,paddingRight:10}}><div style={{width:"100%"}}>
                        <h3 style={{display:"inline"}}>Other metadata</h3>

                        {
                          allowEdit && (
                          <Button variant="outlined"
                            style={{height: 40, display:"inline", marginLeft:10, color:"green"}}
                            onClick={ () => { setMetadataAdder(!enableMetadataAdder);} }
                          > + Add other terminology </Button>)
                        }

                        {
                          enableMetadataAdder && <div>
                            <div  style={{border:"1px solid black", padding:10, margin:5, marginLeft:20, display:"inline-block"}} >

                              <TextField id="standard-basic" label="Enter concept text..." variant="outlined" style={{width:550}}
                                value={metadataAdderText}
                                onChange={ (evt) => { setMetadataAdderText(evt.currentTarget.value) } }
                                onKeyDown ={onKeyDown}
                              />

                              <Button variant="outlined"
                                        style={{height: 40, display:"inline", marginLeft:10, marginTop:8}}
                                        onClick={ () => {
                                            addTitleMetadataConcept();
                                        }}> Save </Button>

                              <Button variant="outlined"
                                        style={{height: 40, display:"inline", marginLeft:10, marginTop:8}}
                                        onClick={ () => {  setMetadataAdder(false);} }> Cancel </Button>
                            </div>
                          </div>
                        }
                      </div>

                      {
                      manualMetadata().map( (item,i) => <div key={i}> {
                        <div >
                          {
                            enableDelete && (
                              <Button
                                variant="outlined"
                                style={{height: 40, marginLeft:5, marginRight:5, color:"red", float:"left"}}
                                onClick={ () => {  removeTitleMetadataConcept( item.concept ); } }
                              > Delete concept <DeleteForeverIcon/>
                              </Button> )
                          }

                          <TableMetadataItem
                            key={ i }
                            keyN={ i }
                            tableConcept={ [item.concept_root, item.concept] }
                            metadata={ metadata }
                            cuisIndex={ cuisIndex }
                            toggleCui={ toggleCui }
                            addCuis={ addCuis }
                            deleteCui={ deleteCui }
                            enableDelete={ enableDelete }
                            allowEdit= {allowEdit}
                          />
                        </div>
                      } </div> )
                      }

                      <hr style={{borderTop:"1px #acacac dashed"}}/>
                      {
                        Object.keys(headerData).map( (ann_groups,j) => {

                          return <div key={j}> <h3>{ann_groups}</h3><div>{
                            headerData[ann_groups].map(
                              (item, i) => {
                                  // debugger
                                return  <TableMetadataItem
                                          key={ i }
                                          keyN={ i }
                                          tableConcept={ item }
                                          metadata={ metadata }
                                          cuisIndex={ cuisIndex }
                                          toggleCui={ toggleCui }
                                          addCuis={ addCuis }
                                          deleteCui={ deleteCui }
                                          enableDelete={ enableDelete }
                                          allowEdit= {allowEdit}
                                        />}
                            )} </div></div>
                        })
                      }</div> 

  return (
    <div style={{padding:"5px 7px 7px 7px"}} >

      <div style={{marginBottom:10}}>
        {
        shown && allowEdit && (
        <Button
          variant="outlined"
          style={{backgroundColor:"lightblue", height: 40, float:"right"}}
          onClick={ () => { saveMetadataChanges(metadata);} }
        > Save Metadata Changes </Button> )}

        {
        shown && allowEdit && (
        <Button
          variant="outlined"
          style={{backgroundColor:"lightblue", marginRight:10, height: 40, float:"right"}}
          onClick={ () => { autoLabel(); } }
        > Auto Label <AdbIcon /> </Button> )}

        {
        shown && allowEdit && (
        <span style={{float:"right"}}>
          <div style={{marginRight:10, fontSize:17, border:"1px #acacac solid", borderRadius:10, paddingLeft:10}}>
            Enable Delete
            <Switch
              checked={enableDelete}
              onChange={() => { setEnableDelete(!enableDelete) }}
              name="checkedA"
              inputProps={{ 'aria-label': 'secondary checkbox' }}
            />
          </div>
        </span> )}

        <div style={{height:35, fontSize:22, paddingTop:5}}> 4. <b> Terminology </b>
              <Button
                variant="outlined"
                onClick={ () => { shown ? setShown(false) : setShown(true)}}
              >
                { shown ? <VisibilityIcon style={{marginLeft:5}} /> : <VisibilityOffIcon style={{marginLeft:5}} />} 
              
              </Button>
            </div>

        
      </div>
      {
        ///updateTableMetadata(Object.assign({}, metadata))
      }
      <hr style={{borderTop:"1px #acacac dashed"}}/>

      {shown ? content : ""}

      </div>
  );
}

TableMetadata.propTypes = {};

export default memo(TableMetadata);
