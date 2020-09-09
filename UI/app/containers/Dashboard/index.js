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
  Button as RaisedButton,
  MenuItem,
  Popover,
  Menu,
  Divider,
  Tabs, Tab,
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow
} from '@material-ui/core';

import { doSearchAction } from './actions'
import { useDispatch, useSelector } from "react-redux";

import AddBoxIcon from '@material-ui/icons/AddBox';
import CollectionIcon from '@material-ui/icons/Storage';

import SearchBar from '../../components/SearchBar'

import SearchResult from '../../components/SearchResult'

import { useCookies } from 'react-cookie';

export function Dashboard({
  doSearch,
  dashboard,
  goToUrl
}) {
  useInjectReducer({ key: 'dashboard', reducer });
  useInjectSaga({ key: 'dashboard', saga });

  const [cookies, setCookie, removeCookie ] = useCookies();

  const [searchContent, setSearchContent ] = useState(dashboard.searchContent);
  const [searchType, setSearchType ] = useState(dashboard.searchType);

  return (
    <div>
      <Helmet>
        <title>Dashboard</title>
        <meta name="description" content="Description of Dashboard" />
      </Helmet>

      <Card style={{marginTop:10, padding:10}}>
        <div>
          <SearchBar
            searchContent = {searchContent}
            doSearch={
                (searchContent, searchType) => {
                  // console.log(searchContent + " -- "+
                  //             searchType.searchCollections + " -- "+
                  //             searchType.searchTables);

                  setSearchContent(searchContent)
                  setSearchType(searchType)

                  doSearch(searchContent, searchType)
            }
          }/>
        </div>
      </Card>


      <Card style={{marginTop:10,padding:10}}>
        <div> { dashboard.search_results.length == 100 ? "Showing the first 100" : + dashboard.search_results.length +" results" } </div>
      </Card>

      <Card style={{marginTop:10, maxHeight:600, overflowY:"scroll"}}>
        <div>
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
      </Card>

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
    doSearch : (searchContent,searchType) => dispatch( doSearchAction(searchContent,searchType) ),
    goToUrl: (url) => dispatch(push(url))
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Dashboard);
