/**
 *
 * TableResult
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import {
  // Card, Checkbox,
  // Select as SelectField,
  // TextField,
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

import { FormattedMessage } from 'react-intl';
import messages from './messages';

function TableResult({
  loadTableResults,
  tableResult
}) {
  var headers = []
  var data = []

  const getColumnWidth = (rows, accessor, headerText) => {
      const maxWidth = 400
      const magicSpacing = ["row", "col"].indexOf(accessor) > -1 ? 20 : 10
      const cellLength = Math.max(
        ...rows.map(row => (`${row[accessor]}` || '').length),
        headerText.length,
      )
      return Math.min(maxWidth, cellLength * magicSpacing)
    }

  if ( tableResult && tableResult.length > 0 ){
    // debugger
    headers = Object.keys(tableResult[0]).reduce ( (acc,item,i) => {
                  if( item.indexOf("docid_page") < 0 )
                    acc.push({Header:item, accessor:item, width: getColumnWidth(tableResult, item, item)})
                  return acc
                }, [])
    data = tableResult
  }

  return (
    <div style={{padding:"5px 7px 7px 7px"}} >
        <div style={{textAlign:"right", marginBottom:5}}>
          <div style={{height:35, fontSize:22, float:"left", paddingTop:5}}> 2. Extraction <b> Results </b> </div>
          <Button variant="outlined" style={{backgroundColor:"lightblue"}} onClick={ () => { loadTableResults(false) } }> Refresh Results </Button>
        </div>

         {
           data.length > 0 ? <ReactTable
                                data={data}
                                columns={headers}
                                style={{
                                  marginBottom: 10,
                                  backgroundColor:"#f6f5f5"
                                }}
                                defaultPageSize={data.length}
                              /> : <div> No results produced </div>
          }
      </div>
  );
}

TableResult.propTypes = {};

export default memo(TableResult);
