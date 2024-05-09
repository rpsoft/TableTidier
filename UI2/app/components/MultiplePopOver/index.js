/**
 *
 * MultiplePopOver
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';


function MultiplePopOver({
  value,
  variable,
  options,
  updateAnnotation,
  style
}) {

  const [open, setOpen] = React.useState(false);
  const [checked, setChecked] = React.useState( value || []);
  const [anchorEl, setAnchorEl] = React.useState();

  React.useEffect( () => {
    setChecked(value)
  }, [value]);

  const handleClick = (event) => {
    setOpen(true)
    setAnchorEl(event.currentTarget)
  };

  const handleRequestClose = () => {
    setOpen(false)
  };

  const updateCheck = (value) => {
    const newChecked = checked
    const ind = newChecked.indexOf(value)

    if ( ind > -1 ) {
      newChecked.splice(ind, 1)
    } else {
      newChecked.push(value)
    }

    setChecked(Array.from(newChecked))
    updateAnnotation(newChecked)
  }

  const labelname = checked.length > 0 ? checked.join(', ') : (variable || 'undefined')

  let parameters = Object.entries(options)
  const parametersKeys = Object.keys(options)

  // Add custom paramaters to parameters
  // check if checked parameter is a default parameter or it is a custom
  const parametersCheckedCustomNotDefault = checked.filter(element => 
    parametersKeys.includes(element) == false
  )
 
  // If parameters is not in default then add those parameters
  if (
    Array.isArray(parametersCheckedCustomNotDefault) &&
    parametersCheckedCustomNotDefault.length > 0
  ) {
    parametersCheckedCustomNotDefault.forEach(
      // format [key, text] example: ['feature', 'characteristics (features)']
      parameterCustom => parameters.push([parameterCustom, parameterCustom])
    )
  }

  return (
    <div style={Object.assign({}, style ,{display:"inline"})}>
      <Button onClick={handleClick} variant={"contained"}>{labelname}</Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
        onClose={handleRequestClose}
      >
        <div style={{margin:5, textAlign: "center"}}>
          <div style={{color:"grey"}}>
            <div style={{textAlign:"center",marginTop:12}}>Choose options</div>
            <hr/>
          </div>

          {
            parameters.map(
              parameter => {
                const [key, text] = parameter
                return (
                  <div
                    key={key}
                    style={{marginLeft:15}}
                  >{text}
                    <Checkbox
                      value={ key }
                      checked={ checked.includes(key) == true }
                      onChange={ () => { updateCheck(key) } }
                    />
                  </div>
                )
              }
            )
          }
        </div>
      </Popover>
    </div>);
}

MultiplePopOver.propTypes = {};

export default memo(MultiplePopOver);
