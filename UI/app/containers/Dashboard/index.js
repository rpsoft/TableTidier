/**
 *
 * Dashboard
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
import makeSelectDashboard from './selectors';
import { makeSelectLogin } from '../Login/selectors';

import reducer from './reducer';
import saga from './saga';
import messages from './messages';

// import {
//   Link,
// } from "react-router-dom";

import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button,
  Paper,
  Grid,
} from '@material-ui/core';

import {
  makeStyles,
  useTheme,
} from '@material-ui/core/styles';

import AddBoxIcon from '@material-ui/icons/AddBox';
import CollectionIcon from '@material-ui/icons/Storage';

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

import { useCookies } from 'react-cookie';


import {
  FixedSizeList,
  VariableSizeList,
} from 'react-window';
// import './pagination.css';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
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
  link: {
    color: 'inherit',
    textDecoration: 'none',
  },
  searchItem: {
    display: 'flex',
    alignItems: 'baseline',
    '& > div:nth-child(1)': {
      marginLeft:10,
      whiteSpace: 'nowrap',
      fontSize: 'small',
    },
    '& > div:nth-child(2)': {
      marginLeft: 5,
    },
    // link <a>
    '& > div > a' : {
      marginLeft: 5,
      marginRight: 5,
      textDecoration: 'none',
      // color: 'red'
    },
    '& > div > a:hover' : {
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
  }
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

  const [cookies, setCookie, removeCookie ] = useCookies();

  // const [searchContent, setSearchContent ] = useState(dashboard.searchContent);
  // const [searchType, setSearchType ] = useState(dashboard.searchType);

  // const [collections, setCollections ] = useState(doSearch("placebo", searchType));

  const [charCount, setCharCount ]  = useState(0);

  const classes = useStyles();

  const [ checkedTables, setCheckedTables ] = useState({});

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
  }, [loginState.username, cookies.hash]);

  // Search results
  const SearchResulRow = ({ index }) => {
    let {
      doc: table_key,
      selectedChunks,
      score,
     } = dashboard.search_results[index]

    const searchContent = dashboard.searchContent.split(' ')

    const findFirstNumber = /\d/g.exec(table_key)
    // If text before collection number
    if (findFirstNumber.index > 0) {
      // remove text from begging to findFirstNumber.index
      table_key = table_key.slice(findFirstNumber.index)
    }
    const elems = table_key.split('_')

    const [collId, docname] = elems[0].split('/')
    const page = elems[1]

    // var notes = collectionView.tables[index].notes ? collectionView.tables[index].notes : ""
    // var user = collectionView.tables[index].user ? collectionView.tables[index].user : ""

    const url = `/table?docid=${docname}&page=${page}&collId=${collId}`

    return (
      <div
        key={collId+docname+page}
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
          text={table_key}
          type={'table'}
          searchContent={searchContent}
          selectedChunks={selectedChunks.slice(0, 2)}
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
      dashboard.collections.map(
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
              //     doSearch(searchContent, searchType, cookies.hash, cookies.username)
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

      <div
        style={{
          paddingTop: '73px',
          width: '79%',
        }}
      >
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
              marginTop: 10,
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
