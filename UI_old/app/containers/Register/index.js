/**
 *
 * Register
 *
 * Register a user
 */

import React, { useEffect, memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import makeSelectLocation from '../App/selectors'
import { 
  doLoginAction,
} from '../Login/actions'

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { makeStyles } from '@material-ui/core/styles';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card'
// import Popover from '@material-ui/core/Popover';
// import Home from '@material-ui/icons/Home';
// import AccountBoxIcon from '@material-ui/icons/AccountBox';
// import Link from '@material-ui/core/Link'

import VisibilityOutlinedIcon from '@material-ui/icons/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@material-ui/icons/VisibilityOffOutlined';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import LaunchIcon from '@material-ui/icons/Launch';

import {
  filter,
  fromEvent,
  pipe,
  // map,
  // merge,
  // scan
} from 'callbag-basics';
import { debounce } from 'callbag-debounce';
import subscribe from 'callbag-subscribe';

import {
  hashPassword
} from '../../utils/hash'

const USERNAME_MINIMUM_LENGTH = 4

const useStyles = makeStyles({
  textFieldHelper: {
    marginTop: 10,
    marginBottom: 10,
    '& > .MuiFormHelperText-root': {
      position: 'absolute',
      bottom: '-1.2em',
      right: '0px',
    }
  },
  columnTakeTwo: {
    gridColumn: '1 / 3',
  },
  capitalizeFirstLetter: {
    display: 'inline-block',
    '&:first-letter': {
      textTransform: 'capitalize',
    }
  },
});

export function Register({
  appData,
  doLogin,
}) {
  let navigate = useNavigate();
  const classes = useStyles()

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [emailHelpText, setEmailHelpText] = useState({
    text: '',
    error: false,
  });

  const [username, setUsername] = useState('');
  const [usernameHelpText, setUsernameHelpText] = useState({
    text: '',
    error: false,
  });

  const [password, setPassword] = useState('');
  const [password_rep, setPasswordRep] = useState('');

  const [registered, setRegistered] = useState(false);

  const [warning, setWarning] = useState({
    text: '',
    new: false,
    counter: 0,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(!showPassword)

  // clear email helper text when '@' is not present
  useEffect( () => {
    if (email.includes('@') == false) {
      setEmailHelpText({
        text: '',
        error: false,
        color: undefined,
      })
    }
  }, [email])

  // If username is under minimum length clear username helper text
  useEffect( () => {
    if (username.length < USERNAME_MINIMUM_LENGTH) {
      setUsernameHelpText({
        text: '',
        error: false,
        color: undefined,
      })
    }
  }, [username])

  // references to html elements
  const emailInput = useRef(null);
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const passwordConfirmInput = useRef(null);
  const registerButton = useRef(null);

  const checkField = (value) => fetch(appData.api_url+'register/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(value)
  })

  // Logic to control email status
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  useEffect( () => {
    if (emailInput.current == null) {
      return
    }
    // subscribe to email
    const disposeEmailInputObserver = pipe(
      // take key input events of email field
      fromEvent(emailInput.current, 'input'),
      // only pass email. Checked by regular expression
      filter(x => emailRegex.test(x.target.value)),
      // Wait inactivity after last key
      // To check validity of email
      // Time in miliseconds
      debounce(700),
      subscribe(async x => {
        const result = await checkField({
          email: x.target.value,
        })
        if (result.statusText!='OK') return setEmailHelpText({
          text: 'fails checking email',
          error: true,
        })
        const body = await result.json()
        if (body.payload=='unavailable') return setEmailHelpText({
          text: 'email unavailable ✕',
          error: true,
          color: 'red'
        })
        if (body.payload=='available') return setEmailHelpText({
          text: 'email available ✔',
          error: false,
          color: 'green'
        })
      })
    );
    // subscribe to username
    const disposeUsernameInputObserver = pipe(
      // take key input events of username field
      fromEvent(usernameInput.current, 'input'),
      // check username length
      filter(x => x.target.value.length >= USERNAME_MINIMUM_LENGTH),
      // Wait inactivity after last key
      // To check validity of email
      // Time in miliseconds
      debounce(700),
      subscribe(async x => {
        const result = await checkField({
          username: x.target.value,
        })
        if (result.statusText!='OK') return setUsernameHelpText({
          text: 'fails checking username',
          error: true,
        })
        const body = await result.json()
        if (body.payload=='unavailable') return setUsernameHelpText({
          text: 'username unavailable ✕',
          error: true,
          color: 'red'
        })
        if (body.payload=='available') return setUsernameHelpText({
          text: 'username available ✔',
          error: false,
          color: 'green'
        })
      })
    );

    // On unmount clean/dispose observables
    return () => {
      disposeEmailInputObserver()
      disposeUsernameInputObserver()
    }
  }, [])

  const checkDetails = (userDetails) => {
    let status = ''

    if ( userDetails.email.trim().split('@').length != 2 ) {
      status = 'Email missing or in the wrong format'
    } else if ( userDetails.username.trim().length == 0 ) {
      status = 'Type a username'
    } else if ( userDetails.username.trim().length < USERNAME_MINIMUM_LENGTH ) {
      status = 'Username should be at least 4 characters long'
    } else if ( userDetails.password.trim().length == 0 ) {
      status = 'Type a password'
    } else if ( userDetails.password.trim().length < 5 ) {
      status = 'Password should be longer than 5 characters'
    } else if ( userDetails.password !== userDetails.password_rep ) {
      status = 'Passwords do not match'
    }

    return { accept: status.length == 0, status }
  }

  const doRegisterButton = async () => {
    const logInDetails = {
      'displayName': fullname,
      'email': email,
      'username': username,
      'password': password,
      'password_rep': password_rep,
    }

    const status = checkDetails(logInDetails)

    let newWarningText = ''
    if ( status.accept == false ) {
      newWarningText = status.status
      return setWarning({
        text: newWarningText,
        new: true,
        counter: newWarningText == warning.text? ++warning.counter : 1,
      })
    }
    if ( emailHelpText.error ) {
      newWarningText = emailHelpText.text
      return setWarning({
        text: newWarningText,
        new: true,
        counter: newWarningText == warning.text? warning.counter++ : 1,
      })
    }
    if ( usernameHelpText.error ) {
      newWarningText = usernameHelpText.text
      return setWarning({
        text: newWarningText,
        new: true,
        counter: newWarningText == warning.text? warning.counter++ : 1,
      })
    }

    // hash password
    const key = await hashPassword(username, password)

    // Do register
    const params = new URLSearchParams({
      email,
      username,
      password: key,
      displayName: fullname,
    });
    const result = await fetch(appData.api_url+'/createUser', {
      method: 'POST',
      body: params
    })

    if (result.statusText!='OK') {
      newWarningText = 'Fails register'
      return setWarning({
        text: newWarningText,
        new: true,
        counter: newWarningText == warning.text? warning.counter++ : 1,
      })
    }
    const body = await result.json()

    if (body.status=='failed') {
      newWarningText = body.payload
      return setWarning({
        text: newWarningText,
        new: true,
        counter: newWarningText == warning.text? warning.counter++ : 1,
      })
    }
    if (body.status=='unavailable') {
      newWarningText = body.payload
      return setWarning({
        text: newWarningText,
        new: true,
        counter: newWarningText == warning.text? warning.counter++ : 1,
      })
    }

    // logged and option to go to another place
    setRegistered(true);

    //login
    doLogin(username, key)
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
        { !registered ? <>

        <h2> Register your Account </h2>
        <div

        >
        <form 
          autoComplete='on'
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(3,1fr)',
            gridTemplateRows: '4.5em 4.5em',
          }}
        >
          <TextField
            id="register_email"
            value={email}
            label='email'
            placeholder="Your@Email.Here *"
            className={[
              classes.textFieldHelper,
              classes.columnTakeTwo,
            ].join(' ')}
            inputProps={{
              ref: emailInput,
              autoComplete: 'register email',
              type: 'email',
              required: true,
              autoFocus: true,
            }}
            // htmlAutoComplete='register email'
            onChange={ (evt) => { setEmail(evt.currentTarget.value)} }
            // go next field username
            onKeyDown ={ (event) => {
              if (event.key != "Enter") return
              usernameInput.current && usernameInput.current.focus()
            }}
            error={emailHelpText.error}
            // Under text comment 
            FormHelperTextProps={{
              style: {
                backgroundColor: 'transparent',
                color: emailHelpText.color,
                textAlign: 'right',
              }
            }}
            helperText={emailHelpText.text}
          />

          <TextField
            id="register_username"
            value={username}
            label='username'
            placeholder="Username *"
            className={[
              classes.textFieldHelper,
              classes.columnTakeTwo,
            ].join(' ')}
            inputProps={{
              ref: usernameInput,
              autoComplete: 'username',
              type: 'text',
            }}
            // autoComplete='login username'
            onChange={ (evt) => { setUsername(evt.currentTarget.value)}  }
            onKeyDown ={ (event) => {
              if (event.key != "Enter") return
              passwordInput.current && passwordInput.current.focus()
            }}
            error={usernameHelpText.error}
            // Under text comment 
            FormHelperTextProps={{
              style: {
                backgroundColor: 'transparent',
                color: usernameHelpText.color,
                textAlign: 'right',
              }
            }}
            helperText={usernameHelpText.text}
          />
          <br /><br />
          <br /><br />
          <div
            className={[
              classes.columnTakeTwo,
            ]}
            style={{
              textAlign: 'right',
            }}
          >
            <Button
              onClick={() => toggleShowPassword()}
              style={{
                marginTop: 22,
                backgroundColor: '#f3f3f3',
              }}
              variant="contained"
              disableElevation
            >
              {
                showPassword?
                  <VisibilityOffOutlinedIcon style={{ color: 'grey' }} />
                : <VisibilityOutlinedIcon style={{ color: 'grey' }} />
              }
            </Button>
          </div>

          <TextField
            id="register_password"
            value={password}
            placeholder="Password *"
            type={showPassword? 'text': 'password'}
            autoComplete='login password new-password'
            className={[
              classes.columnTakeTwo,
            ].join(' ')}
            onChange={ (evt) => { setPassword(evt.currentTarget.value)}  }
            onKeyDown ={ (event) => {
              if (event.key != "Enter") return
              passwordConfirmInput.current && passwordConfirmInput.current.focus()
            }}
            inputProps={{
              ref: passwordInput,
            }}
          />

          <TextField
            id="register_password_conf"
            value={password_rep}
            placeholder="Confirm Password *"
            type={showPassword? 'text': 'password'}
            autoComplete='off'
            className={[
              classes.columnTakeTwo,
            ].join(' ')}
            onChange={ (evt) => { setPasswordRep(evt.currentTarget.value)} }
            onKeyDown ={ (event) => {
              if (event.key != "Enter") return
              registerButton.current && registerButton.current.focus()
            }}
            inputProps={{
              ref: passwordConfirmInput,
            }}
          />

          </form>

          <br /><br />

          <div style={{marginTop:10,textAlign:"right"}}>
            <Button
              ref={registerButton}
              variant="contained"
              onClick={ () => {
                doRegisterButton()
              }}
              style={{backgroundColor:"#93de85"}}
            > Register </Button>

            <Button
              disabled={false}
              variant="contained"
              onClick={ () => { navigate('/') } }
              style={{marginLeft:5, backgroundColor:"#f98989"}}
            > Cancel </Button>
          </div>

          <br />
          <div
            style={{
              position: 'relative',
              marginTop: 5,
              marginBottom: 5,
              width: '100%',
            }}
          >
            <div
              className={[
                classes.capitalizeFirstLetter,
              ].join(' ')}

              style={{
                color: 'red',
              }}
            > {
              // count number tries
              (warning.counter <= 1? ' ' : warning.counter + 'x ') +
              // warning text
              warning.text}
            </div>
          </div>
          <br />
        </div></>
        : <>
        <div>
          <h2>Successfully Registered</h2>
          <h4 style={{
            marginLeft:15,
          }}>
            <ArrowRightIcon />

            <Link to="/"
              style={{
                marginLeft:6,
                color: 'black',
              }}
            >
              Back to beginning <LaunchIcon style={{marginLeft:5}}/>
            </Link>
          </h4>
          <h4 style={{marginLeft:15}}>
            <ArrowRightIcon /> Go to :

            <Link to="/dashboard">
              <Button style={{backgroundColor:"#d8d7ff",padding:10}} >
                Annotation Dashboard <LaunchIcon style={{marginLeft:5}}/>
              </Button>
            </Link>
          </h4>
        </div>
        </>
        }

      </Card>
    </div>
  );
}

Register.propTypes = {};

const mapStateToProps = createStructuredSelector({
  appData : makeSelectLocation(),
});

function mapDispatchToProps(dispatch) {
  return {
    doLogin: (username, password) => dispatch( doLoginAction(username, password) ),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Register);
