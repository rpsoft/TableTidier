/**
 *
 * Annotator
 *
 */

import './dragstyle.css';

import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line prettier/prettier
import {
  connect,
  useSelector,
  useDispatch,
} from 'react-redux';
import { Helmet } from 'react-helmet';
// import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';

// eslint-disable-next-line prettier/prettier
import {
  useNavigate,
  useLocation,
  useSearchParams
} from "react-router-dom";

import CsvDownloader from 'react-csv-downloader';
import { makeStyles, useTheme } from '@material-ui/core/styles';

// import messages from './messages';

// import {browserHistory} from 'react-router';

import {
  Link,
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
  OutlinedInput,
  InputAdornment,
  CircularProgress,
} from '@material-ui/core';

import {
  ArrowDropUp,
  ArrowDropDown,
  Edit as EditIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  GetApp as DownloadIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
}from '@material-ui/icons';

import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';

import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
// import Draggable from 'react-draggable';

// import { Resizable, ResizableBox } from 'react-resizable';
import NavigationBar from 'components/NavigationBar';

import AnnotatorMenuButtons from 'components/AnnotatorMenuButtons';

import TableAnnotator from '../../components/TableAnnotator'
import TableEditor from '../../components/TableEditor'
import TableResult from '../../components/TableResult'
import TableMetadata from '../../components/TableMetadata'
import TableNotes from '../../components/TableNotes'

import InfoPage from '../InfoPage'

import prepareMetadata from './metadataUtil';
import { makeSelectCredentials } from '../App/selectors';

import { makeSelectLogin } from '../Login/selectors';
import makeSelectAnnotator from './selectors';
import reducer from './reducer';
import saga from './saga';
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
} from './actions';
import appActions from '../App/actions';
import generateMetamappers from '../../utils/metadata-mapper.js';

const drawerWidth = 250;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  drawer: {
    flexShrink: 0,
    right: 10,
  },
  drawerPaper: {
    width: drawerWidth,
    height: `calc(100% - 50px)`,
    left: 'auto',
    right: 15,
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

  // Side Menu Styles
  // Header
  sideMenuHeader: {
    textAlign: 'center',
    margin: '10px auto',
    font: 'caption',
    backgroundColor: 'lavender',
    margin: 0,
    padding: 10,
  },
  sideMenuHeaderSecond: {
    textAlign: 'center',
    margin: '10px auto',
    font: 'caption',
  },
  // Info about table
  tableIdentifiers: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    maxWidth: '300px',
    margin: '1em',
    lineHeight: '1.45',
    fontSize: '14px',
    '& dt': {
      gridColumn: 1,
      fontWeight: 'normal',
      alignSelf: 'baseline',
    },
    '& dd': {
      gridColumn: 2,
      justifySelf: 'end',
      color: 'dimgray',
      marginLeft: 0,
      '& a': {
        color: 'cadetblue', // steelblue, cadetblue
        textDecoration: 'none',
      },
      '& a:hover': {
        textDecoration: 'underline',
      }
    },
  },

  // Menu PMID, DOI, url
  referenceInputsListItemEditing: {
    alignItems: 'center',
    marginTop: 3,
  },
  referenceInputsBase: {
    marginLeft: 10,
    marginBottom: 3,
    fontSize: '14px',
      // TextField style
    '& > .MuiInputBase-root': {
      padding: '8px 14px',
      color: 'dimgray',
      fontSize: '14px',
    }
  },
  referenceInputs: {
    padding: '8px 14px',
    color: 'dimgray',
  },
}));

const diffY = 0;

export function Annotator({
  annotator,
  credentials,
  loginState,

  loadTableContent,
  loadTableResults,
  loadTableMetadata,

  saveTextChanges,
  saveNoteChanges,
  saveAnnotationChanges,
  saveMetadataChanges,

  updateTableMetadata,

  autoLabel,
}) {
  useInjectReducer({ key: 'annotator', reducer });
  useInjectSaga({ key: 'annotator', saga });

  // Var used to name loading with a var
  const LOADING = 'loading'

  const dispatch = useDispatch()
  let navigate = useNavigate();
  let location = useLocation();
  let [searchParamsURL, setSearchParams] = useSearchParams();
  // transform URLSearchParams to object {}
  const searchParams = Object.fromEntries([...searchParamsURL])

  // Get api_url from redux store
  const apiUrl = useSelector(state => state.app.api_url)
  const userToken = loginState.token
  // Used to show if the page loaging or if trying to access Unauthorised content
  const tablePageStatus = useSelector(state => 'app' in state?
      state.app.status
      : null
  )
  // get CuisIndex from redux store
  const cuisIndex = useSelector(state => state.annotator && state.annotator.cuis_index || {})
  // get cuisIndexKeys from redux store
  const cuisIndexKeys = useSelector(
    state => state.annotator && state.annotator.cuisIndexKeys || [])

  const classes = useStyles();
  const theme = useTheme();

  const titleEditor = useRef();
  const bodyEditor = useRef();

  const [ bottomEnabled, setBottomEnabled ] = React.useState(false);
  const [ bottomLevel, setBottomLevel ] = React.useState(0);
  const [ bottomSize, setBottomSize ] = React.useState("50vh");

  const handleBottomChange = (increment) => {
    const resetBottomMenu = () => {
      setBottomLevel(0);
      setBottomEnabled(false);
      setBottomSize(65);
    }
    const growBottomMenu = () => {
      setBottomEnabled(true);
      setBottomLevel(bottomLevel+1)
      setBottomSize(((bottomLevel+1)*44)+"vh");
    }
    const shrinkBottomMenu = () => {
      setBottomEnabled(true);
      setBottomLevel(bottomLevel-1);
      setBottomSize(((bottomLevel-1)*44)+"vh");
    }

    switch (increment) {
      case -1:
        if ( bottomLevel == 1 ){
          return resetBottomMenu()
        }
        shrinkBottomMenu()
        break;
      case 1:
        if ( bottomLevel < 2 ){
          return growBottomMenu()
        }
        resetBottomMenu()
        break;
      default:
        resetBottomMenu()
        break;
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

  const [ allowEdit, setAllowEdit ] = React.useState(false);

  const [ results, setResults ] = React.useState(  annotator.results || [] );
  const [ metadata, setMetadata ] = React.useState( {} );
  const [ headerData, setHeaderData ] = React.useState( {} );

  // ! :-) cuisIndex moved to get from redux store
  // const [ cuisIndex, setCuisIndex ] = React.useState( {} );

  const [ tid, setTid ] = React.useState('')

  const [ notesData, setNotesData ] = React.useState({ tableType:"", tableStatus:"", textNotes: "" });

  const [ editorEnabled, setEditorEnabled ] = React.useState(false);

  const [ showEditCuis, setShowEditCuis ] = React.useState(false);

  const [ windowSize, setWindowSize ] = React.useState({
    width: undefined,
    height: undefined,
  });

  // table external references
  const {
    docid = '',
    page = '',
    collection_id: collId = '',
    pmid = '',
    doi = '',
    url = '',
  } = 'tableData' in annotator? annotator.tableData.annotationData: {}

  const pmidRef = useRef();
  const doiRef =  useRef();
  const urlRef =  useRef();

  //On component will mount
  React.useEffect(() => {
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

  const updateReferences = async () => {
    const url = apiUrl + 'table/updateReferences'
    let headers = {'Content-Type': 'application/json'}
    // JWT token
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`
    }
    let result = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        // tid get from state
        tid,
        pmid: pmidRef.current.value,
        doi: doiRef.current.value,
        url: urlRef.current.value,
      }),
    })

    if (result.status != 200) {
      return false
    }
  }

  const doUpdates = () => {
    if( annotator.tableData ){
      setAnnotations(annotator.annotations)
      let header_data = annotator.annotations.map( ann => {
        return {head: Object.keys(ann.content).reverse().join(';'), sub: ann.subAnnotation }
      })

      header_data = header_data.reduce( (acc, header, i) => {
        acc.count[header.head] = acc.count[header.head] ? acc.count[header.head]+1 : 1;
        acc.headers.push(header.head+'@'+acc.count[header.head]);
        acc.subs.push(header.sub);
        return acc;
      }, {count:{},headers:[],subs:[]} )

      setAnnotationHeaders([ 'docid_page', 'row', 'col', 'value', ...header_data.headers ])

      setTableData(annotator.tableData)

      setAllowEdit(annotator.tableData && annotator.tableData.permissions ? annotator.tableData.permissions.write : false)

      setN_tables(parseInt(annotator.tableData.collectionData.tables.length))
      setTablePosition(parseInt(annotator.tableData.tablePosition))

      setResults(annotator.results)

      setMetadata(annotator.metadata)

      // ! :-) cuisIndex moved to get from redux store
      // setCuisIndex(annotator.cuis_index)

      setHeaderData( prepareMetadata(header_data, annotator.results) );

      setTid(tableData.annotationData ? tableData.annotationData.tid : '')

      setNotesData({
        tableType: annotator.tableData.tableType || '',
        tableStatus: annotator.tableData.tableStatus || '' ,
        textNotes: annotator.tableData.textNotes || '',
      })
    }
  }
  
  React.useEffect(() => {
    // Table data already loaded?
    // compare table info with table url
    if (
      tid != searchParams.tid ||
      (
        docid == searchParams.docid &&
        page == searchParams.page &&
        collId == searchParams.collId
      ) == false
    ) {
      // If not status to loading...
      dispatch( appActions.statusSet.action(LOADING) )
    }

    // When unmount clear status
    return () => dispatch( appActions.statusClear.action() )
  }, [])

  React.useEffect(() => {
    doUpdates()
  }, [annotator])

  React.useEffect(() => {
    loadTableContent(false)
    loadTableResults(true)
    loadTableMetadata()

    // ! :-) Can we call load Cuis Index only one time?
    //  ex: once cuisIndex is loaded at redux store don't call again?
    // heavy process leave for last
    if ( cuisIndexKeys.length == 0 ) {
      dispatch(loadCuisIndexAction())
    }
  }, [location.search, loginState.username]);

  const openMargin = bottomEnabled ? bottomSize : 65;

  const table_notes = <TableNotes notesData={notesData} setNotesData={setNotesData} saveNoteChanges={saveNoteChanges} allowEdit={allowEdit}/>

  const table_annotator =  annotations ? <TableAnnotator annotations={annotations}
                                                         setAnnotations={ (anns) => {setAnnotations(anns)}}
                                                         tid={tid}
                                                         saveAnnotationChanges={saveAnnotationChanges}
                                                         loadTableResults={ (autoAnnotate) => { loadTableContent(autoAnnotate); loadTableResults(false);   }}
                                                         allowEdit={allowEdit}
                                                         /> : ''

  var cols = []  //columns.map( (v,i) => { var col = {Header: v, accessor : v}; if( v == "col" || v == "row"){ col.width = 70 }; if( v == "value" ){ col.width = 200 }; return col } )

  const table_results = <TableResult loadTableResults={ () => { loadTableContent(false); loadTableResults(false);  }}
                                    tableResult={results}
                                    sortedHeaders={annotationHeaders}
                                    allowEdit={allowEdit}
                                    />

  const table_metadata = <TableMetadata tid={tid}
                                        tableResults={results}
                                        headerData={headerData}
                                        metadata={metadata}
                                        cuisIndex={cuisIndex}
                                        updateTableMetadata={updateTableMetadata}
                                        saveMetadataChanges={saveMetadataChanges}
                                        autoLabel={ () => { autoLabel(headerData, tid ) } }
                                        allowEdit={allowEdit}
                                        />

  const bottom_elements = [table_notes, table_annotator, table_results, table_metadata]

  // Preparing navigation variables here.
  const prepare_nav_link  = (tables, ind) => {
    if ( !tables || tables.length == 0 ) {
      return () => {}
    }

    let index = ind - 1

    if ( index < 0) {
      index = 0
    }

    if ( index > (tables.length-1) ){
      index = (tables.length-1)
    }

    const {
      docid,
      page,
      collection_id,
      tid,
    } = tables[index]

    // const address = `/table?docid=${docid}&page=${page}&collId=${collection_id}`
    const address = `/table?tid=${tid}`

    return () => navigate(address)
  }

  const prevNumber = (tablePosition-1) >= 0 ? (tablePosition-1) : 0
  const nextNumber = (tablePosition+1) > N_tables ? N_tables : tablePosition+1

  // annotator.tableData.collectionData.tables
  const goPrev = annotator.tableData ? prepare_nav_link(annotator.tableData.collectionData.tables, prevNumber) : () => {}
  const goNext = annotator.tableData ? prepare_nav_link(annotator.tableData.collectionData.tables, nextNumber) : () => {}

  const goToTable = (number) => { return annotator.tableData ? prepare_nav_link(annotator.tableData.collectionData.tables, number) : () => {} }

  const fileNameRoot = () => [docid,page,collId].join('_')

  const downloadFile = async (data, filename = "mydata") => {
    const fileName = filename;
    const json = JSON.stringify(data);
    const blob = new Blob([json], {type: 'application/json'});
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // is private == Unauthorised?
  if (tablePageStatus == 'Unauthorised') {
    return <InfoPage
      title='Annotator'
      titleDescription='Description of Annotations'
      headerIcon={
        <ErrorOutlineIcon
          style={{
            color: 'red',
          }}
          fontSize="large"
        />
      }
      headerText='Unauthorised'
      text={
        <p
          style={{
            fontFamily: 'arial',
          }}
        >
          You are trying to access a private content
        </p>
      }
    />
  }

  // is not found?
  if (tablePageStatus == 'not found' || tablePageStatus == 'collection not found') {
    return <InfoPage
      title='Annotator'
      titleDescription='Description of Annotations'
      headerIcon={
        <InfoOutlinedIcon
          style={{
            color: 'red',
          }}
          fontSize="large"
        />
      }
      headerText='Not Found'
      text={
        <p
          style={{
            fontFamily: 'arial',
          }}
        >
          {tablePageStatus == 'not found'? 'Table not found': 'Collection not found'}
        </p>
      }
    />
  }

  return (
    <>
    <Helmet>
      <title>TableTidier - Annotator</title>
      <meta name="description" content="Description of Annotations" />
    </Helmet>
      
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gridTemplateRows: 'auto',
      }}
    >
      <Card 
        style={{
          // marginTop: 5,
          // marginBottom: openMargin,
          minHeight: '85vh',
          height: '86.3vh',
          marginRight: 5,
          overflow: 'scroll',
        }}
      >
        <div className={classes.root}>
          <div className={classes.content}>

            <div style={{width:"100%",textAlign:"right"}}>
              {
                tablePageStatus == LOADING &&
                <CircularProgress />
              }

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

              { allowEdit && <div>
                {editorEnabled && (
                  <Button
                    variant="outlined"
                    style={{
                      backgroundColor:"#ffdbdb",
                      marginRight: 15,
                    }}
                    onClick={ () => {
                      const title = titleEditor.current.getData()
                      const body = bodyEditor.current.getData()
                      // if references changed then update
                      if (
                        pmid != pmidRef.current.value ||
                        doi != doiRef.current.value ||
                        url != urlRef.current.value
                      ) {
                        // save references pmid, doi, url...
                        updateReferences()
                      }

                      setEditorEnabled(false);

                      saveTextChanges(title, body);

                      // Called from saga after saveTextChanges:
                      // loadTableContent(false);
                      // loadTableResults(false);
                    } }
                  >
                      Save Edit Changes <EditIcon style={{marginLeft:5}}/>
                  </Button> )
                }
                {editorEnabled ? "Disable" : "Enable"} Editing
                <Switch
                  checked={editorEnabled}
                  onChange={() => { setEditorEnabled(!editorEnabled);}}
                  name="checkedA"
                  inputProps={{ 'aria-label': 'secondary checkbox' }}
                />
              </div>}
            </div>

            <hr />

            {
            <TableEditor
              editorID={"table_title_editor"}
              textContent={tableData ? tableData.tableTitle : ''}
              editorEnabled={editorEnabled}
              editorRef={(editor) => titleEditor.current = editor}
              height={200}
              metadata={metadata}
              cuisIndex={cuisIndex}
              showEditCuis={showEditCuis}
            />
            }
            <hr />
            
            <TableEditor
              editorID={"table_content_editor"}
              textContent={tableData ? tableData.tableBody : ''}
              editorEnabled={editorEnabled}
              editorRef={(editor) => bodyEditor.current = editor}
              height={800}
              metadata={metadata}
              cuisIndex={cuisIndex}
              showEditCuis={showEditCuis}
            />
          </div>

        </div>
      </Card>

          {/* side menu */}
      <Card
        id="sideMenu"
        className={classes.drawer}
        // variant="permanent"
        classes={{
          // paper: classes.drawerPaper,
          root: classes.drawerPaper,
        }}
        // style={{zIndex: 0}}
      >
        <NavigationBar
          stylesCustom={{
            root: {
              margin: 0,
            }
          }} 
        />
        {/* Table number in collection */}
        <List>
          <ListItem style={{marginLeft:0}}>
            Table Number in Collection:
          </ListItem>
          <ListItem>
            <Button
              variant="outlined"
              size="small"
              style={{minWidth: "auto", width:30, height:40, marginLeft:5}}
              onClick={ goPrev }
            >
              <NavigateBeforeIcon style={{fontSize:20}} />
            </Button>
            <div
              style={{
                display:"inline",
                border:"1px solid #e5e5e5",
                borderRadius:5,
                height:40,
                verticalAlign:"center",
                width:"100% ",
                textAlign:"center",
                padding:2,
                fontSize:15
              }}
            >
              <input
                style={{width:70, marginRight:5, textAlign:"right",height:35 }}
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
            <Button
              variant="outlined"
              size="small"
              style={{minWidth: "auto", width:30, height:40}}
              onClick={ goNext }
            >
              <NavigateNextIcon style={{fontSize:20}} />
            </Button>
          </ListItem>
        </List>

        <Divider />


        {/* Table ID */}
        <h3 className={classes.sideMenuHeader} >
          Table Info
        </h3>
        <dl className={classes.tableIdentifiers}>
          <dt> Doc Id </dt>
          <dd> {docid} </dd>
          <dt> Page </dt>
          <dd> {page} </dd>
          <dt> Collection Id </dt>
          <dd> {collId} </dd>
          <dt> Table Id </dt>
          <dd> {tid} </dd>
        </dl>
        <Divider />

        {/* References pmid, doi, url, etc */}
        <h3 className={classes.sideMenuHeaderSecond} >
          References
        </h3>
        <Divider />

        <dl className={classes.tableIdentifiers} >
        {
        editorEnabled == false ? <>
          <dt>
            {!pmid ? 'PMID'
              : (
                <Link
                  href={'https://pubmed.ncbi.nlm.nih.gov/'+pmid}
                  underline="hover"
                  target="_blank"
                >PMID</Link>
              )}
          </dt>
          <dd> {pmid} </dd>
          <dt>
            {!doi ? 'DOI'
              : (
                <Link
                  href={'https://doi.org/'+doi}
                  underline="hover"
                  target="_blank"
                >DOI</Link>
              )}
          </dt>
          <dd> {doi} </dd>
          <dt> Url </dt>
          <dd> <a href={url} target="_blank">{url}</a> </dd>
        </>
        : <>
          <dt
            // className={classes.referenceInputsListItemEditing}
          >
            PMID
          </dt>
          <dd>
            <OutlinedInput
              id="table-pmid"
              defaultValue={pmid}
              inputRef={pmidRef}
              placeholder={'PMID Code'}
              // onChange={handleChange('weight')}
              classes={{
                root: classes.referenceInputsBase,
                input: classes.referenceInputs,
              }}
              aria-describedby="outlined-weight-helper-text"
              inputProps={{
                'aria-label': 'weight',
              }}
              labelWidth={0}
            />
          </dd>
          <dt
            className={classes.referenceInputsListItemEditing}
          >
            DOI
          </dt>
          <dd>
            <TextField
              id="table-doi"
              defaultValue={doi}
              inputRef={doiRef}
              // onChange={handleChange('weight')}
              classes={{
                root: classes.referenceInputsBase,
              }}
              aria-describedby="outlined-weight-helper-text"
              inputProps={{
                'aria-label': 'weight',
              }}
              multiline
              minRows={3}
              variant="outlined"
            />
          </dd>
          <dt
            className={classes.referenceInputsListItemEditing}
          >
            Url
          </dt>
          <dd>
            <TextField
              id="table-url"
              defaultValue={url}
              inputRef={urlRef}
              // onChange={handleChange('weight')}
              classes={{
                root: classes.referenceInputsBase,
              }}
              aria-describedby="outlined-weight-helper-text"
              inputProps={{
                'aria-label': 'weight',
              }}
              multiline
              minRows={4}
              variant="outlined"
              // labelWidth={0}
            />
          </dd>
        </>
        }
        </dl>
        
        {/* Downloads */}
        <Divider />
        <h3 className={classes.sideMenuHeaderSecond} >
          Downloads
        </h3>
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
            <ListItemIcon style={{display:"inline"}}><DownloadIcon style={{fontSize:25}} /></ListItemIcon>

            <ListItemText style={{display:"inline", marginLeft:5 }} primary={
              <CsvDownloader
                filename={fileNameRoot()+"_table_data.csv"}
                separator=";"
                wrapColumnChar="'"
                columns={['tid', ...annotationHeaders].map( item => { return {id: item, displayName: item} } )}
                datas={results.map(line => ({tid, ...line}) )}
              >
                Table Data (.csv)
              </CsvDownloader>
              }
            />
          </ListItem>

          <ListItem button>
            <ListItemIcon style={{display:"inline"}}><DownloadIcon style={{fontSize:25}}/></ListItemIcon>
            <ListItemText
              style={{display:"inline", marginLeft:5}}
              primary={
                <CsvDownloader
                  filename={fileNameRoot()+'_table_metadata.csv'}
                  separator=";"
                  wrapColumnChar="'"
                  columns={
                    Object.values(metadata)[0] ?
                      Object.keys(
                        Object.values(metadata)[0]
                      ).map( item => { return {id: item, displayName: item} } )
                      : []
                  }
                  datas={Object.values(metadata)}
                > Table Metadata (.csv) </CsvDownloader>
              }
            />
          </ListItem>

          <ListItem
            button
            onClick={ ()=> {
              const {
                tid,
                docid,
                page,
                collection_id,
                pmid,
                doi,
                url,
              } = annotator.tableData.annotationData
              // remove 'docid_page' redundant field from data
              const data = annotator.results.map(item => {
                const itemCopy = {...item};
                delete itemCopy.docid_page;
                return itemCopy
              })
              // remove 'tid' redundant field from metadata
              const metadataKeys = Object.keys(annotator.metadata)
              const metadata = metadataKeys.map((metaKey, index) => {
                const metadataItemCopy = {...annotator.metadata[metaKey]};
                delete metadataItemCopy.tid;
                return metadataItemCopy;
              })

              const { concMapper, posiMapper } = generateMetamappers({
                tableResults: data,
                metadata,
              })

              const {
                tableType='',
                notes='',
                completion=''
              } = annotator.tableData.annotationData

              downloadFile(
                {
                  // General info
                  tid,
                  docid,
                  page,
                  collection_id,
                  pmid,
                  doi,
                  url,
                  annotations: {
                    notes: notes ?? '',
                    tableType: tableType ?? '',
                    completion: completion ?? '',
                  },
                  // Data & Metadata
                  tableResults: data,
                  metadata: metadata,
                  concMapper,
                  posiMapper,

                },
                fileNameRoot()+'_all_data'
              )
            }}
          >
            <ListItemIcon style={{display:"inline"}}>
              <DownloadIcon style={{fontSize:25}}/>
            </ListItemIcon>
            <ListItemText
              style={{display:"inline", marginLeft:5}}
              primary='Results & Metadata (.json)'
            />
          </ListItem>

          <ListItem
            button
            onClick={ ()=> {
              const {
                tid,
                docid,
                page,
                collection_id,
                pmid,
                doi,
                url,
              } = annotator.tableData.annotationData
              downloadFile(
                {
                  // General info
                  tid,
                  docid,
                  page,
                  collection_id,
                  pmid,
                  doi,
                  url,
                  // Data
                  annotation: annotator.annotations,
                },
                fileNameRoot()+'_annotation'
              )
            }}
          >
            <ListItemIcon style={{display:"inline"}}>
              <DownloadIcon style={{fontSize:25}}/>
            </ListItemIcon>
            <ListItemText
              style={{display:"inline", marginLeft:5}}
              primary="Annotation (.json)"
            />
          </ListItem>

        </List>
      </Card>
    </div>

    {/* Edition menu */}
    <Card
      style={
        bottomEnabled?
        {
          position: 'fixed',
          left: 0,
          bottom: 60,
          width: '100%',
          height: bottomEnabled ? bottomSize : 62
        }
        :
        {
          position: 'fixed',
          // left: 0,
          right: 5,
          bottom: 60,
          width: 250,
          height: bottomEnabled ? bottomSize : 62
        }
      }
    >
      <div style={{width:"100%", backgroundColor: "#a3a3a3", height:5}}></div>
      <div
        style={{
          width:"100%",
          // minWidth:800,
          height: bottomEnabled ? "100%" : 65, backgroundColor:"#e5e5e5"
        }}
      >
        {!bottomEnabled && ( <span
          style={{
            position: 'relative',
            top: 20,
            left: 35,
          }}
        >
          Table Analysis
        </span>)}

        {
        // If menu to extend bottom menu
        !bottomEnabled && (
        <Button
          variant="outlined"
          style={{float: "right", backgroundColor: "#ffffff", top: 5, right: 9}}
          onClick={ () => handleBottomChange(1) }
        >
          { bottomEnabled ? <ArrowDropDown style={{fontSize:35}} /> : <ArrowDropUp style={{fontSize:35}} /> }
        </Button> )
        }
        {
        !bottomEnabled ||
        <div
          style={{
            height:"100%",
            backgroundColor:"#ffffff",
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gridTemplateRows: '1fr',
            gridTemplateAreas: `
              'menu'
              'main'
              'show'`,
          }}
        >
          <menu
            style={{
              // width:"100%"
              display: 'flex',
              flexDirection: 'column',
              paddingLeft: '10px',
              paddingRight: '10px',
            }}
          >
            <Button
              variant="outlined"
              className={classes.bottomButtons}
              style={bottomNotes ? {backgroundColor: '#dde6ff'} : {} }
              onClick={ () => showBottomNotes(!bottomNotes)}
            >
              1. Notes {
                bottomNotes ?
                  <VisibilityIcon style={{marginLeft:5}}/>
                  : <VisibilityOffIcon style={{marginLeft:5}}/>
              }
            </Button>
            <Button
              variant="outlined"
              className={classes.bottomButtons}
              style={bottomAnnotations ? {backgroundColor: "lightgoldenrodyellow"} : {} }
              onClick={ () => showBottomAnnotations(!bottomAnnotations)}
            >
              2. Table Structure {
                bottomAnnotations ?
                  <VisibilityIcon style={{marginLeft:5}}/>
                  : <VisibilityOffIcon style={{marginLeft:5}}/>
              }
            </Button>
            <Button
              variant="outlined"
              className={classes.bottomButtons}
              style={bottomResults ? {backgroundColor: "lightsteelblue"} : {} }
              onClick={ () => showBottomResults(!bottomResults)}
            >
              3. Results {
                bottomResults ?
                  <VisibilityIcon style={{marginLeft:5}}/>
                  : <VisibilityOffIcon style={{marginLeft:5}}/>
              }
            </Button>
            <Button
              variant="outlined"
              className={classes.bottomButtons}
              style={bottomMetadata ? {backgroundColor: "lightpink"} : {} }
              onClick={ () => showBottomMetadata(!bottomMetadata)}
            >
              4. Terminology {
                bottomMetadata ?
                  <VisibilityIcon style={{marginLeft:5}}/>
                  : <VisibilityOffIcon style={{marginLeft:5}}/>
              }
            </Button>
          </menu>
          <main
            style={{
              // overflow: 'auto',
              overflowY: 'scroll',
            }}
          >
            {
            [
              bottomNotes,
              bottomAnnotations,
              bottomResults,
              bottomMetadata
            ].map( (elm, i) => elm ?
                <div key={"tr_"+i} style={{width:"100%", verticalAlign:"top", borderBottom:"1px #acacac solid"}}>
                  <span style={{paddingBottom:20}}>

                    { bottom_elements[i] }

                  </span>
                </div> 
              : undefined
            )
            }
          </main>
          <nav
            style={{
              paddingLeft: '10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingBottom: '15px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginRight: 4,
              }}
            >
              <AnnotatorMenuButtons handler={handleBottomChange} bottomLevel={bottomLevel} />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginRight: 4,
              }}
            >
              <AnnotatorMenuButtons handler={handleBottomChange} bottomLevel={bottomLevel} invertButtons={true} />
            </div>
          </nav>
        </div>
      }
      </div>
    </Card>
  </>
  );
}

Annotator.propTypes = {
  dispatch: PropTypes.func.isRequired,
  annotator: PropTypes.object,
  credentials: PropTypes.object,
  loginState: PropTypes.object,
};

const mapStateToProps = createStructuredSelector({
  annotator: makeSelectAnnotator(),
  credentials: makeSelectCredentials(),
  loginState: makeSelectLogin(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    loadTableContent : (enablePrediction) => dispatch( loadTableContentAction(enablePrediction) ),
    loadTableResults : (cachedOnly) => dispatch ( loadTableResultsAction(cachedOnly) ),
    loadTableMetadata : (tid) => dispatch ( loadTableMetadataAction(tid) ),
    saveTextChanges : (tableTitle, tableBody) => dispatch( saveTableTextAction(tableTitle, tableBody) ),
    saveNoteChanges : (notes) => dispatch( saveTableNoteAction(notes)  ),
    saveAnnotationChanges : (tid, annotations) => dispatch( saveTableAnnotationAction(tid, annotations)  ),
    saveMetadataChanges : (metadata) => dispatch( saveTableMetadataAction(metadata) ),
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
