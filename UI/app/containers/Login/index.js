/**
 *
 * Login
 *
 */

import React, { useEffect, memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';
import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';
import { makeSelectLogin, makeLoginSelector } from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card'
import Popover from '@material-ui/core/Popover';
import Home from '@material-ui/icons/Home';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

import AccountBoxIcon from '@material-ui/icons/AccountBox';

import { 
  loginAction,
  loginSuccessAction,
  loginFailedAction,
  doLoginAction,
  doLogOutAction
} from './actions'

import {
  Link,
  useLocation,
} from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { useDispatch, useSelector } from "react-redux";

import { makeStyles, useTheme } from '@material-ui/core/styles';

import {
  hashPassword
} from '../../utils/hash'

const drawerWidth = 0;

const useStyles = makeStyles((theme) => ({
  root: {
   display: 'flex',
 },
 appBar: {
   width: `calc(100% - ${drawerWidth}px)`,
   minHeight: 64,
   marginRight: drawerWidth,
   backgroundColor: "#3f51b5",
 },
 drawer: {
   width: drawerWidth,
   flexShrink: 0,
 },
 drawerPaper: {
   width: drawerWidth,
 },
 // necessary for content to be below app bar
 toolbar: theme.mixins.toolbar,
 content: {
   flexGrow: 1,
   backgroundColor: theme.palette.background.default,
   padding: theme.spacing(3),
 },
}));

export function Login({
  token,
  loginState,

  doLogin,
  doLogOut,
}) {

  // let location = useLocation()
  const classes = useStyles();
  const theme = useTheme();

  const [cookies, setCookie, removeCookie ] = useCookies();

  const [username, setUsername] = useState(loginState.username ? loginState.username :  '' );
  const [password, setPassword] = useState('');

  // const [loginWarning, setLoginWarning] = useState('');
  // const loginWarning = useSelector(state => state.loginWarning);

  const [isLoginShown, toggleLogin] = useState(false);

  const handleLoginToggle = (event) => {
    if( isLoginShown ) {
      return toggleLogin(false)
    }
    toggleLogin(true);
  }

  const anchorElRef = useRef(null);

  const logIn = async () => {
    if (
      username && username != undefined &&
      password && password != undefined
    ) {
      const key = await hashPassword(username, password)
      doLogin(username, key)
    }
  }

  const logOut = () => {
    removeCookie('hash');
    removeCookie('username');
    setUsername('');
    setPassword('');
    doLogOut();
  }

  const onKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      const key = await hashPassword(username, password)
      doLogin(username, key)
    }
  }

  useEffect(() => {
    // If authentication token is available and it's different from the cookie token it will be set in the cookies.
    // console.log('username ', loginState.username)
    if ( loginState.username ) {
      handleLoginToggle(); // close on successful login.
      // setCookie('username', loginState.username)
      return
    }
    setCookie('username', '')
  }, [loginState.username]);
  //
  // useEffect(() => {
  //   document.title = Date.now();
  // });

  // useEffect(() => {
  //   // If authentication token is available and it's different from the cookie token it will be set in the cookies.
  //   console.log('token', token)
  //   if ( token ) {
  //     setCookie('hash', token) // 86400 seconds in a day. Login will expire after a day.
  //     setCookie('username', loginState.username)
  //   } else {
  //     setCookie('hash', '') // 86400 seconds in a day. Login will expire after a day.
  //     setCookie('username', '')
  //   }
  // }, [token]);

  useInjectReducer({ key: 'login', reducer });
  useInjectSaga({ key: 'login', saga });

  const isLoggedIn = loginState.username ? true : false;

  const cancelButton = <>
    <Button
      variant="contained"
      onClick={ () => { handleLoginToggle() } }
      style={{marginLeft:5, backgroundColor:"#f98989"}}
    >
      Cancel
    </Button>
  </>

  return (
    <AppBar position="fixed" className={classes.appBar} style={{backgroundColor:"#3f51b5"}}>
    <Toolbar>

      <Helmet>
        <title>Login</title>
        <meta name="description" content="Description of Login" />
      </Helmet>

      <Link to="/">
        <img src="./tabletidier.png" style={{height:45,width:45, cursor:"pointer", marginRight:15}} />
      </Link>
      <h2 style={{color:"white",margin:0}}>TableTidier <div style={{color:"red",display:"inline-block",fontSize:15}}>(beta)</div></h2>

      <div style={{marginRight:0, position:"absolute",right:16}} >
        <Button
          ref={anchorElRef}
          variant="contained"
          onClick={ handleLoginToggle }
          style={{marginLeft:5}}
        >
          <AccountBoxIcon/>
          {loginState.username ? "Logged as: "+ loginState.username : " guest "}
        </Button>
      </div>

      <Popover
        id={"loginDropDown"}
        open={isLoginShown}
        anchorEl={anchorElRef.current}
        onClose={ handleLoginToggle }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <div style={{padding:20, maxWidth:300}}>
          {
            // Is logged
            isLoggedIn ? <>
            Logged as 
            <span 
              style={{
                fontSize: 'larger',
                fontWeight: 'bold',
                marginLeft: 10,
              }}
            >
              {loginState.username}
            </span>

            <div style={{marginTop:10,textAlign:"right"}}>
              <Button
                disabled={!isLoggedIn}
                variant="contained"
                onClick={ () => { logOut() } }
                style={{marginLeft:5, backgroundColor:"#89b6f9"}}
              >
                Logout
              </Button>
              {cancelButton}
            </div>
            </>
            // Is Not logged?
            : <>
            <h4 style={{whiteSpace: 'nowrap'}}> Enter Your Login Details </h4>

            <form>
            <TextField
              id="username"
              value={username}
              placeholder="Username"
              autoComplete='login username'
              autoFocus={true}
              onChange={ (evt) => {setUsername(evt.currentTarget.value)} }
              onKeyDown ={onKeyDown}
            />
            <br />
            <TextField
              id="password"
              value={password}
              placeholder="Password"
              type="password"
              autoComplete='login password'
              onChange={ (evt) => {setPassword(evt.currentTarget.value)} }
              onKeyDown ={onKeyDown}
            />
            <br />
            </form>
            {
            loginState.loginWarning ?
              <div 
                style={{color:"red",marginTop:5,marginBottom:5}}
              >
                {loginState.loginWarning}
              </div>
            : <br />
            }

            <div style={{marginTop:10,textAlign:"right"}}>
              <Button variant="contained" onClick={ () => { logIn() } } style={{backgroundColor:"#93de85"}} >
                  Login
              </Button>
              {cancelButton}
            </div>
            </>
          }

        </div>
      </Popover>

    </Toolbar>
    </AppBar>
  );
}

Login.propTypes = {
  // dispatch: PropTypes.func.isRequired,
  token : PropTypes.string,
  doLogin : PropTypes.func,
  doLogOut : PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  token: makeLoginSelector(),
  loginState: makeSelectLogin(),
});

const mapDispatchToProps = (dispatch) => {
  return {
    doLogin : (username,password) => dispatch( doLoginAction(username,password) ),
    doLogOut : () => dispatch(doLogOutAction()),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Login);
