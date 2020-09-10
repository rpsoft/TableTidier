var passport = require('passport');
const crypto = require('crypto');

import passportCustom from 'passport-custom';
const CustomStrategy = passportCustom.Strategy;

global.records = [
  //   { id: 1, username: 'jack', password: 'secret', displayName: 'Jack', email: 'jack@example.com', registered : "1588283579685", role: "viewer" }
  // , { id: 2, username: 'jill', password: 'birthday', displayName: 'Jill', email:'jill@example.com', registered : "1588283575644", role: "user" }
  // , { id: 3, username: 'suso', password: 'me', displayName: 'Jesus', email: 'suso@example.com', registered : "1588283589667", role: "admin" }
];


export async function initialiseUsers() {
  var client = await global.pool.connect()
  var result = await client.query('SELECT id, username, password, "displayName", email, registered, role FROM public.users')
        client.release()

  global.records = result.rows;
}


export async function createUser(userData) {
  var client = await global.pool.connect()

  var result = await client.query(
    'INSERT INTO public.users( username, password, "displayName", email, registered, role) VALUES ($1, $2, $3, $4, $5, $6)',
    [userData.username, userData.password, userData.displayName, userData.email,  Date.now(), "standard" ]);

  client.release()

  await initialiseUsers()

  return result
}




export function getUserHash(user){
  var hash = crypto.createHmac('sha256', CONFIG.hashSecret)
                     .update(user.username+user.password+user.registered)
                     .digest('hex');

 return {username : user.username, password: user.password, hash}
}


passport.use(new CustomStrategy(
  function(req, done) {

    for ( var i in global.records ){
      if ( global.records[i].username == req.body.username ){
        if (global.records[i].password != req.body.password) {
          return done(null, false);
        }
        return done(null, getUserHash(records[i]));
      }
    }ns

    return done(null, false);
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  for ( var i in global.records ){
    if ( global.records[i].id == id ){
      return cb(null, global.records[i]);
    }
  }
  return cb(null,false)
});


export default passport;
