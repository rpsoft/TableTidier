import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router'

import Card from '@material-ui/core/Card';

import {URL_BASE} from '../links'

import fetchData from '../network/fetch-data';

//import Bootstrap from '../../assets/bootstrap.css';
import RaisedButton from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import Menu from '@material-ui/core/Menu';
import Divider from '@material-ui/core/Divider';
import DownArrow from '@material-ui/icons/ArrowDropDown';
import TextField from '@material-ui/core/TextField';

import SelectField from '@material-ui/core/Select';


import { push } from 'connected-react-router'

import Checkbox from '@material-ui/core/Checkbox';

import Annotation from './annotation'

// import style from './table.css'

var ReactDOMServer = require('react-dom/server');

var HtmlToReact = require('html-to-react')
var HtmlToReactParser = require('html-to-react').Parser;

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

class MetaView extends Component {

  constructor(props) {
    super()
    this.state = {
        table: null
    };

  }

  async componentWillReceiveProps(next) {
        this.loadPageFromProps(next)
  }

  async componentWillMount() {

      this.loadPageFromProps(this.props)
  }

  async loadPageFromProps(props){

        let fetch = new fetchData();

        var results = await fetch.getAllMetadata()

        // debugger

        this.setState({results})

    }



   render() {

     if ( this.state.results ){

      return <div>

        <Card id="results" style={{padding:15}}>
          <div>{Object.keys(this.state.results[0]).map( heading => '"'+heading+'"' ).join(",  ")}</div>
          <div>{

            this.state.results.map( (value, i) => {

                var values = Object.keys(value).map( (heading) => {

                    return '"'+(value[heading]+"".replace(new RegExp('"', 'g'), ""))+'"'

                })

                return <div> {values.join(",")} </div>

            } )

          }</div>
        </Card>

      </div>
    } else {
      return <div>no results</div>
    }
    }
}

const mapStateToProps = (state, ownProps) => ({
  params: ownProps.params,
  location: ownProps.location
})

const mapDispatchToProps = (dispatch) => ({

  goToUrl: (url) => dispatch(push(url))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MetaView);
