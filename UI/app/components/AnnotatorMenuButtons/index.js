import
  React, {
    // memo 
  } from 'react';

import {
  Button,
} from '@material-ui/core';

import {
  ArrowDropUp,
  ArrowDropDown,
  Close as CloseIcon,
}from '@material-ui/icons';

const AnnotatorMenuButtons = ({handler, bottomLevel, invertButtons}) => {
  const buttonUp = <Button
  name="grow-menu"
  variant="outlined"
  elevation={6}
  style={{
    float:"right",
    backgroundColor:"#ffffff",
    top:5,
    right:5,
    marginTop: 5,
  }}
  disabled={bottomLevel >= 2}
  onClick={ () => handler(1) }
  >
    <ArrowDropUp style={{fontSize:35}} />
  </Button>

  const buttonDown = <Button
  name="shrik-menu"
  variant="outlined"
  elevation={2}
  style={{
    float:"right",
    backgroundColor:"#ffffff",
    top:5,
    right:5,
    marginTop: 5,
  }}
  onClick={ () => handler(-1) }
  >
  <ArrowDropDown style={{fontSize:35}} />
  </Button>

  const buttonList = [
    buttonUp,
    buttonDown,
  ]

  return (<>
    <Button
    name="close-menu"
    variant="outlined"
    style={{
      float:"right",
      backgroundColor:"#ffffff",
      top:5,
      right:5,
    }}
    onClick={ () => handler(0) }
    >
    <CloseIcon fontSize="small" />
    </Button>
    {
    invertButtons?
    buttonList.reverse().map(elm => elm)
    : buttonList.map(elm => elm)
    }
  </>)
}

export default AnnotatorMenuButtons
