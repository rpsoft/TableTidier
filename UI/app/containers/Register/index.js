/**
 *
 * Register
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';
import makeSelectRegister from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';

import { push } from 'connected-react-router';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card'
import Popover from '@material-ui/core/Popover';
import Home from '@material-ui/icons/Home';
import AccountBoxIcon from '@material-ui/icons/AccountBox';


export function Register({
  goTo
}) {
  useInjectReducer({ key: 'register', reducer });
  useInjectSaga({ key: 'register', saga });

// <FormattedMessage {...messages.header} />

  return (
    <div>
      <Helmet>
        <title>Register</title>
        <meta name="description" content="Register Account" />
      </Helmet>

      <Card style={{padding:30,marginTop:10,width:400, marginLeft:"auto", marginRight:"auto"}}>

        <h2> Register your Account </h2>

        <TextField
          id="fullname"
          value={""}
          placeholder="Full name"
          onChange={ () => {} }
          onKeyDown ={() => {}}
          />

        <br />

        <TextField
          id="email"
          value={""}
          placeholder="Your@Email.Here"
          onChange={ () => {} }
          onKeyDown ={() => {}}
          />

        <br /><br />

        <TextField
          id="username"
          value={""}
          placeholder="Username"
          onChange={ () => {} }
          onKeyDown ={() => {}}
          />
        <br />

        <TextField
          id="password"
          value={""}
          placeholder="Password"
          type="password"
          onChange={ (evt) => {} }
          onKeyDown ={ () => {} }
          />

        <br /><br />

        <div style={{marginTop:10,textAlign:"right"}}>
          <Button variant="contained" onClick={ () => {  } } style={{backgroundColor:"#93de85"}} > Register </Button>
          <Button disabled={false} variant="contained" onClick={ () => { goTo("/") } } style={{marginLeft:5, backgroundColor:"#f98989"}}>Cancel</Button>
        </div>

        </Card>
    </div>
  );
}

Register.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  register: makeSelectRegister(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    goTo : (path) => dispatch(push(path)),
    doRegister : (userData) => dispatch( registerAccount(userData) ),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Register);
