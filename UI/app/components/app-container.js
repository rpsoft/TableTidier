import React, { Component } from 'react';

// import createPalette from '@material-ui/styles/createPalette';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';


import muiLMSTheme from '../muiLMSTheme';

const muiTheme = createMuiTheme(muiLMSTheme)


/**
 * Component that handles default App layout.
 *
 * React container pattern. The container component explained:
 * https://medium.com/@learnreact/container-components-c0e67432e005#.iu4v0nc2d
 *
 * Example usage (please look at ./src/routes.js):
 * ```
 * var routes = (history) => (
 *   <Router history={history}>
 *     <Route path="/" component={AppContainer}>
 *       <IndexRoute component={Dashboard} />
 * ```
 */

import CommonView from './common-view';

export default class AppContainer extends Component {
  render() {
    return (
     <div id="maincontainer" style={{ backgroundSize: "52%",backgroundAttachment:"fixed", paddingTop:10,paddingBottom:10, height:"100%"}}>
       <MuiThemeProvider theme={ muiTheme }>
         <CommonView {...this.props} />
       </MuiThemeProvider>
     </div>
    );
  }
}
