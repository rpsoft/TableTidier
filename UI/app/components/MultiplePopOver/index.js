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

    const handleClick = (event) => {
      setOpen(true)
      setAnchorEl(event.currentTarget)
    };

    const handleRequestClose = () => {
      setOpen(false)
    };

    const updateCheck = (value) => {
      var newChecked = checked
      var ind = newChecked.indexOf(value)

      if ( ind > -1 ){
        newChecked.splice(ind,1)
      } else {
        newChecked.push(value)
      }

      setChecked(Array.from(newChecked))
      updateAnnotation(newChecked)
    }

    const labelname = checked.length > 0 ? checked.join(", ") : (variable || "undefined")

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
              options.map(
                (v,o) => <div key={o} style={{marginLeft:15}}>{v}
                            <Checkbox
                              value={ v }
                              checked={ checked.indexOf(v) > -1 }
                              onChange={ () => { updateCheck(v) }}
                              />
                         </div>
                       )
            }
          </div>
        </Popover>
      </div>);
}

MultiplePopOver.propTypes = {};

export default memo(MultiplePopOver);
