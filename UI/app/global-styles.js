import { createGlobalStyle } from 'styled-components';

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
    padding: 15px 5px 10px 5px;
  }
  #app > footer {
    grid-area: footer;
  }

  p,
  label {
    font-family: Georgia, Times, 'Times New Roman', serif;
    line-height: 1.5em;
  }
`;

export default GlobalStyle;