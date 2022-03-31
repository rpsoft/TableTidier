// Admin Users

const express = require('express');
const router = express.Router()

import passport, {initialiseUsers, createUser, getUserHash}  from "../security.js"

// CONFIG.api_base_url+'/login'
router.route('/login')
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
 *       500:
 *         description: Failed
 * 
 */
.post((req, res, next) => {
  passport.authenticate('custom', function(err, user, info) {
    // console.log("login_req",JSON.stringify(req))
    if ( err ){
      res.status(500).json({status:"failed", payload: err})
    } else if ( !user ) {
      res.status(401).json({status:"unauthorised", payload: null})
    } else {
      res.status(200).json({status:"success", payload: user})
    }
  })(req, res, next)
});

router.route('/createUser')
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
 *       500:
 *         description: Failed
 */
.post(async (req, res) => {
  var result;
  try{
    result = await createUser(req.body)
    res.status(200).json({status:'success', payload: result })
  } catch (err) {
    res.status(500).json({status:'failed', payload: err })
  }
});

export default router