var passport = require('passport');
const crypto = require('crypto');

import passportCustom from 'passport-custom';
const CustomStrategy = passportCustom.Strategy;



var records = [
    { id: 1, username: 'jack', password: 'secret', displayName: 'Jack', emails: [ { value: 'jack@example.com' } ], registered : "1588283579685", role: "viewer" }
  , { id: 2, username: 'jill', password: 'birthday', displayName: 'Jill', emails: [ { value: 'jill@example.com' } ], registered : "1588283575644", role: "user" }
  , { id: 3, username: 'suso', password: 'me', displayName: 'Jesus', emails: [ { value: 'suso@example.com' } ], registered : "1588283589667", role: "admin" }
];

function getUserHash(user){
  var hash = crypto.createHmac('sha256', CONFIG.hashSecret)
                     .update(user.username+user.password+user.registered)
                     .digest('hex');

 return {username : user.username, password: user.password, hash}
}


passport.use(new CustomStrategy(
  function(req, done) {

    for ( var i in records ){
      if ( records[i].username == req.body.username ){
        if (records[i].password != req.body.password) {
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
  for ( var i in records ){
    if ( records[i].id == id ){
      return cb(null, records[i]);
    }
  }
  return cb(null,false)
});


export default passport;

// var records = [
//     { id: 1, username: 'jack', password: 'secret', displayName: 'Jack', emails: [ { value: 'jack@example.com' } ], registered : "1588283579685" }
//   , { id: 2, username: 'jill', password: 'birthday', displayName: 'Jill', emails: [ { value: 'jill@example.com' } ], registered : "1588283575644" }
// ];
//
// function getUserHash(user){
//
//   var hash = crypto.createHmac('sha256', CONFIG.hashSecret)
//                      .update(user.username+user.password+user.registered)
//                      .digest('hex');
//
//  return {username : user.username, password: user.password, hash}
// }
//
//
// passport.use(new CustomStrategy(
//   function(req, done) {
//
//     for ( var i in records ){
//       if ( records[i].username == req.body.username ){
//         if (records[i].password != req.body.password) {
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
//   for ( var i in records ){
//     if ( records[i].id == id ){
//       return cb(null, records[i]);
//     }
//   }
//   return cb(null,false)
// });
//
//
// app.use(passport.initialize());
//
// app.post('/login', function(req, res, next) {
//   passport.authenticate('custom', function(err, user, info) {
//
//     if ( err ){
//       res.json({status:"failed", payload: null})
//     } else if ( !user ) {
//       res.json({status:"unauthorised", payload: null})
//     } else {
//       res.json({status:"success", payload: user})
//     }
//
//     })(req, res, next)
//   }
// );
