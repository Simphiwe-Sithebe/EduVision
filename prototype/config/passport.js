const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const passport = require('passport')
const dbFunctions = require('../config/dbFunctions');

const cookieExtractor = function(req) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['token'];
    }
    return token;
};

const opts = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.SECRET_PRIVATE_KEY,
};

passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
    try {
        const user = await dbFunctions.selectById('users', jwt_payload.id);
        if (user) {
            return done(null, user);
        }
        return done(null, false);
    } catch (error) {
        return done(null, false);
    }
}));