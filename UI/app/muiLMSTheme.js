import { createTheme } from '@material-ui/core/styles';

import {
  cyan700,
  grey,
  pinkA100, pinkA200, pinkA400,
  fullWhite,
} from '@material-ui/core/colors';
import {fade} from '@material-ui/core/styles/colorManipulator';
import spacing from '@material-ui/core/styles/colorManipulator';

const theme = createTheme({
  spacing: spacing,
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: '#3F51B5',
    primary2Color: 'white',
    primary3Color: grey,
    // accent1Color: pinkA200,
    // accent2Color: pinkA400,
    // accent3Color: pinkA100,
    textColor: '#333333',
    // alternateTextColor: '#303030',
    // canvasColor: '#303030',
    // borderColor: fade(fullWhite, 0.3),
    // disabledColor: fade(fullWhite, 0.3),
    // pickerHeaderColor: fade(fullWhite, 0.12),
    // clockCircleColor: fade(fullWhite, 0.12),
    selectionColor: '#303030',
    selectionBackground: '#f0f030',
    chip: '#efefef',
    chipSelected: '#ff5f5f',
    dialog: {
      accept: '#93de85',
      cancel: '#f98989',
      // cancel: '#ffbdbd',
      cancel2: '#f98989',
      normalBackground: 'rgb(245 249 232)',
      successBackground: 'rgb(237, 247, 237)',
      infoBackground: 'rgb(163 198 249)',
      warningBackground: 'rgb(255 233 184)',
      errorBackground: 'rgb(255 182 182)',
      textColorDialog: 'black',
    },
  },
  sizes: {
    minWidth: '800px',
    maxWidth: '1390px',
  }
});

export default theme
