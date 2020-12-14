/**
 *
 * TableAnnotator
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import Fade from '@material-ui/core/Fade';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import TableAnnotatorItem from 'components/TableAnnotatorItem'

import AdbIcon from '@material-ui/icons/Adb';

import ReactDOM from "react-dom";

import { List, arrayMove } from 'react-movable';

import {
  Button,
  TextField,
  Select as SelectField,
  Menu,
  MenuItem,
  Card,
  Popover,
  Checkbox,
  Switch,
} from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    height: 35,
  }
}));

function TableAnnotator({
  annotations,
  setAnnotations,
  saveAnnotationChanges,
  tid,
  loadTableResults,
}) {
  const classes = useStyles();

  const [enableDelete, setEnableDelete] = React.useState(false);

  const changeAnnotationData = (index, key, data) => {
    var temp = Array.from(annotations);
    temp[index][key] = data;
    setAnnotations(temp.slice());
  }

  const deleteAnnotationLine = (index) => {
    var temp = Array.from(annotations);
    temp.splice(index,1)
    setAnnotations(temp.slice());
  }

  const AnnotationList = annotations ? <List
      values={annotations}
      onChange={({ oldIndex, newIndex }) =>
        setAnnotations(arrayMove(annotations, oldIndex, newIndex))
      }
      renderList={({ children, props }) => <div {...props}>{children}</div>}
      renderItem={({ value, index, props }) => <div {...props}>{
        <TableAnnotatorItem
            id={index}
            annotationData={ value }
            deleteAnnotation={ deleteAnnotationLine }
            editAnnotation={ changeAnnotationData }
            enableDelete={enableDelete}
        />}
      </div>}
    />: ""

  return (
    <div style={{padding:"7px 7px 7px 7px"}} >
        <div style={{height:35, fontSize:22}}>

          <Button variant="outlined" style={{backgroundColor:"lightblue", float:"right"}} onClick={ () => {saveAnnotationChanges(tid, annotations); loadTableResults();} }> save annotation changes </Button>
          <Button variant="outlined" style={{backgroundColor:"lightblue", float:"right", marginRight:10}} onClick={ () => {} }> Auto Annotate <AdbIcon /></Button>

          <span style={{float:"right", marginRight:10, fontSize:17, border:"1px #acacac solid", borderRadius:10, paddingLeft:10}}>
            Enable Delete
            <Switch
                checked={enableDelete}
                onChange={() => { setEnableDelete(!enableDelete) }}
                name="checkedA"
                inputProps={{ 'aria-label': 'secondary checkbox' }}
                classes={{
                  root: classes.root, // class name, e.g. `classes-nesting-root-x`
                }}
              />
          </span>
          <div style={{paddingTop:5}}> 2. Table <b> Annotations </b> </div>

        </div>

      {//<div>{JSON.stringify(annotations)}</div>
      }
        <hr style={{borderTop:"1px #acacac dashed"}}/>

        <div style={{width:"100%",whiteSpace: "nowrap"}}>
          {AnnotationList}
        </div>
          <Button variant="outlined" style={{backgroundColor:"lightgreen", marginTop:5}} onClick={ () => { var temp = Array.from(annotations); temp.push({location: "Col" , content:{}, qualifiers:{}, number:"", subAnnotation:false}); setAnnotations( temp )} }> + add annotation item</Button>

    </div>
  );
}

TableAnnotator.propTypes = {};

export default memo(TableAnnotator);
