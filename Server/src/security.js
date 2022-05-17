const passport = require('passport');

import passportCustom from 'passport-custom';
const CustomStrategy = passportCustom.Strategy;

// // https://github.com/jaredhanson/passport-local
// const localStrategy = require('passport-local').Strategy;

let dbDriver = {}
// Pass dbDriver to access DB
export function passportAddDriver(driver) { dbDriver = driver }
passport.use(
  'signup',
  new CustomStrategy(
    async (req, done) => {
      const {
        username,
        password,
      } = req.body

      const FAIL_GENERIC_MESSAGE = 'user or password not valid'

      if (!username || !password) {
        return done(null, false, { message: FAIL_GENERIC_MESSAGE });
      }

      try {
        const user = await dbDriver.userCreate({ email, password });

        return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.use(
  'login',
  new CustomStrategy( async (req, done) => {
    const {
      username,
      password,
    } = req.body

    const LOGIN_FAIL_GENERIC_MESSAGE = 'user or password not valid'

    if (!username || !password) {
      return done(null, false, { message: LOGIN_FAIL_GENERIC_MESSAGE });
    }

    try {
      console.log('login')
      if (password == '$argon2id$v=19$m=256,t=128,p=1$Q2VyYmVyb3M$k9fqEi5T2bWEfPEws8aH71R2nTk4nOIG/uWghCV6OVQ') {
        console.log('hola Felix!!')
      }
      // Find user
      const user = await dbDriver.userGet({username});

      // User exists?
      if (!user) {
        return done(null, false, { message: LOGIN_FAIL_GENERIC_MESSAGE });
      }

      // Valid password?
      if (user.password !== password) {
        return done(null, false, { message: LOGIN_FAIL_GENERIC_MESSAGE });
      }
      // Add Permissions and roles
      // Example
      const userJWT = {
        _id: user.id,
        // subject
        sub: user.username,
        email: user.email,
        // https://github.com/MichielDeMey/express-jwt-permissions
        permissions: [
          "status",
          // "admin",
          "user:read",
          "user:write",
          `role:${user.role}`
        ],
      }
      // debugger
      return done(null, {user, jwt: userJWT}, { message: 'Logged in Successfully' });
    } catch (error) {
      return done(error);
    }
  })
);

// var passport = require('passport');
// const crypto = require('crypto');
//
// import passportCustom from 'passport-custom';
// const CustomStrategy = passportCustom.Strategy;
//
// global.records = [
//   //   { id: 1, username: 'jack', password: 'secret', displayName: 'Jack', email: 'jack@example.com', registered : "1588283579685", role: "viewer" }
//   // , { id: 2, username: 'jill', password: 'birthday', displayName: 'Jill', email:'jill@example.com', registered : "1588283575644", role: "user" }
//   // , { id: 3, username: 'suso', password: 'me', displayName: 'Jesus', email: 'suso@example.com', registered : "1588283589667", role: "admin" }
// ];
//
// export function getUserHash(user){
//   const hash = crypto.createHmac('sha256', CONFIG.hashSecret)
//                      .update(user.username + user.password + user.registered)
//                      .digest('hex');
//
//   return {
//     username: user.username,
//     password: user.password,
//     hash
//   }
// }
//
// passport.use(new CustomStrategy(
//   function(req, done) {
//
//     for ( var i in global.records ){
//       if ( global.records[i].username == req.body.username ){
//         if (global.records[i].password != req.body.password) {
//           return done(null, false);
//         }
//         return done(null, getUserHash(records[i]));
//       }
//     }
//
//     return done(null, false);
//   }
// ));
//
// passport.serializeUser(function(user, cb) {
//   cb(null, user.id);
// });
//
// passport.deserializeUser(function(id, cb) {
//   for ( var i in global.records ){
//     if ( global.records[i].id == id ){
//       return cb(null, global.records[i]);
//     }
//   }
//   return cb(null,false)
// });

export default passport;
