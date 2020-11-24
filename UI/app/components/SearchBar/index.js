/**
 *
 * SearchBar
 *
 */

import React, { useEffect, memo, useState } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import DirectionsIcon from '@material-ui/icons/Directions';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

import BackspaceIcon from '@material-ui/icons/Backspace';

import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button as RaisedButton,
  MenuItem,
  Popover,
  Menu,
} from '@material-ui/core';


const useStyles = makeStyles((theme) => ({
  root: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    width: `100%`,
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
  divider: {
    height: 28,
    margin: 4,
  },
}));

function SearchBar({
  doSearch,
  searchCont,
  setCharCount
}) {
  const classes = useStyles();

  const [searchContent, setSearchContent ] = useState(searchCont);
  const [searchCollections, setSearchCollections ] = useState(true);
  const [searchTables, setSearchTables ] = useState(true);

  const onKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        doSearch(searchContent, {searchCollections, searchTables} );
      }
  }

  const handleCheckBox = () =>{

  }


  return (

    <div style={{height:"auto",  minWidth:"50%", maxWidth:600, marginLeft:"auto", marginRight:"auto"}}>
      <Paper component="form" className={classes.root}>
        <InputBase
          className={ classes.input }
          value={searchContent}
          placeholder={ "Search for tables" }
          onChange={ (evt) => { setSearchContent(evt.currentTarget.value); setCharCount(evt.currentTarget.value.length)}}
          onKeyDown ={ onKeyDown }
        />

        <IconButton className={classes.iconButton} aria-label="search" onClick={ () => { setSearchContent(""); doSearch("", {searchCollections, searchTables}) }}>
          <BackspaceIcon />
        </IconButton>

        <IconButton className={classes.iconButton} aria-label="search" onClick={ () => { doSearch(searchContent, {searchCollections, searchTables}) }}>
          <SearchIcon />
        </IconButton>

      </Paper>

      <div style={{width:"100%",textAlign:"center"}}>
      {
        // Collections
        // <Checkbox
        //   checked={searchCollections}
        //   onChange={() => { searchCollections ? setSearchCollections(false) : setSearchCollections(true) }}
        //   inputProps={{ 'aria-label': 'primary checkbox' }}
        // />
        //
        // Tables
        // <Checkbox
        //   checked={searchTables}
        //   onChange={() => { searchTables ? setSearchTables(false) : setSearchTables(true) }}
        //   inputProps={{ 'aria-label': 'primary checkbox' }}
        // />
      }
      </div>
    </div>
  );
}

SearchBar.propTypes = {};

export default SearchBar;
