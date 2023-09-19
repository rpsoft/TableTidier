/**
 *
 * SearchBar
 *
 */

import React, {
  // useEffect,
  // memo,
  useState,
  useRef
} from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import IconButton from '@material-ui/core/IconButton';
// import Divider from '@material-ui/core/Divider';
// import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import DirectionsIcon from '@material-ui/icons/Directions';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

import BackspaceIcon from '@material-ui/icons/Backspace';

// import {
//   Card, Checkbox,
//   Select as SelectField,
//   Input as TextField,
//   Button as RaisedButton,
//   MenuItem,
//   Popover,
//   Menu,
// } from '@material-ui/core';


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
  // setCharCount
}) {
  const classes = useStyles();
  const searchInput = useRef(searchCont);

  // const [searchContent, setSearchContent ] = useState(searchCont);
  const [searchContent, setSearchContent ] = useState('');
  const [searchCollections, setSearchCollections ] = useState(true);
  const [searchTables, setSearchTables ] = useState(true);

  const onKeyDown = (event) => {
    // event.preventDefault();
    // event.stopPropagation();
    const value = searchInput.current.value
    switch (event.key) {
      case 'Enter':
        doSearch(value, {searchCollections, searchTables} );
event.preventDefault();
event.stopPropagation();

        break;
      case 'Escape':
          value = '';
          doSearch('', {searchCollections, searchTables})
        break;
      case 'Backspace':
        if (value.length <= 1) {
          doSearch('', {searchCollections, searchTables})
        }
        break;
      default:
    }
  }

  const handleCheckBox = () =>{
  }

  return (
    <div style={{height:"auto",  minWidth:"50%", maxWidth:600, marginLeft:"auto", marginRight:"auto"}}>
      <Paper component="form" className={classes.root}>
        <InputBase
          className={ classes.input }
          placeholder={ "Search for tables" }
          defaultValue={searchCont}
          inputRef={searchInput}
          inputProps={{
            autoCorrect: 'off',
            spellCheck: 'false',
            autoComplete: 'off',
            type: 'text',
          }}
          // onChange={ (evt) => { setSearchContent(evt.currentTarget.value); setCharCount(evt.currentTarget.value.length)}}
          onKeyDown ={ onKeyDown }
        />

        <IconButton
          className={classes.iconButton}
          aria-label="search"
          onClick={ () => {
            // setSearchContent('');
            searchInput.current.value = ''
            doSearch('', {searchCollections, searchTables})
          }}
        >
          <BackspaceIcon />
        </IconButton>

        <IconButton
          className={classes.iconButton}
          aria-label="search"
          onClick={ () => {
            console.log(new Date())
            const searchText = searchInput.current.value
            doSearch(searchText, {searchCollections, searchTables})
          }}
        >
          <SearchIcon />
        </IconButton>

      </Paper>

      {/* <div style={{width:"100%",textAlign:"center"}}>
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
      </div> */}
    </div>
  );
}

SearchBar.propTypes = {};

export default SearchBar;
