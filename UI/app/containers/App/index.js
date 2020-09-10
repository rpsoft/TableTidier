/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';

import PropTypes from 'prop-types';

import HomePage from 'containers/HomePage/Loadable';
import NotFoundPage from 'containers/NotFoundPage/Loadable';

import GlobalStyle from '../../global-styles';

import Login from '../Login'
import Register from '../Register'
import Annotator from '../Annotator'
import Dashboard from '../Dashboard'
import CollectionView from '../CollectionView'

import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import makeSelectLocation from './selectors'

import {
  URL_BASE,
} from '../../links'

import {
  // Core components
  AppContainer,
  CommonView,
  ResultsContainer,
  MetaContainer,
  TableContainer,
  AnnotationView,
  CuiAdminContainer,
} from '../../components/'

const urlBase = URL_BASE

export function App({
  appData,
}) {
  // debugger

  return (
    <div>
      <Login/>
      <Switch>
        <Route path="/annotator" component={Annotator} />
        <Route path="/table" component={TableContainer}></Route>
        <Route path="/allresults" component={ResultsContainer}></Route>
        <Route path="/metaresults" component={MetaContainer}></Route>
        <Route path="/cuiadmin" component={CuiAdminContainer}></Route>
        <Route path="/register" component={Register}></Route>
        <Route path="/dashboard" component={Dashboard}></Route>
        <Route path="/collection" component={CollectionView}></Route>
        <Route path="/" component={AppContainer}></Route>
      </Switch>
      <GlobalStyle />
    </div>
  );
}

const mapStateToProps = createStructuredSelector({
  appData : makeSelectLocation(),
});

const withConnect = connect(
  mapStateToProps,
  // mapDispatchToProps,
);

export default compose(withConnect)(App);
// export default App;
