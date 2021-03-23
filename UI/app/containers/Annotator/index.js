/**
 *
 * Annotator
 *
 */
 const _ = require('lodash');


import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';

import makeSelectAnnotator from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';
import {
  loadTableContentAction,
  loadTableResultsAction,
  loadTableMetadataAction,
  saveTableTextAction,
  saveTableNoteAction,
  saveTableAnnotationAction,
  saveTableMetadataAction,
  loadCuisIndexAction,
  updateTableMetadataAction,
  autoLabelHeadersAction,
} from './actions'

import { useCookies } from 'react-cookie';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import { ArrowDropUp, ArrowDropDown }from '@material-ui/icons';

import { push } from 'connected-react-router'

// import {browserHistory} from 'react-router';

import CsvDownloader from 'react-csv-downloader';

import {
  Card, Checkbox,
  Select as SelectField,
  TextField,
  Button,
  Paper,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Switch,
} from '@material-ui/core';

import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';

import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

// import Draggable from 'react-draggable';

// import { Resizable, ResizableBox } from 'react-resizable';

const drawerWidth = 250;

import TableAnnotator from 'components/TableAnnotator'
import TableEditor from 'components/TableEditor'
import TableResult from 'components/TableResult'
import TableMetadata from 'components/TableMetadata'
import TableNotes from 'components/TableNotes'
import PopAlert from 'components/PopAlert'

import prepareMetadata from './metadataUtil'

import {
  GetApp as DownloadIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Link as LinkIcon,
  Edit as EditIcon,
} from '@material-ui/icons';

import './dragstyle.css';

const useStyles = makeStyles((theme) => ({
 root: {
   display: 'flex',
 },
 appBar: {

   marginRight: drawerWidth,
 },
 drawer: {
   flexShrink: 0,
 },
 drawerPaper: {
   width: drawerWidth,
   height: `calc(100% - 124px)`,
   marginTop:64,
 },
 // necessary for content to be below app bar
 toolbar: theme.mixins.toolbar,
 content: {
   flexGrow: 1,
   // backgroundColor: theme.palette.background.default,
   padding: theme.spacing(3),
 },
 bottomButtons: {
   width: 185,
   marginBottom:5,
 },
 bottomTable: {

 }
}));

var diffY = 0;


export function Annotator({
  annotator,
  loadTableContent,
  loadTableResults,
  loadTableMetadata,

  loadCuisIndex,

  goToUrl,
  saveTextChanges,
  saveNoteChanges,
  saveAnnotationChanges,
  saveMetadataChanges,

  updateTableMetadata,

  autoLabel,
}) {
   var hey = _;
  useInjectReducer({ key: 'annotator', reducer });
  useInjectSaga({ key: 'annotator', saga });

  const [cookies] = useCookies();

  const classes = useStyles();
  const theme = useTheme();


  const [ bottomEnabled, setBottomEnabled ] = React.useState(false);
  const [ bottomLevel, setBottomLevel ] = React.useState(0);
  const [ bottomSize, setBottomSize ] = React.useState("50vh");

  const handleBottomChange = (bottomLevel) => {
    // debugger
    if ( bottomLevel >= 2 ){
      setBottomLevel(0);
      setBottomEnabled(false);
      setBottomSize(65)
    } else {
      setBottomEnabled(true);
      setBottomLevel(bottomLevel+1)
      setBottomSize(((bottomLevel+1)*44)+"vh");
    }
  }

  const [ bottomNotes, showBottomNotes ] = React.useState(true);
  const [ bottomAnnotations, showBottomAnnotations ] = React.useState(true);
  const [ bottomResults, showBottomResults ] = React.useState(true);
  const [ bottomMetadata, showBottomMetadata ] = React.useState(true);

  const [ startBottomSize, setStartBottomSize ] = React.useState(0);
  const [ dragStartY, setDragStartY ] = React.useState(0);

  const [ N_tables, setN_tables ] = React.useState(0)
  const [ tablePosition, setTablePosition] = React.useState(-1)

  // const [ tablePositionInput, setTablePositionInput] = React.useState(1)

  const [ tableData, setTableData ] = React.useState( {...annotator.tableData });
  const [ annotations, setAnnotations ] = React.useState( annotator.annotations );
  const [ annotationHeaders, setAnnotationHeaders ] = React.useState([])

  const [ results, setResults ] = React.useState(  annotator.results );
  const [ metadata, setMetadata ] = React.useState( {} );
  const [ headerData, setHeaderData ] = React.useState( {} );

  const [ cuisIndex, setCuisIndex ] = React.useState( {} );

  const [ alertData, setAlertData]  = React.useState( { open: false, message: "", isError: false } );

  const [ tid, setTid ] = React.useState("")

  const [ notesData, setNotesData ] = React.useState({ tableType:"", tableStatus:"", textNotes: "" });

  const [ editorEnabled, setEditorEnabled ] = React.useState(false);

  const [ showEditCuis, setShowEditCuis ] = React.useState(false);



  const [ windowSize, setWindowSize ] = React.useState({
    width: undefined,
    height: undefined,
  });



  //On component will mount
  React.useEffect(() => {
    // loadTableContent()
    // loadTableResults(true)
    //console.log("WILL MOUNT")

    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      setBottomSize( (windowSize.height*0.80) < bottomSize ? windowSize.height*0.80 : bottomSize )

    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);


  }, []);


  React.useEffect(() => {

      if( annotator.tableData ){
        setAnnotations(annotator.annotations)

        var header_data = annotator.annotations.map( ann => { return {head: Object.keys(ann.content).join(";"), sub: ann.subAnnotation } })

        header_data = header_data.reduce( (acc, header,i) => {
                                acc.count[header.head] = acc.count[header.head] ? acc.count[header.head]+1 : 1;
                                acc.headers.push(header.head+"@"+acc.count[header.head]);
                                acc.subs.push(header.sub);
                                return acc;
                              }, {count:{},headers:[],subs:[]} )

        setAnnotationHeaders([ "docid_page", "row", "col", "value", ...header_data.headers ])

        setTableData(annotator.tableData)
        setN_tables(parseInt(annotator.tableData.collectionData.tables.length))
        setTablePosition(parseInt(annotator.tableData.tablePosition))
        setResults(annotator.results)

        setMetadata(annotator.metadata)
        // debugger
        setCuisIndex(annotator.cuis_index)

        setHeaderData( prepareMetadata(header_data, annotator.results) );

        setAlertData(annotator.alertData)

        setTid(tableData.annotationData ? tableData.annotationData.tid : "")

        setNotesData({
          tableType: annotator.tableData.tableType || "",
          tableStatus: annotator.tableData.tableStatus || "" ,
          textNotes: annotator.tableData.textNotes || "",
        })
      }
    }, [annotator])

  // React.useEffect(() => {
  //   // getCollectionData()
  //   // setEditMode(false)
  // }, [cookies.hash]);

  React.useEffect(() => {
    loadCuisIndex()
    loadTableContent(false)
    loadTableResults(true)
    loadTableMetadata()

  }, [location.search]);

  const openMargin = bottomEnabled ? bottomSize : 65;

  const table_notes = <TableNotes notesData={notesData} setNotesData={setNotesData} saveNoteChanges={saveNoteChanges}/>

  const table_annotator =  annotations ? <TableAnnotator annotations={annotations}
                                                         setAnnotations={ (anns) => {setAnnotations(anns)}}
                                                         tid={tid}
                                                         saveAnnotationChanges={saveAnnotationChanges}
                                                         loadTableResults={ (autoAnnotate) => { loadTableContent(autoAnnotate); loadTableResults(false);   }}
                                                         /> : ""

  var cols = []  //columns.map( (v,i) => { var col = {Header: v, accessor : v}; if( v == "col" || v == "row"){ col.width = 70 }; if( v == "value" ){ col.width = 200 }; return col } )

  const table_results = <TableResult loadTableResults={ () => { loadTableContent(false); loadTableResults(false);  }} tableResult={results} sortedHeaders={annotationHeaders}/>

  const table_metadata = <TableMetadata tid={tid}
                                        tableResults={results}
                                        headerData={headerData}
                                        metadata={metadata}
                                        cuisIndex={cuisIndex}
                                        updateTableMetadata={updateTableMetadata}
                                        saveMetadataChanges={saveMetadataChanges}
                                        autoLabel={ () => { autoLabel(headerData, tid ) } }
                                        />

  const bottom_elements = [table_notes, table_annotator, table_results, table_metadata]

  const changeTableData = (key,data) => {

    var temp_table_data = Object.assign({}, tableData);
    temp_table_data[key] = data;
    setTableData(temp_table_data);

  }

  // Preparing navigation variables here.
  const prepare_nav_link  = (tables, ind) => {

    if ( !tables ){uhtgfuytfuytfjhg
      return () => {}
    }

    var index = ind - 1

    if ( index < 0) {
      index = 0
    }

    if ( index > (tables.length-1) ){
      index = (tables.length-1)
    }

    return () => {
      var address = "/table?"+
                "docid="+tables[index].docid+
                "&page="+tables[index].page+
                "&collId="+tables[index].collection_id;

      goToUrl(address);
    }
  }

  const prevNumber = ((tablePosition-1) >= 0) ? (tablePosition-1) : 0
  const nextNumber = ((tablePosition+1) > (N_tables)) ? (N_tables) : (tablePosition+1)

  // annotator.tableData.collectionData.tables
  const goPrev = annotator.tableData ? prepare_nav_link(annotator.tableData.collectionData.tables, prevNumber) : () => {}
  const goNext = annotator.tableData ? prepare_nav_link(annotator.tableData.collectionData.tables, nextNumber) : () => {}

  const goToTable = (number) => { return annotator.tableData ? prepare_nav_link(annotator.tableData.collectionData.tables, number) : () => {} }

  const docid = annotator.tableData ? annotator.tableData.docid : ""
  const page = annotator.tableData ? annotator.tableData.page : ""
  const collId = annotator.tableData ? annotator.tableData.collId : ""

  const fileNameRoot = () => [docid,page,collId].join("_")


  return (

      <Card style={{marginTop:10, marginBottom: openMargin, minHeight:"85vh", marginRight:250}}>
{
        <Helmet>
          <title>TableTidier - Annotator</title>
          <meta name="description" content="Description of Annotations" />
        </Helmet>
}
        <PopAlert alertData={alertData} setAlertData={setAlertData} />

        <div className={classes.root}>
          <div className={classes.content}>

            <div style={{width:"100%",textAlign:"right"}}>
              <div style={{float:"left", marginTop:10}}>
                    Document Name / ID:  <span style={{fontWeight:"bold", textDecoration: "underline", cursor: "pointer", color: "blue"}}> {docid} </span>
              </div>

              <div>
                Show Cuis
                <Switch
                    checked={showEditCuis}
                    onChange={() => { setShowEditCuis(!showEditCuis);}}
                    name="checkedA"
                    inputProps={{ 'aria-label': 'secondary checkbox' }}
                  />
              </div>

              <div>
                {editorEnabled ? "Disable" : "Enable"} Editing
                <Switch
                    checked={editorEnabled}
                    onChange={() => { setEditorEnabled(!editorEnabled);}}
                    name="checkedA"
                    inputProps={{ 'aria-label': 'secondary checkbox' }}
                  />
                  {editorEnabled ? <Button variant="outlined"
                                           style={{backgroundColor:"#ffdbdb"}}
                                           onClick={ () => {
                                              saveTextChanges(tableData.tableTitle, tableData.tableBody);
                                              setEditorEnabled(false);
                                              loadTableContent(false);
                                              loadTableResults(false);
                                            } }>
                                           Save Edit Changes <EditIcon style={{marginLeft:5}}/>
                                   </Button> : "" }
              </div>
            </div>

            <hr />

            {
            <TableEditor editorID={"table_title_editor"}
                         textContent={tableData ? tableData.tableTitle : ""}
                         editorEnabled={editorEnabled}
                         saveTextChanges={ (newText) => { changeTableData("tableTitle", newText) } }
                         height={200}
                         metadata={metadata}
                         cuisIndex={cuisIndex}
                         showEditCuis={showEditCuis}
                         />
                       }
            <hr />

            <TableEditor editorID={"table_content_editor"}
                         textContent={tableData ? tableData.tableBody : ""}
                         editorEnabled={editorEnabled}
                         saveTextChanges={ (newText) => { changeTableData("tableBody", newText) } }
                         height={800}
                         metadata={metadata}
                         cuisIndex={cuisIndex}
                         showEditCuis={showEditCuis}  />
        </div>

           <Drawer
              className={classes.drawer}
              variant="permanent"
              classes={{
                paper: classes.drawerPaper,
              }}
              anchor="right"
              style={{zIndex: 0}}
            >

              <List>
              <ListItem style={{marginLeft:0}}>
                Table Number in Collection:
              </ListItem>
              <ListItem>
                <Button variant="outlined" size="small" style={{minWidth: "auto", width:30, height:40, marginLeft:5}} onClick={ goPrev }>
                  <NavigateBeforeIcon style={{fontSize:20}} />
                </Button>
                <div style={{display:"inline", border:"1px solid #e5e5e5", borderRadius:5, height:40, verticalAlign:"center", width:"100% ", textAlign:"center", padding:2, fontSize:15}}>
                  <input style={{width:70, marginRight:5, textAlign:"right",height:35 }}
                         type="number"
                         value={ tablePosition && (parseInt(tablePosition) > -1) ? tablePosition : tablePosition }
                         onKeyDown={ (event) => {
                           if(event.key === 'Enter'){
                             goToTable(tablePosition)()
                              // (event.target.value > (tablePosition+1)) ? goNext() : goPrev()
                           } else {
                             // event.target.value ? setTablePosition( ( event.target.value > 0 ? event.target.value -1 : 0 ) ) : event.target.value
                             setTablePosition( parseInt(event.target.value) ? (parseInt(event.target.value) ) : "" )
                           }
                         }}
                         onChange={ (event) => {

                           setTablePosition( parseInt(event.target.value) ? (parseInt(event.target.value) ) : "" )
                           // event.target.value ? setTablePosition( ( event.target.value > 0 ? event.target.value -1 : 0 ) ) : event.target.value
                         } }

                         />
                  <div style={{display:"inline-block"}}> / {N_tables} </div>
                </div>
                <Button variant="outlined" size="small" style={{minWidth: "auto", width:30, height:40}} onClick={ goNext }>
                  <NavigateNextIcon style={{fontSize:20}} />
                </Button>
              </ListItem>

              </List>
              <Divider />
              <List>
              {
                // <ListItem button>
                //   <ListItemIcon><EditIcon/></ListItemIcon>
                //   <ListItemText primary={"Edit Table"} />
                //   <Switch
                //       checked={editorEnabled}
                //       onChange={() => { setEditorEnabled(!editorEnabled);}}
                //       name="checkedA"
                //       inputProps={{ 'aria-label': 'secondary checkbox' }}
                //     />
                // </ListItem>
                }

                <ListItem button>
                  <CsvDownloader
                    filename={fileNameRoot()+"_table_data.csv"}
                    separator=";"
                    wrapColumnChar="'"
                    columns={annotationHeaders.map( item => { return {id: item, displayName: item} } )}
                    datas={results}
                  >
                    <ListItemIcon style={{display:"inline"}}><DownloadIcon style={{fontSize:25}} /></ListItemIcon>
                    <ListItemText style={{display:"inline", marginLeft:5 }} primary="Table Data (.csv)" />
                  </CsvDownloader>
                </ListItem>

                <ListItem button>
                  <CsvDownloader
                    filename={fileNameRoot()+"_table_metadata.csv"}
                    separator=";"
                    wrapColumnChar="'"
                    columns={ Object.values(metadata)[0] ? Object.keys(Object.values(metadata)[0]).map( item => { return {id: item, displayName: item} } ) : []}
                    datas={Object.values(metadata)}
                  >
                    <ListItemIcon style={{display:"inline"}}><DownloadIcon style={{fontSize:25}}/></ListItemIcon>
                    <ListItemText style={{display:"inline", marginLeft:5}} primary="Table Metadata (.csv)" />
                  </CsvDownloader>
                </ListItem>

                {
                  // <ListItem button>
                  //   <ListItemIcon><LinkIcon/></ListItemIcon>
                  //   <ListItemText primary={"Link to Document"} />
                  // </ListItem>
                }
              </List>
            </Drawer>
        </div>


        <Card style={{position:"fixed",left: 0, bottom: 60, width: "100%", height: bottomEnabled ? bottomSize : 65}}>
          <div style={{width:"100%", backgroundColor: "#a3a3a3", height:5}}> </div>
          <div style={{width:"100%", minWidth:800, height: bottomEnabled ? "100%" : 65, backgroundColor:"#e5e5e5"}}>
            { !bottomEnabled ? <Button variant="outlined" style={{float:"right", backgroundColor:"#ffffff", top:5, right:5}} onClick={ () => handleBottomChange(bottomLevel) }> { bottomEnabled ? <ArrowDropDown style={{fontSize:35}} /> : <ArrowDropUp style={{fontSize:35}} /> }</Button> : ""}
            {
              !bottomEnabled ||
               <div style={{height:"100%", backgroundColor:"#ffffff"}}>
                  <table className={"bottomTable"}  style={{width:"100%", height:"100%"}}>
                    <tbody>
                      <tr>
                          <td style={{ textAlign: "center", padding:5, borderRight:"5px solid #e5e5e5", verticalAlign:"top", width: 200, maxWidth:200}}>
                            <div style={{width:"100%"}}>
                              <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomNotes ? "#dde6ff" : "" }} onClick={ () => showBottomNotes(!bottomNotes)}>
                                            1. Notes { bottomNotes ? <VisibilityIcon style={{marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> }  </Button>
                              <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomAnnotations ? "lightgoldenrodyellow" : "" }} onClick={ () => showBottomAnnotations(!bottomAnnotations)}>
                                            2. Annotations { bottomAnnotations ? <VisibilityIcon style={{marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> }  </Button>
                              <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomResults ? "lightsteelblue" : ""  }} onClick={ () => showBottomResults(!bottomResults)}>
                                            3. Results { bottomResults ? <VisibilityIcon style={{ marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> } </Button>
                              <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomMetadata ? "lightpink" : ""  }} onClick={ () => showBottomMetadata(!bottomMetadata)}>
                                            4. Metadata { bottomMetadata ? <VisibilityIcon style={{ marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> } </Button>
                            </div>
                          </td>

                          <td style={{ padding:5, verticalAlign:"top", maxWidth:"50%" }}>

                              <div style={{overflowY:"scroll",height:"100%"}}>
                                <table style={{width:"100%", height:"100%"}}>
                                  <tbody>
                                    { [bottomNotes, bottomAnnotations, bottomResults, bottomMetadata].map( (elm, i) => elm ?
                                        <tr key={"tr_"+i} style={{width:"100%", verticalAlign:"top", borderBottom:"1px #acacac solid"}}>
                                          <td style={{paddingBottom:20}}>

                                            { bottom_elements[i] }

                                          </td>
                                        </tr> : undefined )
                                    }
                                    </tbody>
                                 </table>
                               </div>

                           </td>
                           <td style={{ padding:5, verticalAlign:"top", width:70}}>
                              <Button variant="outlined"
                                      style={{float:"right", backgroundColor:"#ffffff", top:5, right:5}}
                                      onClick={ () => handleBottomChange(bottomLevel) }> { bottomLevel == 2 ? <ArrowDropDown style={{fontSize:35}} /> : <ArrowDropUp style={{fontSize:35}} /> }
                                      </Button>
                           </td>
                        </tr>
                    </tbody>
                  </table>
                </div>
          }


          </div>
        </Card>


      </Card>
  );
}

Annotator.propTypes = {
  dispatch: PropTypes.func.isRequired,
  annotator: PropTypes.object
};

const mapStateToProps = createStructuredSelector({
  annotator: makeSelectAnnotator(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    loadTableContent : (enablePrediction) => dispatch( loadTableContentAction(enablePrediction) ),
    loadTableResults : (cachedOnly) => dispatch ( loadTableResultsAction(cachedOnly) ),
    loadTableMetadata : (tid) => dispatch ( loadTableMetadataAction(tid) ),
    loadCuisIndex : () => dispatch( loadCuisIndexAction() ),
    saveTextChanges : (tableTitle, tableBody) => dispatch( saveTableTextAction(tableTitle, tableBody) ),
    saveNoteChanges : (notes) => dispatch( saveTableNoteAction(notes)  ),
    saveAnnotationChanges : (tid, annotations) => dispatch( saveTableAnnotationAction(tid, annotations)  ),
    saveMetadataChanges : (metadata) => dispatch( saveTableMetadataAction(metadata) ),
    goToUrl : (url) => dispatch(push(url)),
    updateTableMetadata : (metadata) => dispatch( updateTableMetadataAction(metadata) ),
    autoLabel : (headers,tid) => dispatch( autoLabelHeadersAction(headers,tid) ),

    // deleteCollection : () => dispatch( deleteCollectionAction() ),
    // updateCollectionData : (collectionData) => dispatch( updateCollectionAction (collectionData)),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withConnect,
  memo,
)(Annotator);
