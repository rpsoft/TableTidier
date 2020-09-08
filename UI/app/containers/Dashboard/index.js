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
  doSearch
}) {
  useInjectReducer({ key: 'dashboard', reducer });
  useInjectSaga({ key: 'dashboard', saga });

  const [cookies, setCookie, removeCookie ] = useCookies();

  const [searchContent, setSearchContent ] = useState("");
  const [searchType, setSearchType ] = useState("");

  return (
    <div>
      <Helmet>
        <title>Dashboard</title>
        <meta name="description" content="Description of Dashboard" />
      </Helmet>
      <Card style={{marginTop:10, padding:10}}>
        <div>
          <SearchBar
            doSearch={
                (searchContent, searchType) => {
                  console.log(searchContent + " -- "+
                              searchType.searchCollections + " -- "+
                              searchType.searchTables);

                  setSearchContent(searchContent)
                  setSearchType(searchType)

                  doSearch(searchContent, searchType)
            }
          }/>
        </div>
      </Card>

      <Card style={{marginTop:10, maxHeight:600, overflowY:"scroll"}}>
        <div>

        {
          Array.from({length:100},(v,k)=> { k+1; return <SearchResult key={k} text={"something here"} type={"table"} /> })
        }
        <SearchResult text={"something here"} type={"collection"} />

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
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Dashboard);
