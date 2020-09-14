/**
 *
 * CollectionView
 *
 */


 import React, { useEffect, memo, useState } from 'react';
 import PropTypes from 'prop-types';
 import { connect } from 'react-redux';
 import { Helmet } from 'react-helmet';
 import { FormattedMessage } from 'react-intl';
 import { createStructuredSelector } from 'reselect';
 import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';
import makeSelectCollectionView from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';

import { loadCollectionAction } from './actions'

import { push } from 'connected-react-router'
//
// import { useLocation } from 'react-router-dom';

import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button,
  Paper,
} from '@material-ui/core';

import { useDispatch, useSelector } from "react-redux";

import AddBoxIcon from '@material-ui/icons/AddBox';
import CollectionIcon from '@material-ui/icons/Storage';

import SearchBar from '../../components/SearchBar'

import SearchResult from '../../components/SearchResult'

import FileUploader from '../../components/FileUploader'

import Grid from "@material-ui/core/Grid";

import { useCookies } from 'react-cookie';

import { makeStyles } from '@material-ui/core/styles';

const queryString = require('query-string');

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    marginTop:10,
  },
  titles:{
    fontSize:20,
  },
  titles_content:{
    fontWeight:"bold",
    display:"inline",
  },
  paper: {
    padding: theme.spacing(2),
  },
  buttonHolder:{
    marginBottom:5
  },
  buttonColor: {
    backgroundColor:"blue",
    '&:hover': {
        backgroundColor: 'blue',
        borderColor: '#0062cc',
        boxShadow: 'none',
    },
    // '&:active': {
    //   boxShadow: 'none',
    //   backgroundColor: 'blue',
    //   borderColor: '#005cbf',
    // },
    // '&:focus': {
    //   boxShadow: '0 0 0 0.2rem rgba(0,123,255,.5)',
    // },
  },

}));

export function CollectionView({
  getCollectionData,
  collectionView
}) {
  useInjectReducer({ key: 'collectionView', reducer });
  useInjectSaga({ key: 'collectionView', saga });

  // console.log(collectionView)
  const parsed = queryString.parse(location.search);

  const [ editMode, setEditMode ] = useState ( false )

  const classes = useStyles();

  const [ currentCollection ] = useState(window.location.search)

  const [ cookies, setCookie, removeCookie ] = useCookies();

  const [ title, setTitle] = useState();
  const [ collection_id, setCollection_id ] = useState();
  const [ description, setDescription ] = useState();
  const [ owner_username, setOwner_username ] = useState();


  useEffect(() => {
    getCollectionData()
    setEditMode()
  }, [cookies.hash]);

  useEffect(() => {
    setTitle(collectionView.title)
    setCollection_id(collectionView.collection_id)
    setDescription(collectionView.description)
    setOwner_username(collectionView.owner_username)
    setEditMode()
  }, [collectionView])


  return (
    <div style={{margin:10}}>
            <Helmet>
              <title>CollectionView</title>
              <meta name="description" content="Description of CollectionView" />
            </Helmet>

            <div className={classes.root}>
              <Grid container spacing={1}>
                <Grid item xs={9}>
                  <Card style={{ marginBottom:10, padding:10 }}>
                    <div className={classes.titles}>

                      <div style={{fontSize:15}}> Collection ID: <div className={classes.titles_content}>{collectionView.collection_id}</div> </div>
                      <hr />
                      <div style={{marginTop:10}}> Title: { editMode ? <TextField
                                            id="title"
                                            value={title}
                                            placeholder={collectionView.title}
                                            onChange={ (evt) => {setTitle(evt.currentTarget.value)} }/>
                                      : <div className={classes.titles_content}>{collectionView.title}</div> } </div>

                      <div style={{marginTop:10}} > Description: { editMode ? <TextField
                                            id="description"
                                            value={description}
                                            placeholder={collectionView.description}
                                            onChange={ (evt) => {setDescription(evt.currentTarget.value)} } />
                                      : <div className={classes.titles_content}>{collectionView.description}</div>} </div>

                      <div style={{marginTop:10}}> Owner: { editMode ? <TextField
                                            id="owner_username"
                                            value={owner_username}
                                            placeholder={collectionView.owner_username}
                                            onChange={ (evt) => {setOwner_username(evt.currentTarget.value)} } />
                                      : <div className={classes.titles_content}>{collectionView.owner_username}</div>} </div>
                    </div>
                  </Card>

                  <Card>

                    <div style={{ padding:10}}>
                        Tables here
                    </div>

                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card>
                  <div  style={{ padding:10}}>
                    <div className={classes.buttonHolder}>
                          <Button variant="contained"
                                  onClick={ () => { setEditMode(!editMode) }} > Edit Collection Details
                          </Button>
                    </div>

                    <div className={classes.buttonHolder}><Button variant="contained" > Edit Collaborators </Button> </div>
                    <div className={classes.buttonHolder}><FileUploader /></div>
                    <hr />
                    <div className={classes.buttonHolder}><Button variant="contained" > Save Changes </Button> </div>
                  </div>
                  </Card>

                </Grid>
              </Grid>
            </div>
    </div>
  );
}

CollectionView.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  collectionView : makeSelectCollectionView(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    getCollectionData : () => dispatch( loadCollectionAction() ),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withConnect,
  memo,
)(CollectionView);
