/**
 *
 * Dashboard
 *
 */

 import './Dashboard.css';

import React, { useEffect, memo, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';
import makeSelectDashboard from './selectors';
import { makeSelectLogin } from '../Login/selectors';

import reducer from './reducer';
import saga from './saga';
import messages from './messages';

import {
  sortMin,
  sortMax,
  sortTextMin,
  sortTextMax,
  sortTextAsNumberMin,
  sortTextAsNumberMax,
} from '../../utils/sort';

import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button,
  Tab,
  Tabs,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
} from '@material-ui/core';

import {
  makeStyles,
  useTheme,
} from '@material-ui/core/styles';

import AddBoxIcon from '@material-ui/icons/AddBox';
import CollectionIcon from '@material-ui/icons/Storage';

import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import {
  doSearchAction,
  requestCollectionsListAction,
  createCollectionAction
} from './actions'
import { useDispatch, useSelector } from "react-redux";

import SearchBar from '../../components/SearchBar'

import SearchResult from '../../components/SearchResult'
import SearchTableItem from '../../components/SearchTableItem'

import Collection from '../../components/Collection'
import NavigationBar from 'components/NavigationBar'

import {
  FixedSizeList,
  VariableSizeList,
} from 'react-window';
// import './pagination.css';

const tabHeight = 40

const useStyles = makeStyles(theme => ({
  tabsRoot: {
    display: 'inline-flex',
    minHeight: tabHeight,
    height: tabHeight,
  },
  tabRoot: {
    minHeight: tabHeight,
    height: tabHeight,
    '&.Mui-selected': {
      backgroundColor: 'aliceblue',
    },
  },
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
  },
  buttonHolder: {
    marginBottom: 5,
  },
  buttonColor: {
    backgroundColor: 'blue',
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
  link: {
    color: 'inherit',
    textDecoration: 'none',
  },
  searchItem: {
    display: 'flex',
    alignItems: 'baseline',
    '& > div:nth-child(1)': {
      marginLeft: 10,
      whiteSpace: 'nowrap',
      fontSize: 'small',
    },
    '& > div:nth-child(2)': {
      marginLeft: 5,
    },
    // link <a>
    '& > div > a': {
      marginLeft: 5,
      marginRight: 5,
      textDecoration: 'none',
      // color: 'red'
    },
    '& > div > a:hover': {
      textDecoration: 'underline',
      // color: 'red'
    },
    '& .search_info': {
      width: '100%',
      marginBottom: 5,
    },
    '& .search_summary': {
      color: 'rgb(77, 81, 86)',
      display: 'block',
      fontFamily: 'arial, sans-serif',
      fontSize: '14px',
      fontWeight: 400,
      height: '44.2188px',
      lineHeight: '22.12px',
      marginBottom: 0,
      paddingTop: 0,
      textAlign: 'left',
    },
    '& .search_summary > p': {
      lineHeight: '0.5em',
    },
  },
}));


export function Dashboard({
  doSearch,
  createCollection,
  listCollections,

  dashboard,
  loginState,
}) {
  useInjectReducer({ key: 'dashboard', reducer });
  useInjectSaga({ key: 'dashboard', saga });

  const theme = useTheme();

  // const [searchContent, setSearchContent ] = useState(dashboard.searchContent);
  // const [searchType, setSearchType ] = useState(dashboard.searchType);

  // const [collections, setCollections ] = useState(doSearch("placebo", searchType));

  const [charCount, setCharCount ]  = useState(0);

  const classes = useStyles();

   const [ dashboardListSortBy, setDashboardListSortBy ] = useState('coll-min');

  const [ checkedTables, setCheckedTables ] = useState({});

  // Tabs logic
  const [tabSelected, setTabSelected] = useState('All');

  const handleTabChange = (event, newValue) => {
    setTabSelected(newValue);
  };

  const searchAreaRef = useRef(null)

  const toggleCheckBox = (docid) => {
    var checkedTables_temp = checkedTables
    checkedTables_temp[docid] = checkedTables_temp[docid] ? false : true
    if ( checkedTables_temp[docid] == false ){
      delete checkedTables_temp[docid]
    }
    setCheckedTables(checkedTables_temp)
    // setNoTables(Object.keys(checkedTables).length)
  }

  useEffect(() => {
    listCollections()
    if (loginState.username == '' && tabSelected ==  'Personal') {
      setTabSelected('All')
    }
  }, [loginState.username]);
  
  const dashboardList = useMemo(() => {
    // filtrar por tab
    const collectionsFilterByTabs = tabSelected == 'All'?
      dashboard.collections
      : dashboard.collections.filter(collection => collection.owner_username == loginState.username)

    let collectionsSorted
    // sort por sortby
    switch(dashboardListSortBy) {
      case 'alpha':
        collectionsSorted = collectionsFilterByTabs.sort(sortTextMin('title'))
        break
      case 'omega':
        collectionsSorted = collectionsFilterByTabs.sort(sortTextMax('title'))
        break
      case 'coll-min':
        collectionsSorted = collectionsFilterByTabs.sort(sortMin('collection_id'))
        break
      case 'coll-max':
        collectionsSorted = collectionsFilterByTabs.sort(sortMax('collection_id'))
        break
      case 'user-min':
        collectionsSorted = collectionsFilterByTabs.sort(sortTextMin('owner_username'))
        break
      case 'user-max':
        collectionsSorted = collectionsFilterByTabs.sort(sortTextMax('owner_username'))
        break
      case 'tablesNum-min':
        collectionsSorted = collectionsFilterByTabs.sort(sortTextAsNumberMin('table_n'))
        break
      case 'tablesNum-max':
        collectionsSorted = collectionsFilterByTabs.sort(sortTextAsNumberMax('table_n'))
        break
    }

    // set filtrado
    // setDashboardList(collectionsSorted)
    return collectionsSorted

  }, [dashboard.collections, tabSelected, dashboardListSortBy]);

  // Search results
  const SearchResulRow = ({ index }) => {
    let {
      selectedChunks,
      score,
      info,
    } = dashboard.search_results[index]

    const {
      tid,
      collection_id: collId,
      docid,
      page,
    } = info

    const searchContent = dashboard.searchContent.split(' ')

    const tableHeader = `table id: ${tid} collection ${collId} / ${docid} page ${page} `

    // var notes = collectionView.tables[index].notes ? collectionView.tables[index].notes : ""
    // var user = collectionView.tables[index].user ? collectionView.tables[index].user : ""

    // debugger
    // if (tid == '2967') debugger

    // const url = `/table?docid=${docname}&page=${page}&collId=${collId}`
    const url = `/table?tid=${tid}`

    return (
      <div
        key={tid}
        className={classes.searchItem}
      >
        {
        // <Checkbox checked={checkedTables[table_key]}
        //     onChange={() => {toggleCheckBox(table_key)}}
        //     inputProps={{ 'aria-label': 'primary checkbox' }}
        //     />
        //     <span> -- </span>
        }
        {/* search index */}
        <div>
           {`${index+1} - `}
        </div>

        <SearchTableItem
          text={tableHeader}
          type={'table'}
          searchContent={searchContent}
          selectedChunks={selectedChunks.slice(0, 2)}
          info={info}
          score={score}
          linkUrl={url}
        />
      </div>
    )
  }

  // React.memo(
  console.time('table_search_results')
  const table_search_results = (
    // // 
    // <FixedSizeList
    //   height={searchAreaRef.current? searchAreaRef.current.offsetHeight : 1}
    //   width={"100%"}
    //   itemSize={60}
    //   itemCount={
    //     dashboard.search_results ?
    //       dashboard.search_results.length
    //       : 0
    //   }
    // >
    //   {searchResulRow}
    // </FixedSizeList>

  // // 
  // <VariableSizeList
  // height={searchAreaRef.current? searchAreaRef.current.offsetHeight : 1}
  // // width={"100%"}
  // itemSize={60}
  // itemCount={
  //   dashboard.search_results ?
  //     dashboard.search_results.length
  //     : 0
  // }
  // >
  // {searchResulRow}
  // </VariableSizeList>

  //
    <div
      // className={}
      style={{
        padding: '10px',
        paddingTop: 20,
      }}
    >
      {
      dashboard.search_results.length &&
      dashboard.search_results
        // .slice(0, 120)
        .map((data, index) => <SearchResulRow key={data.doc} index={index}/>)
      }
    </div>
  )
  console.timeEnd('table_search_results')

  const collection_results = (
    <div> {
      dashboardList.map(
        (coll,i) => <Collection 
                      key={i}
                      col_id={coll.collection_id}
                      title={coll.title}
                      description={coll.description}
                      owner_username={coll.owner_username}
                      table_n={coll.table_n}
                      collectionUrl={'/collection?collId='+coll.collection_id}
                    />
      )}
    </div>
  )

  return (
    <div
      style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        minWidth: theme.sizes.minWidth,
        maxWidth: theme.sizes.maxWidth,

        minHeight: '84vh',
      }}
    >
      <Helmet>
        <title>TableTidier - Dashboard</title>
        <meta name="description" content="Description of Dashboard" />
      </Helmet>

      <div
        style={{
          zIndex: 10,
          width: '98%',
          marginLeft: 'auto',
          minWidth: theme.sizes.minWidth,
          maxWidth: theme.sizes.maxWidth,
          position: 'absolute',
        }}
      >
        <Card
          style={{
            marginTop: 5,
            padding: 10,
            backgroundColor: "#e4e2e2",
          }}
        >
          <div>
            <SearchBar
              searchCont = {dashboard.searchContent}
              doSearch = {doSearch}
              // {
              //   (searchContent, searchType) => {
              //     setSearchContent(searchContent)
              //     setSearchType(searchType)
              //   }
              // }
              // setCharCount={ setCharCount }
            />
          </div>
        </Card>

        {/* side panels */}
        <div
          style={{
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: 0,
              // width: '25%',
            }}
          >
            <NavigationBar
              stylesCustom={{
                root: {
                  margin: 0,
                  marginTop: 6,
                  marginBottom: 5,
                  width: 'auto',
                }
              }} 
            />

            <Card style={{marginTop:10,padding:10, fontWeight:"bold", textAlign:"center"}}>
              <div>Actions Panel</div>
            </Card>
            <Card style={{marginTop:10,padding:5, backgroundColor:"#e4e2e2" }}>
              <Card style={{padding:5}}>
                <div>
                  <div className={classes.buttonHolder}>
                    <Button
                      style={{backgroundColor:"#98f398"}}
                      variant="contained"
                      onClick={ () => {
                        createCollection();
                        // goToUrl("/collection?collId=new")
                      }}
                    > New Collection </Button>
                  </div>
                  <div className={classes.buttonHolder}>
                    <Button disabled={true} variant="contained" > Results to New Collection </Button>
                  </div>
                  {
                  // <div className={classes.buttonHolder}><Button variant="contained" > Option 2 </Button> </div>
                  // <div className={classes.buttonHolder}><Button variant="contained" > Option 3 </Button> </div>
                  }
                </div>
              </Card>
            </Card>
          </div>
        </div>
      </div>

      {/* Collectios list */}
      <div
        style={{
          paddingTop: '73px',
          width: 'calc(100% - 300px)',
        }}
      >
        {/* Tabs */}
        <Card
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 11,
            padding: '3px auto',
          }}
        >
          {/* select/unselect all tables in a collection */}
          <Tabs
            value={tabSelected}
            indicatorColor="primary"
            textColor="primary"
            onChange={handleTabChange}
            aria-label="disabled tabs example"
            classes={{root: classes.tabsRoot}}
          >
            <Tab value="All" label="All Collections" classes={{root: classes.tabRoot}}/>
            <Tab
              value="Personal"
              label="Personal"
              classes={{root: classes.tabRoot}}
              disabled={loginState.username == ''}
            />
          </Tabs>

          {/* sort list headers */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span className="dashboardCollectionListHeaderTitleSelect">Sort By</span>
            <FormControl className="dashboardCollectionListHeaderSortByForm">
              {/* <InputLabel id="sort-by-select-outlined-label">Sort By</InputLabel> */}
              <Select
                id="sort-by-select"
                value={dashboardListSortBy}
                onChange={(event)=>{
                  const sortBy = event.target.value
                  setDashboardListSortBy(sortBy)
                }}
                inputProps={{ 'aria-label': 'Without label' }}
                variant="outlined"
              >
                <MenuItem value={'alpha'}>title <ExpandLessIcon/></MenuItem>
                <MenuItem value={'omega'}>title <ExpandMoreIcon/></MenuItem>
                <MenuItem value={'coll-min'}>creation <ExpandLessIcon/></MenuItem>
                <MenuItem value={'coll-max'}>creation <ExpandMoreIcon/></MenuItem>
                <MenuItem value={'user-min'}>user <ExpandLessIcon/></MenuItem>
                <MenuItem value={'user-max'}>user <ExpandMoreIcon/></MenuItem>
                <MenuItem value={'tablesNum-min'}>tables number <ExpandLessIcon/></MenuItem>
                <MenuItem value={'tablesNum-max'}>tables number <ExpandMoreIcon/></MenuItem>
              </Select>
            </FormControl>
          </span>
        </Card>

        {/* main list */}
        <div className={classes.root}>

          { dashboard.search_results.length ?
              <Card style={{marginTop:10,padding:10, fontWeight:"bold"}}>
                <div> {
                  dashboard.search_results.length == 100 ?
                    'Showing the first 100'
                    : + dashboard.search_results.length + ' results' }
                </div>
              </Card> : ''
          }

          {/* Collection or Search List */}
          <Card
            ref={searchAreaRef}
            style={{
              overflow: 'auto',
              marginTop: 5,
              backgroundColor: dashboard.search_results.length > 0 ? "white" : "#e4e2e2"
            }}
          >
            {
            dashboard.search_results.length > 0 ?
              table_search_results
              : collection_results
            }
          </Card>

        </div>
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  dashboard: makeSelectDashboard(),
  loginState: makeSelectLogin(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    doSearch : (searchContent, searchType) => dispatch( doSearchAction(searchContent, searchType) ),
    listCollections : () => dispatch( requestCollectionsListAction() ),
    createCollection : () => dispatch( createCollectionAction() ),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(memo(Dashboard));
