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

import
  passport,
  {
    getUserHash,
  }
from "../security.js"

const privatekey = fs.readFileSync('./certificates/private.pem')
const publickey = fs.readFileSync('./certificates/public.pem')

// Load token config from config.json
const {
  SESSION_TOKEN_EXPIRATION_TIME,
  SESSION_TOKEN_REFRESH_TIME,
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
 *                type: array
 *                items:
 *                  type: object
 *                  required:
 *                    - title
 *                    - id
 *                  properties:
 *                    title:
 *                      type: string
 *                    id:
 *                      type: integer
 *       401:
 *         description: Unauthorised
 *       200:
 *         description: Failed
 *
 */
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

    delete user.jwt.permissions
    user.jwt.type = 'refresh-token'
    const refreshToken = jwtSignToken(user.jwt)

    res.json({
      status: 'authorised',
      payload: {
        ..._user,
        token,
        refreshToken,
        refreshAt: SESSION_TOKEN_REFRESH_TIME,
      }
    });
  })(req, res, next)
});

/**
 * Create a user.
 * @param {object} user - user info.
 *
 * @swagger
 * /createUser:
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
 *         description: Created
 *       200:
 *         description: Failed
 */
router.route('/createUser')
.post((req, res, next) => {
  passport.authenticate('login', function(err, user, info) {
    console.log("login_req", JSON.stringify(user))
    if ( err ) {
      // return next({status: 'failed', payload: err.message});
      return res.status(200).json({status: 'failed', payload: err.message})
    }
    if ( !user ) {
      // return next({status: 'unauthorised', payload: info});
      return res.status(401).json({status: 'unauthorised', payload: info})
    }
    res.status(200).json({status:'success', payload: 'user created' })
  })(req, res, next)
});

router.route('/refreshToken')
.post(
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
  }),
  function(req, res) {
    // has user email?
    console.log(req.user)
    if (!req.user.email) return res.sendStatus(401);

    // verify requestRefreshToken
    const requestRefreshToken = req.headers?.['refresh-token']

    const refreshTokenStatus = jwt.verify(
      req.headers?.['refresh-token'],
      publickey,
      {algorithm: ['ES256'],
    })

    // Is refresh token valid?
    if (refreshTokenStatus?.type == undefined) {
      return res.status(401).json({status:'failed', payload: refreshTokenStatus.message })
    }
    if (refreshTokenStatus?.type !== 'refresh-token') {
      return res.status(401).json({status:'failed', payload: 'invalid refresh token type' })
    }

    const user = req.user

    // remove old iat, exp
    delete user.iat
    delete user.exp
    delete refreshTokenStatus.iat
    delete refreshTokenStatus.exp

    const token = jwtSignToken(user)
    const refreshToken = jwtSignToken(refreshTokenStatus)

    return res.json({
      ...user,
      token,
      refreshToken,
      refreshAt: SESSION_TOKEN_REFRESH_TIME,
    });
  }
);

/**
 * Check that a user exists. by:
 * @param {object} username - username.
 * @param {object} email - email.
 *
 */
router.route('/register/check')
.post( async (req, res) => {
  const {
    email,
    username,
  } = req.body
  req.error = 'err';

  const question = username ? {username} : {email}
  try {
    const result = await dbDriver.userGet(question)
    console.log(result)
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
  }
});
export default router
