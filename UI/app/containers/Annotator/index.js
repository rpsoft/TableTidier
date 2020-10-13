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

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import makeSelectAnnotator from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';

import { useCookies } from 'react-cookie';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import { ArrowDropUp, ArrowDropDown }from '@material-ui/icons';

import RLDD from 'react-list-drag-and-drop/lib/RLDD.js';

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

import Draggable from 'react-draggable';

import { Resizable, ResizableBox } from 'react-resizable';

const drawerWidth = 240;

import TableAnnotator from 'components/TableAnnotator'
import TableEditor from 'components/TableEditor'


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
 }
}));

var diffY = 0;


export function Annotator({
  annotator
}) {
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

  const [ annotations, setAnnotations ] = React.useState([{id:0, subAnnotation:false},{id:1, subAnnotation:false},{id:2, subAnnotation:true},{id:3, subAnnotation:true}]);

  const [ tableData, setTableData ] = React.useState({ tableBody: "<div>This is the content</div>", tableTitle: "<div>This is Title </div>"});

  const [ editorEnabled, setEditorEnabled ] = React.useState(false);

  // const eventLogger = (e, data) => {
  //   // debugger
  //   //
  //   // data.deltaY
  //
  //   // setBottomSize( bottomSize+ data.deltaY)
  //   console.log('delta: ', bottomSize + data.y);
  //   // console.log('Data: ', data);
  // };

  // useEffect(() => {
  //   // This reloads the authentication token if it's available in the cookies.
  //   if ( token ) {
  //     setCookie("hash", token)
  //   }
  //
  // });

  // <FormattedMessage {...messages.header} />
  // <div>Logged in as {cookies.username}</div>
  // <div>{cookies.hash}</div>

  const openMargin = bottomEnabled ? bottomSize : 65;

  // const moveToBottom = () => {
  //   var element = document.getElementById("bottom");
  //   element.scrollIntoView({behavior: "smooth"});
  // }

  const handleMultiChoice = (variable,values) => {


    // var prevState = this.state
    //     prevState[variable] = values
    //
    // console.log(prevState)
    // this.setState(prevState)
    //
    //
    // this.props.addAnnotation(this.state)
  }

  const staticTransform = `translate(0px, 0px)`


  const descriptors_available = ["outcomes", "characteristic_name", "characteristic_level", "arms", "measures", "time/period", "other", "p-interaction"]
  const formaters_available = ["plain", "bold", "indented", "italic", "empty_row","empty_row_with_p_value"]


  const table_annotator =  <div>
      <div style={{height:35, fontSize:22}}> 1. Table <b> Annotations </b> <Button variant="outlined" style={{backgroundColor:"lightblue", float:"right"}} onClick={ () => {} }> save annotation changes </Button></div>

      <hr style={{borderTop:"1px #acacac dashed"}}/>
        {
          // annotations.map( (ann,i) => <TableAnnotator
          //       key={"ann_"+i}
          //       annotationData={ () => {} }
          //       addAnnotation={ () => {} }
          //       deleteAnnotation={ () => {} }
          // /> )
        }

        <RLDD
          items={annotations}
          itemRenderer={(item) => {
            return (
              <div className="item">
              <TableAnnotator
                    key={"ann_"+item.id}
                    annotationData={ item }
                    addAnnotation={ () => {} }
                    deleteAnnotation={ () => {} }
              />
              </div>
            );
          }}
          onChange={ (newAnnotations) => { setAnnotations(newAnnotations) } }
        />
        <Button variant="outlined" style={{backgroundColor:"lightgreen", marginTop:5}} onClick={ () => { var temp = Array.from(annotations); temp.push({id:temp.length}); setAnnotations( temp )} }> + add annotation item</Button>
      </div>


  var cols = []  //columns.map( (v,i) => { var col = {Header: v, accessor : v}; if( v == "col" || v == "row"){ col.width = 70 }; if( v == "value" ){ col.width = 200 }; return col } )

  const table_results = <div>
                          <div style={{textAlign:"right", marginBottom:5}}>
                            <div style={{height:35, fontSize:22, float:"left", paddingTop:5}}> 2. Extraction <b> Results </b> </div>
                            <Button variant="outlined" style={{backgroundColor:"lightblue"}} onClick={ () => {} }> Reload Results </Button>
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

  const table_metadata = <div>
                            <div style={{textAlign:"right", marginBottom:5}}>
                              <div style={{height:35, fontSize:22, float:"left", paddingTop:5}}> 3. <b> Metadata </b> Linking </div>
                              <Button variant="outlined" style={{backgroundColor:"lightblue"}} onClick={ () => {} }> Save Metadata Changes </Button>
                            </div>

                            `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

                              Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
                              "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"

                              1914 translation by H. Rackham
                              "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"

                              Section 1.10.33 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
                              "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."

                              1914 translation by H. Rackham
                              "On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains.`

                          </div>

  const bottom_elements = [table_annotator, table_results, table_metadata]

  const changeTableData = (key,data) => {

    var temp_table_data = Object.assign({}, tableData);
    temp_table_data[key] = data;
    setTableData(temp_table_data);

  }

  return (

      <Card style={{marginTop:10, marginBottom: openMargin, minHeight:"85vh", marginRight:250}}>

        <div className={classes.root}>

          <div className={classes.content}>

            <div style={{width:"100%",textAlign:"right"}}>
              <div style={{float:"left", marginTop:10}}> Document Name / ID:  <span style={{fontWeight:"bold", textDecoration: "underline", cursor: "pointer", color: "blue"}}> 43245435432 </span></div>
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

            <TableEditor editorID={"table_title_editor"} textContent={tableData.tableTitle} editorEnabled={editorEnabled} saveTextChanges={ (newText) => { changeTableData("tableTitle", newText) } }/>

            <hr />

            <TableEditor editorID={"table_content_editor"} textContent={tableData.tableBody} editorEnabled={editorEnabled} saveTextChanges={ (newText) => { changeTableData("tableBody", newText) } }/>
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
                <Button variant="outlined" size="small" style={{minWidth: "auto", width:30, marginLeft:5}}>
                  <NavigateBeforeIcon style={{fontSize:20}} />
                </Button>
                <div style={{display:"inline", border:"1px solid #e5e5e5", borderRadius:5, height:30, verticalAlign:"center", width:"100% ", textAlign:"center", padding:2, fontSize:15}}>
                  <input style={{width:70, marginRight:5, textAlign:"right"}} type="number"/>
                  <div style={{display:"inline-block"}}> / 99999 </div>
                </div>
                <Button variant="outlined" size="small" style={{minWidth: "auto", width:30}}>
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
                <ListItem button>
                  <ListItemIcon><DownloadIcon/></ListItemIcon>
                  <ListItemText primary={"Download CSV Data"} />
                </ListItem>
                <ListItem button>
                  <ListItemIcon><DownloadIcon/></ListItemIcon>
                  <ListItemText primary={"Download CSV Data"} />
                </ListItem>
              </List>
            </Drawer>
        </div>


        <Card style={{position: "fixed", bottom: 60, left: 0, width: "100%"}}>

          <div style={{width:"100%", backgroundColor: "#a3a3a3", height:5, cursor: "row-resize" }}
            draggable="true"
            onDrag={e => {
              if ( bottomEnabled ){
                var dragX = e.pageX, dragY = e.pageY;
                if ( (startBottomSize + (dragStartY - dragY)) % 10 == 0 ){
                  setBottomSize(startBottomSize + (dragStartY - dragY));
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
                setBottomSize(nextSize > 1000 ? 1000 : nextSize);
                e.preventDefault()
              }
            }}
          > </div>

          <div style={{width:"100%", minWidth:800, height: bottomEnabled ? bottomSize : 65, backgroundColor:"#e5e5e5"}}>
            <Button variant="outlined" style={{float:"right", backgroundColor:"#ffffff", top:5, right:5}} onClick={ () => setBottomEnabled(!bottomEnabled) }> { bottomEnabled ? <ArrowDropDown style={{fontSize:35}} /> : <ArrowDropUp style={{fontSize:35}} /> }</Button>
            {
              !bottomEnabled ||
               <div style={{height:"100%", backgroundColor:"#ffffff",paddingRight:70}}>
                  <table style={{width:"100%", height:"100%"}}>
                    <tbody>
                      <tr>
                          <td style={{ textAlign: "center",padding:5, borderRight:"5px solid #e5e5e5", verticalAlign:"top"}}>
                            <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomAnnotations ? "lightgoldenrodyellow" : "" }} onClick={ () => showBottomAnnotations(!bottomAnnotations)}>
                                          1. Annotations { bottomAnnotations ? <VisibilityIcon style={{marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> }  </Button>
                            <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomResults ? "lightsteelblue" : ""  }} onClick={ () => showBottomResults(!bottomResults)}>
                                          2. Results { bottomResults ? <VisibilityIcon style={{ marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> } </Button>
                            <Button variant="outlined" className={classes.bottomButtons} style={{backgroundColor: bottomMetadata ? "lightpink" : ""  }} onClick={ () => showBottomMetadata(!bottomMetadata)}>
                                          3. Metadata { bottomMetadata ? <VisibilityIcon style={{ marginLeft:5}}/> : <VisibilityOffIcon style={{marginLeft:5}}/> } </Button>
                          </td>
                          <td style={{ padding:5, verticalAlign:"top"}}>
                            <div style={{overflowY:"scroll",height:"100%"}}>
                              <table style={{width:"100%", height:"100%"}}>
                                <tbody>
                                  { [bottomAnnotations, bottomResults, bottomMetadata].map( (elm, i) => elm ?
                                      <tr key={"tr_"+i} style={{width:"100%", verticalAlign:"top", borderBottom:"1px #acacac solid"}}>
                                        <td style={{padding:7, paddingBottom:20}}>
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
};

const mapStateToProps = createStructuredSelector({
  annotator: makeSelectAnnotator(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
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
