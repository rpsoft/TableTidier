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

import { FixedSizeList } from 'react-window';

import { loadCollectionAction, updateCollectionAction,
         editCollectionAction, removeTablesAction,
         moveTablesAction } from './actions'

import { push } from 'connected-react-router'

import './pagination.css';
//
// import { useLocation } from 'react-router-dom';

import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button,
  Paper,
  Switch,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Select,
  MenuItem,
} from '@material-ui/core';

import { useDispatch, useSelector } from "react-redux";editCollectionAction

import AddBoxIcon from '@material-ui/icons/AddBox';
import CollectionIcon from '@material-ui/icons/Storage';

import SearchBar from 'Checkbox../../components/SearchBar'

import SearchResult from '../../components/SearchResult'

import FileUploader from '../../components/FileUploader'

import ConfirmationDialog from '../../components/ConfirmationDialog'


import Grid from "@material-ui/core/Grid";

import { useCookies } from 'react-cookie';

import { makeStyles } from '@material-ui/core/styles';

import ReactPaginate from 'react-paginate';

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
  editCollectionData,
  updateCollectionData,
  removeTables,
  moveTables,
  collectionView,
  goToUrl
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
  const [ tables, setTables ] = useState(collectionView.tables || []);
  const [ checkedTables, setCheckedTables ] = useState({});

  const [ targetCollectionID, setTargetCollectionID] = useState("");
  const [ availableCollections, setAvailableCollections ] = useState([]);
  const [ moveDialogOpen, setMoveDialogOpen ] = useState(false);

  const [ deleteDialog, showDeleteDialog ] = useState(false);
  const [ moveDialog, showMoveDialog ] = useState(false);


  const toggleCheckBox = (docid) => {
    var checkedTables_temp = checkedTables
    checkedTables_temp[docid] = checkedTables_temp[docid] ? false : true
    if ( checkedTables_temp[docid] == false ){
      delete checkedTables_temp[docid]
    }
    setCheckedTables(checkedTables_temp)
  }

  useEffect(() => {
    getCollectionData()
    setEditMode(false)
  }, [cookies.hash]);

  useEffect(() => {
    setTitle(collectionView.title)
    setCollection_id(collectionView.collection_id)
    setDescription(collectionView.description)
    setOwner_username(collectionView.owner_username)
    setTables(collectionView.tables)
    setAvailableCollections(collectionView.collectionsList)
    setEditMode(false)
    setCheckedTables({})
  }, [collectionView])

  const prepareCollectionData = () => {
    var collectionData = {
      title : title,
      collection_id : collection_id ,
      description : description ,
      owner_username : owner_username ,
      tables : tables ,
    }
    return collectionData
  }


  const saveChanges = () => {
      updateCollectionData(prepareCollectionData());
      editCollectionData();
  }

  const Row = ({ index, style }) => {
          var table_key = collectionView.tables[index].docid+"_"+collectionView.tables[index].page
          return <div style={{...style, display: "flex", alignItems: "center"}}>
            <Checkbox checked={checkedTables[table_key]}
                onChange={() => {toggleCheckBox(table_key)}}
                inputProps={{ 'aria-label': 'primary checkbox' }}
                />
            <SearchResult
                  text={ table_key+" -- "+collectionView.tables[index].user+" -- "+collectionView.tables[index].status }
                  type={"table"}
                  onClick={ () => { goToUrl("/table?docid="+collectionView.tables[index].docid+"&page="+collectionView.tables[index].page)
                }}/>
          </div>
        };

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

                      <div style={{fontSize:15}}>
                            Collection ID: <div className={classes.titles_content}>{collectionView.collection_id}</div>
                            <div style={{ display:"inline",float:"right", marginTop:-2}}>Enable Editing<Switch
                                checked={editMode}
                                onChange={() => { setEditMode(!editMode) }}
                                name="editmode"
                                inputProps={{ 'aria-label': 'secondary checkbox' }}
                                size="small"
                              /></div>

                      </div>
                      <hr />
                      <div style={{marginTop:10}}> Title: { editMode ? <TextField
                                            id="title"
                                            value={title}
                                            placeholder={collectionView.title}
                                            onChange={ (evt) => {setTitle(evt.currentTarget.value)} }/>
                                      : <div className={classes.titles_content}>{title}</div> } </div>

                      <div style={{marginTop:10}} > Description: { editMode ? <TextField
                                            id="description"
                                            value={description}
                                            placeholder={collectionView.description}
                                            onChange={ (evt) => {setDescription(evt.currentTarget.value)} }
                                            style={{minWidth:500}}
                                            multiline/>
                                      : <div className={classes.titles_content}>{description}</div>} </div>

                      <div style={{marginTop:10}}> Owner: { editMode ? <TextField
                                            id="owner_username"
                                            value={owner_username}
                                            placeholder={collectionView.owner_username}
                                            onChange={ (evt) => {setOwner_username(evt.currentTarget.value)} } />
                                      : <div className={classes.titles_content}>{owner_username}</div>} </div>

                      <hr />
                      <div style={{marginTop:10}}>Total tables: {collectionView.tables ? collectionView.tables.length : 0} </div>
                    </div>
                  </Card>

                  <Card>
                    <FixedSizeList
                      height={700}
                      width={"100%"}
                      itemSize={50}
                      itemCount={collectionView.tables ? collectionView.tables.length : 0}
                    >
                      {Row}
                    </FixedSizeList>
                    </Card>

                </Grid>
                <Grid item xs={3}>
                  <Card>
                  <div  style={{ padding:10}}>

                    <div style={{marginBottom:10,textAlign:"center"}}>Collection Options</div>

                    <div className={classes.buttonHolder}><Button variant="contained" > Edit Collaborators </Button> </div>
                    <div className={classes.buttonHolder}><Button variant="contained" > Set Visibility </Button> </div>
                    <div className={classes.buttonHolder}><Button variant="contained" > Delete Collection </Button> </div>
                                        <hr />
                    <div style={{marginBottom:10,textAlign:"center"}}>Table Actions</div>

                    <div className={classes.buttonHolder}>
                          <FileUploader baseURL={undefined}
                                        collection_id={collection_id}
                                        username_uploader={owner_username}
                                        updaterCallBack= { getCollectionData }/>
                    </div>

                      <div className={classes.buttonHolder}>
                        <Button variant="contained" onClick={() => { setMoveDialogOpen(true); }} > Move Tables </Button>
                        </div>

                      <Dialog onClose={ () => {}} aria-labelledby="customized-dialog-title" open={moveDialogOpen}>
                            <DialogTitle id="customized-dialog-title" >
                              Move Tables to Target Collection
                            </DialogTitle>
                            <DialogContent dividers>
                              <Select
                                  labelId="demo-simple-select-helper-label"
                                  id="demo-simple-select-helper"
                                  value={targetCollectionID}
                                  onChange={(event) => {setTargetCollectionID(event.target.value)}}
                                  style={{width:"100%"}}
                                >
                                {
                                  availableCollections ? availableCollections.map( (coll,j) =>{
                                    return <MenuItem key={j} value={coll.collection_id}><SearchResult
                                          text={ coll.collection_id+" -- "+coll.title }
                                          type={"collection"}
                                          /></MenuItem>
                                  }) : ""

                                }

                              </Select>
                            </DialogContent>
                            <DialogActions>
                              <Button onClick={()=>{showMoveDialog(true);}}> Accept </Button>
                              <Button onClick={()=>{setMoveDialogOpen(false);}}> Cancel </Button>
                            </DialogActions>

                            <ConfirmationDialog
                                  title={"Move Tables"}
                                  accept_action={
                                    () => { moveTables(checkedTables, targetCollectionID);
                                            setMoveDialogOpen(false);
                                            setCheckedTables({});
                                            showMoveDialog(false);
                                        }
                                    }
                                  cancel_action={ () => {showMoveDialog(false);} }
                                  open={moveDialog} />
                      </Dialog>

                      <div className={classes.buttonHolder}>
                        <Button variant="contained"
                                onClick={ () => {showDeleteDialog(true)}}
                                style={{backgroundColor:"#ff8282"}}> Delete Tables </Button>

                          <ConfirmationDialog
                                title={"Delete Tables"}
                                accept_action={ () => {removeTables(checkedTables, prepareCollectionData()); showDeleteDialog(false);}}
                                cancel_action={ () => {showDeleteDialog(false);} }
                                open={deleteDialog} />
                        </div>

                    <hr />

                    <div className={classes.buttonHolder} style={{float:"right",marginBottom:10}}>
                          <Button variant="contained" disabled={false} onClick={() => {saveChanges()}} > Save Changes </Button> </div>
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
    updateCollectionData : (collectionData) => dispatch( updateCollectionAction (collectionData)),
    editCollectionData : () => dispatch( editCollectionAction() ),
    removeTables : (tablesList, collectionData) => dispatch( removeTablesAction(tablesList, collectionData) ),
    moveTables : (tablesList, targetCollectionID ) => dispatch ( moveTablesAction (tablesList, targetCollectionID) ),
    goToUrl : (url) => dispatch(push(url))
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
