/**
 *
 * CollectionView
 *
 */


 import React, { useEffect, memo, useState, useRef } from 'react';
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
         moveTablesAction, deleteCollectionAction,
         downloadDataAction } from './actions'

import { push } from 'connected-react-router'

import './pagination.css';
//
// import { useLocation } from 'react-router-dom';
import CsvDownloader from 'react-csv-downloader';
import csv from 'react-csv-downloader/dist/lib/csv';


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
  FormHelperText,
  FormControl,
  InputLabel,
  Popover,
} from '@material-ui/core';

import { useDispatch, useSelector } from "react-redux";editCollectionAction

import AddBoxIcon from '@material-ui/icons/AddBox';
import CollectionIcon from '@material-ui/icons/Storage';
import WarningIcon from '@material-ui/icons/Warning';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';


import {
  GetApp as DownloadIcon,
  // NavigateBefore as NavigateBeforeIcon,
  // NavigateNext as NavigateNextIcon,
  // Link as LinkIcon,
  // Edit as EditIcon,
} from '@material-ui/icons';


import SearchBar from 'Checkbox../../components/SearchBar'

import SearchResult from '../../components/SearchResult'

import FileUploader from '../../components/FileUploader'

import ConfirmationDialog from '../../components/ConfirmationDialog'


import Grid from "@material-ui/core/Grid";

import { useCookies } from 'react-cookie';

import { makeStyles } from '@material-ui/core/styles';

import ReactPaginate from 'react-paginate';


import makeSelectLocation from '../App/selectors'

import {
  URL_BASE,
} from '../../links'

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
    }
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
  deleteCollection,
  removeTables,
  moveTables,
  collectionView,
  goToUrl,
  downloadData,
  locationData
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
  const [ noTables, setNoTables ] = useState(0);

  const [ targetCollectionID, setTargetCollectionID] = useState("");
  const [ availableCollections, setAvailableCollections ] = useState([]);
  const [ moveDialogOpen, setMoveDialogOpen ] = useState(false);

  const [ delete_enabled, set_delete_enabled ] = useState(false);

  const [ collectionDeleteDialog, showCollectionDeleteDialog ] = useState(false);

  const [ deleteDialog, showDeleteDialog ] = useState(false);
  const [ moveDialog, showMoveDialog ] = useState(false);

  const visibility_states = ["public", "registered", "private"]
  const [visibility, setVisibility] = useState("public");

  const completion_states = ["in progress", "complete"]
  const [completion, setCompletion] = useState("in progress");

  const [height, setHeight] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
      setHeight(ref.current.clientHeight)
  })


  const toggleCheckBox = (docid) => {
    var checkedTables_temp = checkedTables
    checkedTables_temp[docid] = checkedTables_temp[docid] ? false : true
    if ( checkedTables_temp[docid] == false ){
      delete checkedTables_temp[docid]
    }
    setCheckedTables(checkedTables_temp)
    setNoTables(Object.keys(checkedTables).length)
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
    setEditMode(collectionView.collection_id == "new" ? true : false)
    setCheckedTables({})
    setVisibility(collectionView.visibility)
    setCompletion(collectionView.completion)


  }, [collectionView])

  const prepareCollectionData = () => {
    var collectionData = {
      title : title,
      collection_id : collection_id ,
      description : description ,
      owner_username : owner_username ,
      tables : tables ,
      visibility : visibility,
      completion : completion,
    }
    return collectionData
  }


  const saveChanges = () => {
      updateCollectionData(prepareCollectionData());
      editCollectionData();
  }

  // const isNull = (value) => typeof value === "object" && !value

  const Row = ({ index, style }) => {
          var table_key = collectionView.tables[index].docid+"_"+collectionView.tables[index].page

          var notes = collectionView.tables[index].notes ? collectionView.tables[index].notes : ""
          var user = collectionView.tables[index].user ? collectionView.tables[index].user : ""


          return <div style={{...style, display: "flex", alignItems: "center"}}>
            <Checkbox checked={checkedTables[table_key]}
                onChange={() => {toggleCheckBox(table_key)}}
                inputProps={{ 'aria-label': 'primary checkbox' }}
                />
                <span> -- </span>
            <SearchResult
                  text={ table_key+" -- "+user+" -- "+notes }
                  type={"table"}
                  onClick={ () => {
                    goToUrl("/table?"+
                                "docid="+collectionView.tables[index].docid+
                                "&page="+collectionView.tables[index].page+
                                "&collId="+collectionView.collection_id
                            )
                }}/>
          </div>
        }
        //
        // var downloadData = async (filename, columns, data) => {
        //   var stuffhere = await csv(
        //     {filename, separator:";", wrapColumnChar:"'", columns, data}
        //   )
        //   var data = new Blob([stuffhere], {type: 'text/csv'});
        //   var csvURL = window.URL.createObjectURL(data);
        //   var tempLink = document.createElement('a');
        //   tempLink.href = csvURL;
        //   tempLink.setAttribute('download', filename);
        //   tempLink.click();
        // }
        //
        // test( "collection_metadata.csv", [
        //   {id: "id", displayName: "id"},{id: "data", displayName: "data"}
        // ], [
        //   {id: "1", data: 10},{id: "2", displayName: 20}
        // ])

  return (
    <div style={{margin:10, minHeight: "84vh"}}>
          <Helmet>
            <title>TableTidier - Collections</title>
            <meta name="description" content="Description of Collections" />
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
                    <div style={{minHeight:900, height: "70vh", backgroundColor:"white"}} ref={ref}>
                      <FixedSizeList
                        height={height}
                        width={"100%"}
                        itemSize={50}
                        itemCount={collectionView.tables ? collectionView.tables.length : 0}
                      >
                        {Row}
                      </FixedSizeList>
                    </div>
                  </Card>

                </Grid>
                <Grid item xs={3}>
                  <Card style={{padding:10, fontWeight:"bold",marginBottom:5, textAlign:"center"}}>
                    <div>Collection Options</div>
                  </Card>

                  <Card>
                    <div style={{padding:10}}>
                      <div className={classes.buttonHolder} style={{float:"right"}}>

                        <Button onClick={ () => {set_delete_enabled(!delete_enabled)}}> <DeleteIcon  style={{ color: "#ff8282" }}   /> </Button>

                        { delete_enabled ? <Button variant="contained"
                                onClick={ () => {showCollectionDeleteDialog(true);}}
                                style={{backgroundColor:"#ff8282"}} >
                          <WarningIcon  style={{ color: "#ffdc37" }}   />
                            Delete Collection
                          <WarningIcon  style={{ color: "#ffdc37" }}   />
                          </Button> : ""
                        }

                        <ConfirmationDialog
                              title={ <div style={{textAlign:"center"}}>This collection, associated tables, and annotations will be deleted <div style={{color:"red", fontWeight:"bolder"}}>PERMANENTLY</div></div> }
                              accept_action={ () => {deleteCollection(); alert("collection deleted"); goToUrl("/")} }
                              cancel_action={ () => {showCollectionDeleteDialog(false);} }
                              open={collectionDeleteDialog} />
                      </div>
                      {
                      // <div className={classes.buttonHolder}><Button variant="contained" > Edit Collaborators <PeopleAltIcon style={{marginLeft:5}} />  </Button> </div>
                      }
                      <FormControl variant="outlined" className={classes.formControl} style={{marginTop:20, width: 200}}>
                        <InputLabel id="outlined-visibility-label">Set Visibility</InputLabel>
                        <Select
                            labelId="outlined-visibility-label"
                            id="visibility-select-helper"
                            value={visibility}
                            onChange={(event) => {setVisibility(event.target.value)}}
                            style={{width:"100%",display:"inline-block"}}
                            label="Set Visibility"
                          >
                          {
                            visibility_states.map( (com,j) =>{
                              return <MenuItem key={"vis"+j} value={com}>{com}</MenuItem>
                            })
                          }
                        </Select>
                        </FormControl>
                        <br />

                      <FormControl variant="outlined" className={classes.formControl} style={{marginTop:20, width: 200}}  >
                        <InputLabel id="outlined-completion-label">Set Completion</InputLabel>
                        <Select
                            labelId="outlined-completion-label"
                            id="completion-select-helper"
                            value={completion}
                            onChange={(event) => {setCompletion(event.target.value)}}
                            style={{width:"100%",display:"inline-block"}}
                            label="Set Completion"
                          >
                          {
                            completion_states.map( (com,j) =>{
                              return <MenuItem key={"com"+j} value={com}>{com}</MenuItem>
                            })
                          }
                        </Select>
                        </FormControl>
                        </div>
                  </Card>

                  <Card style={{padding:10, fontWeight:"bold", marginTop:5, marginBottom:5, textAlign:"center"}}>
                    <div>Table Actions</div>
                  </Card>


                  <Card style={{padding:10}}>
                    <div>

                      <div className={classes.buttonHolder}>
                            <FileUploader baseURL={(locationData.api_url + 'tableUploader')}
                                          collection_id={ collection_id }
                                          username_uploader={ owner_username}
                                          updaterCallBack= { getCollectionData }/>
                      </div>

                      <div className={classes.buttonHolder}>
                        <Button variant="contained"   disabled = { noTables == 0 } onClick={() => { setMoveDialogOpen(true); }} > Move Tables <OpenInNewIcon style={{marginLeft:5}}/> </Button>
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
                                    if ( coll.collection_id == collection_id){
                                      return ""
                                    }
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
                                disabled = { noTables == 0 }
                                onClick={ () => {showDeleteDialog(true)}}
                                style={{backgroundColor:"#ff8282"}}> Delete Tables <DeleteIcon style={{marginLeft:5}} /></Button>

                          <ConfirmationDialog
                                title={"Delete Tables"}
                                accept_action={ () => {removeTables(checkedTables, prepareCollectionData()); showDeleteDialog(false);}}
                                cancel_action={ () => {showDeleteDialog(false);} }
                                open={deleteDialog} />
                        </div>

                      <hr/>

                      <div className={classes.buttonHolder}>
                        {
                          <Button variant="contained" onClick={ () => { downloadData("results", tables.map( t => t.tid ) )}}> Data CSV <DownloadIcon/></Button>
                          // <CsvDownloader
                          //   filename={"collection_data.csv"}
                          //   separator=";"
                          //   wrapColumnChar="'"
                          //   columns={[]}
                          //   datas={[]}
                          // >
                          // <Button variant="contained" disabled = { noTables == 0 }> Data CSV <DownloadIcon/></Button>
                          // </CsvDownloader>
                        }
                        </div>

                      <div className={classes.buttonHolder}>
                        {
                          // <CsvDownloader
                          //   filename={"collection_metadata.csv"}
                          //   separator=";"
                          //   wrapColumnChar="'"
                          //   columns={[]}
                          //   datas={[]}
                          // >
                          //   <Button variant="contained" disabled = { noTables == 0 }> Metadata CSV <DownloadIcon/></Button>
                          // </CsvDownloader>
                          }
                          <Button variant="contained" onClick={ () => { downloadData("metadata", tables.map( t => t.tid ) )}}> Metadata CSV <DownloadIcon/></Button>
                        </div>




                  </div>
                  </Card>

                  <Card style={{padding:10, fontWeight:"bold", marginTop:5, marginBottom:5, textAlign:"center"}}>
                    <div className={classes.buttonHolder} style={{float:"right"}}>
                        <Button variant="contained" disabled={false} onClick={() => {saveChanges()}} > Save Changes <SaveIcon style={{marginLeft:5}} /> </Button> </div>
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
  locationData : makeSelectLocation(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    getCollectionData : () => dispatch( loadCollectionAction() ),
    deleteCollection : () => dispatch( deleteCollectionAction() ),
    updateCollectionData : (collectionData) => dispatch( updateCollectionAction (collectionData)),
    editCollectionData : () => dispatch( editCollectionAction() ),
    removeTables : (tablesList, collectionData) => dispatch( removeTablesAction(tablesList, collectionData) ),
    moveTables : (tablesList, targetCollectionID ) => dispatch ( moveTablesAction (tablesList, targetCollectionID) ),
    downloadData : (target, tids) => dispatch ( downloadDataAction(target, tids) ),
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
