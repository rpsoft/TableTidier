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

function TableResult() {
  return (
    <div>
        <div style={{textAlign:"right", marginBottom:5}}>
          <div style={{height:35, fontSize:22, float:"left", paddingTop:5}}> 2. Extraction <b> Results </b> </div>
          <Button variant="outlined" style={{backgroundColor:"lightblue"}} onClick={ () => {} }> Refresh Results </Button>
        </div>

        <ReactTable
          data={[{hello:12,there:"cucu"}]}
          columns={[{Header:"hello",accessor:"hello"},{Header:"there",accessor:"there"}]}
          style={{
            marginBottom: 10,
            backgroundColor:"#f6f5f5"
          }}
          defaultPageSize={10}
        />
      </div>
  );
}

TableResult.propTypes = {};

export default memo(TableResult);
