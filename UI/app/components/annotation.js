import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router'

import RaisedButton from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import SelectField from '@material-ui/core/Select';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import Card from '@material-ui/core/Card';


import Popover from '@material-ui/core/Popover';
import Checkbox from '@material-ui/core/Checkbox';

import MultiplePopover from './MultiplePopover'

class Annotation extends Component {
  constructor(props) {
      super()
      this.state = {
        location: "Col",
        content : {},
        qualifiers : {}
      };

    }


  handleChange = (event, data, source) => {
    //debugger
     var prevState = this.state
     prevState[source] = event.target.value
     console.log(prevState)
     this.setState(prevState);
     this.props.addAnnotation(this.state)
  };

  handleMultiChoice = (variable,values) => {
    var prevState = this.state
        prevState[variable] = values
      //  debugger
    console.log(prevState)
    this.setState(prevState)
  //   debugger
    this.props.addAnnotation(this.state)
  }

  async componentDidMount() {
      this.setState(this.props.annotationData)
  }

  async componentWillReceiveProps(next) {

      this.setState(next.annotationData)

  }


  render() {

    var descriptors = ["outcomes", "arms", "measures", "subgroup_name", "subgroup_level","baseline_level_1","baseline_level_2", "time/period", "other", "p-interaction"]
        descriptors = ["outcomes", "characteristic_name", "characteristic_level", "arms", "measures", "time/period", "other", "p-interaction"]


    return (
      <div style={{marginLeft:0, height: 40}}>
            <RaisedButton
                variant={"contained"}
                style={{marginRight:35, backgroundColor:"#ffa3a3"}}
                onClick={() => {this.props.deleteAnnotation()}}

              >Delete</RaisedButton>
            <SelectField
                value={this.state.location}
                onChange={(event,index,value) => {this.handleChange(event,index,"location")}}
                style={{width:130}}
                >
                <MenuItem value={"Col"} key={1} >Column</MenuItem>
                <MenuItem value={"Row"} key={2} >Row</MenuItem>
            </SelectField>

            <TextField
                  value={this.state.number}
                  placeholder="N"
                  onChange={(event,value) => {this.handleChange(event,value,"number")}}
                  style={{width:20,marginLeft:20}}
                />

           <MultiplePopover
                            value={this.state.content}
                            variable={"content"}
                            options={descriptors}
                            updateAnnotation={ (values) => { this.handleMultiChoice("content",values) } }
                            />

           <MultiplePopover
                            value={this.state.qualifiers}
                            variable={"qualifiers"}
                            options={["plain", "bold", "indented", "italic", "empty_row","empty_row_with_p_value"]}
                            updateAnnotation={ (values) => { this.handleMultiChoice("qualifiers",values) } }
                            />



      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  // if route contains params
  params: ownProps.params,
  location: ownProps.location
})

const mapDispatchToProps = (dispatch) => ({

  goToUrl: (url) => dispatch(push(url))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Annotation);
