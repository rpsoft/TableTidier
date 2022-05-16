/**
 * app.js
 *
 * This is the entry file for the application, only setup and boilerplate
 * code.
 */

// Needed for redux-saga es6 generator support
import '@babel/polyfill';

// Import all the third party stuff
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import history from 'utils/history';
import 'sanitize.css/sanitize.css';

// Import root app
import App from 'containers/App';

// Import Language Provider
import LanguageProvider from 'containers/LanguageProvider';

// Load the favicon and the .htaccess file
/* eslint-disable import/no-unresolved, import/extensions */
import '!file-loader?name=[name].[ext]!./images/favicon.ico';
import 'file-loader?name=.htaccess!./.htaccess';
import '!file-loader?name=[name].[ext]!./images/tabletidier.png';
/* eslint-enable import/no-unresolved, import/extensions */

import configureStore from './configureStore';

// Import i18n messages
import { translationMessages } from './i18n';

// Create redux store with history
// const initialState = { global :{ host : process.env.REACT_APP_WEBSITE_NAME, server_port: process.env.REACT_APP_SERVER_PORT, ui_port: process.env.REACT_APP_WEBSITE_PORT } };
//
// var hfeh = argv
import { URL_BASE } from './links'

var proc_host_vars = {
  // "INIT_CWD" : process.env.INIT_CWD,
  // NODE_ENV : process.env.NODE_ENV,
  // UI_DOMAIN : process.env.UI_DOMAIN,
  // UI_PORT : process.env.UI_PORT,
  // API_PORT : process.env.UI_PORT, //process.env.API_PORT
  // API_BASE : process.env.API_BASE,
  // API_DOMAIN : process.env.API_DOMAIN,
  ui_host : process.env.UI_DOMAIN ? process.env.UI_DOMAIN.replace(/['"]+/g, '') : "" ,
  ui_port: process.env.UI_PORT,
  server_host: process.env.API_DOMAIN ? process.env.API_DOMAIN.replace(/['"]+/g, '') : "" ,
  server_port: process.env.UI_PORT, //process.env.API_PORT
}

const initialState = {
  app: {
    ...proc_host_vars,
    api_url : location.protocol + '//' +
              proc_host_vars.ui_host +
              (
                proc_host_vars.server_port && (proc_host_vars.ui_host.includes("localhost")) ?
                  ':' + proc_host_vars.server_port
                  : ''
              ) +
              URL_BASE
  }
}

// console.log(initialState)

const store = configureStore(initialState, history);
const MOUNT_NODE = document.getElementById('app');

const render = messages => {
  ReactDOM.render(
    <Provider store={store}>
      <LanguageProvider messages={messages}>
        <ConnectedRouter history={history}>
            <App/>
        </ConnectedRouter>
      </LanguageProvider>
    </Provider>,
    MOUNT_NODE,
  );
};

if (module.hot) {
  // Hot reloadable React components and translation json files
  // modules.hot.accept does not accept dynamic dependencies,
  // have to be constants at compile-time
  module.hot.accept(['./i18n', 'containers/App'], () => {
    ReactDOM.unmountComponentAtNode(MOUNT_NODE);
    render(translationMessages);
  });
}

// Chunked polyfill for browsers without Intl support
if (!window.Intl) {
  new Promise(resolve => {
    resolve(import('intl'));
  })
    .then(() => Promise.all([import('intl/locale-data/jsonp/en.js')]))
    .then(() => render(translationMessages))
    .catch(err => {
      throw err;
    });
} else {
  render(translationMessages);
}



// Install ServiceWorker and AppCache in the end since
// it's not most important operation and if main code fails,
// we do not want it installed
if (process.env.NODE_ENV === 'production') {
  require('offline-plugin/runtime').install(); // eslint-disable-line global-require
}
