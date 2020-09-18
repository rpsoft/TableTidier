/**
 *
 * Dashboard
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
import makeSelectDashboard from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';

import { push } from 'connected-react-router'

import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button,
  Paper,
} from '@material-ui/core';

import { doSearchAction, requestCollectionsListAction } from './actions'
import { useDispatch, useSelector } from "react-redux";

import AddBoxIcon from '@material-ui/icons/AddBox';
import CollectionIcon from '@material-ui/icons/Storage';

import SearchBar from '../../components/SearchBar'

import SearchResult from '../../components/SearchResult'

import Collection from '../../components/Collection'
import Grid from "@material-ui/core/Grid";

import { useCookies } from 'react-cookie';

import { makeStyles } from '@material-ui/core/styles';

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

}));



export function Dashboard({
  doSearch,
  dashboard,
  goToUrl,
  listCollections
}) {
  useInjectReducer({ key: 'dashboard', reducer });
  useInjectSaga({ key: 'dashboard', saga });

  const [cookies, setCookie, removeCookie ] = useCookies();

  const [searchContent, setSearchContent ] = useState(dashboard.searchContent);
  const [searchType, setSearchType ] = useState(dashboard.searchType);
  //
  // const [collections, setCollections ] = useState(doSearch("placebo", searchType));

  const classes = useStyles();

  // useEffect(() => {
  //
  // }, []);
  //

  useEffect(() => {
    listCollections()
  }, [cookies.hash]);


  var table_search_results = <div>
    {
      dashboard.search_results.map( (result,i) => {
        var elems = result.doc.replace(".html","").split("_")
        var docname = elems[0]
        var page = elems[1]
        var url = "/table?docid="+docname+"&page="+page
        return <SearchResult key={i} text={docname+"_"+page} type={"table"} onClick={ ()=> { goToUrl(url) }}/>
      })
    }
  </div>

  var collection_results = <div> { dashboard.collections.map(
                                    (coll,i) => <Collection key={i}
                                                            title={coll.title}
                                                            description={coll.description}
                                                            owner_username={coll.owner_username}
                                                            table_n={coll.table_n}
                                                            goToUrl={() => {goToUrl("/collection?collId="+coll.collection_id)}} />
                                                          )
                                 }</div>

  return (
    <div style={{marginLeft:"2%", marginRight:"2%"}}>
      <Helmet>
        <title>Dashboard</title>
        <meta name="description" content="Description of Dashboard" />
      </Helmet>

      <Card style={{ marginTop:10, padding:10, backgroundColor: "#e4e2e2" }}>
        <div>
          <SearchBar
            searchCont = {searchContent}
            doSearch = {
              (searchContent, searchType) => {
                setSearchContent(searchContent)
                setSearchType(searchType)
                doSearch(searchContent, searchType, cookies.hash, cookies.username)
              }
          }/>
        </div>
      </Card>

      <div className={classes.root}>
        <Grid container spacing={1}>
          <Grid item xs={9}>
              { dashboard.search_results.length ?
                  <Card style={{marginTop:10,padding:10, fontWeight:"bold"}}>
                    <div> { dashboard.search_results.length == 100 ? "Showing the first 100" : + dashboard.search_results.length +" results" } </div>
                  </Card> : ""
              }
              <Card style={{marginTop:10, minHeight: 700, backgroundColor: dashboard.search_results.length > 0 ? "white" : "#e4e2e2"}}>
                 {dashboard.search_results.length > 0 ? table_search_results : collection_results}
              </Card>
          </Grid>
          <Grid item xs={3}>
            <Card style={{marginTop:10,padding:10, fontWeight:"bold"}}>
              <div>Actions Panel</div>
            </Card>
            <Card style={{marginTop:10,padding:5, backgroundColor:"#e4e2e2" }}>
              <Card style={{padding:5}}>
                <div>
                  <div className={classes.buttonHolder}><Button variant="contained" onClick={ () => {goToUrl("/collection?collId=new")} } > New Collection </Button> </div>
                  <div className={classes.buttonHolder}><Button variant="contained" > Option 2 </Button> </div>
                  <div className={classes.buttonHolder}><Button variant="contained" > Option 3 </Button> </div>
                </div>
              </Card>
            </Card>
          </Grid>
        </Grid>
      </div>


    </div>
  );
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  dashboard: makeSelectDashboard(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    doSearch : (searchContent, searchType, hash, username) => dispatch( doSearchAction(searchContent, searchType, hash, username) ),
    listCollections : () => dispatch( requestCollectionsListAction() ),
    goToUrl : (url) => dispatch(push(url))
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Dashboard);
