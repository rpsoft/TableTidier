// Admin Users

import 'dotenv/config'
const CONFIG_PATH = process.env.CONFIG_PATH || process.cwd()
const GENERAL_CONFIG = require(CONFIG_PATH + '/config.json')

const fs = require('fs');
const express = require('express');
const router = express.Router()

// JSON Web Token (JWT) https://datatracker.ietf.org/doc/html/rfc7519
const experessJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const {getJwtFromCookie} = require('../utils/jwt-utils');

import
  passport
from "../security.js"

const privatekey = fs.readFileSync('./certificates/private.pem')
const publickey = fs.readFileSync('./certificates/public.pem')

// Load token config from config.json
const {
  SESSION_TOKEN_EXPIRATION_TIME,
} = GENERAL_CONFIG.jwt

let dbDriver
router.addDriver = (driver) => dbDriver = driver

const jwtSignToken = (user) => {
  return jwt.sign(
    user,
    // TOP_SECRET
    privatekey,
    {
      expiresIn: SESSION_TOKEN_EXPIRATION_TIME,
      algorithm: 'ES256',
    }
  );
}

/**
 * Create a user.
 * @param {object} user - user info.
 *
 * @swagger
 * /createUser:
 *   post:
 *     description: Create a user
 *     summary: Create a user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - username
 *               - password
 *             examples:
 *               James:
 *                 email: james@example.co.uk
 *                 username: james
 *                 password: password
 *
 *     responses:
 *       200:
 *         description: Created or Failed
 * 
 */
 router.route('/createUser')
 .post((req, res, next) => {
   passport.authenticate('signup', function(err, user, info) {
     console.log("login_req", JSON.stringify(user))
     if ( err && err?.message ) {
       return res.status(200).json({status: 'failed', payload: err.message})
     }
     if ( err ) {
       return res.status(200).json({status: 'failed', payload: info})
     }
     if ( !user ) {
       return res.status(200).json({status: 'unavailable', payload: info})
     }
     res.status(200).json({status:'success', payload: 'user created' })
   })(req, res, next)
 });

// CONFIG.api_base_url+'/login'

/**
 * Login user
 *
 * @swagger
 * /login:
 *   post:
 *     description: Login
 *     summary: Login
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *             examples:
 *               James:
 *                 username: james
 *                 password: password
 *
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *            application/json:
 *              schema:
 *                oneOf:
 *                  - $ref: '#/components/schemas/ApiResultOk'
 *                  - $ref: '#/components/schemas/ApiResultError'
 *       401:
 *         description: Unauthorised
 * 
 * 
 * 
 * components:
 *   schemas:
 *     ApiResultOk:
 *       type: object
 *       properties:
 *         result:
 *           type: boolean
 *           enum: [true]
 *         token:
 *           type: string
 *       required:
 *         - result
 *         - token
 *     ApiResultError:
 *       type: object
 *       properties:
 *         result:
 *           type: boolean
 *           enum: [false]
 *         errorCode:
 *           type: string
 *           example: "00002"
 *         errorMsg:
 *           type: string
 *           example: "duplicated account already exist"
 */

//  *                type: array
//  *                items:
//  *                  type: object
//  *                  required:
//  *                    - title
//  *                    - id
//  *                  properties:
//  *                    title:
//  *                      type: string
//  *                    id:
//  *                      type: integer
router.route('/login')
.post((req, res, next) => {
  passport.authenticate('login', function(err, user, info) {
    console.log("login_req", JSON.stringify(user))
    if ( err ) {
      return next({status: 'failed', payload: err.message});
      // res.status(200).json({status:"failed", payload: err.message})
    }
    if ( !user ) {
      return next({status: 'unauthorised', payload: info});
      // res.status(401).json({status:"unauthorised", payload: info})
    }

    // remove password from response
    const _user = user.user
    delete _user.password

    const token = jwtSignToken(user.jwt)

    // delete user.jwt.permissions
    user.jwt.type = 'refresh-token'
    const refreshToken = jwtSignToken(user.jwt)

    const expireTimeFromToken = JSON.parse(atob(token.split('.')[1])).exp * 1e3

    // set client cookie jwt
    req.cookies.set(
      'session',
      'Bearer ' + token,
      {
        overwrite: true,
        // Expires at token expiration time
        expires: new Date(expireTimeFromToken)
      }
    )

    res.json({
      status: 'authorised',
      payload: {
        ..._user,
        // token,
        refreshToken,
      }
    });
  })(req, res, next)
});

/**
 * Logout
 * Remove client cookie
 * @swagger
 * /refreshToken:
 *   post:
 *     description: Logout will remove client cookie JWT token 
 *     summary: Logout
 *     tags:
 *       - Users
 * 
 */

router.route('/logout')
.post(
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    getToken: getJwtFromCookie,
  }),
  function(req, res) {
    // set client cookie jwt
    req.cookies.set(
      'session',
      'logout',
      {
        overwrite: true,
        // Expires at time from Date.now()
        maxAge: 1,
      }
    )
    res.json({
      status: 'success',
      description: 'Logged out'
    });
  }
);

/**
 * Refresh user token
 * Refresh-Token
 * @swagger
 * /refreshToken:
 *   post:
 *     description: Refresh user token using JWT
 *     summary: Refresh user token
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *       - in: header
 *         name: Refresh-Token
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 * 
 */

router.route('/refreshToken')
.post(
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    getToken: getJwtFromCookie,
  }),
  function(req, res) {
    // has user email?
    console.log(req.user)
    if (!req.user.email) return res.sendStatus(401);

    // // verify requestRefreshToken
    // const requestRefreshToken = req.headers?.['refresh-token']

    const refreshTokenStatus = jwt.verify(
      req.headers?.['refresh-token'],
      publickey,
      {algorithm: ['ES256'],
    })

    // Is refresh token valid?
    if (refreshTokenStatus?.type == undefined) {
      return res.status(200).json({status:'failed', payload: refreshTokenStatus.message })
    }
    if (refreshTokenStatus?.type !== 'refresh-token') {
      return res.status(200).json({status:'failed', payload: 'invalid refresh token type' })
    }

    const user = req.user

    // remove old iat, exp
    delete user.iat
    delete user.exp
    delete refreshTokenStatus.iat
    delete refreshTokenStatus.exp

    const token = jwtSignToken(user)
    const refreshToken = jwtSignToken(refreshTokenStatus)

    const expireTimeFromToken = JSON.parse(atob(token.split('.')[1])).exp * 1e3

    // set refresh client cookie jwt
    req.cookies.set(
      'session', 'Bearer ' + token,
      {
        overwrite: true,
        // Expires at token expiration time
        expires: new Date(expireTimeFromToken)
      }
    )
    
    return res.json({
      ...user,
      // token,
      refreshToken,
    });
  }
);

/**
 * Check if a given username or email already exists. by:
 * @param {object} username - username.
 * @param {object} email - email.
 *
 * @swagger
 * /register/check:
 *   post:
 *     description: Check that a user exists by email or username
 *     summary: Check that a user exists
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *             required:
 *               oneOf:
 *                 - email
 *                 - username
 *             examples:
 *               EmailJames:
 *                 {email: 'james@example.co.uk'}
 *               UsernameJames:
 *                 {username: 'james'}
 * 
 *
 *     responses:
 *       200:
 *         description: Available, Unavailable or Fails
 * 
 */
router.route('/register/check')
.post( async (req, res) => {
  const {
    email,
    username,
  } = req.body
  req.error = 'err';

  if (
    email == undefined &&
    username == undefined
  ) {
    res.json({
      status: 'FAILS',
      payload: 'INVALID CHECK PARAMETERS',
    })
  }

  const question = username ? {username} : {email}
  try {
    const result = await dbDriver.userGet(question)
    // is user available? 
    if (result == undefined) {
      res.json({
        status: 'OK',
        email,
        username,
        payload: 'available',
      })
      return
    }
    res.json({
      status: 'OK',
      email,
      username,
      payload: 'unavailable',
    })
  } catch (err) {
    console.log(err)
    res.json({
      status: 'FAILS',
      payload: 'SERVER ERROR',
    })
  }
});
export default router
