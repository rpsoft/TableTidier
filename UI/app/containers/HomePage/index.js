/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 *
 */

import './homePage.css';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';

import {
  Link as LinkReactRouter,
} from "react-router-dom";

import {
  Card,
  Button,
  Link,
} from '@material-ui/core';

import PersonAddIcon from '@material-ui/icons/PersonAdd';
import LaunchIcon from '@material-ui/icons/Launch';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import {
  useTheme,
} from '@material-ui/core/styles';

export function HomePage({
}) {
  const theme = useTheme();

  return (
  <div
    style={{
      marginLeft:"auto",
      marginRight:"auto",
      // minHeight: "84vh",
      minWidth: theme.sizes.minWidth,
      maxWidth: theme.sizes.maxWidth,
    }}
  >
    <Helmet>
      <title>TableTidier</title>
      <meta name="description" content="TableTidier" />
    </Helmet>
    <Card style={{
      marginTop: 10,
      padding: 20,
      paddingLeft: 70,
      paddingRight: 20,
      // height: "80vh",
      textAlign: "justify"
    }}>

    <div className='home-presentation'>
      <div className='main'>
        <h2 style={{fontSize:35}}> Welcome to TableTidier! </h2>

        <div style={{maxWidth:600 }}>
          TableTidier is mainly a web application to support the extraction of structured data from scanned document tables. But it is also crowdsourced repository of publicly available structured data to further support research efforts.
        </div>

        <h4 style={{marginLeft:15}}>
          <ArrowRightIcon /> Ready to use it? :

          <LinkReactRouter to="dashboard">
            <Button style={{backgroundColor:"#d8d7ff",padding:10}} >
              Annotation Dashboard <LaunchIcon style={{marginLeft:5}}/>
            </Button>
          </LinkReactRouter>
        </h4>

        <h4 style={{marginLeft:15}}>
          <ArrowRightIcon /> If you haven't done so already:
          
          <LinkReactRouter to="register">
            <Button style={{backgroundColor:"#c3efbb",padding:10}} >
              Register Here <PersonAddIcon style={{marginLeft:5}}/>
            </Button>
          </LinkReactRouter>
        </h4>

        <h4 style={{marginLeft:15}}>
          <ArrowRightIcon />
          
          <LinkReactRouter to="documentation">
            <span style={{fontSize:17,marginLeft:5}}>
              Documentation
            </span>
          </LinkReactRouter>
        </h4>

        <div
          style={{
            border: "1px solid  #b7b7b7",
            padding: 15,
            paddingTop: 0,
            marginRight: 30,
            marginTop: 40,
            marginBottom: 40,
            maxWidth: 600,
          }}
        >
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

          <h4>Contact us:</h4>
          <div>
            Jesus A. Rodriguez Perez ( Jesus.RodriguezPerez@glasgow.ac.uk )
            <br /><br />
            David McAllister ( David.McAllister@glasgow.ac.uk )
          </div>
        </div>

        <div id="metamap">
          <h4>Use of MetaMap and MetaMap Tools</h4>
          <div className='metamap-text'>
            This software uses MetaMap (version 2016v2)
            that was developed and funded by the National Library of Medicine,
            part of the National Institutes of Health,
            and agency of the United States Department of Health and Human Services,
            which is making the software available to the public
            for any commercial or non-commercial purpose
            under the following open-source BSD license.
            
            <Link
              target="_blank"
              href='https://lhncbc.nlm.nih.gov/ii/tools/MetaMap/run-locally/Ts_and_Cs.html'
            >
              MetaMap Terms and Conditions
            </Link>
            <Link
              target="_blank"
              href='https://www.nlm.nih.gov/research/umls/knowledge_sources/metathesaurus/release/license_agreement.html'
            >
              UMLS - Metathesaurus License Agreement
            </Link>
          </div>
        </div>
      </div>
      <div
        className='logos'
        // style={{borderLeft:"1px solid black", verticalAlign:"top", padding:20}}
      >
        <div style={{marginBottom:50,textAlign:"right",}}>
          <img style={{height: 70  }} src="https://www.gla.ac.uk/3t4/img/marque.svg" /><br />
          <img style={{height: 70, marginLeft:10, marginTop:20  }} src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Wellcome_Trust_logo.svg/200px-Wellcome_Trust_logo.svg.png" />
        </div>
      </div>
    </div>

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
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(HomePage);
