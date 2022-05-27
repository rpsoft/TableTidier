const passport = require('passport');

import passportCustom from 'passport-custom';
const CustomStrategy = passportCustom.Strategy;

// https://github.com/jaredhanson/passport-local
// const localStrategy = require('passport-local').Strategy;

let dbDriver = {}
// Pass dbDriver to access DB
export function passportAddDriver(driver) { dbDriver = driver }

// Create user
passport.use(
  'signup',
  new CustomStrategy(
    async (req, done) => {
      const {
        email,
        username,
        password,
      } = req.body

      const FAIL_GENERIC_MESSAGE = 'email, username or password are not valid'

      if (
        !email ||
        !username ||
        !password
      ) {
        return done(null, false, { message: FAIL_GENERIC_MESSAGE });
      }

      try {
        // check if user exists
        const emailIsUsed = await dbDriver.userGet({ email });
        const usernameIsUsed = await dbDriver.userGet({ username });
        if (emailIsUsed || usernameIsUsed) {
          return done(null, false, 'email or username not available');
        }

        const user = await dbDriver.userCreate({ email, username, password });

        return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

// Authenticate user
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
      return done(null, {user, jwt: userJWT}, { message: 'Logged in Successfully' });
    } catch (error) {
      return done(error);
    }
  })
);

export default passport;
