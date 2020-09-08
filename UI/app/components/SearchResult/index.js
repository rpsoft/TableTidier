/**
 *
 * SearchResult
 *
 */

import React from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import Tooltip from '@material-ui/core/Tooltip';

import Table from '@material-ui/icons/BorderAll';
// import Table from '@material-ui/icons/BorderClear';
// import Table from '@material-ui/icons/GridOn';

import CollectionIcon from '@material-ui/icons/DynamicFeed';

// import DashboardIcon from '@material-ui/icons/Dashboard';
// import DeleteIcon from '@material-ui/icons/Delete';

// import DnsIcon from '@material-ui/icons/Dns';
// import ViewQuiltIcon from '@material-ui/icons/ViewQuilt';
// import CommonStyles from './common-styles.css';

// import FolderIcon from '@material-ui/icons/Folder';
// import FolderOpenIcon from '@material-ui/icons/FolderOpen';

import Button from '@material-ui/core/Button';

function SearchResult({
  text,
  type,
  data
}) {
  return (
    <div>
      <Button tooltip={"hello"} style={{width:"100%",textAlign:"left", justifyContent:"left"}}>
        { type == "table" ? <Table /> : <CollectionIcon /> }
        <div style={{marginLeft:5}}>{ text }</div>
      </Button>
    </div>
  );
}

SearchResult.propTypes = {};

export default SearchResult;
