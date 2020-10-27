/**
 *
 * Annotator
 *
 */

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
  loadTableResultsAction
} from './actions'

import { useCookies } from 'react-cookie';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import { ArrowDropUp, ArrowDropDown }from '@material-ui/icons';

import { push } from 'connected-react-router'

// import {browserHistory} from 'react-router';

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

import { Resizable, ResizableBox } from 'react-resizable';

const drawerWidth = 240;

import TableAnnotator from 'components/TableAnnotator'
import TableEditor from 'components/TableEditor'
import TableResult from 'components/TableResult'
import TableMetadata from 'components/TableMetadata'



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
  goToUrl
}) {
  // console.log(annotator)

  useInjectReducer({ key: 'annotator', reducer });
  useInjectSaga({ key: 'annotator', saga });

  const [cookies] = useCookies();

  const classes = useStyles();
  const theme = useTheme();

  const [ bottomEnabled, setBottomEnabled ] = React.useState(true);
  const [ bottomSize, setBottomSize ] = React.useState(400);
  const [ bottomAnnotations, showBottomAnnotations ] = React.useState(true);
  const [ bottomResults, showBottomResults ] = React.useState(true);
  const [ bottomMetadata, showBottomMetadata ] = React.useState(true);

  const [ startBottomSize, setStartBottomSize ] = React.useState(0);
  const [ dragStartY, setDragStartY ] = React.useState(0);

  const [ N_tables, setN_tables ] = React.useState(0)
  const [ tablePosition, setTablePosition] = React.useState(-1)

  const [ tableData, setTableData ] = React.useState( {...annotator.tableData });
  const [ annotations, setAnnotations ] = React.useState( annotator.annotations );
  const [ results, setResults ] = React.useState(  annotator.results );
  const [ metadata, setMetadata ] = React.useState( {} );

  const [ editorEnabled, setEditorEnabled ] = React.useState(false);


  //On component will mount
  React.useEffect(() => {
    loadTableContent()
  }, []);


  React.useEffect(() => {
    // debugger
    // console.log(JSON.stringify(annotator.tableData))
      if( annotator.tableData){
        setAnnotations(annotator.annotations)
        setTableData(annotator.tableData)
        setN_tables(parseInt(annotator.tableData.collectionData.tables.length))
        setTablePosition(parseInt(annotator.tableData.tablePosition))
        setResults(annotator.results)
      }
    }, [annotator])

  // React.useEffect(() => {
  //   // getCollectionData()
  //   // setEditMode(false)
  // }, [cookies.hash]);

  React.useEffect(() => {
    // console.log("changed: " + JSON.stringify(location.search))
    loadTableContent()
    loadTableResults()
  }, [location.search]);

  // <FormattedMessage {...messages.header} />     console.log("EFFEFCT")
  // <div>Logged in as {cookies.username}</div>
  // <div>{cookies.hash}</div>

  const openMargin = bottomEnabled ? bottomSize : 65;

  // const moveToBottom = () => {
  //   var element = document.getElementById("bottom");
  //   element.scrollIntoView({behavior: "smooth"});
  // }
  //
  // const handleMultiChoice = (variable,values) => {
  //
  //
  //   // var prevState = this.state
  //   //     prevState[variable] = values
  //   //
  //   // console.log(prevState)
  //   // this.setState(prevState)
  //   //
  //   //
  //   // this.props.addAnnotation(this.state)
  // }
  //
  // const staticTransform = `translate(0px, 0px)`
  //

  const table_annotator =  annotations ? <TableAnnotator annotations={annotations} setAnnotations={ (anns) => {setAnnotations(anns)}}  /> : ""


  var cols = []  //columns.map( (v,i) => { var col = {Header: v, accessor : v}; if( v == "col" || v == "row"){ col.width = 70 }; if( v == "value" ){ col.width = 200 }; return col } )

  const table_results = <TableResult loadTableResults={loadTableResults} tableResult={results} />

  const table_metadata = <TableMetadata />

  const bottom_elements = [table_annotator, table_results, table_metadata]

  const changeTableData = (key,data) => {

    var temp_table_data = Object.assign({}, tableData);
    temp_table_data[key] = data;
    setTableData(temp_table_data);

  }

  // Preparing navigation variables here.
  const prepare_nav_link  = (tables, index, prev, next) => {


    if (!tables ){
      return () => {}
    }

    // console.log(prevNumber+" "+nextNumber+" "+table.docid+" "+table.page)
    // debugger

    return () => {
      // debugger
      var address = "/table?"+
                "docid="+tables[index].docid+
                "&page="+tables[index].page+
                "&collId="+tables[index].collection_id;

      // console.log(address+" -- "+ prev + " : "+ next);
      goToUrl(address);
    }
  }

  // debugger

  const prevNumber = ((tablePosition-1) >= 0) ? (tablePosition-1) : 0
  const nextNumber = ((tablePosition+1) > (N_tables-1)) ? (N_tables-1) : (tablePosition+1)

  // annotator.tableData.collectionData.tables
  const goPrev = annotator.tableData ? prepare_nav_link(annotator.tableData.collectionData.tables,prevNumber, prevNumber, nextNumber) : () => {}
  const goNext = annotator.tableData ? prepare_nav_link(annotator.tableData.collectionData.tables,nextNumber, prevNumber, nextNumber) : () => {}

  const docid = annotator.tableData && annotator.tableData.collectionData.tables.length > 0 && tablePosition > -1  ? annotator.tableData.collectionData.tables[tablePosition].docid : ""

  return (

      <Card style={{marginTop:10, marginBottom: openMargin, minHeight:"85vh", marginRight:250}}>

        <div className={classes.root}>

          <div className={classes.content}>

            <div style={{width:"100%",textAlign:"right"}}>
              <div style={{float:"left", marginTop:10}}>
                    Document Name / ID:  <span style={{fontWeight:"bold", textDecoration: "underline", cursor: "pointer", color: "blue"}}> {docid} </span>
              </div>

              <div>
              <EditIcon/> {editorEnabled ? "Disable" : "Enable"} Editing
              <Switch
                  checked={editorEnabled}
                  onChange={() => { setEditorEnabled(!editorEnabled);}}
                  name="checkedA"
                  inputProps={{ 'aria-label': 'secondary checkbox' }}
                />
              </div>

            </div>

            <hr />

            <TableEditor editorID={"table_title_editor"} textContent={tableData ? tableData.tableTitle : ""} editorEnabled={editorEnabled} saveTextChanges={ (newText) => { changeTableData("tableTitle", newText) } }/>

            <hr />

            <TableEditor editorID={"table_content_editor"} textContent={tableData ? tableData.tableBody : ""} editorEnabled={editorEnabled} saveTextChanges={ (newText) => { changeTableData("tableBody", newText) } }/>
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
              <ListItem style={{marginLeft:8}}>
                Table Number in Collection:
              </ListItem>
              <ListItem>
                <Button variant="outlined" size="small" style={{minWidth: "auto", width:30, marginLeft:5}} onClick={ goPrev }>
                  <NavigateBeforeIcon style={{fontSize:20}} />
                </Button>
                <div style={{display:"inline", border:"1px solid #e5e5e5", borderRadius:5, height:30, verticalAlign:"center", width:"100% ", textAlign:"center", padding:2, fontSize:15}}>
                  <input readOnly style={{width:70, marginRight:5, textAlign:"right"}} type="number" value={tablePosition > -1 ? tablePosition+1 : -1}/>
                  <div style={{display:"inline-block"}}> / {N_tables} </div>
                </div>
                <Button variant="outlined" size="small" style={{minWidth: "auto", width:30}} onClick={ goNext }>
                  <NavigateNextIcon style={{fontSize:20}} />
                </Button>
              </ListItem>

              {
                // ['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
                // <ListItem button key={text}>
                //   <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                //   <ListItemText primary={text} />
                // </ListItem>
                // ))
              }




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
                  <ListItemIcon><DownloadIcon/></ListItemIcon>
                  <ListItemText primary={"Download CSV Data"} />
                </ListItem>
                <ListItem button>
                  <ListItemIcon><LinkIcon/></ListItemIcon>
                  <ListItemText primary={"Link to Document"} />
                </ListItem>
                {
                // <ListItem button>
                //   <ListItemIcon><DownloadIcon/></ListItemIcon>
                //   <ListItemText primary={"Download CSV Data"} />
                // </ListItem>
                // <ListItem button>
                //   <ListItemIcon><DownloadIcon/></ListItemIcon>
                //   <ListItemText primary={"Download CSV Data"} />
                // </ListItem>
                }
              </List>
            </Drawer>
        </div>


        <Card style={{position: "fixed", bottom: 60, left: 0, width: "100%"}}>

          <div style={{width:"100%", backgroundColor: "#a3a3a3", height:5, cursor: "row-resize" }}
            draggable="true"
            onDrag={e => {
              if ( bottomEnabled ){
                var dragX = e.pageX, dragY = e.pageY;

                var comp = Math.round((startBottomSize + (dragStartY - dragY))/100)*100

                if ( (comp) % 20 == 0 ){
                  setBottomSize(comp);

                }
              }

            }}
            onDragStart={ (e,data) => {
              var img = new Image();
              img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
              event.dataTransfer.setDragImage(img, 0, 0);

              if ( bottomEnabled ){
                var dragX = e.pageX, dragY = e.pageY;
                setDragStartY(dragY);
                setStartBottomSize(bottomSize);
              }

            }}

            onDragEnd={e => {
              if ( bottomEnabled ){
                var dragX = e.pageX, dragY = e.pageY;
                var nextSize = startBottomSize + (dragStartY - dragY)
                // debugger

                setBottomSize( (nextSize < 0) || (nextSize > window.innerHeight*0.75) ? window.innerHeight*0.75 : nextSize);
                // e.preventDefault()
              }
            }}
          > </div>

          <div style={{width:"100%", minWidth:800, height: bottomEnabled ? bottomSize : 65, backgroundColor:"#e5e5e5"}}>
            <Button variant="outlined" style={{float:"right", backgroundColor:"#ffffff", top:5, right:5}} onClick={ () => setBottomEnabled(!bottomEnabled) }> { bottomEnabled ? <ArrowDropDown style={{fontSize:35}} /> : <ArrowDropUp style={{fontSize:35}} /> }</Button>
            {
              !bottomEnabled ||
               <div style={{height:"100%", backgroundColor:"#ffffff",paddingRight:70}}>
                  <table className={"bottomTable"}  style={{width:"100%", height:"100%"}}>
                    <tbody>
                      <tr>
                          <td style={{ textAlign: "center", padding:5, borderRight:"5px solid #e5e5e5", verticalAlign:"top", width: 200, maxWidth:200}}>
                            <div style={{width:"100%"}}>
                              <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomAnnotations ? "lightgoldenrodyellow" : "" }} onClick={ () => showBottomAnnotations(!bottomAnnotations)}>
                                            1. Annotations { bottomAnnotations ? <VisibilityIcon style={{marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> }  </Button>
                              <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomResults ? "lightsteelblue" : ""  }} onClick={ () => showBottomResults(!bottomResults)}>
                                            2. Results { bottomResults ? <VisibilityIcon style={{ marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> } </Button>
                              <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomMetadata ? "lightpink" : ""  }} onClick={ () => showBottomMetadata(!bottomMetadata)}>
                                            3. Metadata { bottomMetadata ? <VisibilityIcon style={{ marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> } </Button>
                            </div>
                          </td>
                          <td style={{ padding:5, verticalAlign:"top"}}>
                            <div style={{overflowY:"scroll",height:"100%"}}>
                              <table style={{width:"100%", height:"100%"}}>
                                <tbody>
                                  { [bottomAnnotations, bottomResults, bottomMetadata].map( (elm, i) => elm ?
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
    loadTableContent : () => dispatch( loadTableContentAction() ),
    loadTableResults : (cachedOnly) => dispatch ( loadTableResultsAction(cachedOnly) ),
    goToUrl : (url) => dispatch(push(url))
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
