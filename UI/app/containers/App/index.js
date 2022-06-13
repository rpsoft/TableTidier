/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React, { useEffect, memo, useState, useRef } from 'react';
import {
  Routes,
  Route,
} from 'react-router-dom';
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

import { SnackbarProvider } from 'notistack';
import Grow from '@material-ui/core/Grow';
import WarningIcon from '@material-ui/icons/Warning';
import { makeStyles } from '@material-ui/core/styles';

const styleSeed = (theme) => ({
  // snackbar type style
  snackbarClasses: {
    // normal
    '& > [class*=SnackbarItem-contentRoot]': {
      backgroundColor: theme.palette.dialog.normalBackground,
      color: theme.palette.dialog.textColorDialog,
    },
    // success 
    '& > [class*=SnackbarItem-variantSuccess]': {
      backgroundColor: theme.palette.dialog.successBackground,
      color: theme.palette.dialog.textColorDialog,
      '& .MuiSvgIcon-root': {
        color: 'rgb(76, 175, 80)',
      }
    },
    // info
    '& > [class*=SnackbarItem-variantInfo]': {
      backgroundColor: theme.palette.dialog.infoBackground,
      color: theme.palette.dialog.textColorDialog,
      '& .MuiSvgIcon-root': {
        color: 'rgb(6 92 213)',
      }
    },
    // warning
    '& > [class*=SnackbarItem-variantWarning]': {
      backgroundColor: theme.palette.dialog.warningBackground,
      color: theme.palette.dialog.textColorDialog,
      '& .MuiSvgIcon-root': {
        color: 'rgb(231 131 3)',
      }
    },
    // error
    '& > [class*=SnackbarItem-variantError]': {
      backgroundColor: theme.palette.dialog.errorBackground,
      color: theme.palette.dialog.textColorDialog,
      '& .MuiSvgIcon-root': {
        color: 'rgb(225 1 1)',
      }
    },

  }
})

export function App({
  appData,
  setLoginCredentials,
}) {
  const useStyles = makeStyles(styleSeed);
  const classes = useStyles({});
  const [ cookies, setCookie, removeCookie ] = useCookies();
  const [ alertData, setAlertData ]  = React.useState( appData.alertData ?
    appData.alertData
    : { open: false, message: '', isError: false }
  );

  useEffect(() => {
    setAlertData(appData.alertData ? appData.alertData : { open: false, message: "", isError: false })
  }, [appData.alertData]);

  setLoginCredentials(cookies)

  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={10000}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
        // horizontal: 'left',
      }}
      // iconVariant={{
      //   success: '✅',
      //   error: <WarningIcon style={{color:"#f44336"}} fontSize="small" />,
      //   warning: '⚠️',
      //   info: 'ℹ️',
      // }}
      classes={{root: classes.snackbarClasses}}
      TransitionComponent={Grow}
    >
      <header>
        <Login />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="table" element={<Annotator />} />
          {
            // <Route path="/table" component={TableContainer}></Route>
            // <Route path="/allresults" component={ResultsContainer}></Route>
            // <Route path="/metaresults" component={MetaContainer}></Route>
            // <Route path="/cuiadmin" component={CuiAdminContainer}></Route>
            // <Route path="/list" component={AppContainer}></Route>
          }
          <Route path="register" element={<Register />} />
          <Route path="collection" element={<CollectionView />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Routes>

        <PopAlert alertData={alertData} setAlertData={setAlertData} />
      </main>

      <Footer />
      <GlobalStyle />
    </SnackbarProvider>
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
