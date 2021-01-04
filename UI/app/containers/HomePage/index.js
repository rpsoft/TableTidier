/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 *
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { push } from 'connected-react-router'

import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button,
  Paper,
  Link,
  Switch,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Select,
  MenuItem,
  FormHelperText,
  FormControl,
  InputLabel,
  Popover,
} from '@material-ui/core';

import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';

import PersonAddIcon from '@material-ui/icons/PersonAdd';
import LaunchIcon from '@material-ui/icons/Launch';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';


export function HomePage({
  goToUrl
}) {
  return (<div style={{marginLeft:"2%", marginRight:"2%", minHeight: "84vh"}}>
    <Helmet>
      <title>TableTidier</title>
      <meta name="description" content="TableTidier" />
    </Helmet>
    <Card style={{marginTop:20,padding:20,paddingLeft:70,paddingRight:20,height:"80vh", textAlign:"justify"}}>

    <table style={{height:"100%"}}>
    <tr>
      <td style={{width:"80%", verticalAlign:"top"}}>
          <h2 style={{fontSize:35}}> Welcome to TableTidier! </h2>

          <div style={{maxWidth:600 }}> TableTidier is mainly a web application to support the extraction of structured data from scanned document tables. But it is also crowdsourced repository of publicly available structured data to further support research efforts.
          </div>

          <h4 style={{marginLeft:15}}>
              <ArrowRightIcon />Ready to use it? : <Button style={{backgroundColor:"#d8d7ff",padding:10}} onClick={ () => {goToUrl("/dashboard")}}> Annotation Dashboard <LaunchIcon style={{marginLeft:5}}/> </Button> </h4>


              {
          // <div style={{width:"100%"}}>
          //     <Button style={{backgroundColor:"#d8d7ff",padding:20, fontSize:25}} size="large" fullWidth={true} onClick={ () => {goToUrl("/dashboard")}}> Access Annotation Dashboard </Button>
          //     </div>
            }

          <h4 style={{marginLeft:15}}>
              <ArrowRightIcon />If you haven't done so already: <Button style={{backgroundColor:"#c3efbb",padding:10}} onClick={ () => {goToUrl("/register")}}> Register Here <PersonAddIcon style={{marginLeft:5}}/></Button>
              </h4>


        <div style={{border: "1px solid  black", padding:15, paddingTop:0,marginRight:30, marginTop:40 }}>
          <h4>
            Want to contribute or report issues?
              <br/>Visit our github repository:
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  window.location.href = 'https://github.com/rpsoft/tabletidier';
                }}
                style={{fontSize:17,marginLeft:5}}
              >
                TableTidier in GitHub
              </Link>
              </h4>

            <h4>
              Contact us:
              </h4>
            <div>
              Jesus A. Rodriguez Perez ( Jesus.RodriguezPerez@glasgow.ac.uk )
              <br /><br />
              David McAllister ( David.McAllister@glasgow.ac.uk )
              </div>
          </div>
      </td>
      <td style={{borderLeft:"1px solid black", verticalAlign:"top", padding:20}}>
        <div style={{marginBottom:50,textAlign:"right",}}>
            <img style={{height: 70  }} src="https://www.gla.ac.uk/3t4/img/marque.svg" /><br />
            <img style={{height: 70, marginLeft:10, marginTop:20  }} src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Wellcome_Trust_logo.svg/200px-Wellcome_Trust_logo.svg.png" />
            </div>
      </td>
    </tr>

    </table>


    </Card>
    </div>
  );
}


HomePage.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  // dashboard: makeSelectDashboard(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    goToUrl : (url) => dispatch(push(url)),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(HomePage);
