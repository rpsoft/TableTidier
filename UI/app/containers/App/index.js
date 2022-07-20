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
  useLocation,
} from 'react-router-dom';
import PropTypes from 'prop-types';

// import HomePage from 'containers/HomePage/Loadable';
import NotFoundPage from 'containers/NotFoundPage/Loadable';

import GlobalStyle from '../../global-styles';

import Login from '../Login'
import Register from '../Register'
// import Annotator from '../Annotator'
const Annotator = React.lazy(/* webpackChunkName: "Annotator" */ () => import("../Annotator"));
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

import {useIsMounted} from '../../utils/custom-hooks.js'

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
  const location = useLocation();
  const isMounted = useIsMounted()

  const [ alertData, setAlertData ]  = React.useState( appData.alertData ?
    appData.alertData
    : { open: false, message: '', isError: false }
  );

  const searchScrollRef = useRef(null)
  const searchScrollHistoric = useRef({})

  // useEffect(() => {
  //   console.log(location.pathname);
  //   // Send request to your server to increment page view count
  //   return () => {
  //     console.log('saliendo');
  //     console.log(location.pathname);
  //   }
  // }, [location]);

  // ! :-> scroll study. See trello scroll ticket
  // useEffect(() => {
  //   if (location.pathname.includes('/dashboard') == true) {
  //     if (location.key in searchScrollHistoric.current) {
  //        searchScrollRef.current.scrollTop = searchScrollHistoric.current[location.key]
  //     } else {
  //       // Go to top
  //       searchScrollRef.current.scrollTop = 0
  //     }
  //   }
  //   console.log(searchScrollRef.current.scrollTop)
  //   return () => {
  //     // Store scroll
  //     console.log(searchScrollRef.current.scrollTop)
  //     if (location.pathname.includes('/dashboard') == true) {
  //       // searchScrollHistoric.current[location.key] = searchScrollRef.current.scrollTop
  //       searchScrollHistoric.current[location.key] = searchScrollRef.current.scrollTop
  //     }
  //     return
  //   }
  // })

  useEffect(() => {
    setAlertData(
      appData.alertData ?
        appData.alertData
        : { open: false, message: '', isError: false }
    )
  }, [appData.alertData]);

  const updateAlertData = (data) => {
    if (isMounted()) {
      setAlertData(data)
    }
  }

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

      <main
        ref={searchScrollRef}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="table"
            element={
              <React.Suspense fallback={<>...</>}>
                <Annotator />
              </React.Suspense>
            }
          />
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

        {/* ! :-) To locate the bad setState() call inside `App`, follow the stack trace as described in https://fb.me/setstate-in-render */}
        <PopAlert alertData={alertData} setAlertData={updateAlertData} />
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
