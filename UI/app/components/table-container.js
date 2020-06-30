import React, { Component } from 'react';

// import createPalette from '@material-ui/styles/createPalette';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';


import muiLMSTheme from '../muiLMSTheme';

const muiTheme = createMuiTheme(muiLMSTheme)



import AnnotationView from './annotation-view';

export default class TableContainer extends Component {
  render() {
    return (
     <div id="maincontainer" style={{height:"calc(100%)",  backgroundSize: "52%",backgroundAttachment:"fixed", backgroundColor:"grey", paddingTop:10,paddingBottom:10}}>
       <MuiThemeProvider theme={ muiTheme }>
         <AnnotationView {...this.props} />
       </MuiThemeProvider>
     </div>
    );
  }
}
