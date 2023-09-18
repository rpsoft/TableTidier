import { createGlobalStyle } from 'styled-components';
import {
  grey,
} from '@material-ui/core/colors';

const GlobalStyle = createGlobalStyle`
  html,
  body {
    margin: 0;
  }

  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  body.fontLoaded {
    font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  #app {
    position: absolute;
    width: 100%;
    height: 100vh;
    background-color: #656565;
    
    /* grid container settings */
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      'header'
      'main'
      'footer';
  }
  #app > header {
    grid-area: header;
  }
  #app > main {
    grid-area: main;
    overflow: auto;
    padding: 5px 5px 5px 5px;
    margin-left: auto;
    margin-right: auto;
  }
  #app > footer {
    grid-area: footer;
  }

  .doc {
    color: ${grey[800]};
  }
  .indent {
    text-indent: 30px;
  }

  p,
  label {
    font-family: Georgia, Times, 'Times New Roman', serif;
    line-height: 1.5em;
  }

  p.doc {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    line-height: 1.15;
  }

  .quote-warn {
    border-left: 15px solid #ff8b8b;
    margin-left: 0px;
    padding-left: 10px;
  }

`;

export default GlobalStyle;