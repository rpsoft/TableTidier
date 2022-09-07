/**
 *
 * Login
 *
 */

import React, { useEffect, memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector, useDispatch } from 'react-redux';
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

import actions from './actions'

import {
  Link,
  useLocation,
} from 'react-router-dom';
// import { useCookies } from 'react-cookie';

import { makeStyles, useTheme } from '@material-ui/core/styles';

import {
  hashPassword
} from '../../utils/hash'

// Store the refresh token in browser localStorage
import {useLocalStorage} from "react-use-storage";


const drawerWidth = 0;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    minHeight: 64,
    marginRight: drawerWidth,
    '&.MuiAppBar-root': {
      backgroundColor: "#3f51b5",
    }
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
}) {
  useInjectReducer({ key: 'login', reducer });
  useInjectSaga({ key: 'login', saga });

  // let location = useLocation()
  const classes = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch()

  const {
    accept: acceptColor,
    cancel: cancelColor,
  } = theme.palette.dialog

  const [username, setUsername] = useState(loginState.username ? loginState.username :  '' );
  const [password, setPassword] = useState('');
  const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage('refreshToken');

  // const [loginWarning, setLoginWarning] = useState('');
  // const loginWarning = useSelector(state => state.loginWarning);

  const [loginShowMenu, setLoginShowMenu] = useState(false);

  const handleLoginShowMenuToggle = (event) => {
    if( loginShowMenu ) {
      return setLoginShowMenu(false)
    }
    setLoginShowMenu(true);
  }

  const passwordRef = useRef(null);
  const anchorElRef = useRef(null);

  // redux store user 
  const doLogin = (username, password) => dispatch( doLoginAction(username, password) )

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
    setUsername('');
    setPassword('');
    dispatch(doLogOutAction())
    // removing refreshToken signals another windows to logout
    removeRefreshToken()
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
    if ( loginState.username && window.document.hasFocus()) {
      setLoginShowMenu(false); // close on successful login.
      return
    }
  }, [loginState.username]);
  
  useEffect(() => {
    // Client JWT authentication/authorization token is stored as a HttpOnly cookie.
    // Mozilla Doc:
    //  A cookie with the HttpOnly attribute is inaccessible to the JavaScript Document.cookie API;
    //  it's only sent to the server

    // Refresh JWT token is stored in LocalStorage

    // console.log('username ', loginState.username)
    // debugger

    // Add event listeners for respond to remote login and logout
    // This events listerners are only trigered by remote actions

    const loginFromToken = (token) => {
      const userInfo = JSON.parse(
        window.atob(token.split('.')[1])
      )
      // Check token expire date
      // is token expired?
      if ((Date.now() - userInfo.exp*1e3) > 0) {
        // if expired set localStore refresToken
        removeRefreshToken()
        return
      }
      dispatch(loginSuccessAction({username: userInfo.sub}))
      // Close login menu
      setLoginShowMenu(false)
    }

    const localStorageListener = (event) => {
      // newValue == null and typeof oldValue == string logout
      if (event.newValue == null && typeof event.oldValue == 'string') {
        // Logout
        // console.log('Logout')
        // Stop refresToken backgrond process
        dispatch(actions.refreshTokenStop.action())
        // Reset redux store username
        dispatch(loginSuccessAction({username: ''}))
        
        // Close login menu
        setUsername('');
        setPassword('');
        setLoginShowMenu(false)
        return
      }

      // if oldValue == null and typeof newValue == string logoin
      if (event.oldValue == null && typeof event.newValue == 'string') {
        // Login
        const token = JSON.parse(event.newValue).token
        loginFromToken(token)
        dispatch(actions.refreshTokenStart.action(token))
        // console.log('Login')
        return
      }

      // If refreshToken is new update the refresToken timer of this window
      // oldValue == null and typeof oldValue == string logout
      if (
        event.oldValue != null &&
        event.newValue != null &&
        event.newValue != event.oldValue) {
        const token = JSON.parse(event.newValue).token
        // restart refreshToken interval
        dispatch(actions.refreshTokenRestart.action(token))
        return
      }
    }

    window.addEventListener('storage', localStorageListener)

    // We can use refreshToken to obtain user's info
    if (refreshToken && !loginState.username) {
      const tokenParsed = JSON.parse(window.atob(refreshToken.token.split('.')[1]))
      // is token expired?
      if (tokenParsed.exp * 1e3 - Date.now() < 0) {
        // Expired token
        // Clean token
        dispatch(doLogOutAction())
      } else {
        // Not expired token
        // restore info from refreshToken, initiate refresh saga
        dispatch(actions.refreshTokenStart.action(refreshToken.token))
        loginFromToken(refreshToken.token)
      }
    }

    
    () => window.removeEventListener('storage', localStorageListener);
  }, []);

  const isLoggedIn = loginState.username ? true : false;

  const cancelButton = <>
    <Button
      variant="contained"
      onClick={ () => { setLoginShowMenu(false) } }
      style={{marginLeft:5, backgroundColor: cancelColor}}
    >
      Cancel
    </Button>
  </>

  return (
    <AppBar
      position="static"
      className={classes.appBar}
    >
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
          onClick={ () => setLoginShowMenu(true) }
          style={{marginLeft:5}}
        >
          <AccountBoxIcon/>
          {loginState.username ? 'Logged as: ' + loginState.username : ' guest '}
        </Button>
      </div>

      <Popover
        id={"loginDropDown"}
        open={loginShowMenu}
        anchorEl={anchorElRef.current}
        onClose={ () => setLoginShowMenu(false) }
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
                onKeyDown ={ (event) => {
                  if (event.key != "Enter") return
                  passwordRef.current && passwordRef.current.focus()
                }}
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
                inputProps={{
                  ref: passwordRef,
                }}
              />
              <br />
            </form>
            {
            loginState.loginWarning ?
              <div 
                style={{color:"red", marginTop:5, marginBottom:5}}
              >
                {loginState.loginWarning}
              </div>
            : <br />
            }

            <div style={{marginTop:10, textAlign:"right"}}>
              <Button
                variant="contained"
                onClick={ () => { logIn() } }
                style={{backgroundColor: acceptColor}}
              >
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
  return {};
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Login);
