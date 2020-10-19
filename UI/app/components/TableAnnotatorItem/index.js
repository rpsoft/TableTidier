/**
 *
 * TableAnnotator
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';

import {
  Button as RaisedButton,
  TextField,
  Input,
  Select as SelectField,
  Menu,
  MenuItem,
  Card,
  Popover,
  Checkbox,
} from '@material-ui/core';

import KeyboardBackspaceIcon from '@material-ui/icons/KeyboardBackspace';
import SubdirectoryArrowRightIcon from '@material-ui/icons/SubdirectoryArrowRight';
import DeleteIcon from '@material-ui/icons/Delete';
import Fab from '@material-ui/core/Fab';

import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';

import MultiplePopOver from 'components/MultiplePopOver'

function TableAnnotatorItem({
  annotationData,
  editAnnotation,
  deleteAnnotation,
  id,
  enableDelete
}) {

  // const [location, setLocation] = React.useState(annotationData.location)
  // const [descriptors, setDescriptors] = React.useState( Object.keys(annotationData.content) )
  // const [formaters, setFormaters] = React.useState( Object.keys(annotationData.qualifiers) )



  //
  // React.useEffect(() => {
  //   // debugger
  //   setLocation(annotationData.location)
  //   setDescriptors({...annotationData.content})
  //   setFormaters({...annotationData.qualifiers})
  //
  //
  // }, [annotationData]);
  //



  const handleChange = (event, data, source) => {
     // var prevState = this.state
     // prevState[source] = event.target.value
     // console.log(prevState)
     // this.setState(prevState);
     // this.props.addAnnotation(this.state)
  };

  const handleMultiChoice = (variable, values) => {
    // var prevState = this.state
    //     prevState[variable] = values
    // this.setState(prevState)
    //
    // this.props.addAnnotation(this.state)
  }

  // debugger
  // {"location":"Row","content":{"arms":true},"qualifiers":{},"number":"1"}



  const descriptors_available = ["outcomes", "characteristic_name", "characteristic_level", "arms", "measures", "time/period", "other", "p-interaction"]
  const formaters_available = ["plain", "bold", "indented", "italic", "empty_row","empty_row_with_p_value"]

  const Object2Array = (obj) => Array.isArray(obj) ? obj : Object.keys(obj) // This is a fix for legacy annotations.

  const descriptors_selected = annotationData.content ? Object2Array(annotationData.content) : []
  const formaters_selected = annotationData.qualifiers ? Object2Array(annotationData.qualifiers) : []

  return (
    <div style={{marginLeft:5, height: 40}}  >

            {enableDelete ? <Fab style={{height:25, width:35, marginRight:20, backgroundColor:"#ffa3a3"}} onClick={ () => { deleteAnnotation(id) } } ><DeleteIcon style={{height:20}}/> </Fab> : ""}


          <DragIndicatorIcon style={{cursor:"grab"}}/>
          <span>

            <RaisedButton style={{minWidth: "auto", width: 30, marginLeft: 5}} onClick={() => {editAnnotation( id, "subAnnotation", false)}}> <KeyboardArrowLeftIcon /> </RaisedButton>
            <RaisedButton style={{minWidth: "auto", width: 30, marginLeft: 5}} onClick={() => {editAnnotation( id, "subAnnotation", true)}}> <KeyboardArrowRightIcon /> </RaisedButton>

            <span> { annotationData.subAnnotation ? <SubdirectoryArrowRightIcon style={{marginLeft:20}}/> : ""} </span>

            <SelectField
                value={ annotationData.location }
                onChange={(event,index,value) => { editAnnotation( id, "location", index.props.value);}}
                style={{width:130,marginLeft:10}}
                >
                  <MenuItem value={"Col"} key={1} >Column</MenuItem>
                  <MenuItem value={"Row"} key={2} >Row</MenuItem>
            </SelectField>

            <Input
                  disabled={false}
                  value={ annotationData.number }
                  placeholder={"0"}
                  type="number"
                  onChange={(event,value) => { editAnnotation( id, "number", event.target.value ) }}
                  inputProps={{style: { textAlign: 'center' }}}
                  style={{width:40,marginLeft:20, textAlign:"center"}}
                />



            <MultiplePopOver
                         value={ descriptors_selected }
                         variable={"Content "}
                         options={ descriptors_available }
                         updateAnnotation={ (values) => { editAnnotation( id, "content", values )  } }
                         style={{marginLeft:10}}
                         />

            <MultiplePopOver
                         value={ formaters_selected }
                         variable={"Format "}
                         options={ formaters_available }
                         updateAnnotation={ (values) => {  editAnnotation( id, "qualifiers", values ) } }
                         style={{marginLeft:10}}
                         />



            {
              // <span style={{marginLeft:10, padding:9, border:"1px solid black", borderRadius:5}}>
              //   Subordinate ?
              //  <Checkbox
              //    checked={ false }
              //    onChange={ () => {} }
              //    inputProps={{ 'aria-label': 'primary checkbox' }}
              //  />
              // </span>
              //   <RaisedButton
              //   variant={"contained"}
              //   style={{marginLeft: 30, backgroundColor:"#ffa3a3"}}
              //   onClick={() => { deleteAnnotation()}}
              //
              // ><DeleteIcon /></RaisedButton>
              // optionsShown ? <span> <KeyboardBackspaceIcon style={{marginLeft:30}}/>
              // <Fab style={{height:25, width:35, marginLeft:30, backgroundColor:"#ffa3a3"}} ><DeleteIcon style={{height:20}}/> </Fab></span> : ""
            }

          </span>
    </div>
  );
}

TableAnnotatorItem.propTypes = {};

export default memo(TableAnnotatorItem);
