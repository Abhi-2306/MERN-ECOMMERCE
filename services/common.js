const passport = require("passport")

exports.isAuth=(req, res, done)=> {
    return passport.authenticate('jwt')
  }

exports.sanitizeUser=(user)=>{
    return {id:user.id, role:user.role, username:user.username}
}

exports.cookieExtractor = function(req) {
  var token = null;
  // console.log("inside cookie extractor");
  // console.log(req.cookies);
  if (req && req.cookies) {
      token = req.cookies['jwt'];
      // console.log(token);
  }
  return token;
};