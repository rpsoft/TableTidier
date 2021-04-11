/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React, { useEffect, memo, useState } from 'react';
import { Switch, Route } from 'react-router-dom';

import PropTypes from 'prop-types';

// import HomePage from 'containers/HomePage/Loadable';
import NotFoundPage from 'containers/NotFoundPage/Loadable';

import GlobalStyle from '../../global-styles';

import Login from '../Login'
import Register from '../Register'
import Annotator from '../Annotator'
import Dashboard from '../Dashboard'
import CollectionView from '../CollectionView'
import HomePage from '../HomePage'

import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import makeSelectLocation from './selectors'

import {setLoginCredentialsAction} from './actions'

import {
  URL_BASE,
} from '../../links'

// import {
//   // Core components
//   AppContainer,
//   CommonView,
//   ResultsContainer,
//   MetaContainer,
//   TableContainer,
//   AnnotationView,
//   CuiAdminContainer,
// } from '../../components/'

const urlBase = URL_BASE

import Footer from '../../components/Footer'

import { useCookies } from 'react-cookie';

import PopAlert from 'components/PopAlert'



export function App({
  // appData,
  setLoginCredentials,
  appData
}) {

  const [ cookies, setCookie, removeCookie ] = useCookies();
  const [ alertData, setAlertData ]  = React.useState( appData.alertData ? appData.alertData : { open: false, message: "", isError: false } );


  useEffect(() => {

      setAlertData(appData.alertData ? appData.alertData : { open: false, message: "", isError: false })

  }, [appData.alertData]);

  setLoginCredentials(cookies)

  return (
    <div id={"container"} style={{marginLeft:"auto", marginRight:"auto", minWidth:800, maxWidth:1400, width:"100%", minHeight:"100vh"}}>
        <Login />

          <div style={{padding:5, paddingTop:65,  marginLeft:10, paddingBottom:70, minHeight:"90vh"}}>
            <Switch>
              <Route path="/table" component={Annotator} />
              {
                // <Route path="/table" component={TableContainer}></Route>
                // <Route path="/allresults" component={ResultsContainer}></Route>
                // <Route path="/metaresults" component={MetaContainer}></Route>
                // <Route path="/cuiadmin" component={CuiAdminContainer}></Route>
                // <Route path="/list" component={AppContainer}></Route>
              }
              <Route path="/register" component={Register}></Route>
              <Route path="/collection" component={CollectionView}></Route>
              <Route path="/dashboard" component={Dashboard}></Route>
              <Route path="/" component={HomePage}></Route>
            </Switch>
          </div>


      <PopAlert alertData={alertData} setAlertData={setAlertData} />

      <div style={{position:"fixed", left:0, bottom:0, width:"100%" }}><Footer /></div>
      <GlobalStyle />
    </div>
  );
}
// const mapStateToProps = createStructuredSelector({
//   annotator: makeSelectAnnotator(),
//   credentials: makeSelectCredentials(),
//   // loginDetails: makeSelectLogin(),
// });
const mapStateToProps = createStructuredSelector({
   appData : makeSelectLocation(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    setLoginCredentials : (cookies) => dispatch( setLoginCredentialsAction(cookies) ),
    // getCollectionData : () => dispatch( loadCollectionAction() ),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(App);
// export default App;
