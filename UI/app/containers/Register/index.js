/**
 *
 * Register
 *
 */

import React, { useEffect, memo, useState } from 'react';
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
import Link from '@material-ui/core/Link'

import { registerAccountAction, registerAccountActionSuccess, registerAccountActionFailed } from './actions';


export function Register({
  goTo,
  doRegister,
  register
}) {
  useInjectReducer({ key: 'register', reducer });
  useInjectSaga({ key: 'register', saga });

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");
  const [password_rep, setPasswordRep] = useState("");

  const [registered, setRegistered] = useState(false);

  const [warning, setWarning] = useState("");

  const preventDefault = (event) => event.preventDefault();
// <FormattedMessage {...messages.header} />

  useEffect( () => {
    if ( !warning ){
      setWarning(register.status)
    }
  }, [register.status])


  const checkDetails = (userDetails) => {

    var status = ""

    if ( userDetails.password !== userDetails.password_rep ){
      status = "Passwords do not match"
    } else if ( userDetails.password.trim().length < 5 ){
      status = "Password should be longer than 5 characters"
    } else if ( userDetails.password.trim().length == 0 ){
      status = "Type a password"
    } else if ( userDetails.username.trim().length == 0 ){
      status = "Type a username"
    } else if ( userDetails.username.trim().length < 4 ){
      status = "Username should be at least 4 characters long"
    } else if ( userDetails.email.trim().split("@").length != 2 ){
      status = "Email missing or in the wrong format"
    }

    return { accept: status.length == 0, status }

  }

  const doRegisterButton = () => {
    var logInDetails = {
      'displayName': fullname,
      'email': email,
      'username': username,
      'password': password,
      'password_rep': password_rep,
    }

    var status = checkDetails(logInDetails)

    setWarning( status.status )

    if( status.accept ){
      doRegister({
        'username': username,
        'password': password,
        'displayName': fullname,
        'email': email,
      })

      setRegistered(true);
    }
  }

  return (
    <div>
      <Helmet>
        <title>Register</title>
        <meta name="description" content="Register Account" />
      </Helmet>

      <Card style={{padding:30,marginTop:10,width:400, marginLeft:"auto", marginRight:"auto"}}>

        {
          //<TextField
          //   id="fullname"
          //   value={fullname }
          //   placeholder="Full name"
          //   onChange={ (evt) => { setFullname(evt.currentTarget.value)} }
          //   onKeyDown ={() => {}}
          //   />
          //
          // <br />
        }
        { !registered ? <div><h2> Register your Account </h2>

                                  <TextField
                                    id="email"
                                    value={email}
                                    placeholder="Your@Email.Here *"
                                    onChange={ (evt) => { setEmail(evt.currentTarget.value)} }
                                    onKeyDown ={() => {}}
                                    />

                                  <br /><br />


                                  <TextField
                                    id="username"
                                    value={username}
                                    placeholder="Username *"
                                    onChange={ (evt) => { setUsername(evt.currentTarget.value)}  }
                                    onKeyDown ={() => {}}
                                    />
                                  <br /><br />

                                  <TextField
                                    id="password"
                                    value={password}
                                    placeholder="Password *"
                                    type="password"
                                    onChange={ (evt) => { setPassword(evt.currentTarget.value)}  }
                                    onKeyDown ={ () => {} }
                                    />

                                  <TextField
                                    id="password_conf"
                                    value={password_rep}
                                    placeholder="Confirm Password *"
                                    type="password"
                                    onChange={ (evt) => { setPasswordRep(evt.currentTarget.value)} }
                                    onKeyDown ={ () => {} }
                                    />

                                  <br /><br />

                                  <div style={{marginTop:10,textAlign:"right"}}>
                                    <Button variant="contained" onClick={ doRegisterButton } style={{backgroundColor:"#93de85"}} > Register </Button>
                                    <Button disabled={false} variant="contained" onClick={ () => { goTo("/") } } style={{marginLeft:5, backgroundColor:"#f98989"}}>Cancel</Button>
                                  </div>

                                  <br />
                                  { warning ? <div style={{color:"red",marginTop:5,marginBottom:5}}> {warning} </div> : <br /> }
                            </div>
                  : <div> Successfully Registered <Link onClick={ () => { goTo("/") } }> Back to dashboard </Link>

                  </div>

        }

        </Card>
    </div>
  );
}

Register.propTypes = {
  // dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  register: makeSelectRegister(),
});

const preventDefault = (event) => event.preventDefault();

function mapDispatchToProps(dispatch) {
  return {
    goTo : (path) => dispatch(push(path)),
    doRegister : (userData) => dispatch( registerAccountAction(userData) ),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Register);
